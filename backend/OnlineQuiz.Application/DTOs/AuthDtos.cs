namespace OnlineQuiz.Application.DTOs;

public record RegisterRequest(string FullName, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string UserId,
    string FullName,
    string Email,
    string Role);

public record CurrentUserResponse(
    string UserId,
    string FullName,
    string Email,
    string Role);
