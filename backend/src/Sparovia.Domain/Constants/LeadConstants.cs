namespace Sparovia.Domain.Constants;

public static class LeadStatus
{
    public const string New = "New";
    public const string Contacted = "Contacted";
    public const string Qualified = "Qualified";
    public const string Closed = "Closed";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        New,
        Contacted,
        Qualified,
        Closed
    };

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && All.Contains(status.Trim());
}

public static class LeadSource
{
    public const string Website = "Website";
    public const string WhatsApp = "WhatsApp";
    public const string Manual = "Manual";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Website,
        WhatsApp,
        Manual
    };

    public static bool IsValid(string? source) =>
        !string.IsNullOrWhiteSpace(source) && All.Contains(source.Trim());
}

public static class LeadFollowUpMethod
{
    public const string Call = "Call";
    public const string WhatsApp = "WhatsApp";
    public const string Email = "Email";
    public const string Meeting = "Meeting";
    public const string Other = "Other";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Call,
        WhatsApp,
        Email,
        Meeting,
        Other
    };

    public static bool IsValid(string? method) =>
        !string.IsNullOrWhiteSpace(method) && All.Contains(method.Trim());

    public static string Normalize(string? method)
    {
        var trimmed = method?.Trim() ?? string.Empty;
        foreach (var item in All)
        {
            if (string.Equals(item, trimmed, StringComparison.OrdinalIgnoreCase))
                return item;
        }
        return trimmed;
    }
}
