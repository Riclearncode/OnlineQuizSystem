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
        [FromQuery] Difficulty? difficulty,
        [FromQuery] QuestionType? questionType)
    {
        var query = BuildQuestionQuery();

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

        if (questionType.HasValue)
        {
            query = query.Where(x => x.QuestionType == questionType.Value);
        }

        var questions = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(questions.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuestionDto>> GetById(int id)
    {
        var question = await BuildQuestionQuery().FirstOrDefaultAsync(x => x.Id == id);
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
            QuestionType = request.QuestionType,
            Explanation = request.Explanation.Trim(),
            CodeSnippet = NormalizeNullable(request.CodeSnippet),
            CorrectOptionId = 0,
            CreatedAt = DateTime.UtcNow
        };

        ApplyQuestionChildren(question, request);

        _dbContext.Questions.Add(question);
        await _dbContext.SaveChangesAsync();

        UpdateLegacyCorrectOptionId(question);
        await _dbContext.SaveChangesAsync();

        var created = await LoadQuestionAsync(question.Id);
        return CreatedAtAction(nameof(GetById), new { id = question.Id }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<QuestionDto>> Update(int id, QuestionUpsertRequest request)
    {
        ValidateQuestion(request);

        var question = await LoadQuestionForUpdateAsync(id);
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
        question.QuestionType = request.QuestionType;
        question.Explanation = request.Explanation.Trim();
        question.CodeSnippet = NormalizeNullable(request.CodeSnippet);
        question.UpdatedAt = DateTime.UtcNow;

        ReplaceQuestionChildren(question, request);
        await _dbContext.SaveChangesAsync();

        UpdateLegacyCorrectOptionId(question);
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

    private IQueryable<Question> BuildQuestionQuery()
    {
        return _dbContext.Questions
            .AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Options)
            .Include(x => x.CorrectTextAnswers)
            .Include(x => x.MatchingPairs)
            .Include(x => x.OrderingItems)
            .AsQueryable();
    }

    private async Task<Question?> LoadQuestionAsync(int id)
    {
        return await BuildQuestionQuery().FirstOrDefaultAsync(x => x.Id == id);
    }

    private async Task<Question?> LoadQuestionForUpdateAsync(int id)
    {
        return await _dbContext.Questions
            .Include(x => x.Options)
            .Include(x => x.CorrectTextAnswers)
            .Include(x => x.MatchingPairs)
            .Include(x => x.OrderingItems)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    private void ReplaceQuestionChildren(Question question, QuestionUpsertRequest request)
    {
        _dbContext.AnswerOptions.RemoveRange(question.Options);
        _dbContext.CorrectTextAnswers.RemoveRange(question.CorrectTextAnswers);
        _dbContext.MatchingPairs.RemoveRange(question.MatchingPairs);
        _dbContext.OrderingItems.RemoveRange(question.OrderingItems);

        question.Options = new List<AnswerOption>();
        question.CorrectTextAnswers = new List<CorrectTextAnswer>();
        question.MatchingPairs = new List<MatchingPair>();
        question.OrderingItems = new List<OrderingItem>();
        question.CorrectOptionId = 0;

        ApplyQuestionChildren(question, request);
    }

    private static void ApplyQuestionChildren(Question question, QuestionUpsertRequest request)
    {
        question.Options = BuildAnswerOptions(request).ToList();
        question.CorrectTextAnswers = request.CorrectTextAnswers
            .Select(answer => new CorrectTextAnswer
            {
                CorrectText = answer.CorrectText.Trim(),
                IsCaseSensitive = answer.IsCaseSensitive
            })
            .ToList();
        question.MatchingPairs = request.MatchingPairs
            .Select((pair, index) => new MatchingPair
            {
                LeftItem = pair.LeftItem.Trim(),
                RightItem = pair.RightItem.Trim(),
                PairOrder = pair.PairOrder ?? index
            })
            .ToList();
        question.OrderingItems = request.OrderingItems
            .Select((item, index) => new OrderingItem
            {
                Content = item.Content.Trim(),
                CorrectOrder = item.CorrectOrder ?? index
            })
            .ToList();
    }

    private static IReadOnlyList<AnswerOption> BuildAnswerOptions(QuestionUpsertRequest request)
    {
        var inputs = GetOptionInputs(request);
        if (inputs.Count == 0)
        {
            return [];
        }

        var correctIndexes = GetCorrectOptionIndexes(request, inputs);
        return inputs
            .Select((option, index) => new AnswerOption
            {
                Label = NormalizeLabel(option.Label, index),
                Text = option.Text.Trim(),
                IsCorrect = correctIndexes.Contains(index),
                OptionOrder = option.OptionOrder ?? index
            })
            .ToList();
    }

    private static IReadOnlyList<AnswerOptionInput> GetOptionInputs(QuestionUpsertRequest request)
    {
        if (request.QuestionType == QuestionType.TrueFalse && request.Options.Count == 0)
        {
            return
            [
                new AnswerOptionInput { Label = "A", Text = "True" },
                new AnswerOptionInput { Label = "B", Text = "False" }
            ];
        }

        return request.Options;
    }

    private static HashSet<int> GetCorrectOptionIndexes(
        QuestionUpsertRequest request,
        IReadOnlyList<AnswerOptionInput> options)
    {
        var correctIndexes = request.CorrectOptionIndexes
            .Where(index => index >= 0 && index < options.Count)
            .ToHashSet();

        foreach (var option in options.Select((value, index) => new { value, index }).Where(x => x.value.IsCorrect))
        {
            correctIndexes.Add(option.index);
        }

        if (correctIndexes.Count == 0 &&
            request.QuestionType is QuestionType.SingleChoice or QuestionType.TrueFalse or QuestionType.CodeOutput or QuestionType.BigOAnalysis &&
            request.CorrectOptionIndex >= 0 &&
            request.CorrectOptionIndex < options.Count)
        {
            correctIndexes.Add(request.CorrectOptionIndex);
        }

        return correctIndexes;
    }

    private static void UpdateLegacyCorrectOptionId(Question question)
    {
        question.CorrectOptionId = question.Options
            .OrderBy(x => x.OptionOrder)
            .ThenBy(x => x.Label)
            .FirstOrDefault(x => x.IsCorrect)
            ?.Id ?? 0;
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

        if (!Enum.IsDefined(request.QuestionType))
        {
            throw new ArgumentException("Question type is invalid.");
        }

        switch (request.QuestionType)
        {
            case QuestionType.SingleChoice:
                ValidateChoiceQuestion(request, exactOptionCount: 4, requireExactlyOneCorrect: true);
                break;
            case QuestionType.MultipleChoice:
                ValidateChoiceQuestion(request, minOptionCount: 2, requireAtLeastOneCorrect: true);
                break;
            case QuestionType.TrueFalse:
                if (request.Options.Count is not 0 and not 2)
                {
                    throw new ArgumentException("True/False questions must have exactly 2 answer options, or no options to use defaults.");
                }

                ValidateChoiceQuestion(request, exactOptionCount: 2, requireExactlyOneCorrect: true, allowDefaultTrueFalseOptions: true);
                break;
            case QuestionType.FillInBlank:
                ValidateTextAnswers(request);
                break;
            case QuestionType.Matching:
                if (request.MatchingPairs.Count < 2 || request.MatchingPairs.Any(x => string.IsNullOrWhiteSpace(x.LeftItem) || string.IsNullOrWhiteSpace(x.RightItem)))
                {
                    throw new ArgumentException("Matching questions must have at least 2 complete pairs.");
                }

                break;
            case QuestionType.Ordering:
                if (request.OrderingItems.Count < 2 || request.OrderingItems.Any(x => string.IsNullOrWhiteSpace(x.Content)))
                {
                    throw new ArgumentException("Ordering questions must have at least 2 complete items.");
                }

                break;
            case QuestionType.CodeOutput:
                if (string.IsNullOrWhiteSpace(request.CodeSnippet))
                {
                    throw new ArgumentException("Code output questions require a code snippet.");
                }

                ValidateChoiceOrTextAnswerQuestion(request);
                break;
            case QuestionType.BigOAnalysis:
                ValidateChoiceOrTextAnswerQuestion(request);
                break;
            default:
                throw new ArgumentException("Question type is invalid.");
        }
    }

    private static void ValidateChoiceOrTextAnswerQuestion(QuestionUpsertRequest request)
    {
        if (request.Options.Count > 0)
        {
            ValidateChoiceQuestion(request, minOptionCount: 2, requireAtLeastOneCorrect: true);
            return;
        }

        ValidateTextAnswers(request);
    }

    private static void ValidateTextAnswers(QuestionUpsertRequest request)
    {
        if (request.CorrectTextAnswers.Count == 0 || request.CorrectTextAnswers.Any(x => string.IsNullOrWhiteSpace(x.CorrectText)))
        {
            throw new ArgumentException("At least one correct text answer is required.");
        }
    }

    private static void ValidateChoiceQuestion(
        QuestionUpsertRequest request,
        int? exactOptionCount = null,
        int? minOptionCount = null,
        bool requireExactlyOneCorrect = false,
        bool requireAtLeastOneCorrect = false,
        bool allowDefaultTrueFalseOptions = false)
    {
        var options = allowDefaultTrueFalseOptions ? GetOptionInputs(request) : request.Options;
        if (exactOptionCount.HasValue && options.Count != exactOptionCount.Value)
        {
            throw new ArgumentException($"Question must have exactly {exactOptionCount.Value} answer options.");
        }

        if (minOptionCount.HasValue && options.Count < minOptionCount.Value)
        {
            throw new ArgumentException($"Question must have at least {minOptionCount.Value} answer options.");
        }

        if (options.Any(x => string.IsNullOrWhiteSpace(x.Text)))
        {
            throw new ArgumentException("Answer option text is required.");
        }

        var correctIndexes = GetCorrectOptionIndexes(request, options);
        if (requireExactlyOneCorrect && correctIndexes.Count != 1)
        {
            throw new ArgumentException("Question must have exactly one correct answer option.");
        }

        if (requireAtLeastOneCorrect && correctIndexes.Count == 0)
        {
            throw new ArgumentException("Question must have at least one correct answer option.");
        }
    }

    private static string NormalizeLabel(string? label, int index)
    {
        var fallback = ((char)('A' + index)).ToString();
        return string.IsNullOrWhiteSpace(label) ? fallback : label.Trim().ToUpperInvariant()[..1];
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static QuestionDto ToDto(Question question)
    {
        return new QuestionDto(
            question.Id,
            question.Content,
            question.TopicId,
            question.Topic?.Name ?? string.Empty,
            question.Difficulty,
            question.QuestionType,
            question.Explanation,
            question.CodeSnippet,
            question.CorrectOptionId,
            question.CreatedAt,
            question.UpdatedAt,
            question.Options
                .OrderBy(x => x.OptionOrder)
                .ThenBy(x => x.Label)
                .Select(x => new QuestionAnswerOptionDto(x.Id, x.Label, x.Text, x.IsCorrect, x.OptionOrder))
                .ToList(),
            question.CorrectTextAnswers
                .OrderBy(x => x.Id)
                .Select(x => new CorrectTextAnswerDto(x.Id, x.CorrectText, x.IsCaseSensitive))
                .ToList(),
            question.MatchingPairs
                .OrderBy(x => x.PairOrder)
                .Select(x => new MatchingPairDto(x.Id, x.LeftItem, x.RightItem, x.PairOrder))
                .ToList(),
            question.OrderingItems
                .OrderBy(x => x.CorrectOrder)
                .Select(x => new OrderingItemDto(x.Id, x.Content, x.CorrectOrder))
                .ToList());
    }
}
