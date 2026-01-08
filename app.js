/**
 * Maps a numeric score (0-100) to a grade point using the PDF's exact thresholds.
 * @param {number} score - Numeric score between 0 and 100
 * @returns {{ letter: string, point: number }} Grade letter and point value
 */
function mapNumericToGradePoint(score) {
    // Validate input
    if (typeof score !== 'number' || isNaN(score)) {
        return { letter: 'Invalid', point: 0 };
    }
    
    // Clamp score to valid range
    score = Math.max(0, Math.min(100, score));
    
    // PDF Grade Mapping (Orientation Session Fall 24):
    // Using exact fractions: 1/3 ≈ 0.333..., 2/3 ≈ 0.666...
    // A- = 3 + 2/3 = 11/3, B+ = 3 + 1/3 = 10/3, B- = 2 + 2/3 = 8/3, etc.
    if (score >= 95) return { letter: 'A',  point: 4 };           // 4
    if (score >= 90) return { letter: 'A-', point: 11/3 };        // 3 + 2/3
    if (score >= 85) return { letter: 'B+', point: 10/3 };        // 3 + 1/3
    if (score >= 80) return { letter: 'B',  point: 3 };           // 3
    if (score >= 75) return { letter: 'B-', point: 8/3 };         // 2 + 2/3
    if (score >= 70) return { letter: 'C+', point: 7/3 };         // 2 + 1/3
    if (score >= 65) return { letter: 'C',  point: 2 };           // 2
    if (score >= 60) return { letter: 'C-', point: 5/3 };         // 1 + 2/3
    return { letter: 'F', point: 0 };  // 0-59
}

/**
 * Maps a letter grade to its grade point value.
 * @param {string} letter - Letter grade (A, A-, B+, B, B-, C+, C, C-, F)
 * @returns {number} Grade point value
 */
function mapLetterToGradePoint(letter) {
    // PDF Grade Points - Using exact fractions (1/3 and 2/3)
    // Example: 3 credits × B+ (10/3) = 10 QP exactly, not 9.99
    const gradePoints = {
        'A':  4,        // 4
        'A-': 11/3,     // 3 + 2/3 = 3.666...
        'B+': 10/3,     // 3 + 1/3 = 3.333...
        'B':  3,        // 3
        'B-': 8/3,      // 2 + 2/3 = 2.666...
        'C+': 7/3,      // 2 + 1/3 = 2.333...
        'C':  2,        // 2
        'C-': 5/3,      // 1 + 2/3 = 1.666...
        'F':  0         // 0
    };
    
    return gradePoints[letter] ?? 0;
}

/**
 * Gets the letter grade from a grade point value.
 * @param {number} point - Grade point value
 * @returns {string} Letter grade
 */
function getLetterFromPoint(point) {
    if (point >= 4.00) return 'A';
    if (point >= 3.66) return 'A-';
    if (point >= 3.33) return 'B+';
    if (point >= 3.00) return 'B';
    if (point >= 2.66) return 'B-';
    if (point >= 2.33) return 'C+';
    if (point >= 2.00) return 'C';
    if (point >= 1.67) return 'C-';
    return 'F';
}

// ============================================
// GPA CALCULATION FUNCTIONS
// ============================================

/**
 * Computes the Term GPA from an array of course data.
 * Formula: Term GPA = Σ(Quality Points) / Σ(Credit Hours)
 * 
 * @param {Array} courseRows - Array of course objects
 * @returns {{ gpa: number, totalCredits: number, totalQualityPoints: number, courses: Array }}
 */
function computeTermGPA(courseRows) {
    let totalCredits = 0;
    let totalQualityPoints = 0;
    const processedCourses = [];
    
    for (const course of courseRows) {
        // Skip excluded courses (Withdraw/Drop/W)
        if (course.excluded) {
            processedCourses.push({
                ...course,
                qualityPoints: 0,
                status: 'excluded'
            });
            continue;
        }
        
        // Get grade point
        let gradePoint = course.gradePoint;
        let letter = course.letter;
        let wasCapped = false;
        
        // Apply repeated course cap (PDF Rule: max B+ for repeated courses)
        if (course.repeated && gradePoint > 3.33) {
            gradePoint = 3.33;  // Cap at B+
            letter = 'B+';
            wasCapped = true;
        }
        
        // Calculate quality points: Credit Hours × Grade Point
        const qualityPoints = course.credits * gradePoint;
        
        // Accumulate totals
        totalCredits += course.credits;
        totalQualityPoints += qualityPoints;
        
        processedCourses.push({
            ...course,
            gradePoint,
            letter,
            qualityPoints,
            wasCapped,
            status: wasCapped ? 'capped' : 'included'
        });
    }
    
    // Calculate GPA (avoid division by zero)
    const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
    
    return {
        gpa,
        totalCredits,
        totalQualityPoints,
        courses: processedCourses
    };
}

