namespace OnlineQuiz.Domain.Entities;

public class AnswerOption
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OptionOrder { get; set; }

    public Question? Question { get; set; }
}
