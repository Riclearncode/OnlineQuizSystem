using Microsoft.AspNetCore.Mvc;

namespace OnlineQuiz.Api.Imports;

public sealed class QuizImportForm
{
    [FromForm(Name = "title")]
    public string Title { get; set; } = string.Empty;

    [FromForm(Name = "description")]
    public string? Description { get; set; }

    [FromForm(Name = "timeLimitMinutes")]
    public int TimeLimitMinutes { get; set; } = 25;

    [FromForm(Name = "isActive")]
    public bool IsActive { get; set; } = true;

    [FromForm(Name = "file")]
    public IFormFile? File { get; set; }

    [FromForm(Name = "rawText")]
    public string? RawText { get; set; }
}