/**
 * Computes the new Cumulative GPA.
 * Formula: CGPA = (Previous QP + Current QP) / (Previous Credits + Current Credits)
 * 
 * @param {number} prevCGPA - Previous cumulative GPA (0-4)
 * @param {number} prevCredits - Previous total credit hours
 * @param {number} termQualityPoints - Current term quality points
 * @param {number} termCredits - Current term credit hours
 * @param {number|null} prevQualityPoints - Optional: explicit previous quality points
 * @returns {{ cgpa: number, totalCredits: number, totalQualityPoints: number, prevQualityPoints: number }}
 */
function computeNewCGPA(prevCGPA, prevCredits, termQualityPoints, termCredits, prevQualityPoints = null) {
    // Calculate previous quality points
    // If explicit quality points provided, use those; otherwise calculate from CGPA
    const calculatedPrevQP = prevQualityPoints !== null 
        ? prevQualityPoints 
        : prevCGPA * prevCredits;
    
    // Calculate new totals
    const newTotalQualityPoints = calculatedPrevQP + termQualityPoints;
    const newTotalCredits = prevCredits + termCredits;
    
    // Calculate new CGPA (avoid division by zero)
    const cgpa = newTotalCredits > 0 ? newTotalQualityPoints / newTotalCredits : 0;
    
    return {
        cgpa,
        totalCredits: newTotalCredits,
        totalQualityPoints: newTotalQualityPoints,
        prevQualityPoints: calculatedPrevQP
    };
}

// ============================================
// APPLICATION STATE
// ============================================

const state = {
    mode: 'term',       // 'term' or 'cgpa'
    courses: [],        // Array of course objects
    courseCounter: 0    // For unique IDs
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    // Mode selection
    modeRadios: () => document.querySelectorAll('input[name="calcMode"]'),
    
    // Previous section (CGPA)
    previousSection: () => document.getElementById('previousSection'),
    prevCGPA: () => document.getElementById('prevCGPA'),
    prevCredits: () => document.getElementById('prevCredits'),
    
    // Courses
    courseList: () => document.getElementById('courseList'),
    emptyMessage: () => document.getElementById('emptyMessage'),
    
    // Buttons
    addCourseBtn: () => document.getElementById('addCourseBtn'),
    calculateBtn: () => document.getElementById('calculateBtn'),
    resetBtn: () => document.getElementById('resetBtn'),
    exportBtn: () => document.getElementById('exportBtn'),
    referenceToggle: () => document.getElementById('referenceToggle'),
    referenceContent: () => document.getElementById('referenceContent'),
    
    // Results
    resultsSection: () => document.getElementById('resultsSection'),
    gpaValue: () => document.getElementById('gpaValue'),
    gpaLabel: () => document.getElementById('gpaLabel'),
    summaryStats: () => document.getElementById('summaryStats'),
    breakdownContent: () => document.getElementById('breakdownContent'),
    detailsBody: () => document.getElementById('detailsBody')
};

// ============================================
// UI FUNCTIONS
// ============================================

/**
 * Creates the HTML for a course row.
 * @param {number} id - Unique course ID
 * @returns {string} HTML string
 */
