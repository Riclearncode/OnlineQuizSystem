using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Domain.Entities;

namespace OnlineQuiz.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<AnswerOption> AnswerOptions => Set<AnswerOption>();
    public DbSet<CorrectTextAnswer> CorrectTextAnswers => Set<CorrectTextAnswer>();
    public DbSet<MatchingPair> MatchingPairs => Set<MatchingPair>();
    public DbSet<OrderingItem> OrderingItems => Set<OrderingItem>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<AttemptAnswer> AttemptAnswers => Set<AttemptAnswer>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Topic>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
        });

        builder.Entity<Question>(entity =>
        {
            entity.Property(x => x.Content).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.Explanation).HasMaxLength(1500).IsRequired();
            entity.Property(x => x.CodeSnippet).HasMaxLength(4000);
            entity.Property(x => x.Difficulty).HasConversion<int>();
            entity.Property(x => x.QuestionType)
                .HasConversion<int>()
                .HasDefaultValue(OnlineQuiz.Domain.Enums.QuestionType.SingleChoice);
            entity.HasOne(x => x.Topic)
                .WithMany(x => x.Questions)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AnswerOption>(entity =>
        {
            entity.Property(x => x.Label).HasMaxLength(1).IsRequired();
            entity.Property(x => x.Text).HasMaxLength(500).IsRequired();
            entity.Property(x => x.OptionOrder).HasDefaultValue(0);
            entity.HasOne(x => x.Question)
                .WithMany(x => x.Options)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CorrectTextAnswer>(entity =>
        {
            entity.Property(x => x.CorrectText).HasMaxLength(300).IsRequired();
            entity.Property(x => x.IsCaseSensitive).HasDefaultValue(false);
            entity.HasOne(x => x.Question)
                .WithMany(x => x.CorrectTextAnswers)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<MatchingPair>(entity =>
        {
            entity.Property(x => x.LeftItem).HasMaxLength(500).IsRequired();
            entity.Property(x => x.RightItem).HasMaxLength(500).IsRequired();
            entity.Property(x => x.PairOrder).HasDefaultValue(0);
            entity.HasOne(x => x.Question)
                .WithMany(x => x.MatchingPairs)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderingItem>(entity =>
        {
            entity.Property(x => x.Content).HasMaxLength(500).IsRequired();
            entity.HasOne(x => x.Question)
                .WithMany(x => x.OrderingItems)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Quiz>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
        });

        builder.Entity<QuizQuestion>(entity =>
        {
            entity.HasKey(x => new { x.QuizId, x.QuestionId });
            entity.HasOne(x => x.Quiz)
                .WithMany(x => x.QuizQuestions)
                .HasForeignKey(x => x.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Question)
                .WithMany(x => x.QuizQuestions)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<QuizAttempt>(entity =>
        {
            entity.Property(x => x.Score).HasPrecision(5, 2);
            entity.Property(x => x.Status).HasConversion<int>();
            entity.HasOne(x => x.Quiz)
                .WithMany(x => x.Attempts)
                .HasForeignKey(x => x.QuizId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.User)
                .WithMany(x => x.QuizAttempts)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AttemptAnswer>(entity =>
        {
            entity.Property(x => x.SelectedOptionIdsJson).HasMaxLength(1000);
            entity.Property(x => x.TextAnswer).HasMaxLength(1000);
            entity.Property(x => x.MatchingAnswerJson).HasMaxLength(4000);
            entity.Property(x => x.OrderingAnswerJson).HasMaxLength(4000);
            entity.Property(x => x.Score).HasPrecision(5, 2);
            entity.Property(x => x.MaxScore).HasPrecision(5, 2).HasDefaultValue(1m);
            entity.HasOne(x => x.QuizAttempt)
                .WithMany(x => x.Answers)
                .HasForeignKey(x => x.QuizAttemptId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Question)
                .WithMany(x => x.AttemptAnswers)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.SelectedOption)
                .WithMany()
                .HasForeignKey(x => x.SelectedOptionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
