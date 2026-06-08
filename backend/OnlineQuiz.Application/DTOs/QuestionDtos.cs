using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Application.DTOs;

public record AnswerOptionDto(int Id, string Label, string Text);

public record AnswerOptionInput(string Label, string Text);

public record QuestionDto(
    int Id,
    string Content,
    int TopicId,
    string TopicName,
    Difficulty Difficulty,
    string Explanation,
    int CorrectOptionId,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<AnswerOptionDto> Options);

public record QuestionUpsertRequest(
    string Content,
    int TopicId,
    Difficulty Difficulty,
    string Explanation,
    IReadOnlyList<AnswerOptionInput> Options,
    int CorrectOptionIndex);

public record QuestionQuery(string? Search, int? TopicId, Difficulty? Difficulty);
