using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Application.Services;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Domain.Enums;
using OnlineQuiz.Infrastructure.Data;

namespace OnlineQuiz.Infrastructure.Services;

public class QuizAttemptService : IQuizAttemptService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ApplicationDbContext _dbContext;
    private readonly IQuizGradingService _quizGradingService;

    public QuizAttemptService(ApplicationDbContext dbContext) : this(dbContext, new QuizGradingService())
    {
    }

    public QuizAttemptService(ApplicationDbContext dbContext, IQuizGradingService quizGradingService)
    {
        _dbContext = dbContext;
        _quizGradingService = quizGradingService;
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
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.MatchingPairs)
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.OrderingItems)
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
            .Include(x => x.Quiz)
                .ThenInclude(x => x!.QuizQuestions)
                    .ThenInclude(x => x.Question)
                        .ThenInclude(x => x!.CorrectTextAnswers)
            .Include(x => x.Quiz)
                .ThenInclude(x => x!.QuizQuestions)
                    .ThenInclude(x => x.Question)
                        .ThenInclude(x => x!.MatchingPairs)
            .Include(x => x.Quiz)
                .ThenInclude(x => x!.QuizQuestions)
                    .ThenInclude(x => x.Question)
                        .ThenInclude(x => x!.OrderingItems)
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
            .ToDictionary(x => x.Key, x => x.Last());

        var questions = attempt.Quiz!.QuizQuestions
            .Select(x => x.Question!)
            .OrderBy(x => x.Id)
            .ToList();

        var answers = new List<AttemptAnswer>();
        foreach (var question in questions)
        {
            answerMap.TryGetValue(question.Id, out var submittedAnswer);
            var gradedAnswer = _quizGradingService.Grade(question, submittedAnswer);
            gradedAnswer.QuizAttemptId = attempt.Id;
            answers.Add(gradedAnswer);
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
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.CorrectTextAnswers)
            .Include(x => x.Answers)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.MatchingPairs)
            .Include(x => x.Answers)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.OrderingItems)
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
            question.Difficulty,
            question.QuestionType,
            question.CodeSnippet,
            question.Options
                .OrderBy(x => x.OptionOrder)
                .ThenBy(x => x.Label)
                .Select(x => new AnswerOptionDto(x.Id, x.Label, x.Text))
                .ToList(),
            question.MatchingPairs
                .OrderBy(x => x.PairOrder)
                .Select(x => x.LeftItem)
                .ToList(),
            question.MatchingPairs
                .OrderBy(_ => Guid.NewGuid())
                .Select(x => x.RightItem)
                .ToList(),
            question.OrderingItems
                .OrderBy(_ => Guid.NewGuid())
                .Select(x => x.Content)
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
                var correctOption = question.Options.FirstOrDefault(x => x.Id == question.CorrectOptionId);
                var selectedOptionIds = DeserializeSelectedOptionIds(answer.SelectedOptionIdsJson).ToList();
                if (selectedOptionIds.Count == 0 && answer.SelectedOptionId.HasValue)
                {
                    selectedOptionIds.Add(answer.SelectedOptionId.Value);
                }

                var selectedOptionIdSet = selectedOptionIds.ToHashSet();
                return new AttemptAnswerResultDto(
                    question.Id,
                    question.Content,
                    question.Difficulty,
                    question.QuestionType,
                    question.CodeSnippet,
                    answer.SelectedOptionId,
                    answer.SelectedOption?.Text,
                    selectedOptionIds,
                    question.Options
                        .Where(x => selectedOptionIdSet.Contains(x.Id))
                        .OrderBy(x => x.OptionOrder)
                        .ThenBy(x => x.Label)
                        .Select(x => new AnswerOptionDto(x.Id, x.Label, x.Text))
                        .ToList(),
                    answer.TextAnswer,
                    answer.MatchingAnswerJson,
                    answer.OrderingAnswerJson,
                    correctOption?.Id ?? 0,
                    correctOption?.Text ?? string.Empty,
                    question.Options
                        .Where(x => x.IsCorrect)
                        .OrderBy(x => x.OptionOrder)
                        .ThenBy(x => x.Label)
                        .Select(x => new AnswerOptionDto(x.Id, x.Label, x.Text))
                        .ToList(),
                    question.CorrectTextAnswers
                        .OrderBy(x => x.Id)
                        .Select(x => x.CorrectText)
                        .ToList(),
                    question.MatchingPairs
                        .OrderBy(x => x.PairOrder)
                        .Select(x => new MatchingPairDto(x.Id, x.LeftItem, x.RightItem, x.PairOrder))
                        .ToList(),
                    question.OrderingItems
                        .OrderBy(x => x.CorrectOrder)
                        .Select(x => new OrderingItemDto(x.Id, x.Content, x.CorrectOrder))
                        .ToList(),
                    answer.IsCorrect,
                    answer.Score,
                    answer.MaxScore,
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

    private static IReadOnlyList<int> DeserializeSelectedOptionIds(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<int>>(value, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
