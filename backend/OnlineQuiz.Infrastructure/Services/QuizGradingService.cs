using System.Text.Json;
using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Application.Services;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Infrastructure.Services;

public class QuizGradingService : IQuizGradingService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public AttemptAnswer Grade(Question question, SubmitAnswerRequest? answer)
    {
        var selectedOptionId = GetSingleSelectedOptionId(answer);
        var selectedOptionIds = GetSelectedOptionIds(answer);

        ValidateSelectedOptions(question, selectedOptionId, selectedOptionIds);

        var matchingAnswer = NormalizeMatchingAnswer(answer?.MatchingAnswer);
        var orderingAnswer = NormalizeOrderingAnswer(answer?.OrderingAnswer);
        var textAnswer = NormalizeNullableText(answer?.TextAnswer);

        var isCorrect = question.QuestionType switch
        {
            QuestionType.SingleChoice => GradeSingleChoice(question, selectedOptionId),
            QuestionType.MultipleChoice => GradeMultipleChoice(question, selectedOptionIds),
            QuestionType.TrueFalse => GradeSingleChoice(question, selectedOptionId),
            QuestionType.FillInBlank => GradeTextAnswer(question, textAnswer),
            QuestionType.Matching => GradeMatching(question, matchingAnswer),
            QuestionType.Ordering => GradeOrdering(question, orderingAnswer),
            QuestionType.CodeOutput => GradeChoiceOrTextAnswer(question, selectedOptionId, selectedOptionIds, textAnswer),
            QuestionType.BigOAnalysis => GradeChoiceOrTextAnswer(question, selectedOptionId, selectedOptionIds, textAnswer),
            _ => false
        };

        return new AttemptAnswer
        {
            QuestionId = question.Id,
            SelectedOptionId = selectedOptionId,
            SelectedOptionIdsJson = selectedOptionIds.Count == 0 ? null : JsonSerializer.Serialize(selectedOptionIds, JsonOptions),
            TextAnswer = textAnswer,
            MatchingAnswerJson = matchingAnswer.Count == 0 ? null : JsonSerializer.Serialize(matchingAnswer, JsonOptions),
            OrderingAnswerJson = orderingAnswer.Count == 0 ? null : JsonSerializer.Serialize(orderingAnswer, JsonOptions),
            IsCorrect = isCorrect,
            Score = isCorrect ? 1m : 0m,
            MaxScore = 1m
        };
    }

    private static bool GradeChoiceOrTextAnswer(
        Question question,
        int? selectedOptionId,
        IReadOnlyList<int> selectedOptionIds,
        string? textAnswer)
    {
        if (question.Options.Count > 0 && (selectedOptionId.HasValue || selectedOptionIds.Count > 0))
        {
            return selectedOptionIds.Count > 1 || GetCorrectOptionIds(question).Count > 1
                ? GradeMultipleChoice(question, selectedOptionIds)
                : GradeSingleChoice(question, selectedOptionId);
        }

        return GradeTextAnswer(question, textAnswer);
    }

    private static bool GradeSingleChoice(Question question, int? selectedOptionId)
    {
        if (!selectedOptionId.HasValue)
        {
            return false;
        }

        var correctOptionIds = GetCorrectOptionIds(question);
        return correctOptionIds.Count == 1 && correctOptionIds.Contains(selectedOptionId.Value);
    }

    private static bool GradeMultipleChoice(Question question, IReadOnlyList<int> selectedOptionIds)
    {
        var selected = selectedOptionIds.Distinct().ToHashSet();
        var correct = GetCorrectOptionIds(question);
        return correct.Count > 0 && selected.SetEquals(correct);
    }

    private static bool GradeTextAnswer(Question question, string? textAnswer)
    {
        if (string.IsNullOrWhiteSpace(textAnswer))
        {
            return false;
        }

        return question.CorrectTextAnswers.Any(answer =>
        {
            var correctText = NormalizeText(answer.CorrectText);
            return answer.IsCaseSensitive
                ? string.Equals(textAnswer, correctText, StringComparison.Ordinal)
                : string.Equals(textAnswer, correctText, StringComparison.OrdinalIgnoreCase);
        });
    }

    private static bool GradeMatching(Question question, IReadOnlyDictionary<string, string> matchingAnswer)
    {
        var correctPairs = question.MatchingPairs
            .ToDictionary(
                pair => NormalizeText(pair.LeftItem),
                pair => NormalizeText(pair.RightItem),
                StringComparer.OrdinalIgnoreCase);

        if (correctPairs.Count == 0 || matchingAnswer.Count != correctPairs.Count)
        {
            return false;
        }

        foreach (var pair in correctPairs)
        {
            if (!matchingAnswer.TryGetValue(pair.Key, out var selectedRight) ||
                !string.Equals(selectedRight, pair.Value, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    private static bool GradeOrdering(Question question, IReadOnlyList<string> orderingAnswer)
    {
        var correctItems = question.OrderingItems
            .OrderBy(item => item.CorrectOrder)
            .Select(item => NormalizeText(item.Content))
            .ToList();

        return correctItems.Count > 0 &&
            orderingAnswer.Count == correctItems.Count &&
            orderingAnswer.SequenceEqual(correctItems, StringComparer.OrdinalIgnoreCase);
    }

    private static HashSet<int> GetCorrectOptionIds(Question question)
    {
        var correctOptionIds = question.Options
            .Where(option => option.IsCorrect)
            .Select(option => option.Id)
            .ToHashSet();

        if (correctOptionIds.Count == 0 && question.CorrectOptionId > 0)
        {
            correctOptionIds.Add(question.CorrectOptionId);
        }

        return correctOptionIds;
    }

    private static int? GetSingleSelectedOptionId(SubmitAnswerRequest? answer)
    {
        if (answer?.SelectedOptionId is not null)
        {
            return answer.SelectedOptionId;
        }

        var selectedOptionIds = answer?.SelectedOptionIds ?? [];
        return selectedOptionIds.Count == 1 ? selectedOptionIds[0] : null;
    }

    private static IReadOnlyList<int> GetSelectedOptionIds(SubmitAnswerRequest? answer)
    {
        if (answer is null)
        {
            return [];
        }

        var ids = answer.SelectedOptionIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (ids.Count == 0 && answer.SelectedOptionId.HasValue)
        {
            ids.Add(answer.SelectedOptionId.Value);
        }

        return ids;
    }

    private static void ValidateSelectedOptions(
        Question question,
        int? selectedOptionId,
        IReadOnlyList<int> selectedOptionIds)
    {
        var optionIds = question.Options.Select(option => option.Id).ToHashSet();

        if (selectedOptionId.HasValue && !optionIds.Contains(selectedOptionId.Value))
        {
            throw new InvalidOperationException($"Selected option is invalid for question {question.Id}.");
        }

        var invalidSelectedOptionId = selectedOptionIds.FirstOrDefault(id => !optionIds.Contains(id));
        if (invalidSelectedOptionId > 0)
        {
            throw new InvalidOperationException($"Selected option {invalidSelectedOptionId} is invalid for question {question.Id}.");
        }
    }

    private static Dictionary<string, string> NormalizeMatchingAnswer(IReadOnlyDictionary<string, string>? matchingAnswer)
    {
        if (matchingAnswer is null || matchingAnswer.Count == 0)
        {
            return [];
        }

        return matchingAnswer
            .Where(pair => !string.IsNullOrWhiteSpace(pair.Key) && !string.IsNullOrWhiteSpace(pair.Value))
            .ToDictionary(
                pair => NormalizeText(pair.Key),
                pair => NormalizeText(pair.Value),
                StringComparer.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<string> NormalizeOrderingAnswer(IReadOnlyList<string>? orderingAnswer)
    {
        if (orderingAnswer is null || orderingAnswer.Count == 0)
        {
            return [];
        }

        return orderingAnswer
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(NormalizeText)
            .ToList();
    }

    private static string? NormalizeNullableText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : NormalizeText(value);
    }

    private static string NormalizeText(string value)
    {
        return string.Join(' ', value.Trim().Split(Array.Empty<char>(), StringSplitOptions.RemoveEmptyEntries));
    }
}
