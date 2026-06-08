# Database Scripts

The database is managed with Entity Framework Core migrations in:

```text
backend/OnlineQuiz.Infrastructure/Migrations
```

Local database update command:

```bash
cd backend
dotnet ef database update --project OnlineQuiz.Infrastructure --startup-project OnlineQuiz.Api
```

Runtime seed data is implemented in `OnlineQuiz.Infrastructure/Data/DatabaseSeeder.cs` and runs when the API starts.
