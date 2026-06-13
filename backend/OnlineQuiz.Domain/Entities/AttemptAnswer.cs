namespace OnlineQuiz.Domain.Entities;

public class AttemptAnswer
{
    public int Id { get; set; }
    public int QuizAttemptId { get; set; }
    public int QuestionId { get; set; }
    public int? SelectedOptionId { get; set; }
    public string? SelectedOptionIdsJson { get; set; }
    public string? TextAnswer { get; set; }
    public string? MatchingAnswerJson { get; set; }
    public string? OrderingAnswerJson { get; set; }
    public bool IsCorrect { get; set; }
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; } = 1m;

    public QuizAttempt? QuizAttempt { get; set; }
    public Question? Question { get; set; }
    public AnswerOption? SelectedOption { get; set; }
}
