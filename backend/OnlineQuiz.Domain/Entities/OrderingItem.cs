namespace OnlineQuiz.Domain.Entities;

public class OrderingItem
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public int CorrectOrder { get; set; }

    public Question? Question { get; set; }
}
