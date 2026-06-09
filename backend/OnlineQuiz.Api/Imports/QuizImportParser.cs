using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using OnlineQuiz.Domain.Enums;
using UglyToad.PdfPig;

namespace OnlineQuiz.Api.Imports;

public static partial class QuizImportParser
{
    private static readonly string[] RequiredHeaders =
    [
        "topic",
        "difficulty",
        "question",
        "a",
        "b",
        "c",
        "d",
        "correct",
        "explanation"
    ];

    public static IReadOnlyList<ImportedQuestion> ParseExcel(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();
        var rows = worksheet.RowsUsed().ToList();
        if (rows.Count < 2)
        {
            throw new ArgumentException("Excel file must include a header row and at least one question row.");
        }

        var headers = rows[0].CellsUsed()
            .ToDictionary(
                cell => NormalizeHeader(cell.GetString()),
                cell => cell.Address.ColumnNumber,
                StringComparer.OrdinalIgnoreCase);

        foreach (var header in RequiredHeaders)
        {
            if (!headers.ContainsKey(header))
            {
                throw new ArgumentException($"Excel file is missing required column '{header}'.");
            }
        }

        var questions = new List<ImportedQuestion>();
        foreach (var row in rows.Skip(1))
        {
            var content = GetCell(row, headers, "question");
            if (string.IsNullOrWhiteSpace(content))
            {
                continue;
            }

            questions.Add(new ImportedQuestion(
                Require(GetCell(row, headers, "topic"), "Topic", row.RowNumber()),
                ParseDifficulty(Require(GetCell(row, headers, "difficulty"), "Difficulty", row.RowNumber())),
                content.Trim(),
                [
                    Require(GetCell(row, headers, "a"), "A", row.RowNumber()),
                    Require(GetCell(row, headers, "b"), "B", row.RowNumber()),
                    Require(GetCell(row, headers, "c"), "C", row.RowNumber()),
                    Require(GetCell(row, headers, "d"), "D", row.RowNumber())
                ],
                ParseCorrectOption(Require(GetCell(row, headers, "correct"), "Correct", row.RowNumber())),
                Require(GetCell(row, headers, "explanation"), "Explanation", row.RowNumber())));
        }

        return questions.Count == 0
            ? throw new ArgumentException("No valid question rows were found in the Excel file.")
            : questions;
    }

    public static string ExtractPdfText(Stream stream)
    {
        using var document = PdfDocument.Open(stream);
        var builder = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            builder.AppendLine(page.Text);
        }

