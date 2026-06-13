using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Domain.Entities;

namespace OnlineQuiz.Application.Services;

public interface IQuizGradingService
{
    AttemptAnswer Grade(Question question, SubmitAnswerRequest? answer);
}
