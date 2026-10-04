namespace Sparovia.Domain.Constants;

public static class LeadStatus
{
    public const string New = "New";
    public const string Contacted = "Contacted";
    public const string Closed = "Closed";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        New,
        Contacted,
        Closed
    };

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && All.Contains(status.Trim());
}

public static class LeadSource
{
    public const string Website = "Website";
    public const string WhatsApp = "WhatsApp";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Website,
        WhatsApp
    };

    public static bool IsValid(string? source) =>
        !string.IsNullOrWhiteSpace(source) && All.Contains(source.Trim());
}