        return builder.ToString();
    }

    public static IReadOnlyList<ImportedQuestion> ParseText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("Import text is empty.");
        }

        var blocks = SplitBlocks(text);
        var questions = new List<ImportedQuestion>();

        for (var index = 0; index < blocks.Count; index++)
        {
            var block = blocks[index];
            if (string.IsNullOrWhiteSpace(block))
            {
                continue;
            }

            questions.Add(ParseBlock(block, index + 1));
        }

        return questions.Count == 0
            ? throw new ArgumentException("No valid questions were found in the import text.")
            : questions;
    }

    private static ImportedQuestion ParseBlock(string block, int blockNumber)
    {
        var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var options = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string? currentKey = null;

        foreach (var rawLine in block.Replace("\r\n", "\n").Split('\n'))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var optionMatch = OptionLineRegex().Match(line);
            if (optionMatch.Success)
            {
                currentKey = optionMatch.Groups["label"].Value.ToUpperInvariant();
                options[currentKey] = optionMatch.Groups["text"].Value.Trim();
                continue;
            }

            var fieldMatch = FieldLineRegex().Match(line);
            if (fieldMatch.Success)
            {
                currentKey = NormalizeHeader(fieldMatch.Groups["key"].Value);
                fields[currentKey] = fieldMatch.Groups["value"].Value.Trim();
                continue;
            }

            if (currentKey is not null)
            {
                if (options.TryGetValue(currentKey, out var optionText))
                {
                    options[currentKey] = $"{optionText} {line}".Trim();
                }
                else if (fields.TryGetValue(currentKey, out var fieldText))
                {
                    fields[currentKey] = $"{fieldText} {line}".Trim();
                }
            }
        }

        return new ImportedQuestion(
            Require(GetField(fields, "topic"), "Topic", blockNumber),
            ParseDifficulty(Require(GetField(fields, "difficulty"), "Difficulty", blockNumber)),
            Require(GetField(fields, "question"), "Question", blockNumber),
            [
                Require(GetOption(options, "A"), "A", blockNumber),
                Require(GetOption(options, "B"), "B", blockNumber),
                Require(GetOption(options, "C"), "C", blockNumber),
                Require(GetOption(options, "D"), "D", blockNumber)
            ],
            ParseCorrectOption(Require(GetField(fields, "correct"), "Correct", blockNumber)),
            Require(GetField(fields, "explanation"), "Explanation", blockNumber));
    }

    private static List<string> SplitBlocks(string text)
    {
        var blocks = new List<string>();
        var builder = new StringBuilder();
        var hasQuestion = false;

        foreach (var rawLine in text.Replace("\r\n", "\n").Split('\n'))
        {
            var line = rawLine.Trim();
            var isSeparator = line == "---";
            var isNewQuestion = FieldLineRegex().Match(line) is { Success: true } match &&
                NormalizeHeader(match.Groups["key"].Value) == "question";

            if ((isSeparator || (isNewQuestion && hasQuestion)) && builder.Length > 0)
            {
                blocks.Add(builder.ToString());
                builder.Clear();
                hasQuestion = false;
            }

            if (!isSeparator)
            {
                builder.AppendLine(rawLine);
            }

            if (isNewQuestion)
            {
                hasQuestion = true;
            }
        }

        if (builder.Length > 0)
        {
            blocks.Add(builder.ToString());
        }

        return blocks;
    }

    private static string GetCell(IXLRow row, IReadOnlyDictionary<string, int> headers, string key)
    {
        return row.Cell(headers[key]).GetString();
    }

    private static string? GetField(IReadOnlyDictionary<string, string> fields, string key)
    {
        return fields.TryGetValue(key, out var value) ? value : null;
    }

    private static string? GetOption(IReadOnlyDictionary<string, string> options, string label)
    {
        return options.TryGetValue(label, out var value) ? value : null;
    }

    private static string Require(string? value, string fieldName, int rowOrBlock)
    {
        return string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException($"{fieldName} is required at row/block {rowOrBlock}.")
            : value.Trim();
    }

    private static Difficulty ParseDifficulty(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        return normalized switch
        {
            "easy" or "e" or "dễ" or "de" => Difficulty.Easy,
            "medium" or "m" or "trung bình" or "trung binh" => Difficulty.Medium,
            "hard" or "h" or "khó" or "kho" => Difficulty.Hard,
            _ when Enum.TryParse<Difficulty>(value, true, out var difficulty) => difficulty,
            _ => throw new ArgumentException($"Difficulty '{value}' is invalid. Use Easy, Medium, or Hard.")
        };
    }

    private static int ParseCorrectOption(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();
        if (normalized.Length == 1 && normalized[0] is >= 'A' and <= 'D')
        {
            return normalized[0] - 'A';
        }

        if (int.TryParse(normalized, out var number))
        {
            return number switch
            {
                >= 1 and <= 4 => number - 1,
                >= 0 and <= 3 => number,
                _ => throw new ArgumentException("Correct option must be A, B, C, D, or 0-3/1-4.")
            };
        }

        throw new ArgumentException("Correct option must be A, B, C, D, or 0-3/1-4.");
    }

    private static string NormalizeHeader(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        normalized = Regex.Replace(normalized, @"\s+", "");

        return normalized switch
        {
            "content" or "questioncontent" or "câu hỏi" or "cauhoi" => "question",
            "answer" or "correctanswer" or "đápánđúng" or "dapandung" => "correct",
            "explain" or "giảithích" or "giaithich" => "explanation",
            "chủđề" or "chude" => "topic",
            "độkhó" or "dokho" => "difficulty",
            _ => normalized
        };
    }

    [GeneratedRegex(@"^(?<label>[A-Da-d])[\.\):]\s*(?<text>.+)$")]
    private static partial Regex OptionLineRegex();

    [GeneratedRegex(@"^(?<key>Topic|Difficulty|Question|Correct|Explanation|Content|Answer|Đáp án đúng|Dap an dung|Chủ đề|Chu de|Độ khó|Do kho|Giải thích|Giai thich)\s*:\s*(?<value>.*)$", RegexOptions.IgnoreCase)]
    private static partial Regex FieldLineRegex();
}
