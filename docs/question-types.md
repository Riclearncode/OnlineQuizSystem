# Question Types Guide

This project supports eight question types for the Data Structures and Algorithms quiz bank.

## Supported Types

| Question type | Best for | Admin config | Student input | Grading rule |
| --- | --- | --- | --- | --- |
| `SingleChoice` | Basic concept checks | 4 options, exactly one correct | one selected option | selected option must equal the correct option |
| `MultipleChoice` | Questions with several valid statements | 2+ options, at least one correct | selected option id list | selected set must exactly match correct set |
| `TrueFalse` | Fast factual checks | two options, exactly one correct | one selected option | selected option must equal true/false key |
| `FillInBlank` | Short terms, complexity notation, output values | accepted text answers | typed text | normalized text must match an accepted answer |
| `Matching` | Pairing concepts and definitions | left/right pairs | left item mapped to right item | all submitted pairs must match |
| `Ordering` | Algorithm step ordering | ordered item list | item array in chosen order | submitted order must match correct order |
| `CodeOutput` | Reading pseudocode/source snippets | code snippet plus choice or text answer | selected option or typed text | choice/text answer must match |
| `BigOAnalysis` | Complexity analysis | choice or text answer | selected option or typed text | choice/text answer must match |

## Entity Model

`Question` stores shared metadata:

- `Content`
- `TopicId`
- `Difficulty`
- `QuestionType`
- `Explanation`
- optional `CodeSnippet`

Type-specific answer data is stored in child tables:

- `AnswerOptions` for choice-based questions
- `CorrectTextAnswers` for fill-in, code-output text, and Big O text answers
- `MatchingPairs` for matching questions
- `OrderingItems` for ordering questions

Student submissions are stored in `AttemptAnswers`:

- `SelectedOptionId` for one selected option
- `SelectedOptionIdsJson` for multiple selected options
- `TextAnswer` for typed answers
- `MatchingAnswerJson` for matching maps
- `OrderingAnswerJson` for ordering arrays
- `Score`, `MaxScore`, and `IsCorrect`

## Admin UI Rules

Use **Admin > Questions > Add question** to create non-import question types.

Rules enforced by the backend:

- `SingleChoice`: exactly 4 options and exactly one correct answer.
- `MultipleChoice`: at least 2 options and at least one correct answer.
- `TrueFalse`: exactly 2 options, or no options to use defaults `True` and `False`.
- `FillInBlank`: at least one accepted text answer.
- `Matching`: at least 2 complete left/right pairs.
- `Ordering`: at least 2 complete items.
- `CodeOutput`: requires `codeSnippet`; answer can be choice-based or text-based.
- `BigOAnalysis`: answer can be choice-based or text-based.

## Student UI Rules

The Take Quiz page renders controls from `questionType`:

- radio buttons for `SingleChoice`, `TrueFalse`, choice-based `CodeOutput`, and choice-based `BigOAnalysis`
- checkboxes for `MultipleChoice`
- text input for `FillInBlank`, text-based `CodeOutput`, and text-based `BigOAnalysis`
- select controls for `Matching`
- up/down buttons for `Ordering`

Correct answers and explanations are not sent in the start-quiz response. They are only shown after submit on the result page.

## Result Page

The result page displays:

- the student's submitted answer
- the correct answer
- per-question correctness
- per-question score
- explanation
- code snippets when available

For matching and ordering questions, the result page displays both the submitted structure and the correct structure so students can compare them directly.

## Seed Data

Advanced seed questions use `[QT-*]` prefixes in `DatabaseAdvancedSeedData.cs`:

| Prefix | Question type |
| --- | --- |
| `[QT-SC]` | `SingleChoice` |
| `[QT-MC]` | `MultipleChoice` |
| `[QT-TF]` | `TrueFalse` |
| `[QT-FB]` | `FillInBlank` |
| `[QT-MATCH]` | `Matching` |
| `[QT-ORDER]` | `Ordering` |
| `[QT-CODE]` | `CodeOutput` |
| `[QT-BIGO]` | `BigOAnalysis` |

The seeder also creates `Mixed Question Types Quiz` from these advanced questions.

## Import Limitation

Quiz import from `.xlsx`, `.pdf`, `.txt`, `.md`, or pasted text currently creates `SingleChoice` questions only.

Use the Admin question form for:

- `MultipleChoice`
- `TrueFalse`
- `FillInBlank`
- `Matching`
- `Ordering`
- `CodeOutput`
- `BigOAnalysis`

Future work can extend the import format with a `QuestionType` column and type-specific sections.
