using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Application.DTOs;

public record StartQuizRequest(int QuizId);

public record StartQuizResponse(
    int AttemptId,
    int QuizId,
    string Title,
    string? Description,
    int TimeLimitMinutes,
    DateTime StartedAt,
    IReadOnlyList<TakeQuizQuestionDto> Questions);

public record TakeQuizQuestionDto(
    int Id,
    string Content,
    string TopicName,
    Difficulty Difficulty,
    QuestionType QuestionType,
    string? CodeSnippet,
    IReadOnlyList<AnswerOptionDto> Options,
    IReadOnlyList<string> MatchingLeftItems,
    IReadOnlyList<string> MatchingRightItems,
    IReadOnlyList<string> OrderingItems);

public record SubmitQuizRequest(
    int AttemptId,
    IReadOnlyList<SubmitAnswerRequest> Answers);

public class SubmitAnswerRequest
{
    public SubmitAnswerRequest()
    {
    }

    public SubmitAnswerRequest(int questionId, int? selectedOptionId)
    {
        QuestionId = questionId;
        SelectedOptionId = selectedOptionId;
    }

    public int QuestionId { get; init; }
    public int? SelectedOptionId { get; init; }
    public IReadOnlyList<int> SelectedOptionIds { get; init; } = [];
    public string? TextAnswer { get; init; }
    public IReadOnlyDictionary<string, string> MatchingAnswer { get; init; } = new Dictionary<string, string>();
    public IReadOnlyList<string> OrderingAnswer { get; init; } = [];
}

public record QuizAttemptSummaryDto(
    int Id,
    int QuizId,
    string QuizTitle,
    string StudentName,
    string StudentEmail,
    DateTime StartedAt,
    DateTime? SubmittedAt,
    int TotalQuestions,
    int CorrectCount,
    int WrongCount,
    decimal Score);

public record QuizAttemptResultDto(
    int Id,
    int QuizId,
    string QuizTitle,
    string StudentName,
    DateTime StartedAt,
    DateTime? SubmittedAt,
    int TotalQuestions,
    int CorrectCount,
    int WrongCount,
    decimal Score,
    int TimeSpentSeconds,
    IReadOnlyList<AttemptAnswerResultDto> Answers);

public record AttemptAnswerResultDto(
    int QuestionId,
    string QuestionContent,
    Difficulty Difficulty,
    QuestionType QuestionType,
    string? CodeSnippet,
    int? SelectedOptionId,
    string? SelectedOptionText,
    IReadOnlyList<int> SelectedOptionIds,
    IReadOnlyList<AnswerOptionDto> SelectedOptions,
    string? TextAnswer,
    string? MatchingAnswerJson,
    string? OrderingAnswerJson,
    int CorrectOptionId,
    string CorrectOptionText,
    IReadOnlyList<AnswerOptionDto> CorrectOptions,
    IReadOnlyList<string> CorrectTextAnswers,
    IReadOnlyList<MatchingPairDto> CorrectMatchingPairs,
    IReadOnlyList<OrderingItemDto> CorrectOrderingItems,
    bool IsCorrect,
    decimal Score,
    decimal MaxScore,
    string Explanation);
