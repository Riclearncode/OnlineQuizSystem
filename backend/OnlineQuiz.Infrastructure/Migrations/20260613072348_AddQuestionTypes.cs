using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineQuiz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodeSnippet",
                table: "Questions",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuestionType",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "MatchingAnswerJson",
                table: "AttemptAnswers",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxScore",
                table: "AttemptAnswers",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 1m);

            migrationBuilder.AddColumn<string>(
                name: "OrderingAnswerJson",
                table: "AttemptAnswers",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Score",
                table: "AttemptAnswers",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "SelectedOptionIdsJson",
                table: "AttemptAnswers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextAnswer",
                table: "AttemptAnswers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCorrect",
                table: "AnswerOptions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "OptionOrder",
                table: "AnswerOptions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE answerOptions
                SET
                    IsCorrect = CASE WHEN questions.CorrectOptionId = answerOptions.Id THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END,
                    OptionOrder = CASE UPPER(answerOptions.Label)
                        WHEN 'A' THEN 0
                        WHEN 'B' THEN 1
                        WHEN 'C' THEN 2
                        WHEN 'D' THEN 3
                        ELSE 0
                    END
                FROM AnswerOptions AS answerOptions
                INNER JOIN Questions AS questions ON questions.Id = answerOptions.QuestionId;
                """);

            migrationBuilder.Sql("""
                UPDATE AttemptAnswers
                SET Score = CASE WHEN IsCorrect = CAST(1 AS bit) THEN 1 ELSE 0 END,
                    MaxScore = 1;
                """);

            migrationBuilder.CreateTable(
                name: "CorrectTextAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    CorrectText = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    IsCaseSensitive = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CorrectTextAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CorrectTextAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchingPairs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    LeftItem = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RightItem = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PairOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchingPairs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchingPairs_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderingItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CorrectOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderingItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderingItems_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CorrectTextAnswers_QuestionId",
                table: "CorrectTextAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchingPairs_QuestionId",
                table: "MatchingPairs",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderingItems_QuestionId",
                table: "OrderingItems",
                column: "QuestionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CorrectTextAnswers");

            migrationBuilder.DropTable(
                name: "MatchingPairs");

            migrationBuilder.DropTable(
                name: "OrderingItems");

            migrationBuilder.DropColumn(
                name: "CodeSnippet",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "MatchingAnswerJson",
                table: "AttemptAnswers");

            migrationBuilder.DropColumn(
                name: "MaxScore",
                table: "AttemptAnswers");

            migrationBuilder.DropColumn(
                name: "OrderingAnswerJson",
                table: "AttemptAnswers");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "AttemptAnswers");

            migrationBuilder.DropColumn(
                name: "SelectedOptionIdsJson",
                table: "AttemptAnswers");

            migrationBuilder.DropColumn(
                name: "TextAnswer",
                table: "AttemptAnswers");

            migrationBuilder.DropColumn(
                name: "IsCorrect",
                table: "AnswerOptions");

            migrationBuilder.DropColumn(
                name: "OptionOrder",
                table: "AnswerOptions");
        }
    }
}