function createCourseRowHTML(id) {
    return `
        <div class="course-row" data-course-id="${id}">
            <div class="course-header">
                <span class="course-number">Course #${id}</span>
                <button type="button" class="remove-btn" onclick="removeCourse(${id})" aria-label="Remove course">✕</button>
            </div>
            
            <div class="course-inputs">
                <div class="input-group">
                    <label for="courseName${id}">Course Name</label>
                    <input type="text" id="courseName${id}" placeholder="e.g., CSAI 101" maxlength="50">
                </div>
                
                <div class="input-group">
                    <label for="courseCredits${id}">Credit Hours *</label>
                    <input type="number" id="courseCredits${id}" min="0.5" max="6" step="0.5" placeholder="e.g., 3" required>
                </div>
                
                <div class="input-group grade-input-group">
                    <label>Grade *</label>
                    <div class="grade-toggle">
                        <button type="button" onclick="toggleGradeInput(${id}, 'numeric')">Numeric</button>
                        <button type="button" class="active" onclick="toggleGradeInput(${id}, 'letter')">Letter</button>
                    </div>
                    <div id="gradeInputContainer${id}">
                        <select id="courseLetter${id}">
                            <option value="">Select grade</option>
                            <option value="A">A (4.00)</option>
                            <option value="A-">A- (3.66)</option>
                            <option value="B+">B+ (3.33)</option>
                            <option value="B">B (3.00)</option>
                            <option value="B-">B- (2.66)</option>
                            <option value="C+">C+ (2.33)</option>
                            <option value="C">C (2.00)</option>
                            <option value="C-">C- (1.67)</option>
                            <option value="F">F (0.00)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="course-options">
                <label class="checkbox-label">
                    <input type="checkbox" id="courseExcluded${id}" onchange="updateCourseVisual(${id})">
                    <span>Exclude from GPA</span>
                    <span class="info-icon" title="Check this for Withdraw (W), Drop, WP, or WF courses that should not affect your GPA">?</span>
                </label>
                
                <label class="checkbox-label">
                    <input type="checkbox" id="courseRepeated${id}" onchange="updateCourseVisual(${id})">
                    <span>Repeated Course</span>
                    <span class="info-icon" title="Per PDF rules: Repeated courses have a maximum grade of B+ (3.33), even if score is higher">?</span>
                </label>
            </div>
        </div>
    `;
}

/**
 * Creates the letter grade selector HTML.
 * @param {number} id - Course ID
 * @returns {string} HTML string
 */
function createLetterSelectHTML(id) {
    return `
        <select id="courseLetter${id}">
            <option value="">Select grade</option>
            <option value="A">A (4.00)</option>
            <option value="A-">A- (3.66)</option>
            <option value="B+">B+ (3.33)</option>
            <option value="B">B (3.00)</option>
            <option value="B-">B- (2.66)</option>
            <option value="C+">C+ (2.33)</option>
            <option value="C">C (2.00)</option>
            <option value="C-">C- (1.67)</option>
            <option value="F">F (0.00)</option>
        </select>
    `;
}

/**
 * Toggles between numeric and letter grade input.
 * @param {number} id - Course ID
 * @param {string} type - 'numeric' or 'letter'
 */
function toggleGradeInput(id, type) {
    const container = document.getElementById(`gradeInputContainer${id}`);
    const toggleBtns = container.parentElement.querySelectorAll('.grade-toggle button');
    
    // Update button states
    toggleBtns.forEach((btn, index) => {
        btn.classList.toggle('active', 
            (type === 'numeric' && index === 0) || 
            (type === 'letter' && index === 1)
        );
    });
    
    // Update input
    if (type === 'numeric') {
        container.innerHTML = `<input type="number" id="courseScore${id}" min="0" max="100" step="1" placeholder="0-100">`;
    } else {
        container.innerHTML = createLetterSelectHTML(id);
    }
    
    // Store the input type for this course
    const courseRow = document.querySelector(`[data-course-id="${id}"]`);
    courseRow.dataset.gradeType = type;
}

/**
 * Updates the visual state of a course row.
 * @param {number} id - Course ID
 */
function updateCourseVisual(id) {
    const row = document.querySelector(`[data-course-id="${id}"]`);
    const excluded = document.getElementById(`courseExcluded${id}`).checked;
    const repeated = document.getElementById(`courseRepeated${id}`).checked;
    
    row.classList.toggle('excluded', excluded);
    row.classList.toggle('capped', repeated && !excluded);
}

/**
 * Adds a new course row.
 */
function addCourse() {
    state.courseCounter++;
    const html = createCourseRowHTML(state.courseCounter);
    
    elements.courseList().insertAdjacentHTML('afterbegin', html);
    elements.emptyMessage().style.display = 'none';
    
    // Focus the credit hours input
    setTimeout(() => {
        document.getElementById(`courseCredits${state.courseCounter}`).focus();
    }, 100);
}

/**
 * Removes a course row.
 * @param {number} id - Course ID
 */
function removeCourse(id) {
    const row = document.querySelector(`[data-course-id="${id}"]`);
    if (row) {
        row.style.animation = 'slideIn 0.2s ease reverse';
        setTimeout(() => {
            row.remove();
            if (elements.courseList().children.length === 0) {
                elements.emptyMessage().style.display = 'block';
            }
        }, 200);
    }
}

