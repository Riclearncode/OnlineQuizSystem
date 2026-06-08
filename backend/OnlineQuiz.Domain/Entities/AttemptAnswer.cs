namespace OnlineQuiz.Domain.Entities;

public class AttemptAnswer
{
    public int Id { get; set; }
    public int QuizAttemptId { get; set; }
    public int QuestionId { get; set; }
    public int? SelectedOptionId { get; set; }
    public bool IsCorrect { get; set; }

    public QuizAttempt? QuizAttempt { get; set; }
    public Question? Question { get; set; }
    public AnswerOption? SelectedOption { get; set; }
}
