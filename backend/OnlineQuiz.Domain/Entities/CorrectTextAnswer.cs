namespace OnlineQuiz.Domain.Entities;

public class CorrectTextAnswer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string CorrectText { get; set; } = string.Empty;
    public bool IsCaseSensitive { get; set; }

    public Question? Question { get; set; }
}
