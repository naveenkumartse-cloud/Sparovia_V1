namespace Sparovia.Application.AI;

/// <summary>
/// Provider abstraction boundary. Concrete provider adapters (OpenAI, Anthropic, Local, Stub)
/// implement this interface inside Infrastructure.
/// The Application and Domain layers do NOT depend on external provider SDKs.
/// </summary>
public interface IAIProvider
{
    string ProviderName { get; }
    Task<bool> TestConnectionAsync(string providerKey, string apiKey, CancellationToken cancellationToken = default);
    Task<AIProviderResult> GenerateTextAsync(AIProviderTextRequest request, CancellationToken cancellationToken = default);
}
