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
    IReadOnlyList<AnswerOptionDto> Options);

public record SubmitQuizRequest(
    int AttemptId,
    IReadOnlyList<SubmitAnswerRequest> Answers);

public record SubmitAnswerRequest(int QuestionId, int? SelectedOptionId);

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
    int? SelectedOptionId,
    string? SelectedOptionText,
    int CorrectOptionId,
    string CorrectOptionText,
    bool IsCorrect,
    string Explanation);
