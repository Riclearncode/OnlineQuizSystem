using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Application.DTOs;

public record AnswerOptionDto(int Id, string Label, string Text);

public record QuestionAnswerOptionDto(
    int Id,
    string Label,
    string Text,
    bool IsCorrect,
    int OptionOrder);

public class AnswerOptionInput
{
    public string? Label { get; init; }
    public string Text { get; init; } = string.Empty;
    public bool IsCorrect { get; init; }
    public int? OptionOrder { get; init; }
}

public record CorrectTextAnswerDto(int Id, string CorrectText, bool IsCaseSensitive);

public class CorrectTextAnswerInput
{
    public string CorrectText { get; init; } = string.Empty;
    public bool IsCaseSensitive { get; init; }
}

public record MatchingPairDto(int Id, string LeftItem, string RightItem, int PairOrder);

public class MatchingPairInput
{
    public string LeftItem { get; init; } = string.Empty;
    public string RightItem { get; init; } = string.Empty;
    public int? PairOrder { get; init; }
}

public record OrderingItemDto(int Id, string Content, int CorrectOrder);

public class OrderingItemInput
{
    public string Content { get; init; } = string.Empty;
    public int? CorrectOrder { get; init; }
}

public record QuestionDto(
    int Id,
    string Content,
    int TopicId,
    string TopicName,
    Difficulty Difficulty,
    QuestionType QuestionType,
    string Explanation,
    string? CodeSnippet,
    int CorrectOptionId,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<QuestionAnswerOptionDto> Options,
    IReadOnlyList<CorrectTextAnswerDto> CorrectTextAnswers,
    IReadOnlyList<MatchingPairDto> MatchingPairs,
    IReadOnlyList<OrderingItemDto> OrderingItems);

public class QuestionUpsertRequest
{
    public string Content { get; init; } = string.Empty;
    public int TopicId { get; init; }
    public Difficulty Difficulty { get; init; } = Difficulty.Easy;
    public QuestionType QuestionType { get; init; } = QuestionType.SingleChoice;
    public string Explanation { get; init; } = string.Empty;
    public string? CodeSnippet { get; init; }
    public IReadOnlyList<AnswerOptionInput> Options { get; init; } = [];
    public int CorrectOptionIndex { get; init; }
    public IReadOnlyList<int> CorrectOptionIndexes { get; init; } = [];
    public IReadOnlyList<CorrectTextAnswerInput> CorrectTextAnswers { get; init; } = [];
    public IReadOnlyList<MatchingPairInput> MatchingPairs { get; init; } = [];
    public IReadOnlyList<OrderingItemInput> OrderingItems { get; init; } = [];
}

public record QuestionQuery(string? Search, int? TopicId, Difficulty? Difficulty, QuestionType? QuestionType);
