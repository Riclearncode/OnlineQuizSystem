using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Domain.Entities;

public class QuizAttempt
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int WrongCount { get; set; }
    public decimal Score { get; set; }
    public int TimeSpentSeconds { get; set; }
    public AttemptStatus Status { get; set; } = AttemptStatus.InProgress;

    public Quiz? Quiz { get; set; }
    public ApplicationUser? User { get; set; }
    public ICollection<AttemptAnswer> Answers { get; set; } = new List<AttemptAnswer>();
}
