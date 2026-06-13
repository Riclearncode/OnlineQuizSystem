using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Domain.Entities;

public class Question
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int TopicId { get; set; }
    public Difficulty Difficulty { get; set; }
    public QuestionType QuestionType { get; set; } = QuestionType.SingleChoice;
    public string Explanation { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public int CorrectOptionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Topic? Topic { get; set; }
    public ICollection<AnswerOption> Options { get; set; } = new List<AnswerOption>();
    public ICollection<CorrectTextAnswer> CorrectTextAnswers { get; set; } = new List<CorrectTextAnswer>();
    public ICollection<MatchingPair> MatchingPairs { get; set; } = new List<MatchingPair>();
    public ICollection<OrderingItem> OrderingItems { get; set; } = new List<OrderingItem>();
    public ICollection<QuizQuestion> QuizQuestions { get; set; } = new List<QuizQuestion>();
    public ICollection<AttemptAnswer> AttemptAnswers { get; set; } = new List<AttemptAnswer>();
}
