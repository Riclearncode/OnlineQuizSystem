using Microsoft.AspNetCore.Identity;

namespace OnlineQuiz.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
}
