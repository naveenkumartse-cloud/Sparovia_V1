namespace Sparovia.Domain.Entities;

using Sparovia.Domain.Constants;

public class TenantAIConfiguration
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // 1-to-1 relationship with Tenant
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Approved provider key (e.g. "openai", "gemini", "claude")
    public string ProviderKey { get; set; } = AIProviders.OpenAI;

    // Encrypted API credential (AES-256-GCM ciphertext, never stored in plaintext)
    public string? EncryptedApiKey { get; set; }

    // Safe masked representation for UI display (e.g. "••••••••••••••••3a9f")
    public string? MaskedApiKey { get; set; }

    // Approved model key (e.g. "gpt-4o-mini", "gpt-4o")
    public required string SelectedModelKey { get; set; }

    // Supported capability: Content, Image, or Both
    public string SupportedCapability { get; set; } = AIModelCapability.Content;

    // Connection lifecycle status: Connected, NotConnected, Invalid
    public string Status { get; set; } = AIConnectionStatus.NotConnected;

    // Timestamp of last successful connection test
    public DateTime? LastValidatedAt { get; set; }

    // Audit tracking for configuration changes
    public Guid? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
