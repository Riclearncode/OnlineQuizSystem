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
public class TopicsController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public TopicsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TopicDto>>> GetAll()
    {
        var topics = await _dbContext.Topics
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync();

        return Ok(topics.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TopicDto>> GetById(int id)
    {
        var topic = await _dbContext.Topics.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return topic is null ? NotFound(new { message = "Topic was not found." }) : Ok(ToDto(topic));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost]
    public async Task<ActionResult<TopicDto>> Create(TopicUpsertRequest request)
    {
        ValidateTopic(request);

        var topic = new Topic
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Topics.Add(topic);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = topic.Id }, ToDto(topic));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TopicDto>> Update(int id, TopicUpsertRequest request)
    {
        ValidateTopic(request);

        var topic = await _dbContext.Topics.FirstOrDefaultAsync(x => x.Id == id);
        if (topic is null)
        {
            return NotFound(new { message = "Topic was not found." });
        }

        topic.Name = request.Name.Trim();
        topic.Description = request.Description?.Trim();
        topic.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(ToDto(topic));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var topic = await _dbContext.Topics.FirstOrDefaultAsync(x => x.Id == id);
        if (topic is null)
        {
            return NotFound(new { message = "Topic was not found." });
        }

        var hasQuestions = await _dbContext.Questions.AnyAsync(x => x.TopicId == id);
        if (hasQuestions)
        {
            return BadRequest(new { message = "Cannot delete a topic that still has questions." });
        }

        _dbContext.Topics.Remove(topic);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    private static void ValidateTopic(TopicUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Topic name is required.");
        }
    }

    private static TopicDto ToDto(Topic topic)
    {
        return new TopicDto(topic.Id, topic.Name, topic.Description, topic.CreatedAt, topic.UpdatedAt);
    }
}
