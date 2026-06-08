using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Domain.Common;
using OnlineQuiz.Domain.Enums;
using OnlineQuiz.Infrastructure.Data;

namespace OnlineQuiz.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = RoleNames.Admin)]
public class AdminDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminDashboardController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<AdminDashboardSummaryDto>> Summary()
    {
        var totalUsers = await _dbContext.Users.CountAsync();
        var totalQuestions = await _dbContext.Questions.CountAsync();
        var totalQuizzes = await _dbContext.Quizzes.CountAsync();
        var totalAttempts = await _dbContext.QuizAttempts.CountAsync(x => x.Status == AttemptStatus.Submitted);

        var topStudentRows = await _dbContext.QuizAttempts
            .AsNoTracking()
            .Where(x => x.Status == AttemptStatus.Submitted)
            .GroupBy(x => x.UserId)
            .Select(x => new
            {
                UserId = x.Key,
                BestScore = x.Max(attempt => attempt.Score)
            })
            .OrderByDescending(x => x.BestScore)
            .Take(5)
            .Join(
                _dbContext.Users.AsNoTracking(),
                attempt => attempt.UserId,
                user => user.Id,
                (attempt, user) => new
                {
                    user.FullName,
                    user.Email,
                    attempt.BestScore
                })
            .ToListAsync();

        var topStudents = topStudentRows
            .Select(x => new TopStudentDto(x.FullName, x.Email ?? string.Empty, x.BestScore))
            .ToList();

        var questionTopicRows = await _dbContext.Topics
            .AsNoTracking()
            .Select(x => new
            {
                TopicName = x.Name,
                QuestionCount = x.Questions.Count
            })
            .OrderByDescending(x => x.QuestionCount)
            .ThenBy(x => x.TopicName)
            .ToListAsync();

        var questionsByTopic = questionTopicRows
            .Select(x => new TopicQuestionStatDto(x.TopicName, x.QuestionCount))
            .ToList();

        var attemptQuizRows = await _dbContext.Quizzes
            .AsNoTracking()
            .Select(x => new
            {
                QuizTitle = x.Title,
                AttemptCount = x.Attempts.Count(attempt => attempt.Status == AttemptStatus.Submitted)
            })
            .OrderByDescending(x => x.AttemptCount)
            .ThenBy(x => x.QuizTitle)
            .ToListAsync();

        var attemptsByQuiz = attemptQuizRows
            .Select(x => new QuizAttemptStatDto(x.QuizTitle, x.AttemptCount))
            .ToList();

        return Ok(new AdminDashboardSummaryDto(
            totalUsers,
            totalQuestions,
            totalQuizzes,
            totalAttempts,
            topStudents,
            questionsByTopic,
            attemptsByQuiz));
    }
}
