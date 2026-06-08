using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Application.Services;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Domain.Enums;
using OnlineQuiz.Infrastructure.Data;

namespace OnlineQuiz.Infrastructure.Services;

public class QuizAttemptService : IQuizAttemptService
{
    private readonly ApplicationDbContext _dbContext;

    public QuizAttemptService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StartQuizResponse> StartQuizAsync(string userId, StartQuizRequest request)
    {
        var quiz = await _dbContext.Quizzes
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Topic)
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .FirstOrDefaultAsync(x => x.Id == request.QuizId && x.IsActive);

        if (quiz is null)
        {
            throw new KeyNotFoundException("Active quiz was not found.");
        }

        var questions = quiz.QuizQuestions
            .Select(x => x.Question!)
            .OrderBy(x => x.Id)
            .ToList();

        if (questions.Count == 0)
        {
            throw new InvalidOperationException("This quiz does not have any questions.");
        }

        var attempt = new QuizAttempt
        {
            QuizId = quiz.Id,
            UserId = userId,
            StartedAt = DateTime.UtcNow,
            TotalQuestions = questions.Count,
            Status = AttemptStatus.InProgress
        };

        _dbContext.QuizAttempts.Add(attempt);
        await _dbContext.SaveChangesAsync();

        return new StartQuizResponse(
            attempt.Id,
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.TimeLimitMinutes,
            attempt.StartedAt,
            questions.Select(ToTakeQuizQuestionDto).ToList());
    }

    public async Task<QuizAttemptResultDto> SubmitQuizAsync(string userId, SubmitQuizRequest request)
    {
        var attempt = await _dbContext.QuizAttempts
            .Include(x => x.Quiz)
                .ThenInclude(x => x!.QuizQuestions)
                    .ThenInclude(x => x.Question)
                        .ThenInclude(x => x!.Options)
            .FirstOrDefaultAsync(x => x.Id == request.AttemptId);

        if (attempt is null)
        {
            throw new KeyNotFoundException("Quiz attempt was not found.");
        }

        if (attempt.UserId != userId)
        {
            throw new UnauthorizedAccessException("You can only submit your own quiz attempts.");
        }

        if (attempt.Status == AttemptStatus.Submitted)
        {
            throw new InvalidOperationException("This quiz attempt has already been submitted.");
        }

        var answerMap = request.Answers
            .GroupBy(x => x.QuestionId)
            .ToDictionary(x => x.Key, x => x.Last().SelectedOptionId);

        var questions = attempt.Quiz!.QuizQuestions
            .Select(x => x.Question!)
            .OrderBy(x => x.Id)
            .ToList();

        var answers = new List<AttemptAnswer>();
        foreach (var question in questions)
        {
            answerMap.TryGetValue(question.Id, out var selectedOptionId);
            var isValidOption = selectedOptionId is null || question.Options.Any(x => x.Id == selectedOptionId.Value);
            if (!isValidOption)
            {
                throw new InvalidOperationException($"Selected option is invalid for question {question.Id}.");
            }

            answers.Add(new AttemptAnswer
            {
                QuizAttemptId = attempt.Id,
                QuestionId = question.Id,
                SelectedOptionId = selectedOptionId,
                IsCorrect = selectedOptionId == question.CorrectOptionId
            });
        }

        _dbContext.AttemptAnswers.AddRange(answers);
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.TotalQuestions = questions.Count;
        attempt.CorrectCount = answers.Count(x => x.IsCorrect);
        attempt.WrongCount = questions.Count - attempt.CorrectCount;
        attempt.Score = questions.Count == 0 ? 0 : Math.Round(attempt.CorrectCount * 100m / questions.Count, 2);
        attempt.TimeSpentSeconds = (int)Math.Max(0, (attempt.SubmittedAt.Value - attempt.StartedAt).TotalSeconds);
        attempt.Status = AttemptStatus.Submitted;

        await _dbContext.SaveChangesAsync();
        return await GetAttemptAsync(userId, false, attempt.Id);
    }

    public async Task<IReadOnlyList<QuizAttemptSummaryDto>> GetMyHistoryAsync(string userId)
    {
        return await _dbContext.QuizAttempts
            .AsNoTracking()
            .Include(x => x.Quiz)
            .Include(x => x.User)
            .Where(x => x.UserId == userId && x.Status == AttemptStatus.Submitted)
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => ToSummaryDto(x))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<QuizAttemptSummaryDto>> GetAllAttemptsAsync()
    {
        return await _dbContext.QuizAttempts
            .AsNoTracking()
            .Include(x => x.Quiz)
            .Include(x => x.User)
            .Where(x => x.Status == AttemptStatus.Submitted)
            .OrderByDescending(x => x.SubmittedAt)
            .Take(100)
            .Select(x => ToSummaryDto(x))
            .ToListAsync();
    }

    public async Task<QuizAttemptResultDto> GetAttemptAsync(string currentUserId, bool isAdmin, int attemptId)
    {
        var attempt = await _dbContext.QuizAttempts
            .AsNoTracking()
            .Include(x => x.Quiz)
            .Include(x => x.User)
            .Include(x => x.Answers)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .Include(x => x.Answers)
                .ThenInclude(x => x.SelectedOption)
            .FirstOrDefaultAsync(x => x.Id == attemptId);

        if (attempt is null)
        {
            throw new KeyNotFoundException("Quiz attempt was not found.");
        }

        if (!isAdmin && attempt.UserId != currentUserId)
        {
            throw new UnauthorizedAccessException("You can only view your own quiz attempts.");
        }

        return ToResultDto(attempt);
    }

    private static TakeQuizQuestionDto ToTakeQuizQuestionDto(Question question)
    {
        return new TakeQuizQuestionDto(
            question.Id,
            question.Content,
            question.Topic?.Name ?? string.Empty,
            question.Options
                .OrderBy(x => x.Label)
                .Select(x => new AnswerOptionDto(x.Id, x.Label, x.Text))
                .ToList());
    }

    private static QuizAttemptSummaryDto ToSummaryDto(QuizAttempt attempt)
    {
        return new QuizAttemptSummaryDto(
            attempt.Id,
            attempt.QuizId,
            attempt.Quiz?.Title ?? string.Empty,
            attempt.User?.FullName ?? string.Empty,
            attempt.User?.Email ?? string.Empty,
            attempt.StartedAt,
            attempt.SubmittedAt,
            attempt.TotalQuestions,
            attempt.CorrectCount,
            attempt.WrongCount,
            attempt.Score);
    }

    private static QuizAttemptResultDto ToResultDto(QuizAttempt attempt)
    {
        var answers = attempt.Answers
            .OrderBy(x => x.QuestionId)
            .Select(answer =>
            {
                var question = answer.Question!;
                var correctOption = question.Options.First(x => x.Id == question.CorrectOptionId);
                return new AttemptAnswerResultDto(
                    question.Id,
                    question.Content,
                    answer.SelectedOptionId,
                    answer.SelectedOption?.Text,
                    correctOption.Id,
                    correctOption.Text,
                    answer.IsCorrect,
                    question.Explanation);
            })
            .ToList();

        return new QuizAttemptResultDto(
            attempt.Id,
            attempt.QuizId,
            attempt.Quiz?.Title ?? string.Empty,
            attempt.User?.FullName ?? string.Empty,
            attempt.StartedAt,
            attempt.SubmittedAt,
            attempt.TotalQuestions,
            attempt.CorrectCount,
            attempt.WrongCount,
            attempt.Score,
            attempt.TimeSpentSeconds,
            answers);
    }
}
