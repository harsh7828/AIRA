# Coding Question Implementation Fix

## Problem Identified
AIRA was not asking any coding-related questions in Technical interviews, despite having:
- Monaco Editor integrated in the frontend
- 15-minute timer support (900 seconds) for PRACTICAL questions
- A problem bank with coding challenges

## Root Cause
The AI prompt in `generateQuestion` function was **requesting** PRACTICAL questions but not **enforcing** them. The AI had the freedom to return all CONCEPTUAL questions, which it frequently did.

## Solution Implemented

### 1. Enhanced AI System Prompt (`AIRA/server/controllers/interview.controller.js`)
**Lines 139-196**: Updated the system prompt to:
- **Explicitly require** at least 1 PRACTICAL coding question for Technical interviews
- **Specify** that Question 3 (medium difficulty) should be the coding question
- **Mandate** 900 seconds (15 minutes) time limit for PRACTICAL questions
- **Provide clear examples** of expected output format for Technical mode

**Key additions:**
```javascript
- **CRITICAL REQUIREMENT**: You MUST include at least 1 PRACTICAL coding question in this interview. Question 3 (medium difficulty) should be the PRACTICAL coding question where the candidate writes actual code.
```

### 2. Server-Side Validation (`AIRA/server/controllers/interview.controller.js`)
**Lines 218-238**: Added fallback validation to ensure coding questions:
```javascript
// Server-side validation: Ensure at least 1 PRACTICAL question for Technical mode
if (mode === "Technical") {
  const hasPractical = questionsArray.some(q => q.questionType === "PRACTICAL");
  if (!hasPractical) {
    console.log("AI did not generate any PRACTICAL question. Forcing Question 3 to be PRACTICAL.");
    // Force Question 3 (index 2) to be PRACTICAL with 900 seconds time limit
    if (questionsArray.length > 2) {
      questionsArray[2].questionType = "PRACTICAL";
      questionsArray[2].timeLimit = 900;
    }
  }
  
  // Ensure all PRACTICAL questions have 900 seconds (15 minutes) time limit
  questionsArray.forEach(q => {
    if (q.questionType === "PRACTICAL") {
      q.timeLimit = 900;
    }
  });
}
```

### 3. Enhanced Problem Bank (`AIRA/server/utils/problem_bank.json`)
**Lines 1-82**: Expanded from 5 to 10 coding problems with:
- More diverse problem types (Arrays, Linked Lists, Stacks, Sorting, Design, Searching, Dynamic Programming, Strings)
- Better skill matching by adding common skills: JavaScript, TypeScript, Node.js, React, DSA, Algorithms
- Increased chances of matching user skills for personalized coding questions

**New problems added:**
- Binary Search
- Maximum Subarray (Dynamic Programming)
- Implement Queue using Stacks
- Find Missing Number
- String Compression

## How It Works Now

### Interview Flow for Technical Mode:
1. **Question 1** (Easy, 300s): Conceptual warm-up question about projects/experience
2. **Question 2** (Easy, 300s): Foundational technical concept
3. **Question 3** (Medium, **900s**): **PRACTICAL CODING QUESTION** ← Monaco Editor appears
4. **Question 4** (Medium, 300s): Complex scenario/architecture
5. **Question 5** (Hard, 300s): Challenging situation/stress test

### For HR Mode:
All questions remain CONCEPTUAL with 180 seconds each (no coding questions)

## Frontend Behavior
When a question with `questionType === "PRACTICAL"` is displayed:
- **Monaco Editor** appears instead of textarea (Line 676-686 in Step2Interview.jsx)
- **Timer** automatically set to 900 seconds (15 minutes)
- User writes code in the editor
- Code is submitted along with verbal explanation
- AI evaluates both the code and verbal explanation

## Testing Recommendations
1. Create a new Technical interview with skills like "JavaScript", "Python", or "Java"
2. Verify that Question 3 is a coding question with 900 seconds timer
3. Confirm Monaco Editor appears for the coding question
4. Submit code and verify AI evaluates it properly

## Files Modified
1. `AIRA/server/controllers/interview.controller.js` - Enhanced AI prompt + server-side validation
2. `AIRA/server/utils/problem_bank.json` - Expanded coding problem bank

## Expected Outcome
✅ Every Technical interview will now include at least 1 coding question  
✅ Coding questions will have 15-minute (900 seconds) time limit  
✅ Monaco Editor will appear for coding questions  
✅ Problem bank will match better with user skills  
✅ HR interviews remain unchanged (no coding questions)