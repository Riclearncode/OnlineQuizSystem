# Online Quiz System for Data Structures and Algorithms

Online Quiz System is a full-stack web application for creating, managing, taking, and grading Data Structures and Algorithms quizzes. It is built as a portfolio-ready project with a clean ASP.NET Core Web API backend, SQL Server persistence, JWT authentication, role-based authorization, and a responsive React frontend.

The project focuses on a practical academic use case: helping students practice DSA concepts through structured quizzes while giving administrators tools to manage question banks, quizzes, attempts, and statistics.

## Highlights

- ASP.NET Core Web API with a layered backend structure.
- ASP.NET Core Identity for user and role management.
- JWT authentication with Admin and Student authorization.
- SQL Server database managed with Entity Framework Core migrations.
- React + Vite frontend with Axios, React Router, Bootstrap, and bilingual UI support.
- Admin question bank supporting multiple DSA question formats.
- Student quiz-taking flow with hidden answers until submission.
- Automatic grading and detailed result review.
- Attempt history for students and attempt analytics for admins.
- Import support for standard single-choice quiz files.
- Focused xUnit tests for quiz grading behavior.

## Main Features

### Admin

- Manage DSA topics.
- Create, update, view, filter, and delete questions.
- Create quizzes from selected topics and difficulty levels.
- Import quizzes from Excel, PDF, text files, or pasted form text.
- View dashboard statistics.
- Review submitted quiz attempts with per-question details.

### Student

- Register and log in.
- View active quizzes.
- Take timed quizzes.
- Submit answers and receive automatic grading.
- Review score, correct answers, explanations, and attempt history.

## Supported Question Types

The question bank supports eight question types:

| Type | Student input | Typical use case |
| --- | --- | --- |
| `SingleChoice` | Radio option | Basic concept checks |
| `MultipleChoice` | Checkbox options | Questions with several correct statements |
| `TrueFalse` | True/False radio option | Fast factual checks |
| `FillInBlank` | Text answer | Terms, notation, short outputs |
| `Matching` | Pair selection | Match structures, definitions, or properties |
| `Ordering` | Ordered item list | Algorithm step ordering |
| `CodeOutput` | Choice or text answer | Predicting output from code/pseudocode |
| `BigOAnalysis` | Choice or text answer | Algorithm complexity analysis |

Detailed notes are available in [docs/question-types.md](docs/question-types.md).

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | ASP.NET Core Web API, .NET 10 |
| Application data | SQL Server |
| ORM | Entity Framework Core |
| Authentication | ASP.NET Core Identity, JWT Bearer |
| Frontend | React, Vite, Axios, React Router |
| UI | Bootstrap, Tailwind CSS utilities |
| Tests | xUnit, EF Core InMemory |
| Documentation | Swagger/OpenAPI, Markdown docs |

## Architecture

