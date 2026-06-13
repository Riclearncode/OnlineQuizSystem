using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Api.Imports;
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
    private static readonly string[] OptionLabels = ["A", "B", "C", "D"];
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
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<QuizImportResultDto>> Import([FromForm] QuizImportForm request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Quiz title is required.");
        }

        if (request.TimeLimitMinutes <= 0)
        {
            throw new ArgumentException("Time limit must be greater than zero.");
        }

        var importedQuestions = await ReadImportQuestionsAsync(request);
        var warnings = new List<string>();
        var topicLookup = await _dbContext.Topics
            .ToDictionaryAsync(x => x.Name, StringComparer.OrdinalIgnoreCase);
        var createdTopicCount = 0;

        foreach (var topicName in importedQuestions.Select(x => x.TopicName.Trim()).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (topicLookup.ContainsKey(topicName))
            {
                continue;
            }

            var topic = new Topic
            {
                Name = topicName,
                Description = $"Imported topic: {topicName}",
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Topics.Add(topic);
            topicLookup[topicName] = topic;
            createdTopicCount++;
        }

        if (createdTopicCount > 0)
        {
            await _dbContext.SaveChangesAsync();
        }

        var existingQuestionLookup = await _dbContext.Questions
            .AsNoTracking()
            .Select(x => new { x.Id, x.Content })
            .ToDictionaryAsync(x => NormalizeContent(x.Content), x => x.Id, StringComparer.OrdinalIgnoreCase);

        var questionIds = new List<int>();
        var createdQuestionCount = 0;
        var reusedQuestionCount = 0;

        foreach (var imported in importedQuestions)
        {
            var contentKey = NormalizeContent(imported.Content);
            if (existingQuestionLookup.TryGetValue(contentKey, out var existingQuestionId))
            {
                questionIds.Add(existingQuestionId);
                reusedQuestionCount++;
                continue;
            }

            var topic = topicLookup[imported.TopicName.Trim()];
            var question = new Question
            {
                Content = imported.Content.Trim(),
                TopicId = topic.Id,
                Difficulty = imported.Difficulty,
                QuestionType = OnlineQuiz.Domain.Enums.QuestionType.SingleChoice,
                Explanation = imported.Explanation.Trim(),
                CorrectOptionId = 0,
                CreatedAt = DateTime.UtcNow,
                Options = imported.Options.Select((text, index) => new AnswerOption
                {
                    Label = OptionLabels[index],
                    Text = text.Trim(),
                    IsCorrect = index == imported.CorrectOptionIndex,
                    OptionOrder = index
                }).ToList()
            };

            _dbContext.Questions.Add(question);
            await _dbContext.SaveChangesAsync();

            question.CorrectOptionId = question.Options
                .OrderBy(x => x.Label)
                .ElementAt(imported.CorrectOptionIndex)
                .Id;
            await _dbContext.SaveChangesAsync();

            existingQuestionLookup[contentKey] = question.Id;
            questionIds.Add(question.Id);
            createdQuestionCount++;
        }

        var uniqueQuestionIds = new List<int>();
        var seenQuestionIds = new HashSet<int>();
        foreach (var questionId in questionIds)
        {
            if (seenQuestionIds.Add(questionId))
            {
                uniqueQuestionIds.Add(questionId);
            }
            else
            {
                warnings.Add($"Duplicate question id {questionId} was skipped in the quiz.");
            }
        }

        if (uniqueQuestionIds.Count == 0)
        {
            throw new ArgumentException("Import must contain at least one unique question.");
        }

        var quiz = new Quiz
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            TimeLimitMinutes = request.TimeLimitMinutes,
            TotalQuestions = uniqueQuestionIds.Count,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            QuizQuestions = uniqueQuestionIds.Select(id => new QuizQuestion { QuestionId = id }).ToList()
        };

        _dbContext.Quizzes.Add(quiz);
        await _dbContext.SaveChangesAsync();

        var createdQuiz = await LoadQuizAsync(quiz.Id);
        var result = new QuizImportResultDto(
            ToDto(createdQuiz!),
            createdQuestionCount,
            reusedQuestionCount,
            createdTopicCount,
            warnings);

        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, result);
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

    private static async Task<IReadOnlyList<ImportedQuestion>> ReadImportQuestionsAsync(QuizImportForm request)
    {
        var questions = new List<ImportedQuestion>();

        if (request.File is { Length: > 0 })
        {
            var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            await using var stream = request.File.OpenReadStream();

            if (extension == ".xlsx")
            {
                questions.AddRange(QuizImportParser.ParseExcel(stream));
            }
            else if (extension == ".pdf")
            {
                using var memoryStream = new MemoryStream();
                await stream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                var text = QuizImportParser.ExtractPdfText(memoryStream);
                questions.AddRange(QuizImportParser.ParseText(text));
            }
            else if (extension is ".txt" or ".md")
            {
                using var reader = new StreamReader(stream);
                questions.AddRange(QuizImportParser.ParseText(await reader.ReadToEndAsync()));
            }
            else
            {
                throw new ArgumentException("Unsupported import file type. Use .xlsx, .pdf, .txt, or the text form.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.RawText))
        {
            questions.AddRange(QuizImportParser.ParseText(request.RawText));
        }

        return questions.Count == 0
            ? throw new ArgumentException("Upload a standard .xlsx/.pdf file or paste standard form text.")
            : questions;
    }

    private static string NormalizeContent(string content)
    {
        return string.Join(' ', content.Trim().Split(Array.Empty<char>(), StringSplitOptions.RemoveEmptyEntries));
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
                x.Difficulty,
                x.QuestionType))
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
