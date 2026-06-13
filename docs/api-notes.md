# API Notes

Base URL:

```text
http://localhost:5043/api
```

Use the JWT returned from login/register as a Bearer token:

```text
Authorization: Bearer <token>
```

All JSON enum values are serialized as strings, for example `Easy`, `Student`, `SingleChoice`.

## Auth

- `POST /api/auth/register` creates a Student account.
- `POST /api/auth/login` returns JWT token, user info, and role.
- `GET /api/auth/me` returns the current authenticated user.

Login body:

```json
{
  "email": "admin@quiz.com",
  "password": "Admin@123"
}
```

## Topics

- `GET /api/topics` lists topics for authenticated users.
- `GET /api/topics/{id}` returns one topic.
- `POST /api/topics` creates a topic. Admin only.
- `PUT /api/topics/{id}` updates a topic. Admin only.
- `DELETE /api/topics/{id}` deletes a topic if no questions use it. Admin only.

## Questions

Admin only.

- `GET /api/questions?search=&topicId=&difficulty=&questionType=` lists and filters questions.
- `GET /api/questions/{id}` returns one question with answer metadata.
- `POST /api/questions` creates a question.
- `PUT /api/questions/{id}` updates a question.
- `DELETE /api/questions/{id}` deletes a question if it is not used by quizzes or attempts.

`difficulty` accepts `Easy`, `Medium`, `Hard`.

`questionType` accepts:

- `SingleChoice`
- `MultipleChoice`
- `TrueFalse`
- `FillInBlank`
- `Matching`
- `Ordering`
- `CodeOutput`
- `BigOAnalysis`

### SingleChoice Example

```json
{
  "content": "Which operation removes the top item from a stack?",
  "topicId": 1,
  "difficulty": "Easy",
  "questionType": "SingleChoice",
  "explanation": "Pop removes the top item in a stack.",
  "options": [
    { "label": "A", "text": "Enqueue", "isCorrect": false, "optionOrder": 0 },
    { "label": "B", "text": "Pop", "isCorrect": true, "optionOrder": 1 },
    { "label": "C", "text": "Dequeue", "isCorrect": false, "optionOrder": 2 },
    { "label": "D", "text": "Hash", "isCorrect": false, "optionOrder": 3 }
  ],
  "correctOptionIndex": 1,
  "correctOptionIndexes": [1]
}
```

### MultipleChoice Example

```json
{
  "content": "Which statements about a stack are correct?",
  "topicId": 1,
  "difficulty": "Medium",
  "questionType": "MultipleChoice",
  "explanation": "A stack follows LIFO and supports push/pop.",
  "options": [
    { "label": "A", "text": "It follows LIFO", "isCorrect": true, "optionOrder": 0 },
    { "label": "B", "text": "Push adds an item", "isCorrect": true, "optionOrder": 1 },
    { "label": "C", "text": "Pop removes the top item", "isCorrect": true, "optionOrder": 2 },
    { "label": "D", "text": "It always follows FIFO", "isCorrect": false, "optionOrder": 3 }
  ],
  "correctOptionIndexes": [0, 1, 2]
}
```

### FillInBlank Example

```json
{
  "content": "A stack follows the ____ principle.",
  "topicId": 1,
  "difficulty": "Easy",
  "questionType": "FillInBlank",
  "explanation": "Stack behavior is Last In, First Out.",
  "correctTextAnswers": [
    { "correctText": "LIFO", "isCaseSensitive": false },
    { "correctText": "Last In First Out", "isCaseSensitive": false }
  ]
}
```

### Matching Example

```json
{
  "content": "Match each structure with its rule.",
  "topicId": 1,
  "difficulty": "Medium",
  "questionType": "Matching",
  "explanation": "Stack is LIFO and queue is FIFO.",
  "matchingPairs": [
    { "leftItem": "Stack", "rightItem": "LIFO", "pairOrder": 0 },
    { "leftItem": "Queue", "rightItem": "FIFO", "pairOrder": 1 }
  ]
}
```

### Ordering Example

