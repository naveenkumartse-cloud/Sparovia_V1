namespace Sparovia.Application.AI;

/// <summary>
/// Service abstraction for encrypting and decrypting sensitive AI provider API keys.
/// Keys are encrypted at rest and decrypted in server-side memory only during outbound calls.
/// Plaintext API keys are never persisted or returned in API responses.
/// </summary>
public interface IAICredentialEncryptionService
{
    /// <summary>
    /// Encrypts a plaintext API key to secure ciphertext.
    /// </summary>
    string Encrypt(string plainTextApiKey);

    /// <summary>
    /// Decrypts ciphertext back to plaintext in server memory.
    /// </summary>
    string Decrypt(string cipherText);

    /// <summary>
    /// Formats a safe masked representation of an API key for display (e.g. "sk-...••••3a9f").
    /// </summary>
    string MaskApiKey(string plainTextApiKey);
}
