using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Api.Imports;

public sealed record ImportedQuestion(
    string TopicName,
    Difficulty Difficulty,
    string Content,
    IReadOnlyList<string> Options,
    int CorrectOptionIndex,
    string Explanation);
