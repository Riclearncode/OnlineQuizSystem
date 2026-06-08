using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Domain.Enums;
using OnlineQuiz.Infrastructure.Data;
using OnlineQuiz.Infrastructure.Services;

namespace OnlineQuiz.Tests;

public class QuizAttemptServiceTests
{
    [Fact]
    public async Task SubmitQuizAsync_GradesAnswersAndCalculatesScore()
    {
        await using var dbContext = CreateDbContext();
        dbContext.Users.Add(new ApplicationUser
        {
            Id = "student-1",
            FullName = "Test Student",
            Email = "student@test.com",
            UserName = "student@test.com"
        });
        var topic = new Topic { Name = "Stack" };
        dbContext.Topics.Add(topic);
        await dbContext.SaveChangesAsync();

        var firstQuestion = CreateQuestion(topic.Id, "What does Pop do?", "Removes top item", 1);
        var secondQuestion = CreateQuestion(topic.Id, "Stack follows which rule?", "LIFO", 0);
        dbContext.Questions.AddRange(firstQuestion, secondQuestion);
        await dbContext.SaveChangesAsync();

        firstQuestion.CorrectOptionId = firstQuestion.Options.OrderBy(x => x.Label).ElementAt(1).Id;
        secondQuestion.CorrectOptionId = secondQuestion.Options.OrderBy(x => x.Label).ElementAt(0).Id;
        await dbContext.SaveChangesAsync();

        var quiz = new Quiz
        {
            Title = "Stack Quiz",
            TimeLimitMinutes = 15,
            TotalQuestions = 2,
            IsActive = true,
            QuizQuestions =
            [
                new QuizQuestion { QuestionId = firstQuestion.Id },
                new QuizQuestion { QuestionId = secondQuestion.Id }
            ]
        };
        dbContext.Quizzes.Add(quiz);
        await dbContext.SaveChangesAsync();

        var service = new QuizAttemptService(dbContext);
        var start = await service.StartQuizAsync("student-1", new StartQuizRequest(quiz.Id));

        var result = await service.SubmitQuizAsync("student-1", new SubmitQuizRequest(
            start.AttemptId,
            [
                new SubmitAnswerRequest(firstQuestion.Id, firstQuestion.CorrectOptionId),
                new SubmitAnswerRequest(secondQuestion.Id, secondQuestion.Options.First(x => x.Id != secondQuestion.CorrectOptionId).Id)
            ]));

        Assert.Equal(2, result.TotalQuestions);
        Assert.Equal(1, result.CorrectCount);
        Assert.Equal(1, result.WrongCount);
        Assert.Equal(50m, result.Score);
        Assert.Contains(result.Answers, x => x.QuestionId == firstQuestion.Id && x.IsCorrect);
        Assert.Contains(result.Answers, x => x.QuestionId == secondQuestion.Id && !x.IsCorrect);
    }

    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static Question CreateQuestion(int topicId, string content, string explanation, int correctIndex)
    {
        return new Question
        {
            TopicId = topicId,
            Content = content,
            Difficulty = Difficulty.Easy,
            Explanation = explanation,
            CorrectOptionId = correctIndex,
            Options =
            [
                new AnswerOption { Label = "A", Text = "LIFO" },
                new AnswerOption { Label = "B", Text = "Remove item" },
                new AnswerOption { Label = "C", Text = "FIFO" },
                new AnswerOption { Label = "D", Text = "Sort values" }
            ]
        };
    }
}
