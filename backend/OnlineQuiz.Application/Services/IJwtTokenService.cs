using OnlineQuiz.Application.DTOs;
using OnlineQuiz.Domain.Entities;

namespace OnlineQuiz.Application.Services;

public interface IJwtTokenService
{
    Task<AuthResponse> CreateTokenAsync(ApplicationUser user);
}
