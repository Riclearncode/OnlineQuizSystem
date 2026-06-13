# Manual Test Checklist

Use this checklist after running backend and frontend locally.

## 1. Start the App

Backend:

```powershell
cd D:\file_hoc_tap\project\OnlineQuizSystem\backend
dotnet ef database update --project OnlineQuiz.Infrastructure --startup-project OnlineQuiz.Api
dotnet run --project OnlineQuiz.Api --launch-profile http
```

Frontend:

```powershell
cd D:\file_hoc_tap\project\OnlineQuizSystem\frontend\online-quiz-client
npm install
npm run dev
```

Expected:

- API runs at `http://localhost:5043/api`.
- Swagger opens at `http://localhost:5043/swagger`.
- Frontend opens at `http://localhost:5173` or another Vite port from `5173-5179`.

## 2. Auth and Roles

Admin:

- Login with `admin@quiz.com` / `Admin@123`.
- Confirm Admin sidebar contains Dashboard, Topics, Questions, Quizzes, Attempts.
- Confirm Student pages are not accessible as Admin through normal navigation.

Student:

- Login with `student@quiz.com` / `Student@123`.
- Confirm Student sidebar contains Dashboard, Active quizzes, My history.
- Confirm Admin pages are not accessible as Student.

## 3. Admin Question Management

Open **Admin > Questions**.

Create or edit one question for each type:

- `SingleChoice`
- `MultipleChoice`
- `TrueFalse`
- `FillInBlank`
- `Matching`
- `Ordering`
- `CodeOutput`
- `BigOAnalysis`

Expected:

- The question type filter works.
- The view detail modal displays answer data correctly.
- Required fields are enforced by the backend.
- Used questions cannot be deleted if they are already attached to quizzes or attempts.

## 4. Quiz Creation

Open **Admin > Quizzes**.

Expected:

- Admin can create a quiz from topic and difficulty filters.
- Admin can activate/deactivate quizzes.
- Existing seeded quiz `Mixed Question Types Quiz` appears after the backend starts and seed data runs.

## 5. Import Quiz

Open **Admin > Quizzes > Import quiz**.

Test sources:

- Excel `.xlsx`
- Text file `.txt`
- Pasted text form

Expected:

- Import creates a quiz and attaches questions.
- Missing topics are created.
- Existing question content is reused.
- Imported questions are `SingleChoice`.

## 6. Student Take Quiz

Login as Student and open **Active quizzes**.

Start `Mixed Question Types Quiz`.

Expected UI:

- `SingleChoice` and `TrueFalse` use radio buttons.
- `MultipleChoice` uses checkboxes.
- `FillInBlank`, text-based `CodeOutput`, and text-based `BigOAnalysis` use text input.
- `Matching` uses select controls.
- `Ordering` uses up/down buttons.
- Code-output questions display the code snippet.
- Correct answers are not shown before submit.

## 7. Submit and Result Review

Submit the quiz.

Expected:

- Result page shows score, correct count, wrong count, and time spent.
- Each answer card shows:
  - question type
  - student's answer
  - correct answer
  - explanation
  - per-question score
- Matching and ordering questions show structured submitted/correct answers.
- Code snippets are visible on the result page.

## 8. Student History

Open **My history**.

Expected:

- Submitted attempt appears.
- Student can open details for their own attempts.

## 9. Admin Attempts

Login as Admin and open **Attempts**.

Expected:

- Recent submitted attempts are listed.
- Admin can view details for any attempt.
- Attempt detail shows the same multi-type answer review as Student result.

## 10. Regression Commands

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
