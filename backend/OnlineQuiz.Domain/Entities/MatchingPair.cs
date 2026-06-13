namespace OnlineQuiz.Domain.Entities;

public class MatchingPair
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string LeftItem { get; set; } = string.Empty;
    public string RightItem { get; set; } = string.Empty;
    public int PairOrder { get; set; }

    public Question? Question { get; set; }
}
