namespace OnlineQuiz.Infrastructure.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "OnlineQuizSystem";
    public string Audience { get; set; } = "OnlineQuizSystemClient";
    public string Secret { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 120;
}
