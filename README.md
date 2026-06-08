# Online Quiz System for Data Structures and Algorithms

A full-stack web application for practicing and managing Data Structures and Algorithms quizzes. The project includes JWT authentication, Admin/Student role authorization, CRUD management, automatic quiz grading, attempt history, and admin statistics.

## Features

- Student registration, login, JWT authentication, and role-based access control.
- Admin management for topics, questions, and quizzes.
- Student quiz-taking flow with hidden correct answers until submission.
- Automatic grading with score, correct/wrong count, explanations, and attempt details.
- Student attempt history.
- Admin dashboard with totals, top students, questions by topic, and attempts by quiz.
- English/Vietnamese language switcher for the frontend UI.
- Swagger/OpenAPI documentation for backend endpoints.
- Responsive React + Bootstrap frontend.

## Tech Stack

- Backend: ASP.NET Core Web API, .NET 10
- Database: SQL Server
- ORM: Entity Framework Core
- Auth: ASP.NET Core Identity, JWT Bearer
- Frontend: React, Vite, Axios, React Router, Bootstrap, Tailwind CSS utilities
- Tests: xUnit, EF Core InMemory

## Screenshots

Add screenshots to `docs/screenshots` after running the app locally.

## Database Design Summary

Core entities:

- `ApplicationUser` and Identity roles: Admin, Student
- `Topic`
- `Question`
- `AnswerOption`
- `Quiz`
- `QuizQuestion`
- `QuizAttempt`
- `AttemptAnswer`

The database is created by EF Core migrations. Runtime seed data creates:

- Admin: `admin@quiz.com` / `Admin@123`
- Student: `student@quiz.com` / `Student@123`
- 10 DSA topics
- 40 English sample DSA questions, each with 4 options and explanation
- 20 Vietnamese sample DSA questions, each with 4 options and explanation
- 3 English active sample quizzes
- 3 Vietnamese active sample quizzes

## How to Run Backend

Requirements:

- .NET SDK 10
- SQL Server instance, default local setting: `.\NQTHAI`
- `dotnet-ef` tool

Commands:

```bash
cd backend
dotnet restore
dotnet ef database update --project OnlineQuiz.Infrastructure --startup-project OnlineQuiz.Api
dotnet run --project OnlineQuiz.Api --launch-profile http
```

Backend URL:

- API: `http://localhost:5043/api`
- Swagger: `http://localhost:5043/swagger`

Development CORS allows local Vite origins on `localhost`, `127.0.0.1`, and `::1` from ports `5173` through `5179`.

To change database settings, copy `backend/OnlineQuiz.Api/appsettings.example.json` values into your local `appsettings.Development.json`.

## How to Run Frontend

Requirements:

- Node.js 20+ or 21+
- npm

Commands:

```bash
cd frontend/online-quiz-client
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

If port `5173` is already in use, Vite may start on the next free port, for example `http://127.0.0.1:5174`. The backend already allows local Vite ports `5173-5179`.

If the backend URL changes, create `.env.local`:

```bash
VITE_API_URL=http://localhost:5043/api
```

## Default Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@quiz.com` | `Admin@123` |
| Student | `student@quiz.com` | `Student@123` |

## API Documentation

Run the backend and open Swagger at `http://localhost:5043/swagger`.

Short endpoint notes are available in `docs/api-notes.md`.

## Project Structure

```text
OnlineQuizSystem/
├── backend/
│   ├── OnlineQuiz.Api/
│   ├── OnlineQuiz.Application/
│   ├── OnlineQuiz.Domain/
│   ├── OnlineQuiz.Infrastructure/
│   └── OnlineQuiz.Tests/
├── frontend/
│   └── online-quiz-client/
├── database/
│   └── scripts/
├── docs/
│   ├── screenshots/
│   └── api-notes.md
└── README.md
```

## Future Improvements

- Add pagination for questions and attempt lists.
- Add CSV import/export for question banks.
- Add timed auto-submit on the frontend.
- Add refresh tokens.
- Add richer charts for admin analytics.

## Author

Nguyen Quang Thai
