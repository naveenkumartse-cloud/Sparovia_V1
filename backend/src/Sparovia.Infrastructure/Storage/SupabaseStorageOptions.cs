namespace Sparovia.Infrastructure.Storage;

using Microsoft.Extensions.Configuration;

public class SupabaseStorageOptions
{
    public const string SectionName = "Supabase";

    public string Url { get; set; } = "https://ejvpbjbehujqcnwllxby.supabase.co";
    public string? Key { get; set; }
    public string Bucket { get; set; } = "sparovia-images";

    /// <summary>
    /// Binds Supabase storage options from the "Supabase" section,
    /// environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, SUPABASE_BUCKET),
    /// and standard ASP.NET Core hierarchical naming.
    /// </summary>
    public static SupabaseStorageOptions FromConfiguration(IConfiguration configuration)
    {
        var options = new SupabaseStorageOptions();
        var section = configuration.GetSection(SectionName);

        // 1. Resolve Project URL
        var url = section["Url"]
            ?? configuration["SUPABASE_URL"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_URL")
            ?? Environment.GetEnvironmentVariable("Supabase__Url");

        if (!string.IsNullOrWhiteSpace(url))
        {
            options.Url = url.Trim().TrimEnd('/');
        }

        // 2. Resolve Server-side Key (Service Role preferred for storage write access)
        var key = section["ServiceRoleKey"]
            ?? section["Key"]
            ?? configuration["SUPABASE_SERVICE_ROLE_KEY"]
            ?? configuration["SUPABASE_KEY"]
            ?? configuration["SUPABASE_ANON_KEY"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
            ?? Environment.GetEnvironmentVariable("SUPABASE_KEY")
            ?? Environment.GetEnvironmentVariable("Supabase__ServiceRoleKey")
            ?? Environment.GetEnvironmentVariable("Supabase__Key")
            ?? Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");

        if (!string.IsNullOrWhiteSpace(key))
        {
            options.Key = key.Trim();
        }

        // 3. Resolve Target Bucket Name
        var bucket = section["Bucket"]
            ?? configuration["SUPABASE_BUCKET"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_BUCKET")
            ?? Environment.GetEnvironmentVariable("Supabase__Bucket");

        if (!string.IsNullOrWhiteSpace(bucket))
        {
            options.Bucket = bucket.Trim();
        }

        return options;
    }
}
