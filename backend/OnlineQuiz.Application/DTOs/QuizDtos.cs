using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Application.DTOs;

public record QuizDto(
    int Id,
    string Title,
    string? Description,
    int TimeLimitMinutes,
    int TotalQuestions,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<QuestionSummaryDto> Questions);

public record QuestionSummaryDto(
    int Id,
    string Content,
    int TopicId,
    string TopicName,
    Difficulty Difficulty);

public record QuizUpsertRequest(
    string Title,
    string? Description,
    int TimeLimitMinutes,
    int TotalQuestions,
    bool IsActive,
    IReadOnlyList<int> TopicIds,
    IReadOnlyList<Difficulty> Difficulties);

public record QuizImportResultDto(
    QuizDto Quiz,
    int CreatedQuestionCount,
    int ReusedQuestionCount,
    int CreatedTopicCount,
    IReadOnlyList<string> Warnings);
