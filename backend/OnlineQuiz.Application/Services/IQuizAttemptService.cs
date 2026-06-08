using OnlineQuiz.Application.DTOs;

namespace OnlineQuiz.Application.Services;

public interface IQuizAttemptService
{
    Task<StartQuizResponse> StartQuizAsync(string userId, StartQuizRequest request);
    Task<QuizAttemptResultDto> SubmitQuizAsync(string userId, SubmitQuizRequest request);
    Task<IReadOnlyList<QuizAttemptSummaryDto>> GetMyHistoryAsync(string userId);
    Task<IReadOnlyList<QuizAttemptSummaryDto>> GetAllAttemptsAsync();
    Task<QuizAttemptResultDto> GetAttemptAsync(string currentUserId, bool isAdmin, int attemptId);
}