```text
OnlineQuizSystem/
|-- backend/
|   |-- OnlineQuiz.Api/             # Controllers, middleware, API startup
|   |-- OnlineQuiz.Application/     # DTOs, service contracts
|   |-- OnlineQuiz.Domain/          # Entities, enums, role constants
|   |-- OnlineQuiz.Infrastructure/  # EF Core, Identity, services, seed data
|   `-- OnlineQuiz.Tests/           # xUnit tests
|-- frontend/
|   `-- online-quiz-client/         # React + Vite client
|-- database/
|   `-- scripts/
|-- docs/
|   |-- api-notes.md
|   |-- manual-test-checklist.md
|   |-- question-types.md
|   `-- screenshots/
`-- README.md
```

## Database Overview

Core tables/entities:

- `ApplicationUser` and Identity role tables
- `Topic`
- `Question`
- `AnswerOption`
- `CorrectTextAnswer`
- `MatchingPair`
- `OrderingItem`
- `Quiz`
- `QuizQuestion`
- `QuizAttempt`
- `AttemptAnswer`

The migration that adds advanced question types is:

```text
20260613072348_AddQuestionTypes
```

## Seed Data

When the API starts, the database seeder creates local development data:

| Data | Description |
| --- | --- |
| Roles | `Admin`, `Student` |
| Admin account | `admin@quiz.com` / `Admin@123` |
| Student account | `student@quiz.com` / `Student@123` |
| Topics | 10 DSA topics |
| English questions | 40 single-choice DSA questions |
| Vietnamese questions | 20 single-choice DSA questions |
| Advanced questions | 32 questions across all supported question types |
| Sample quizzes | English, Vietnamese, and mixed-type quizzes |

The seeded credentials are intended for local demo and development only.

## Getting Started

### Prerequisites

- .NET SDK 10
- SQL Server, default instance used by the project: `.\NQTHAI`
- Node.js 20+ or 21+
- npm
- Optional: `dotnet-ef` CLI tool

Install `dotnet-ef` if needed:

```powershell
dotnet tool install --global dotnet-ef
```

### Backend

```powershell
cd D:\file_hoc_tap\project\OnlineQuizSystem\backend
dotnet restore
dotnet ef database update --project OnlineQuiz.Infrastructure --startup-project OnlineQuiz.Api
dotnet run --project OnlineQuiz.Api --launch-profile http
```

Backend URLs:

```text
API:     http://localhost:5043/api
Swagger: http://localhost:5043/swagger
```

### Frontend

```powershell
cd D:\file_hoc_tap\project\OnlineQuizSystem\frontend\online-quiz-client
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

If `5173` is busy, Vite may use another local port such as `5174`. The backend CORS policy allows local Vite ports from `5173` through `5179`.

If the API URL changes, define it in:

```text
frontend/online-quiz-client/.env.local
```

Example:

```text
VITE_API_URL=http://localhost:5043/api
```

## Demo Flow

1. Start the backend and frontend.
2. Log in as Admin.
3. Open **Questions** and review the supported question types.
4. Open **Quizzes** and confirm `Mixed Question Types Quiz` exists.
5. Log out and log in as Student.
6. Start `Mixed Question Types Quiz`.
7. Answer single-choice, multiple-choice, text, matching, ordering, code-output, and Big O questions.
8. Submit the quiz.
9. Review the result page with explanations and correct answers.
10. Log in as Admin and open **Attempts** to review the submitted attempt.

More manual validation steps are listed in [docs/manual-test-checklist.md](docs/manual-test-checklist.md).

## Import Quiz Format

Admins can import a quiz from:

- Excel `.xlsx`
- PDF `.pdf`
- Text `.txt` / `.md`
- Pasted form text

Current import support creates `SingleChoice` questions only. Other question types can be created from **Admin > Questions**.

Excel header format:

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

Accepted difficulty values:

```text
Easy, Medium, Hard
De, Trung binh, Kho
```

`Correct` accepts `A`, `B`, `C`, `D`, or numeric indexes `0-3` / `1-4`.

## API Documentation

Run the backend and open Swagger:

```text
http://localhost:5043/swagger
```

Additional endpoint notes and JSON payload examples are available in [docs/api-notes.md](docs/api-notes.md).

## Validation Commands

Backend:

```powershell
cd D:\file_hoc_tap\project\OnlineQuizSystem\backend
dotnet build
dotnet test
```

Frontend:

```powershell
cd D:\file_hoc_tap\project\OnlineQuizSystem\frontend\online-quiz-client
npm run lint
npm run build
```

## Current Status

Implemented:

- Authentication and authorization
- Admin topic/question/quiz management
- Multiple question types
- Quiz attempt flow
- Automatic grading
- Result review
- Admin attempt review
- Dashboard statistics
- English/Vietnamese UI switcher
- Import format guide
- README and API documentation

Planned improvements:

- Pagination for large question and attempt lists.
- Import/export support for all question types.
- Timed auto-submit on the frontend.
- Refresh tokens.
- Richer chart visualizations for admin analytics.

## Author

Nguyen Quang Thai