/**
 * Collects all course data from the form.
 * @returns {Array} Array of course objects
 */
function collectCourseData() {
    const rows = elements.courseList().querySelectorAll('.course-row');
    const courses = [];
    
    rows.forEach(row => {
        const id = row.dataset.courseId;
        const gradeType = row.dataset.gradeType || 'letter';
        
        const name = document.getElementById(`courseName${id}`)?.value.trim() || `Course ${id}`;
        const credits = parseFloat(document.getElementById(`courseCredits${id}`)?.value) || 0;
        const excluded = document.getElementById(`courseExcluded${id}`)?.checked || false;
        const repeated = document.getElementById(`courseRepeated${id}`)?.checked || false;
        
        let gradePoint = 0;
        let letter = 'F';
        let score = null;
        
        if (gradeType === 'numeric') {
            score = parseFloat(document.getElementById(`courseScore${id}`)?.value);
            if (!isNaN(score)) {
                const mapped = mapNumericToGradePoint(score);
                gradePoint = mapped.point;
                letter = mapped.letter;
            }
        } else {
            letter = document.getElementById(`courseLetter${id}`)?.value || '';
            if (letter) {
                gradePoint = mapLetterToGradePoint(letter);
            }
        }
        
        courses.push({
            id,
            name,
            credits,
            score,
            gradePoint,
            letter,
            excluded,
            repeated,
            gradeType
        });
    });
    
    return courses;
}

/**
 * Validates course data and returns any errors.
 * @param {Array} courses - Array of course objects
 * @returns {Array} Array of error messages
 */
function validateCourses(courses) {
    const errors = [];
    
    if (courses.length === 0) {
        errors.push('Please add at least one course.');
        return errors;
    }
    
    courses.forEach((course, index) => {
        const num = index + 1;
        
        if (course.credits <= 0) {
            errors.push(`Course ${num}: Credit hours must be greater than 0.`);
        }
        
        if (course.credits > 6) {
            errors.push(`Course ${num}: Credit hours cannot exceed 6.`);
        }
        
        if (!course.excluded) {
            if (course.gradeType === 'numeric') {
                if (course.score === null || isNaN(course.score)) {
                    errors.push(`Course ${num}: Please enter a valid numeric score.`);
                } else if (course.score < 0 || course.score > 100) {
                    errors.push(`Course ${num}: Score must be between 0 and 100.`);
                }
            } else if (!course.letter) {
                errors.push(`Course ${num}: Please select a letter grade.`);
            }
        }
    });
    
    return errors;
}

/**
 * Validates CGPA input fields.
 * @returns {Array} Array of error messages
 */
function validateCGPAInputs() {
    const errors = [];
    
    if (state.mode !== 'cgpa') return errors;
    
    const prevCGPA = parseFloat(elements.prevCGPA().value);
    const prevCredits = parseFloat(elements.prevCredits().value);
    
    if (isNaN(prevCGPA) || prevCGPA < 0 || prevCGPA > 4) {
        errors.push('Previous CGPA must be between 0.00 and 4.00.');
    }
    
    if (isNaN(prevCredits) || prevCredits < 0) {
        errors.push('Previous total credits must be 0 or greater.');
    }
    
    return errors;
}

/**
 * Displays error messages.
 * @param {Array} errors - Array of error messages
 */
function showErrors(errors) {
    // Remove existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    if (errors.length === 0) return;
    
    const errorHTML = `
        <div class="error-message">
            <strong>⚠️ Please fix the following errors:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem;">
                ${errors.map(e => `<li>${e}</li>`).join('')}
            </ul>
        </div>
    `;
    
    elements.resultsSection().insertAdjacentHTML('beforebegin', errorHTML);
    elements.resultsSection().style.display = 'none';
}

/**
 * Renders the results section.
 * @param {Object} result - Calculation result object
 */
