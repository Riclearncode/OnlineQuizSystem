using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Infrastructure.Data;

internal static class DatabaseAdvancedSeedData
{
    public static IReadOnlyList<AdvancedSeedQuestion> GetQuestionTypeSeedQuestions()
    {
        return
        [
            new("Stack", Difficulty.Easy, QuestionType.SingleChoice, "[QT-SC] Which stack operation adds an item to the top?", "Push inserts an item at the top of a stack.")
            {
                Options = [new("Push", true), new("Pop", false), new("Dequeue", false), new("Search", false)]
            },
            new("Queue", Difficulty.Easy, QuestionType.SingleChoice, "[QT-SC] Which queue operation removes the front item?", "Dequeue removes the item at the front of a queue.")
            {
                Options = [new("Push", false), new("Pop", false), new("Dequeue", true), new("Peek stack", false)]
            },
            new("Tree", Difficulty.Medium, QuestionType.SingleChoice, "[QT-SC] Which traversal visits a binary tree level by level?", "Level order traversal processes nodes by depth and usually uses a queue.")
            {
                Options = [new("Preorder", false), new("Inorder", false), new("Postorder", false), new("Level order", true)]
            },
            new("Graph", Difficulty.Medium, QuestionType.SingleChoice, "[QT-SC] Which graph representation is usually memory efficient for sparse graphs?", "Adjacency lists store only existing edges and are efficient for sparse graphs.")
            {
                Options = [new("Adjacency matrix", false), new("Adjacency list", true), new("Sorted array", false), new("Binary heap only", false)]
            },
            new("Sorting", Difficulty.Medium, QuestionType.SingleChoice, "[QT-SC] Which sorting algorithm is stable by its standard merge-based implementation?", "Merge sort is stable when equal elements are merged in original order.")
            {
                Options = [new("Merge sort", true), new("Selection sort", false), new("Heap sort", false), new("Quick sort", false)]
            },

            new("Stack", Difficulty.Medium, QuestionType.MultipleChoice, "[QT-MC] Which statements about a stack are correct?", "A stack follows LIFO and supports push/pop/peek operations.")
            {
                Options = [new("It follows LIFO", true), new("Push adds an item", true), new("Pop removes the top item", true), new("It always follows FIFO", false)]
            },
            new("Queue", Difficulty.Medium, QuestionType.MultipleChoice, "[QT-MC] Which statements about a queue are correct?", "A queue follows FIFO and supports enqueue/dequeue operations.")
            {
                Options = [new("It follows FIFO", true), new("Enqueue inserts an item", true), new("Dequeue removes the front item", true), new("It removes the newest item first", false)]
            },
            new("Graph", Difficulty.Medium, QuestionType.MultipleChoice, "[QT-MC] Which algorithms can be used to traverse a graph?", "BFS and DFS are standard graph traversal algorithms.")
            {
                Options = [new("BFS", true), new("DFS", true), new("Bubble sort", false), new("Dijkstra can visit graph vertices while solving shortest paths", true)]
            },
            new("Hash Table", Difficulty.Medium, QuestionType.MultipleChoice, "[QT-MC] Which techniques can handle hash collisions?", "Separate chaining and open addressing are common collision handling techniques.")
            {
                Options = [new("Separate chaining", true), new("Open addressing", true), new("Linear probing", true), new("Inorder traversal", false)]
            },
            new("Big O Notation", Difficulty.Medium, QuestionType.MultipleChoice, "[QT-MC] Which complexities are generally better than O(n^2) for large n?", "Constant, logarithmic, and linear growth are generally better than quadratic growth.")
            {
                Options = [new("O(1)", true), new("O(log n)", true), new("O(n)", true), new("O(2^n)", false)]
            },

            new("Queue", Difficulty.Easy, QuestionType.TrueFalse, "[QT-TF] Queue follows the FIFO rule.", "Queue means first in, first out.")
            {
                Options = [new("True", true), new("False", false)]
            },
            new("Stack", Difficulty.Easy, QuestionType.TrueFalse, "[QT-TF] Stack pop removes the oldest inserted item.", "Pop removes the newest inserted item, so the statement is false.")
            {
                Options = [new("True", false), new("False", true)]
            },
            new("Tree", Difficulty.Easy, QuestionType.TrueFalse, "[QT-TF] A binary tree node can have at most two children.", "A binary tree node has zero, one, or two children.")
            {
                Options = [new("True", true), new("False", false)]
            },
            new("Searching", Difficulty.Easy, QuestionType.TrueFalse, "[QT-TF] Binary search works correctly on any unsorted array.", "Binary search requires sorted data.")
            {
                Options = [new("True", false), new("False", true)]
            },
            new("Recursion", Difficulty.Easy, QuestionType.TrueFalse, "[QT-TF] A recursive function should have a base case.", "The base case stops recursive calls.")
            {
                Options = [new("True", true), new("False", false)]
            },

            new("Searching", Difficulty.Easy, QuestionType.FillInBlank, "[QT-FB] The average time complexity of binary search is ____.", "Binary search halves the remaining search range each step.")
            {
                CorrectTextAnswers = ["O(log n)", "log n"]
            },
            new("Stack", Difficulty.Easy, QuestionType.FillInBlank, "[QT-FB] A stack follows the ____ principle.", "Stack behavior is Last In, First Out.")
            {
                CorrectTextAnswers = ["LIFO", "Last In First Out", "Last-In First-Out"]
            },
            new("Queue", Difficulty.Easy, QuestionType.FillInBlank, "[QT-FB] A queue follows the ____ principle.", "Queue behavior is First In, First Out.")
            {
                CorrectTextAnswers = ["FIFO", "First In First Out", "First-In First-Out"]
            },
            new("Hash Table", Difficulty.Medium, QuestionType.FillInBlank, "[QT-FB] A hash table maps a key to a bucket using a ____ function.", "A hash function computes a bucket/index from a key.")
            {
                CorrectTextAnswers = ["hash", "hashing", "hash function"]
            },
            new("Recursion", Difficulty.Easy, QuestionType.FillInBlank, "[QT-FB] The condition that stops recursion is called the ____ case.", "A base case terminates recursive calls.")
            {
                CorrectTextAnswers = ["base", "base case"]
            },

            new("Stack", Difficulty.Medium, QuestionType.Matching, "[QT-MATCH] Match each data structure with its access rule.", "Stack is LIFO, queue is FIFO, and hash table maps keys to buckets.")
            {
                MatchingPairs = [new("Stack", "LIFO"), new("Queue", "FIFO"), new("Hash Table", "Key to bucket")]
            },
            new("Searching", Difficulty.Medium, QuestionType.Matching, "[QT-MATCH] Match each search method with its usual requirement or behavior.", "Linear search scans sequentially, binary search needs sorted data, BFS uses a queue.")
            {
                MatchingPairs = [new("Linear Search", "Sequential scan"), new("Binary Search", "Sorted input"), new("BFS", "Queue-based traversal")]
            },
            new("Tree", Difficulty.Medium, QuestionType.Matching, "[QT-MATCH] Match each tree traversal with its order.", "The traversal names describe the root position or level-based processing.")
            {
                MatchingPairs = [new("Preorder", "Root-left-right"), new("Inorder", "Left-root-right"), new("Postorder", "Left-right-root")]
            },

            new("Searching", Difficulty.Medium, QuestionType.Ordering, "[QT-ORDER] Put binary search steps in the correct order.", "Binary search repeatedly checks the middle and narrows the search range.")
            {
                OrderingItems = ["Set left and right bounds", "Compute mid", "Compare array[mid] with key", "Narrow the search range", "Repeat until found or range is empty"]
            },
            new("Sorting", Difficulty.Medium, QuestionType.Ordering, "[QT-ORDER] Put merge sort steps in the correct order.", "Merge sort divides the array, sorts halves, and merges them.")
            {
                OrderingItems = ["Split the array into two halves", "Recursively sort the left half", "Recursively sort the right half", "Merge the sorted halves"]
            },
            new("Graph", Difficulty.Medium, QuestionType.Ordering, "[QT-ORDER] Put BFS steps in the correct order.", "BFS starts from a source, uses a queue, and visits neighbors level by level.")
            {
                OrderingItems = ["Mark the start vertex as visited", "Enqueue the start vertex", "Dequeue a vertex", "Visit and enqueue each unvisited neighbor", "Repeat until the queue is empty"]
            },

            new("Stack", Difficulty.Medium, QuestionType.CodeOutput, "[QT-CODE] What output does this stack pseudocode produce?", "The last pushed value is popped first.")
            {
                CodeSnippet = "push(3)\npush(7)\nprint(pop())",
                CorrectTextAnswers = ["7"]
            },
            new("Queue", Difficulty.Medium, QuestionType.CodeOutput, "[QT-CODE] What output does this queue pseudocode produce?", "The first enqueued value is dequeued first.")
            {
                CodeSnippet = "enqueue(2)\nenqueue(9)\nprint(dequeue())",
                CorrectTextAnswers = ["2"]
            },
            new("Recursion", Difficulty.Hard, QuestionType.CodeOutput, "[QT-CODE] What value does f(4) return?", "The function computes a factorial-like product.")
            {
                CodeSnippet = "f(n):\n  if n == 1: return 1\n  return n * f(n - 1)",
                CorrectTextAnswers = ["24"]
            },

            new("Big O Notation", Difficulty.Easy, QuestionType.BigOAnalysis, "[QT-BIGO] What is the complexity of a single loop from 1 to n?", "A single loop that processes n items is linear.")
            {
                Options = [new("O(1)", false), new("O(log n)", false), new("O(n)", true), new("O(n^2)", false)]
            },
            new("Big O Notation", Difficulty.Medium, QuestionType.BigOAnalysis, "[QT-BIGO] What is the complexity of two nested loops over n?", "Two nested loops over n produce quadratic growth.")
            {
                CorrectTextAnswers = ["O(n^2)", "n^2", "O(n squared)"]
            },
            new("Searching", Difficulty.Medium, QuestionType.BigOAnalysis, "[QT-BIGO] What is the complexity of binary search on a sorted array?", "Binary search halves the range each step.")
            {
                Options = [new("O(1)", false), new("O(log n)", true), new("O(n)", false), new("O(n log n)", false)]
            }
        ];
    }
}

internal sealed record AdvancedSeedQuestion(
    string TopicName,
    Difficulty Difficulty,
    QuestionType QuestionType,
    string Content,
    string Explanation)
{
    public string? CodeSnippet { get; init; }
    public IReadOnlyList<AdvancedOptionSeed> Options { get; init; } = [];
    public IReadOnlyList<string> CorrectTextAnswers { get; init; } = [];
    public IReadOnlyList<MatchingPairSeed> MatchingPairs { get; init; } = [];
    public IReadOnlyList<string> OrderingItems { get; init; } = [];
}

internal sealed record AdvancedOptionSeed(string Text, bool IsCorrect);

internal sealed record MatchingPairSeed(string LeftItem, string RightItem);
