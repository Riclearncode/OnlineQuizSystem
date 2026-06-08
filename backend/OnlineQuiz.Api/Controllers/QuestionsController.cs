using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Domain.Common;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Domain.Enums;
using OnlineQuiz.Infrastructure.Data;

namespace OnlineQuiz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = RoleNames.Admin)]
public class QuestionsController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public QuestionsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QuestionDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? topicId,
        [FromQuery] Difficulty? difficulty)
    {
        var query = _dbContext.Questions
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Options)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Content.Contains(search));
        }

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId.Value);
        }

        if (difficulty.HasValue)
        {
            query = query.Where(x => x.Difficulty == difficulty.Value);
        }

        var questions = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(questions.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuestionDto>> GetById(int id)
    {
        var question = await _dbContext.Questions
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == id);

        return question is null ? NotFound(new { message = "Question was not found." }) : Ok(ToDto(question));
    }

    [HttpPost]
    public async Task<ActionResult<QuestionDto>> Create(QuestionUpsertRequest request)
    {
        ValidateQuestion(request);

        if (!await _dbContext.Topics.AnyAsync(x => x.Id == request.TopicId))
        {
            return BadRequest(new { message = "Topic does not exist." });
        }

        var question = new Question
        {
            Content = request.Content.Trim(),
            TopicId = request.TopicId,
            Difficulty = request.Difficulty,
            Explanation = request.Explanation.Trim(),
            CorrectOptionId = 0,
            CreatedAt = DateTime.UtcNow,
            Options = request.Options.Select((option, index) => new AnswerOption
            {
                Label = NormalizeLabel(option.Label, index),
                Text = option.Text.Trim()
            }).ToList()
        };

        _dbContext.Questions.Add(question);
        await _dbContext.SaveChangesAsync();

        question.CorrectOptionId = question.Options.OrderBy(x => x.Label).ElementAt(request.CorrectOptionIndex).Id;
        await _dbContext.SaveChangesAsync();

        var created = await LoadQuestionAsync(question.Id);
        return CreatedAtAction(nameof(GetById), new { id = question.Id }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<QuestionDto>> Update(int id, QuestionUpsertRequest request)
    {
        ValidateQuestion(request);

        var question = await _dbContext.Questions
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (question is null)
        {
            return NotFound(new { message = "Question was not found." });
        }

        if (!await _dbContext.Topics.AnyAsync(x => x.Id == request.TopicId))
        {
            return BadRequest(new { message = "Topic does not exist." });
        }

        question.Content = request.Content.Trim();
        question.TopicId = request.TopicId;
        question.Difficulty = request.Difficulty;
        question.Explanation = request.Explanation.Trim();
        question.UpdatedAt = DateTime.UtcNow;

        var existingOptions = question.Options.OrderBy(x => x.Label).ToList();
        if (existingOptions.Count == 4)
        {
            for (var index = 0; index < existingOptions.Count; index++)
            {
                existingOptions[index].Label = NormalizeLabel(request.Options[index].Label, index);
                existingOptions[index].Text = request.Options[index].Text.Trim();
            }

            question.CorrectOptionId = existingOptions[request.CorrectOptionIndex].Id;
        }
        else
        {
            _dbContext.AnswerOptions.RemoveRange(question.Options);
            question.CorrectOptionId = 0;
            await _dbContext.SaveChangesAsync();

            question.Options = request.Options.Select((option, index) => new AnswerOption
            {
                QuestionId = question.Id,
                Label = NormalizeLabel(option.Label, index),
                Text = option.Text.Trim()
            }).ToList();
            await _dbContext.SaveChangesAsync();
            question.CorrectOptionId = question.Options.OrderBy(x => x.Label).ElementAt(request.CorrectOptionIndex).Id;
        }

        await _dbContext.SaveChangesAsync();
        var updated = await LoadQuestionAsync(question.Id);
        return Ok(ToDto(updated!));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var question = await _dbContext.Questions.FirstOrDefaultAsync(x => x.Id == id);
        if (question is null)
        {
            return NotFound(new { message = "Question was not found." });
        }

        var isUsed = await _dbContext.QuizQuestions.AnyAsync(x => x.QuestionId == id) ||
            await _dbContext.AttemptAnswers.AnyAsync(x => x.QuestionId == id);
        if (isUsed)
        {
            return BadRequest(new { message = "Cannot delete a question that is used in quizzes or attempts." });
        }

        _dbContext.Questions.Remove(question);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private async Task<Question?> LoadQuestionAsync(int id)
    {
        return await _dbContext.Questions
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    private static void ValidateQuestion(QuestionUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ArgumentException("Question content is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Explanation))
        {
            throw new ArgumentException("Question explanation is required.");
        }

        if (request.Options.Count != 4 || request.Options.Any(x => string.IsNullOrWhiteSpace(x.Text)))
        {
            throw new ArgumentException("Each question must have exactly 4 answer options.");
        }

        if (request.CorrectOptionIndex < 0 || request.CorrectOptionIndex > 3)
        {
            throw new ArgumentException("Correct option index must be between 0 and 3.");
        }
    }

    private static string NormalizeLabel(string? label, int index)
    {
        var fallback = ((char)('A' + index)).ToString();
        return string.IsNullOrWhiteSpace(label) ? fallback : label.Trim().ToUpperInvariant()[..1];
    }

    private static QuestionDto ToDto(Question question)
    {
        return new QuestionDto(
            question.Id,
            question.Content,
            question.TopicId,
            question.Topic?.Name ?? string.Empty,
            question.Difficulty,
            question.Explanation,
            question.CorrectOptionId,
            question.CreatedAt,
            question.UpdatedAt,
            question.Options
                .OrderBy(x => x.Label)
                .Select(x => new AnswerOptionDto(x.Id, x.Label, x.Text))
                .ToList());
    }
}