```json
{
  "content": "Put binary search steps in order.",
  "topicId": 8,
  "difficulty": "Medium",
  "questionType": "Ordering",
  "explanation": "Binary search checks the middle and narrows the range.",
  "orderingItems": [
    { "content": "Set left and right bounds", "correctOrder": 0 },
    { "content": "Compute mid", "correctOrder": 1 },
    { "content": "Compare array[mid] with key", "correctOrder": 2 },
    { "content": "Narrow the search range", "correctOrder": 3 }
  ]
}
```

### CodeOutput Example

```json
{
  "content": "What output does this stack pseudocode produce?",
  "topicId": 1,
  "difficulty": "Medium",
  "questionType": "CodeOutput",
  "codeSnippet": "push(3)\npush(7)\nprint(pop())",
  "explanation": "The last pushed value is popped first.",
  "correctTextAnswers": [
    { "correctText": "7", "isCaseSensitive": false }
  ]
}
```

## Quizzes

- `GET /api/quizzes` lists active quizzes for Students and all quizzes for Admin.
- `GET /api/quizzes/{id}` returns quiz metadata and selected question summaries.
- `POST /api/quizzes` creates a quiz from topic/difficulty filters. Admin only.
- `POST /api/quizzes/import` imports a quiz from `.xlsx`, `.pdf`, `.txt`, `.md`, or pasted text form data. Admin only.
- `PUT /api/quizzes/{id}` updates quiz metadata and selected questions. Admin only.
- `DELETE /api/quizzes/{id}` deletes a quiz if it has no attempts. Admin only.

Create/update quiz body:

```json
{
  "title": "Mixed Question Types Quiz",
  "description": "Practice several DSA question formats.",
  "timeLimitMinutes": 35,
  "totalQuestions": 10,
  "isActive": true,
  "topicIds": [1, 2, 8],
  "difficulties": ["Easy", "Medium", "Hard"]
}
```

Quiz import uses `multipart/form-data`:

```text
title: Required quiz title
description: Optional
timeLimitMinutes: Required positive number
isActive: true/false
file: Optional .xlsx/.pdf/.txt/.md
rawText: Optional standard text blocks
```

Current quiz import creates `SingleChoice` questions only.

Excel `.xlsx` columns:

```text
Topic | Difficulty | Question | A | B | C | D | Correct | Explanation
```

Text/PDF block format:

```text
Topic: Stack
Difficulty: Easy
Question: What principle does a stack use?
A. FIFO
B. LIFO
C. Random access
D. Hashing
Correct: B
Explanation: Stack uses last-in, first-out.
---
```

## Quiz Attempts

- `POST /api/quiz-attempts/start` starts an active quiz. Student only.
- `POST /api/quiz-attempts/submit` submits answers and returns graded result. Student only.
- `GET /api/quiz-attempts/my-history` returns the current student's submitted attempts.
- `GET /api/quiz-attempts/{id}` returns attempt details; Students can view their own attempts, Admin can view any.
- `GET /api/quiz-attempts` returns recent submitted attempts. Admin only.

Start body:

```json
{
  "quizId": 1
}
```

Start quiz responses include student-facing fields only:

- `questionType`
- `codeSnippet`
- `options`
- `matchingLeftItems`
- `matchingRightItems`
- `orderingItems`

Start quiz responses do not include correct answers or explanations.

Submit body:

```json
{
  "attemptId": 12,
  "answers": [
    {
      "questionId": 101,
      "selectedOptionId": 501,
      "selectedOptionIds": [501]
    },
    {
      "questionId": 102,
      "selectedOptionIds": [511, 512]
    },
    {
      "questionId": 103,
      "textAnswer": "O(log n)"
    },
    {
      "questionId": 104,
      "matchingAnswer": {
        "Stack": "LIFO",
        "Queue": "FIFO"
      }
    },
    {
      "questionId": 105,
      "orderingAnswer": [
        "Set left and right bounds",
        "Compute mid",
        "Compare array[mid] with key",
        "Narrow the search range"
      ]
    }
  ]
}
```

Result responses include correct answer data and explanations:

- `selectedOptions`
- `correctOptions`
- `correctTextAnswers`
- `correctMatchingPairs`
- `correctOrderingItems`
- `explanation`

## Admin Dashboard

- `GET /api/admin/dashboard-summary` returns totals, top students, questions by topic, and attempts by quiz. Admin only.
