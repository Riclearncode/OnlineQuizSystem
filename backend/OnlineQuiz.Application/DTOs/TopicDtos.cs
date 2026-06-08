namespace OnlineQuiz.Application.DTOs;

public record TopicDto(
    int Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record TopicUpsertRequest(string Name, string? Description);
