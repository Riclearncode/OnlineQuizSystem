namespace OnlineQuiz.Application.DTOs;

public record AdminDashboardSummaryDto(
    int TotalUsers,
    int TotalQuestions,
    int TotalQuizzes,
    int TotalAttempts,
    IReadOnlyList<TopStudentDto> TopStudents,
    IReadOnlyList<TopicQuestionStatDto> QuestionsByTopic,
    IReadOnlyList<QuizAttemptStatDto> AttemptsByQuiz);

public record TopStudentDto(string StudentName, string Email, decimal BestScore);

public record TopicQuestionStatDto(string TopicName, int QuestionCount);

public record QuizAttemptStatDto(string QuizTitle, int AttemptCount);
