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

    [Fact]
    public void QuizGradingService_GradesSupportedQuestionTypes()
    {
        var gradingService = new QuizGradingService();

        var multipleChoice = new Question
        {
            Id = 1,
            QuestionType = QuestionType.MultipleChoice,
            Options =
            [
                new AnswerOption { Id = 11, QuestionId = 1, Label = "A", Text = "LIFO", IsCorrect = true },
                new AnswerOption { Id = 12, QuestionId = 1, Label = "B", Text = "Push", IsCorrect = true },
                new AnswerOption { Id = 13, QuestionId = 1, Label = "C", Text = "FIFO", IsCorrect = false }
            ]
        };
        Assert.True(gradingService.Grade(multipleChoice, new SubmitAnswerRequest
        {
            QuestionId = multipleChoice.Id,
            SelectedOptionIds = [12, 11]
        }).IsCorrect);
        Assert.False(gradingService.Grade(multipleChoice, new SubmitAnswerRequest
        {
            QuestionId = multipleChoice.Id,
            SelectedOptionIds = [11, 13]
        }).IsCorrect);

        var trueFalse = new Question
        {
            Id = 6,
            QuestionType = QuestionType.TrueFalse,
            Options =
            [
                new AnswerOption { Id = 61, QuestionId = 6, Label = "A", Text = "True", IsCorrect = true },
                new AnswerOption { Id = 62, QuestionId = 6, Label = "B", Text = "False", IsCorrect = false }
            ]
        };
        Assert.True(gradingService.Grade(trueFalse, new SubmitAnswerRequest(trueFalse.Id, 61)).IsCorrect);

        var fillInBlank = new Question
        {
            Id = 2,
            QuestionType = QuestionType.FillInBlank,
            CorrectTextAnswers =
            [
                new CorrectTextAnswer { QuestionId = 2, CorrectText = "O(log n)" },
                new CorrectTextAnswer { QuestionId = 2, CorrectText = "log n" }
            ]
        };
        Assert.True(gradingService.Grade(fillInBlank, new SubmitAnswerRequest
        {
            QuestionId = fillInBlank.Id,
            TextAnswer = "  o(log   n)  "
        }).IsCorrect);

        var codeOutput = new Question
        {
            Id = 7,
            QuestionType = QuestionType.CodeOutput,
            CodeSnippet = "print(2 + 3)",
            CorrectTextAnswers =
            [
                new CorrectTextAnswer { QuestionId = 7, CorrectText = "5" }
            ]
        };
        Assert.True(gradingService.Grade(codeOutput, new SubmitAnswerRequest
        {
            QuestionId = codeOutput.Id,
            TextAnswer = " 5 "
        }).IsCorrect);

        var matching = new Question
        {
            Id = 3,
            QuestionType = QuestionType.Matching,
            MatchingPairs =
            [
                new MatchingPair { QuestionId = 3, LeftItem = "Stack", RightItem = "LIFO", PairOrder = 0 },
                new MatchingPair { QuestionId = 3, LeftItem = "Queue", RightItem = "FIFO", PairOrder = 1 }
            ]
        };
        Assert.True(gradingService.Grade(matching, new SubmitAnswerRequest
        {
            QuestionId = matching.Id,
            MatchingAnswer = new Dictionary<string, string>
            {
                ["Stack"] = "LIFO",
                ["Queue"] = "FIFO"
            }
        }).IsCorrect);

        var ordering = new Question
        {
            Id = 4,
            QuestionType = QuestionType.Ordering,
            OrderingItems =
            [
                new OrderingItem { QuestionId = 4, Content = "Set left and right", CorrectOrder = 0 },
                new OrderingItem { QuestionId = 4, Content = "Compute mid", CorrectOrder = 1 },
                new OrderingItem { QuestionId = 4, Content = "Compare with key", CorrectOrder = 2 }
            ]
        };
        Assert.True(gradingService.Grade(ordering, new SubmitAnswerRequest
        {
            QuestionId = ordering.Id,
            OrderingAnswer = ["Set left and right", "Compute mid", "Compare with key"]
        }).IsCorrect);

        var bigO = new Question
        {
            Id = 5,
            QuestionType = QuestionType.BigOAnalysis,
            Options =
            [
                new AnswerOption { Id = 51, QuestionId = 5, Label = "A", Text = "O(n)", IsCorrect = false },
                new AnswerOption { Id = 52, QuestionId = 5, Label = "B", Text = "O(n^2)", IsCorrect = true }
            ]
        };
        Assert.True(gradingService.Grade(bigO, new SubmitAnswerRequest(bigO.Id, 52)).IsCorrect);
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
