using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Application.Services;
using OnlineQuiz.Domain.Common;

namespace OnlineQuiz.Api.Controllers;

[ApiController]
[Route("api/quiz-attempts")]
[Authorize]
public class QuizAttemptsController : ControllerBase
{
    private readonly IQuizAttemptService _quizAttemptService;

    public QuizAttemptsController(IQuizAttemptService quizAttemptService)
    {
        _quizAttemptService = quizAttemptService;
    }

    [Authorize(Roles = RoleNames.Student)]
    [HttpPost("start")]
    public async Task<ActionResult<StartQuizResponse>> Start(StartQuizRequest request)
    {
        return Ok(await _quizAttemptService.StartQuizAsync(GetUserId(), request));
    }

    [Authorize(Roles = RoleNames.Student)]
    [HttpPost("submit")]
    public async Task<ActionResult<QuizAttemptResultDto>> Submit(SubmitQuizRequest request)
    {
        return Ok(await _quizAttemptService.SubmitQuizAsync(GetUserId(), request));
    }

    [Authorize(Roles = RoleNames.Student)]
    [HttpGet("my-history")]
    public async Task<ActionResult<IReadOnlyList<QuizAttemptSummaryDto>>> MyHistory()
    {
        return Ok(await _quizAttemptService.GetMyHistoryAsync(GetUserId()));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QuizAttemptSummaryDto>>> GetAll()
    {
        return Ok(await _quizAttemptService.GetAllAttemptsAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<QuizAttemptResultDto>> GetById(int id)
    {
        return Ok(await _quizAttemptService.GetAttemptAsync(GetUserId(), User.IsInRole(RoleNames.Admin), id));
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User id claim is missing.");
    }
}
