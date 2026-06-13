using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OnlineQuiz.Domain.Common;
using OnlineQuiz.Domain.Entities;
using OnlineQuiz.Domain.Enums;

namespace OnlineQuiz.Infrastructure.Data;

public static class DatabaseSeeder
{
    private static readonly string[] OptionLabels = ["A", "B", "C", "D"];

    public static async Task SeedAsync(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        await SeedRolesAsync(roleManager);
        await SeedUsersAsync(userManager);
        await SeedTopicsAsync(dbContext);
        await SeedQuestionsAsync(dbContext);
        await SeedQuizzesAsync(dbContext);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        foreach (var roleName in new[] { RoleNames.Admin, RoleNames.Student })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }

    private static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager)
    {
        await EnsureUserAsync(userManager, "Nguyen Quang Thai Admin", "admin@quiz.com", "Admin@123", RoleNames.Admin);
        await EnsureUserAsync(userManager, "Demo Student", "student@quiz.com", "Student@123", RoleNames.Student);
    }

    private static async Task EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string fullName,
        string email,
        string password,
        string role)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                FullName = fullName,
                Email = email,
                UserName = email,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join("; ", createResult.Errors.Select(x => x.Description)));
            }
        }

        if (!await userManager.IsInRoleAsync(user, role))
        {
            await userManager.AddToRoleAsync(user, role);
        }
    }

    private static async Task SeedTopicsAsync(ApplicationDbContext dbContext)
    {
        if (await dbContext.Topics.AnyAsync())
        {
            return;
        }

        var topics = new[]
        {
            new Topic { Name = "Stack", Description = "LIFO data structure used for backtracking and expression evaluation." },
            new Topic { Name = "Queue", Description = "FIFO data structure used for scheduling and breadth-first traversal." },
            new Topic { Name = "Linked List", Description = "Node-based linear structure with pointer references." },
            new Topic { Name = "Tree", Description = "Hierarchical structure for search, parsing, and indexing." },
            new Topic { Name = "Graph", Description = "Vertices and edges used to model networks and relationships." },
            new Topic { Name = "Sorting", Description = "Algorithms for ordering data efficiently." },
            new Topic { Name = "Searching", Description = "Algorithms for locating values in collections." },
            new Topic { Name = "Hash Table", Description = "Key-value structure based on hashing." },
            new Topic { Name = "Recursion", Description = "Problem solving by reducing a task into smaller self-similar tasks." },
            new Topic { Name = "Big O Notation", Description = "Asymptotic analysis of algorithm time and space complexity." }
        };

        dbContext.Topics.AddRange(topics);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedQuestionsAsync(ApplicationDbContext dbContext)
    {
        var topics = await dbContext.Topics.ToDictionaryAsync(x => x.Name);
        var existingContents = await dbContext.Questions
            .Select(x => x.Content)
            .ToHashSetAsync();

        await AddSeedQuestionsAsync(dbContext, topics, existingContents, GetSeedQuestions());
        await AddSeedQuestionsAsync(dbContext, topics, existingContents, GetVietnameseSeedQuestions());
        await AddAdvancedSeedQuestionsAsync(dbContext, topics, existingContents, DatabaseAdvancedSeedData.GetQuestionTypeSeedQuestions());
    }

    private static async Task AddSeedQuestionsAsync(
        ApplicationDbContext dbContext,
        IReadOnlyDictionary<string, Topic> topics,
        ISet<string> existingContents,
        IReadOnlyList<SeedQuestion> seedQuestions)
    {
        var questionPairs = new List<(Question Question, int CorrectIndex)>();

        foreach (var seed in seedQuestions)
        {
            if (existingContents.Contains(seed.Content) || !topics.TryGetValue(seed.TopicName, out var topic))
            {
                continue;
            }

            var question = new Question
            {
                Content = seed.Content,
                TopicId = topic.Id,
                Difficulty = seed.Difficulty,
                Explanation = seed.Explanation,
                CorrectOptionId = 0,
                CreatedAt = DateTime.UtcNow,
                Options = seed.Options.Select((text, index) => new AnswerOption
                {
                    Label = OptionLabels[index],
                    Text = text,
                    IsCorrect = index == seed.CorrectIndex,
                    OptionOrder = index
                }).ToList()
            };

            questionPairs.Add((question, seed.CorrectIndex));
            existingContents.Add(seed.Content);
            dbContext.Questions.Add(question);
        }

        if (questionPairs.Count == 0)
        {
            return;
        }

        await dbContext.SaveChangesAsync();

        foreach (var pair in questionPairs)
        {
            pair.Question.CorrectOptionId = pair.Question.Options
                .OrderBy(x => x.Label)
                .ElementAt(pair.CorrectIndex)
                .Id;
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task AddAdvancedSeedQuestionsAsync(
        ApplicationDbContext dbContext,
        IReadOnlyDictionary<string, Topic> topics,
        ISet<string> existingContents,
        IReadOnlyList<AdvancedSeedQuestion> seedQuestions)
    {
        var questions = new List<Question>();

        foreach (var seed in seedQuestions)
        {
            if (existingContents.Contains(seed.Content) || !topics.TryGetValue(seed.TopicName, out var topic))
            {
                continue;
            }

            var question = new Question
            {
                Content = seed.Content,
                TopicId = topic.Id,
                Difficulty = seed.Difficulty,
                QuestionType = seed.QuestionType,
                Explanation = seed.Explanation,
                CodeSnippet = seed.CodeSnippet,
                CorrectOptionId = 0,
                CreatedAt = DateTime.UtcNow,
                Options = seed.Options.Select((option, index) => new AnswerOption
                {
                    Label = ToOptionLabel(index),
                    Text = option.Text,
                    IsCorrect = option.IsCorrect,
                    OptionOrder = index
                }).ToList(),
                CorrectTextAnswers = seed.CorrectTextAnswers.Select(text => new CorrectTextAnswer
                {
                    CorrectText = text,
                    IsCaseSensitive = false
                }).ToList(),
                MatchingPairs = seed.MatchingPairs.Select((pair, index) => new MatchingPair
                {
                    LeftItem = pair.LeftItem,
                    RightItem = pair.RightItem,
                    PairOrder = index
                }).ToList(),
                OrderingItems = seed.OrderingItems.Select((content, index) => new OrderingItem
                {
                    Content = content,
                    CorrectOrder = index
                }).ToList()
            };

            questions.Add(question);
            existingContents.Add(seed.Content);
            dbContext.Questions.Add(question);
        }

        if (questions.Count == 0)
        {
            return;
        }

        await dbContext.SaveChangesAsync();

        foreach (var question in questions)
        {
            question.CorrectOptionId = question.Options
                .OrderBy(x => x.OptionOrder)
                .FirstOrDefault(x => x.IsCorrect)
                ?.Id ?? 0;
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedQuizzesAsync(ApplicationDbContext dbContext)
    {
        var questions = await dbContext.Questions
            .Include(x => x.Topic)
            .OrderBy(x => x.Id)
            .ToListAsync();
        var existingTitles = await dbContext.Quizzes
            .Select(x => x.Title)
            .ToHashSetAsync();

        AddQuiz(
            dbContext,
            existingTitles,
            "Basic Data Structures Quiz",
            "Practice core linear and key-value data structures.",
            25,
            questions
                .Where(x => x.Topic!.Name is "Stack" or "Queue" or "Linked List" or "Hash Table")
                .Take(12)
                .Select(x => x.Id));

        AddQuiz(
            dbContext,
            existingTitles,
            "Sorting and Searching Quiz",
            "Review classic ordering and lookup algorithms.",
            30,
            questions
                .Where(x => x.Topic!.Name is "Sorting" or "Searching" or "Big O Notation")
                .Take(12)
                .Select(x => x.Id));

        AddQuiz(
            dbContext,
            existingTitles,
            "Graph and Tree Quiz",
            "Test traversal and hierarchy fundamentals.",
            30,
            questions
                .Where(x => x.Topic!.Name is "Graph" or "Tree" or "Recursion")
                .Take(12)
                .Select(x => x.Id));

        AddQuiz(
            dbContext,
            existingTitles,
            "Mixed Question Types Quiz",
            "Practice DSA with single choice, multiple choice, true/false, fill blank, matching, ordering, code output, and Big O questions.",
            35,
            questions
                .Where(x => x.Content.StartsWith("[QT-", StringComparison.Ordinal))
                .Take(20)
                .Select(x => x.Id));

        AddQuiz(
            dbContext,
            existingTitles,
            "Trắc nghiệm cấu trúc dữ liệu cơ bản",
            "Ôn tập Stack, Queue, Linked List và Hash Table bằng tiếng Việt.",
            25,
            questions
                .Where(x => x.Content.StartsWith("[VI]", StringComparison.Ordinal) &&
                    (x.Topic!.Name is "Stack" or "Queue" or "Linked List" or "Hash Table"))
                .Take(8)
                .Select(x => x.Id));

        AddQuiz(
            dbContext,
            existingTitles,
            "Trắc nghiệm sắp xếp và tìm kiếm",
            "Bộ câu hỏi tiếng Việt về Sorting, Searching và Big O.",
            30,
            questions
                .Where(x => x.Content.StartsWith("[VI]", StringComparison.Ordinal) &&
                    (x.Topic!.Name is "Sorting" or "Searching" or "Big O Notation"))
                .Take(6)
                .Select(x => x.Id));

        AddQuiz(
            dbContext,
            existingTitles,
            "Trắc nghiệm cây, đồ thị và đệ quy",
            "Bộ câu hỏi tiếng Việt về Tree, Graph và Recursion.",
            30,
            questions
                .Where(x => x.Content.StartsWith("[VI]", StringComparison.Ordinal) &&
                    (x.Topic!.Name is "Tree" or "Graph" or "Recursion"))
                .Take(6)
                .Select(x => x.Id));

        await dbContext.SaveChangesAsync();
    }

    private static void AddQuiz(
        ApplicationDbContext dbContext,
        ISet<string> existingTitles,
        string title,
        string description,
        int timeLimitMinutes,
        IEnumerable<int> questionIds)
    {
        if (existingTitles.Contains(title))
        {
            return;
        }

        var ids = questionIds.ToList();
        if (ids.Count == 0)
        {
            return;
        }

        dbContext.Quizzes.Add(new Quiz
        {
            Title = title,
            Description = description,
            TimeLimitMinutes = timeLimitMinutes,
            TotalQuestions = ids.Count,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            QuizQuestions = ids.Select(id => new QuizQuestion { QuestionId = id }).ToList()
        });
        existingTitles.Add(title);
    }

    private static IReadOnlyList<SeedQuestion> GetSeedQuestions()
    {
        return
        [
            new("Stack", Difficulty.Easy, "Which operation removes the most recently added item from a stack?",
                ["Enqueue", "Pop", "Dequeue", "Peek"], 1,
                "A stack follows LIFO, so Pop removes the latest pushed item."),
            new("Stack", Difficulty.Easy, "Which real-world behavior best matches a stack?",
                ["People waiting in a ticket line", "Browser back button history", "Hashing a key", "Binary search"], 1,
                "The last page visited is the first page returned to by the back button."),
            new("Stack", Difficulty.Medium, "What is the usual time complexity of push on an array-backed stack with available capacity?",
                ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0,
                "Adding to the top only updates one position and the top index."),
            new("Stack", Difficulty.Hard, "Which algorithmic pattern commonly uses an explicit stack to avoid recursive calls?",
                ["Dynamic programming tabulation", "Iterative depth-first search", "Counting sort", "Binary search"], 1,
                "DFS can store pending nodes in a stack instead of using the call stack."),

            new("Queue", Difficulty.Easy, "Which rule does a queue follow?",
                ["LIFO", "FIFO", "Random order", "Sorted order"], 1,
                "A queue removes the item that has waited the longest: first in, first out."),
            new("Queue", Difficulty.Easy, "Which operation inserts an item into a queue?",
                ["Push", "Pop", "Enqueue", "Peek"], 2,
                "Enqueue adds an item at the rear of the queue."),
            new("Queue", Difficulty.Medium, "Which traversal normally uses a queue?",
                ["Depth-first search", "Breadth-first search", "Quick sort", "Binary search"], 1,
                "BFS processes nodes level by level, which naturally uses FIFO behavior."),
            new("Queue", Difficulty.Hard, "Why is a circular queue useful in an array implementation?",
                ["It keeps elements sorted", "It reuses freed front positions", "It removes hashing collisions", "It halves memory usage every time"], 1,
                "A circular queue wraps indices so removed front space can be used again."),

            new("Linked List", Difficulty.Easy, "What does a singly linked list node usually store?",
                ["Only an index", "Data and a pointer to the next node", "Four child pointers", "A hash function"], 1,
                "A singly linked list node contains a value and a reference to the next node."),
            new("Linked List", Difficulty.Easy, "Which operation is efficient when inserting at the head of a singly linked list?",
                ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 0,
                "Head insertion only changes the new node pointer and head reference."),
            new("Linked List", Difficulty.Medium, "What is a disadvantage of linked lists compared with arrays?",
                ["They cannot grow", "They do not support O(1) random access", "They require sorted data", "They cannot store duplicates"], 1,
                "Finding the k-th node requires walking through previous nodes."),
            new("Linked List", Difficulty.Hard, "Which technique detects a cycle in a linked list using O(1) extra space?",
                ["Binary search", "Floyd's slow and fast pointers", "Counting sort", "Hash table resizing"], 1,
                "Floyd's algorithm moves two pointers at different speeds; a meeting indicates a cycle."),

            new("Tree", Difficulty.Easy, "Which node has no children in a tree?",
                ["Root", "Leaf", "Parent", "Ancestor"], 1,
                "A leaf node is a terminal node without children."),
            new("Tree", Difficulty.Easy, "In a binary tree, what is the maximum number of children per node?",
                ["1", "2", "3", "Unlimited"], 1,
                "Binary means each node has at most two children."),
            new("Tree", Difficulty.Medium, "Which traversal visits left subtree, root, then right subtree?",
                ["Preorder", "Inorder", "Postorder", "Level order"], 1,
                "Inorder traversal processes left, then node, then right."),
            new("Tree", Difficulty.Hard, "What property makes a binary search tree useful for lookup?",
                ["All leaves are at the same level", "Left values are smaller and right values are larger", "Every node has exactly two children", "Nodes are stored in a circular array"], 1,
                "The ordering property lets lookup discard one subtree at each step in balanced cases."),

            new("Graph", Difficulty.Easy, "What are the two basic parts of a graph?",
                ["Rows and columns", "Vertices and edges", "Keys and values", "Stacks and queues"], 1,
                "A graph models entities as vertices and relationships as edges."),
            new("Graph", Difficulty.Easy, "Which structure represents graph connections with a list per vertex?",
                ["Adjacency list", "Call stack", "Heap frame", "Prefix table"], 0,
                "An adjacency list stores neighbors for each vertex."),
            new("Graph", Difficulty.Medium, "Which algorithm finds the shortest path in an unweighted graph?",
                ["DFS", "BFS", "Merge sort", "Linear search"], 1,
                "BFS explores by distance levels, so the first visit is shortest in unweighted graphs."),
            new("Graph", Difficulty.Hard, "Which algorithm is commonly used for shortest paths with non-negative weights?",
                ["Dijkstra's algorithm", "Quick sort", "Euclid's algorithm", "Floyd cycle detection"], 0,
                "Dijkstra's algorithm greedily expands the closest unvisited vertex for non-negative weights."),

            new("Sorting", Difficulty.Easy, "Which sorting algorithm repeatedly swaps adjacent out-of-order elements?",
                ["Bubble sort", "Binary search", "DFS", "Hashing"], 0,
                "Bubble sort compares adjacent pairs and bubbles larger values toward the end."),
            new("Sorting", Difficulty.Easy, "What is the best-case time complexity of insertion sort on an already sorted array?",
                ["O(1)", "O(n)", "O(n log n)", "O(n^2)"], 1,
                "Insertion sort scans once when every element is already in place."),
            new("Sorting", Difficulty.Medium, "Which sorting algorithm uses divide and conquer and merging?",
                ["Selection sort", "Merge sort", "Linear search", "BFS"], 1,
                "Merge sort divides the array and merges sorted halves."),
            new("Sorting", Difficulty.Hard, "What is the average time complexity of quicksort?",
                ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], 1,
                "With good pivots, quicksort partitions recursively with logarithmic depth on average."),

            new("Searching", Difficulty.Easy, "Which search works on unsorted data by checking each item?",
                ["Binary search", "Linear search", "Dijkstra search", "Interpolation only"], 1,
                "Linear search scans items one by one and does not require sorting."),
            new("Searching", Difficulty.Easy, "Binary search requires the input to be what?",
                ["Sorted", "Linked", "Random", "Hashed with collisions"], 0,
                "Binary search compares against the middle and needs sorted order."),
            new("Searching", Difficulty.Medium, "What is the time complexity of binary search on a sorted array?",
                ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1,
                "Each comparison halves the remaining search range."),
            new("Searching", Difficulty.Hard, "Why is binary search not efficient on a singly linked list?",
                ["Linked lists cannot store numbers", "Middle access is O(n)", "Binary search requires hashing", "The list must be circular"], 1,
                "A linked list cannot jump to the middle in constant time."),

            new("Hash Table", Difficulty.Easy, "What does a hash function compute?",
                ["A queue order", "An array index or bucket from a key", "A tree height", "A sorting pivot only"], 1,
                "Hashing maps keys to bucket positions."),
            new("Hash Table", Difficulty.Easy, "What is a collision in a hash table?",
                ["Two keys map to the same bucket", "A key is sorted incorrectly", "A graph has a cycle", "A stack is empty"], 0,
                "Collisions happen when different keys produce the same bucket index."),
            new("Hash Table", Difficulty.Medium, "What is the average-case lookup complexity in a well-sized hash table?",
                ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 0,
                "With a good hash function and low load factor, lookup is constant on average."),
            new("Hash Table", Difficulty.Hard, "What does rehashing usually do?",
                ["Converts a graph to a tree", "Moves entries into a larger bucket array", "Sorts all keys alphabetically", "Deletes duplicate keys"], 1,
                "Rehashing grows the table and recomputes bucket placement to reduce collisions."),

            new("Recursion", Difficulty.Easy, "What must a recursive function have to stop correctly?",
                ["A base case", "A hash table", "An adjacency matrix", "A sorted array"], 0,
                "A base case prevents infinite recursive calls."),
            new("Recursion", Difficulty.Easy, "Which data structure is used by the runtime to manage recursive calls?",
                ["Queue", "Call stack", "Hash table", "Graph"], 1,
                "Each recursive call adds a frame to the call stack."),
            new("Recursion", Difficulty.Medium, "What is tail recursion?",
                ["A function with no base case", "A recursive call as the final operation", "A recursive call inside a loop only", "A tree with one child"], 1,
                "Tail recursion returns directly from the recursive call without more work afterward."),
            new("Recursion", Difficulty.Hard, "Why can deep recursion be dangerous?",
                ["It always changes Big O to O(1)", "It can overflow the call stack", "It prevents all loops", "It cannot use parameters"], 1,
                "Too many nested calls can exceed available call stack memory."),

            new("Big O Notation", Difficulty.Easy, "What does Big O describe?",
                ["Exact runtime in seconds", "Growth rate as input size increases", "Programming language syntax", "Database table names"], 1,
                "Big O focuses on asymptotic growth rather than machine-specific timing."),
            new("Big O Notation", Difficulty.Easy, "Which complexity is usually better for large n?",
                ["O(n)", "O(n^2)", "O(2^n)", "O(n!)"], 0,
                "Linear growth is usually much smaller than quadratic, exponential, or factorial growth."),
            new("Big O Notation", Difficulty.Medium, "What is the complexity of one loop over n items?",
                ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 2,
                "A single loop that visits every item once grows linearly."),
            new("Big O Notation", Difficulty.Hard, "What is the complexity of binary search and why?",
                ["O(n), because it scans all items", "O(log n), because it halves the range", "O(n^2), because it has nested loops", "O(1), because it uses one comparison"], 1,
                "Binary search discards half the remaining range after each comparison.")
        ];
    }

    private static IReadOnlyList<SeedQuestion> GetVietnameseSeedQuestions()
    {
        return
        [
            new("Stack", Difficulty.Easy, "[VI] Stack hoạt động theo nguyên tắc nào?",
                ["FIFO", "LIFO", "Sắp xếp tăng dần", "Truy cập ngẫu nhiên"], 1,
                "Stack là cấu trúc LIFO: phần tử được thêm sau cùng sẽ được lấy ra trước."),
            new("Stack", Difficulty.Medium, "[VI] Thao tác Peek trên stack dùng để làm gì?",
                ["Xóa phần tử đầu", "Xem phần tử trên đỉnh mà không xóa", "Thêm phần tử vào cuối hàng đợi", "Đảo ngược toàn bộ mảng"], 1,
                "Peek chỉ đọc phần tử trên đỉnh stack và không làm thay đổi stack."),

            new("Queue", Difficulty.Easy, "[VI] Queue hoạt động theo nguyên tắc nào?",
                ["LIFO", "FIFO", "Chọn ngẫu nhiên", "Luôn ưu tiên phần tử lớn nhất"], 1,
                "Queue là cấu trúc FIFO: phần tử vào trước sẽ được lấy ra trước."),
            new("Queue", Difficulty.Medium, "[VI] Thuật toán duyệt nào thường dùng queue?",
                ["DFS", "BFS", "Quick sort", "Binary search"], 1,
                "BFS duyệt theo từng lớp nên cần queue để xử lý các đỉnh theo thứ tự vào trước ra trước."),

            new("Linked List", Difficulty.Easy, "[VI] Mỗi node trong singly linked list thường gồm những gì?",
                ["Chỉ có chỉ số", "Dữ liệu và con trỏ tới node kế tiếp", "Bốn con trỏ con", "Một hàm băm"], 1,
                "Node của danh sách liên kết đơn lưu dữ liệu và tham chiếu tới node tiếp theo."),
            new("Linked List", Difficulty.Hard, "[VI] Kỹ thuật nào phát hiện chu trình trong linked list với O(1) bộ nhớ phụ?",
                ["Binary search", "Hai con trỏ nhanh chậm của Floyd", "Counting sort", "Dijkstra"], 1,
                "Floyd dùng hai con trỏ di chuyển với tốc độ khác nhau; nếu gặp nhau thì có chu trình."),

            new("Tree", Difficulty.Easy, "[VI] Node không có node con trong cây được gọi là gì?",
                ["Root", "Leaf", "Parent", "Ancestor"], 1,
                "Leaf node là node lá, không có node con."),
            new("Tree", Difficulty.Medium, "[VI] Inorder traversal của cây nhị phân duyệt theo thứ tự nào?",
                ["Root, Left, Right", "Left, Root, Right", "Left, Right, Root", "Theo từng mức"], 1,
                "Inorder duyệt cây con trái, sau đó node hiện tại, rồi cây con phải."),

            new("Graph", Difficulty.Easy, "[VI] Graph gồm hai thành phần cơ bản nào?",
                ["Hàng và cột", "Đỉnh và cạnh", "Khóa và giá trị", "Stack và queue"], 1,
                "Graph biểu diễn đối tượng bằng đỉnh và quan hệ bằng cạnh."),
            new("Graph", Difficulty.Hard, "[VI] Thuật toán nào tìm đường đi ngắn nhất với trọng số không âm?",
                ["Dijkstra", "Bubble sort", "Linear search", "Floyd cycle detection"], 0,
                "Dijkstra phù hợp với đồ thị có trọng số không âm."),

            new("Sorting", Difficulty.Easy, "[VI] Thuật toán nào hoán đổi các phần tử kề nhau nếu sai thứ tự?",
                ["Bubble sort", "Binary search", "DFS", "Hashing"], 0,
                "Bubble sort liên tục so sánh cặp phần tử kề nhau và đẩy phần tử lớn dần về cuối."),
            new("Sorting", Difficulty.Medium, "[VI] Merge sort sử dụng chiến lược nào?",
                ["Tham lam", "Chia để trị", "Backtracking", "Hashing"], 1,
                "Merge sort chia mảng thành hai nửa, sắp xếp từng nửa rồi trộn lại."),

            new("Searching", Difficulty.Easy, "[VI] Binary search yêu cầu dữ liệu đầu vào như thế nào?",
                ["Đã sắp xếp", "Luôn là linked list", "Ngẫu nhiên", "Có hash key"], 0,
                "Binary search cần dữ liệu đã sắp xếp để loại bỏ một nửa phạm vi sau mỗi lần so sánh."),
            new("Searching", Difficulty.Medium, "[VI] Độ phức tạp của binary search trên mảng đã sắp xếp là gì?",
                ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 1,
                "Mỗi bước binary search chia đôi phạm vi tìm kiếm nên độ phức tạp là O(log n)."),

            new("Hash Table", Difficulty.Easy, "[VI] Collision trong hash table là gì?",
                ["Hai key ánh xạ vào cùng bucket", "Mảng bị sắp xếp sai", "Graph có chu trình", "Stack bị rỗng"], 0,
                "Collision xảy ra khi nhiều key khác nhau cho ra cùng vị trí bucket."),
            new("Hash Table", Difficulty.Medium, "[VI] Trung bình thao tác tìm kiếm trong hash table tốt có độ phức tạp nào?",
                ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0,
                "Với hàm băm tốt và load factor hợp lý, tìm kiếm trung bình là O(1)."),

            new("Recursion", Difficulty.Easy, "[VI] Hàm đệ quy cần điều kiện nào để dừng đúng?",
                ["Base case", "Hash table", "Adjacency matrix", "Sorted array"], 0,
                "Base case giúp đệ quy kết thúc thay vì gọi vô hạn."),
            new("Recursion", Difficulty.Hard, "[VI] Vì sao đệ quy quá sâu có thể nguy hiểm?",
                ["Luôn biến độ phức tạp thành O(1)", "Có thể gây tràn call stack", "Không dùng được tham số", "Không thể trả về giá trị"], 1,
                "Mỗi lời gọi đệ quy tạo một frame trên call stack; quá nhiều frame có thể gây tràn stack."),

            new("Big O Notation", Difficulty.Easy, "[VI] Big O dùng để mô tả điều gì?",
                ["Thời gian chạy chính xác theo giây", "Tốc độ tăng trưởng khi kích thước input tăng", "Cú pháp ngôn ngữ lập trình", "Tên bảng database"], 1,
                "Big O mô tả xu hướng tăng trưởng của thuật toán theo kích thước input."),
            new("Big O Notation", Difficulty.Medium, "[VI] Một vòng lặp duyệt qua n phần tử thường có độ phức tạp nào?",
                ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 2,
                "Nếu vòng lặp xử lý mỗi phần tử một lần thì thời gian tăng tuyến tính theo n.")
        ];
    }

    private static string ToOptionLabel(int index)
    {
        return ((char)('A' + index)).ToString();
    }

    private record SeedQuestion(
        string TopicName,
        Difficulty Difficulty,
        string Content,
        string[] Options,
        int CorrectIndex,
        string Explanation);
}