function renderResults(result) {
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const isCGPA = state.mode === 'cgpa';
    const gpa = isCGPA ? result.cgpa : result.gpa;
    
    // Update GPA display
    elements.gpaValue().textContent = gpa.toFixed(4);
    elements.gpaLabel().textContent = isCGPA ? 'Cumulative GPA' : 'Term GPA';
    
    // Summary stats
    let statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${result.termResult.totalCredits}</div>
            <div class="stat-label">Term Credits</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.termResult.totalQualityPoints.toFixed(2)}</div>
            <div class="stat-label">Term Quality Points</div>
        </div>
    `;
    
    if (isCGPA) {
        statsHTML += `
            <div class="stat-card">
                <div class="stat-value">${result.totalCredits}</div>
                <div class="stat-label">Total Credits</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${result.totalQualityPoints.toFixed(2)}</div>
                <div class="stat-label">Total Quality Points</div>
            </div>
        `;
    }
    
    const excludedCount = result.termResult.courses.filter(c => c.excluded).length;
    const cappedCount = result.termResult.courses.filter(c => c.wasCapped).length;
    
    if (excludedCount > 0) {
        statsHTML += `
            <div class="stat-card">
                <div class="stat-value">${excludedCount}</div>
                <div class="stat-label">Excluded Courses</div>
            </div>
        `;
    }
    
    if (cappedCount > 0) {
        statsHTML += `
            <div class="stat-card">
                <div class="stat-value">${cappedCount}</div>
                <div class="stat-label">Capped at B+</div>
            </div>
        `;
    }
    
    elements.summaryStats().innerHTML = statsHTML;
    
    // Calculation breakdown
    let breakdownHTML = '';
    
    result.termResult.courses.filter(c => !c.excluded).forEach(course => {
        const capNote = course.wasCapped ? ' (capped from original)' : '';
        breakdownHTML += `
            <div class="breakdown-line">
                <span>${course.name}: ${course.credits} cr × ${course.gradePoint.toFixed(2)} pts${capNote}</span>
                <span>= ${course.qualityPoints.toFixed(2)} QP</span>
            </div>
        `;
    });
    
    breakdownHTML += `
        <div class="breakdown-line">
            <span>Term Total</span>
            <span>${result.termResult.totalQualityPoints.toFixed(2)} QP / ${result.termResult.totalCredits} cr</span>
        </div>
    `;
    
    if (result.termResult.totalCredits > 0) {
        breakdownHTML += `
            <div class="breakdown-line">
                <span>Term GPA</span>
                <span>${result.termResult.gpa.toFixed(4)}</span>
            </div>
        `;
    }
    
    if (isCGPA) {
        breakdownHTML += `
            <div class="breakdown-line" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--gray-300);">
                <span>Previous: ${result.prevCredits} cr × ${result.prevCGPA.toFixed(2)} GPA</span>
                <span>= ${result.prevQualityPoints.toFixed(2)} QP</span>
            </div>
            <div class="breakdown-line">
                <span>New Total</span>
                <span>${result.totalQualityPoints.toFixed(2)} QP / ${result.totalCredits} cr</span>
            </div>
            <div class="breakdown-line">
                <span><strong>New CGPA</strong></span>
                <span><strong>${result.cgpa.toFixed(4)}</strong></span>
            </div>
        `;
    }
    
    elements.breakdownContent().innerHTML = breakdownHTML;
    
    // Details table
    let tableHTML = '';
    result.termResult.courses.forEach(course => {
        const rowClass = course.excluded ? 'excluded' : (course.wasCapped ? 'capped' : '');
        let statusBadge = '';
        
        if (course.excluded) {
            statusBadge = '<span class="status-badge excluded">Excluded</span>';
        } else if (course.wasCapped) {
            statusBadge = '<span class="status-badge capped">Capped B+</span>';
        } else {
            statusBadge = '<span class="status-badge included">Included</span>';
        }
        
        tableHTML += `
            <tr class="${rowClass}">
                <td>${course.name}</td>
                <td>${course.credits}</td>
                <td>${course.letter}${course.score !== null ? ` (${course.score})` : ''}</td>
                <td>${course.excluded ? '-' : course.gradePoint.toFixed(2)}</td>
                <td>${course.excluded ? '-' : course.qualityPoints.toFixed(2)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    
    elements.detailsBody().innerHTML = tableHTML;
    
    // Show results
    elements.resultsSection().style.display = 'block';
    elements.resultsSection().scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Main calculation function.
 */
function calculate() {
    // Collect and validate data
    const courses = collectCourseData();
    const courseErrors = validateCourses(courses);
    const cgpaErrors = validateCGPAInputs();
    const allErrors = [...courseErrors, ...cgpaErrors];
    
    if (allErrors.length > 0) {
        showErrors(allErrors);
        return;
    }
    
    // Check if all courses are excluded
    const includedCourses = courses.filter(c => !c.excluded);
    if (includedCourses.length === 0) {
        showErrors(['All courses are excluded. Cannot calculate GPA with no included courses.']);
        return;
    }
    
    // Calculate term GPA
    const termResult = computeTermGPA(courses);
    
    let result = { 
        termResult,
        gpa: termResult.gpa  // Ensure gpa is available for Term GPA mode
    };
    
    if (state.mode === 'cgpa') {
        const prevCGPA = parseFloat(elements.prevCGPA().value) || 0;
        const prevCredits = parseFloat(elements.prevCredits().value) || 0;
        
        const cgpaResult = computeNewCGPA(
            prevCGPA,
            prevCredits,
            termResult.totalQualityPoints,
            termResult.totalCredits,
            null  // Always auto-calculate from CGPA × Credits
        );
        
        result = {
            ...result,
            ...cgpaResult,
            prevCGPA,
            prevCredits
        };
    }
    
    renderResults(result);
}

/**
 * Resets the calculator to initial state.
 */
function resetCalculator() {
    if (!confirm('Are you sure you want to reset? All data will be cleared.')) {
        return;
    }
    
    // Clear courses
    elements.courseList().innerHTML = '';
    elements.emptyMessage().style.display = 'block';
    state.courseCounter = 0;
    
    // Clear CGPA inputs
    elements.prevCGPA().value = '';
    elements.prevCredits().value = '';
    
    // Hide results
    elements.resultsSection().style.display = 'none';
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Reset mode to term
    document.querySelector('input[name="calcMode"][value="term"]').checked = true;
    state.mode = 'term';
    elements.previousSection().style.display = 'none';
}

/**
 * Exports course data to CSV.
 */
function exportCSV() {
    const courses = collectCourseData();
    if (courses.length === 0) {
        alert('No courses to export. Please add some courses first.');
        return;
    }
    
    // Calculate to get quality points
    const termResult = computeTermGPA(courses);
    
    // Build CSV content
    let csv = 'Course Name,Credit Hours,Score,Letter Grade,Grade Points,Quality Points,Excluded,Repeated,Status\n';
    
    termResult.courses.forEach(course => {
        const status = course.excluded ? 'Excluded' : (course.wasCapped ? 'Capped at B+' : 'Included');
        csv += `"${course.name}",${course.credits},${course.score ?? ''},${course.letter},${course.gradePoint.toFixed(2)},${course.qualityPoints.toFixed(2)},${course.excluded},${course.repeated},${status}\n`;
    });
    
    csv += `\nTotal Credits,${termResult.totalCredits}\n`;
    csv += `Total Quality Points,${termResult.totalQualityPoints.toFixed(2)}\n`;
    csv += `Term GPA,${termResult.gpa.toFixed(2)}\n`;
    
    if (state.mode === 'cgpa') {
        const prevCGPA = parseFloat(elements.prevCGPA().value) || 0;
        const prevCredits = parseFloat(elements.prevCredits().value) || 0;
        const cgpaResult = computeNewCGPA(prevCGPA, prevCredits, termResult.totalQualityPoints, termResult.totalCredits);
        
        csv += `\nPrevious CGPA,${prevCGPA.toFixed(2)}\n`;
        csv += `Previous Credits,${prevCredits}\n`;
        csv += `New CGPA,${cgpaResult.cgpa.toFixed(2)}\n`;
    }
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `gpa_calculation_${date}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

/**
 * Handles mode change between Term GPA and CGPA.
 */
function handleModeChange(event) {
    state.mode = event.target.value;
    elements.previousSection().style.display = state.mode === 'cgpa' ? 'block' : 'none';
}

/**
 * Toggles the grade reference table visibility.
 */
function toggleReference() {
    const content = elements.referenceContent();
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    elements.referenceToggle().textContent = isVisible ? '📋 View Grade Table' : '📋 Hide Grade Table';
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Mode selection
    elements.modeRadios().forEach(radio => {
        radio.addEventListener('change', handleModeChange);
    });
    
    // Buttons
    elements.addCourseBtn().addEventListener('click', addCourse);
    elements.calculateBtn().addEventListener('click', calculate);
    elements.resetBtn().addEventListener('click', resetCalculator);
    elements.exportBtn().addEventListener('click', exportCSV);
    elements.referenceToggle().addEventListener('click', toggleReference);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to calculate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            calculate();
        }
        
        // Ctrl/Cmd + N to add course
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            addCourse();
        }
    });
    
    // Add initial course
    addCourse();
});

// Make functions globally available for inline event handlers
window.toggleGradeInput = toggleGradeInput;
window.updateCourseVisual = updateCourseVisual;
window.removeCourse = removeCourse;
