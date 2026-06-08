# API Notes

Base URL: `http://localhost:5043/api`

Use the JWT returned from login/register as a Bearer token:

```text
Authorization: Bearer <token>
```

## Auth

- `POST /api/auth/register` creates a Student account.
- `POST /api/auth/login` returns JWT token, user info, and role.
- `GET /api/auth/me` returns the current authenticated user.

## Topics

- `GET /api/topics` lists topics for authenticated users.
- `GET /api/topics/{id}` returns one topic.
- `POST /api/topics` creates a topic. Admin only.
- `PUT /api/topics/{id}` updates a topic. Admin only.
- `DELETE /api/topics/{id}` deletes a topic if no questions use it. Admin only.

## Questions

Admin only.

- `GET /api/questions?search=&topicId=&difficulty=` lists and filters questions.
- `GET /api/questions/{id}` returns a question with options and correct option.
- `POST /api/questions` creates a question with 4 options.
- `PUT /api/questions/{id}` updates question content, options, and explanation.
- `DELETE /api/questions/{id}` deletes a question if it is not used by quizzes or attempts.

`difficulty` uses `Easy`, `Medium`, or `Hard`.

## Quizzes

- `GET /api/quizzes` lists active quizzes for Students and all quizzes for Admin.
- `GET /api/quizzes/{id}` returns quiz metadata and selected questions.
- `POST /api/quizzes` creates a quiz from topic/difficulty filters. Admin only.
- `PUT /api/quizzes/{id}` updates quiz metadata and selected questions. Admin only.
- `DELETE /api/quizzes/{id}` deletes a quiz if it has no attempts. Admin only.

## Quiz Attempts

- `POST /api/quiz-attempts/start` starts an active quiz. Student only.
- `POST /api/quiz-attempts/submit` submits answers and returns graded result. Student only.
- `GET /api/quiz-attempts/my-history` returns the current student's submitted attempts.
- `GET /api/quiz-attempts/{id}` returns attempt details; Students can view their own attempts, Admin can view any.
- `GET /api/quiz-attempts` returns recent submitted attempts. Admin only.

Start quiz responses do not include correct answers or explanations. Result responses include correct answers and explanations.

## Admin Dashboard

- `GET /api/admin/dashboard-summary` returns totals, top students, questions by topic, and attempts by quiz. Admin only.
