# 📊 GPA Calculator - Zewail City University

A web-based GPA calculator for **CSAI (Computer Science and Artificial Intelligence)** students at Zewail City University. All calculations follow the grading rules from the **Orientation Session Fall 24** PDF by Dr. Khaled Mostafa Elsayed.

---

## 🚀 Quick Start

1. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
2. No server, build step, or installation required!

---

## 📖 How to Use

### Step 1: Select Calculation Mode

- **Term GPA**: Calculate GPA for the current semester only
- **Cumulative GPA (CGPA)**: Include previous semesters in calculation

### Step 2: Enter Previous Record (CGPA Mode Only)

- **Previous CGPA**: Your cumulative GPA before this term (0.00 - 4.00)
- **Previous Total Credits**: Credit hours completed before this term
- **Previous Quality Points** _(optional)_: If provided, takes precedence over CGPA × Credits

### Step 3: Add Courses

Click **"Add Course"** and enter for each course:

- **Course Name** _(optional)_: e.g., CSAI 101
- **Credit Hours**: Typically 1-4 credits
- **Grade**: Choose between:
  - Numeric score (0-100) → automatically mapped to letter grade
  - Letter grade (A, A-, B+, etc.) → directly selected

### Step 4: Special Options

- **☐ Exclude from GPA**: For Withdraw (W), Drop, WP, or WF courses
- **☐ Repeated Course**: Caps maximum grade at B+ (3.33) per university rules

### Step 5: Calculate

Click **"Calculate GPA"** to see results with detailed breakdown.

### Additional Features

- **📥 Export CSV**: Download your data as a spreadsheet
- **🔄 Reset**: Clear all data and start over
- **Ctrl+Enter**: Keyboard shortcut to calculate
- **Ctrl+N**: Keyboard shortcut to add course

---

## 📊 Grade Mapping

Based on **Orientation Session Fall 24**:

| Score Range | Letter Grade | Grade Points | Fraction |
| :---------: | :----------: | :----------: | :------: |
|  95 - 100   |      A       |     4.00     |    4     |
|   90 - 94   |      A-      |     3.67     |   11/3   |
|   85 - 89   |      B+      |     3.33     |   10/3   |
|   80 - 84   |      B       |     3.00     |    3     |
|   75 - 79   |      B-      |     2.67     |   8/3    |
|   70 - 74   |      C+      |     2.33     |   7/3    |
|   65 - 69   |      C       |     2.00     |    2     |
|   60 - 64   |      C-      |     1.67     |   5/3    |
|   0 - 59    |      F       |     0.00     |    0     |

> **Note**: The calculator uses exact fractions internally for precise calculations.  
> Example: 3 credits × B+ (10/3) = **10 QP** exactly, not 9.99.

---

## 🧮 Calculation Formulas

### Quality Points

```
Quality Points = Credit Hours × Grade Point
```

### Term GPA

```
Term GPA = Σ(Quality Points) / Σ(Credit Hours)
```

### Cumulative GPA (CGPA)

```
Previous Quality Points = Previous CGPA × Previous Credits
New Total Quality Points = Previous QP + Current Term QP
New Total Credits = Previous Credits + Current Term Credits
CGPA = New Total Quality Points / New Total Credits
```

---

## ⚠️ Special Rules

### Repeated Courses

- Maximum grade for repeated courses is **B+ (10/3)**
- Even if you score higher, it will be capped at B+
- Check the "Repeated Course" checkbox to apply this rule

### Excluded Courses

- Withdraw (W), Drop, WP, WF courses do **not** affect GPA
- Check "Exclude from GPA" for these courses
- Credits and points from excluded courses are not counted

---

## ✅ Test Cases

Verify your calculator works correctly with these examples:

### Test 1: Term GPA

| Course    | Credits | Grade | Quality Points |
| --------- | ------- | ----- | -------------- |
| Course A  | 3       | B+    | 10.00          |
| Course B  | 4       | C+    | 9.33           |
| Course C  | 2       | F     | 0.00           |
| **Total** | **9**   | -     | **19.33**      |

**Expected Term GPA: 2.15**

### Test 2: CGPA Calculation

- Previous CGPA: 3.0
- Previous Credits: 30
- Previous Quality Points: 90
- Current Term: 3 credits, A- = 11 QP

**Expected New CGPA: 3.06** (101 / 33)

### Test 3: Repeated Course Cap

- Course: 3 credits, score 98
- Without "Repeated": Grade A (4) → QP = 12
- With "Repeated" checked: Capped to B+ (10/3) → QP = 10

---

## 📁 File Structure

```
GPAcalc/
├── index.html    # Main HTML structure
├── styles.css    # Responsive styling
├── app.js        # Calculation logic
└── README.md     # This file
```

---

## 💻 Technical Details

- **Pure Vanilla JavaScript** (ES6+) - no frameworks
- **Single-page application** - works offline
- **Responsive design** - works on mobile and desktop
- **Print-friendly** - clean output when printing
- **Accessible** - keyboard navigation, proper contrast

---

## 📚 Source

All grading rules and formulas are based on:

> **Orientation Session Fall 24**  
> Dr. Khaled Mostafa Elsayed  
> Data Science Program Director  
> Zewail City University

---
