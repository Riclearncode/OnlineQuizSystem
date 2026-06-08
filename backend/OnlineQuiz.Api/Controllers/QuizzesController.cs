using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Domain.Common;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Infrastructure.Data;

namespace OnlineQuiz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizzesController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public QuizzesController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QuizDto>>> GetAll()
    {
        var query = _dbContext.Quizzes
            .AsNoTracking()
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Topic)
            .AsQueryable();

        if (!User.IsInRole(RoleNames.Admin))
        {
            query = query.Where(x => x.IsActive);
        }

        var quizzes = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(quizzes.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuizDto>> GetById(int id)
    {
        var quiz = await _dbContext.Quizzes
            .AsNoTracking()
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Topic)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (quiz is null)
        {
            return NotFound(new { message = "Quiz was not found." });
        }

        if (!User.IsInRole(RoleNames.Admin) && !quiz.IsActive)
        {
            return NotFound(new { message = "Quiz was not found." });
        }

        return Ok(ToDto(quiz));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost]
    public async Task<ActionResult<QuizDto>> Create(QuizUpsertRequest request)
    {
        ValidateQuiz(request);
        var questionIds = await SelectQuestionIdsAsync(request);

        var quiz = new Quiz
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            TimeLimitMinutes = request.TimeLimitMinutes,
            TotalQuestions = questionIds.Count,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            QuizQuestions = questionIds.Select(id => new QuizQuestion { QuestionId = id }).ToList()
        };

        _dbContext.Quizzes.Add(quiz);
        await _dbContext.SaveChangesAsync();

        var created = await LoadQuizAsync(quiz.Id);
        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, ToDto(created!));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<QuizDto>> Update(int id, QuizUpsertRequest request)
    {
        ValidateQuiz(request);

        var quiz = await _dbContext.Quizzes
            .Include(x => x.QuizQuestions)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (quiz is null)
        {
            return NotFound(new { message = "Quiz was not found." });
        }

        var questionIds = await SelectQuestionIdsAsync(request);
        quiz.Title = request.Title.Trim();
        quiz.Description = request.Description?.Trim();
        quiz.TimeLimitMinutes = request.TimeLimitMinutes;
        quiz.TotalQuestions = questionIds.Count;
        quiz.IsActive = request.IsActive;
        quiz.UpdatedAt = DateTime.UtcNow;

        _dbContext.QuizQuestions.RemoveRange(quiz.QuizQuestions);
        quiz.QuizQuestions = questionIds.Select(questionId => new QuizQuestion
        {
            QuizId = quiz.Id,
            QuestionId = questionId
        }).ToList();

        await _dbContext.SaveChangesAsync();
        var updated = await LoadQuizAsync(quiz.Id);
        return Ok(ToDto(updated!));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quiz = await _dbContext.Quizzes.FirstOrDefaultAsync(x => x.Id == id);
        if (quiz is null)
        {
            return NotFound(new { message = "Quiz was not found." });
        }

        var hasAttempts = await _dbContext.QuizAttempts.AnyAsync(x => x.QuizId == id);
        if (hasAttempts)
        {
            return BadRequest(new { message = "Cannot delete a quiz that already has attempts." });
        }

        _dbContext.Quizzes.Remove(quiz);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private async Task<Quiz?> LoadQuizAsync(int id)
    {
        return await _dbContext.Quizzes
            .AsNoTracking()
            .Include(x => x.QuizQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Topic)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    private async Task<IReadOnlyList<int>> SelectQuestionIdsAsync(QuizUpsertRequest request)
    {
        var query = _dbContext.Questions.AsNoTracking().AsQueryable();

        if (request.TopicIds.Count > 0)
        {
            query = query.Where(x => request.TopicIds.Contains(x.TopicId));
        }

        if (request.Difficulties.Count > 0)
        {
            query = query.Where(x => request.Difficulties.Contains(x.Difficulty));
        }

        var questionIds = await query
            .OrderBy(x => x.Id)
            .Take(request.TotalQuestions)
            .Select(x => x.Id)
            .ToListAsync();

        if (questionIds.Count < request.TotalQuestions)
        {
            throw new InvalidOperationException("Not enough questions match the selected topic and difficulty filters.");
        }

        return questionIds;
    }

    private static void ValidateQuiz(QuizUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Quiz title is required.");
        }

        if (request.TimeLimitMinutes <= 0)
        {
            throw new ArgumentException("Time limit must be greater than zero.");
        }

        if (request.TotalQuestions <= 0)
        {
            throw new ArgumentException("Total questions must be greater than zero.");
        }
    }

    private static QuizDto ToDto(Quiz quiz)
    {
        var questions = quiz.QuizQuestions
            .Select(x => x.Question!)
            .OrderBy(x => x.Id)
            .Select(x => new QuestionSummaryDto(
                x.Id,
                x.Content,
                x.TopicId,
                x.Topic?.Name ?? string.Empty,
                x.Difficulty))
            .ToList();

        return new QuizDto(
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.TimeLimitMinutes,
            quiz.TotalQuestions,
            quiz.IsActive,
            quiz.CreatedAt,
            quiz.UpdatedAt,
            questions);
    }
}
