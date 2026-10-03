using System.Text.Json;
using System.Text.RegularExpressions;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.WebsiteContent;

public static class WebsiteTemplateRegistry
{
    public const string DefaultTemplateId = "kvn-interiors-v1";

    public class WebsiteTemplateDefinition
    {
        public required string TemplateId { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        public List<WebsiteSectionSchemaDto> Sections { get; set; } = new();
    }

    private static readonly Dictionary<string, WebsiteTemplateDefinition> Templates = new()
    {
        ["kvn-interiors-v1"] = CreateKvnInteriorsTemplate(),
        ["standard-business-v1"] = CreateStandardBusinessTemplate()
    };

    public static string NormalizeSectionKey(string sectionKey)
    {
        return sectionKey.ToLowerInvariant() switch
        {
            "brandintro" or "brand-intro" => "about",
            "interiors" or "services" => "services",
            "whyus" or "why_us" or "why-us" or "whychooseus" or "why-choose-us" => "why-choose-us",
            "gallery" or "projectgallery" or "portfolio" or "ourwork" or "our_work" or "our-work" => "our-work",
            "faqs" or "faq" => "faq",
            "contact" => "contact",
            "footer" => "footer",
            _ => sectionKey
        };
    }

    public static WebsiteTemplateDefinition GetTemplate(string? templateId)
    {
        if (string.IsNullOrWhiteSpace(templateId) || !Templates.TryGetValue(templateId, out var template))
        {
            return Templates[DefaultTemplateId];
        }
        return template;
    }

    public static WebsiteSectionSchemaDto? GetSectionSchema(string? templateId, string sectionKey)
    {
        var template = GetTemplate(templateId);
        var normalizedKey = NormalizeSectionKey(sectionKey);
        return template.Sections.FirstOrDefault(s => s.SectionKey.Equals(normalizedKey, StringComparison.OrdinalIgnoreCase));
    }

    private static WebsiteTemplateDefinition CreateKvnInteriorsTemplate()
    {
        return new WebsiteTemplateDefinition
        {
            TemplateId = "kvn-interiors-v1",
            Name = "Architectural Interiors & UPVC Solutions",
            Description = "Tailored for bespoke interior design, modular casework, and architectural window systems.",
            Sections = new List<WebsiteSectionSchemaDto>
            {
                new()
                {
                    SectionKey = "hero",
                    DisplayName = "Hero Section",
                    Description = "Top billboard introducing your core value proposition and primary action buttons.",
                    IconName = "Sparkles",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Short category or status phrase rendered above the headline.", Placeholder = "e.g., HOME INTERIORS • uPVC WINDOWS" },
                        new() { Key = "headline", Label = "Main Headline", Type = "text", Required = true, MaxLength = 200, Tooltip = "The primary high-impact headline displayed at the top of your landing page.", Placeholder = "e.g., Transform Your Space." },
                        new() { Key = "subheadline", Label = "Subheadline", Type = "textarea", MaxLength = 500, Tooltip = "Supporting narrative clarifying your unique capability and offering.", Placeholder = "e.g., Crafting modern residential transformations..." },
                        new() { Key = "primaryCta", Label = "Primary CTA Label", Type = "text", MaxLength = 50, Tooltip = "Text displayed on the primary action button.", Placeholder = "e.g., Get a Quote" },
                        new() { Key = "secondaryCta", Label = "Secondary CTA Label", Type = "text", MaxLength = 50, Tooltip = "Text displayed on the secondary action button.", Placeholder = "e.g., Explore Our Work" },
                        new() { Key = "heroImage", Label = "Hero Background Image", Type = "image", MaxLength = 500, Tooltip = "URL of the primary hero background image." }
                    }
                },
                new()
                {
                    SectionKey = "about",
                    DisplayName = "About",
                    Description = "Executive positioning and heritage story explaining your company values and expertise.",
                    IconName = "ShieldCheck",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "badge", Label = "Badge Label", Type = "text", MaxLength = 100, Tooltip = "Badge tag displayed above the section title.", Placeholder = "e.g., Craftsmanship & Quality" },
                        new() { Key = "title", Label = "Section Title", Type = "text", Required = true, MaxLength = 200, Tooltip = "The bold section title introducing your company story.", Placeholder = "e.g., Crafting Spaces That Reflect You" },
                        new() { Key = "description", Label = "Story Narrative", Type = "textarea", MaxLength = 1000, Tooltip = "Detailed narrative paragraph explaining your mission and approach.", Placeholder = "e.g., We focus on delivering real residential projects with pristine craftsmanship..." },
                        new() { Key = "pillars", Label = "Key Highlights", Type = "list", Tooltip = "Bullet points highlighting core competencies, standards, or certifications." },
                        new() { Key = "primaryImage", Label = "Primary Feature Image", Type = "image", MaxLength = 500, Tooltip = "URL of the primary project image." },
                        new() { Key = "secondaryImage", Label = "Secondary Accent Image", Type = "image", MaxLength = 500, Tooltip = "URL of the secondary project image." }
                    }
                },
                new()
                {
                    SectionKey = "services",
                    DisplayName = "Services",
                    Description = "Bespoke service offerings, key spaces, and custom modular solutions.",
                    IconName = "Layers",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Section category tag.", Placeholder = "e.g., INTERIORS" },
                        new() { Key = "heading", Label = "Section Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Main heading for the services section.", Placeholder = "e.g., Designed around the way you live." },
                        new() { Key = "description", Label = "Section Description", Type = "textarea", MaxLength = 500, Tooltip = "Overview description of solutions and craftsmanship." },
                        new()
                        {
                            Key = "categories",
                            Label = "Service Offerings",
                            Type = "items",
                            Tooltip = "Individual service offerings rendered as alternating storytelling cards.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "id", Label = "Identifier", Type = "text", MaxLength = 50 },
                                new() { Key = "index", Label = "Index", Type = "text", MaxLength = 10 },
                                new() { Key = "name", Label = "Service Name", Type = "text", Required = true, MaxLength = 100 },
                                new() { Key = "tagline", Label = "Tagline", Type = "text", MaxLength = 150 },
                                new() { Key = "description", Label = "Description", Type = "textarea", MaxLength = 500 },
                                new() { Key = "image", Label = "Service Image", Type = "image", MaxLength = 500 }
                            }
                        }
                    }
                },
                new()
                {
                    SectionKey = "why-choose-us",
                    DisplayName = "Why Choose Us",
                    Description = "Strategic value pillars, operational guarantees, and competitive differentiators.",
                    IconName = "Award",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Section category tag.", Placeholder = "e.g., WHY CHOOSE US" },
                        new() { Key = "heading", Label = "Section Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Main heading for the why choose us section.", Placeholder = "e.g., Built on trust and real experience." },
                        new() { Key = "description", Label = "Section Description", Type = "textarea", MaxLength = 500, Tooltip = "Supporting overview text." },
                        new()
                        {
                            Key = "items",
                            Label = "Value Pillars",
                            Type = "items",
                            Tooltip = "Core competitive advantages and commitments.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "index", Label = "Index", Type = "text", MaxLength = 10 },
                                new() { Key = "title", Label = "Pillar Title", Type = "text", Required = true, MaxLength = 100 },
                                new() { Key = "description", Label = "Description", Type = "textarea", MaxLength = 500 }
                            }
                        }
                    }
                },
                new()
                {
                    SectionKey = "our-work",
                    DisplayName = "Our Work",
                    Description = "Curated architectural portfolio showcasing completed commercial and residential projects.",
                    IconName = "Eye",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Section category tag.", Placeholder = "e.g., OUR WORK" },
                        new() { Key = "heading", Label = "Section Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Main heading for the work portfolio.", Placeholder = "e.g., Spaces brought to life." },
                        new() { Key = "description", Label = "Section Description", Type = "textarea", MaxLength = 500, Tooltip = "Introductory note on craftsmanship." },
                        new() { Key = "categories", Label = "Filter Categories", Type = "list", Tooltip = "Categories displayed in the portfolio filter bar (e.g., All, Kitchens, Wardrobes)." },
                        new()
                        {
                            Key = "items",
                            Label = "Gallery Projects",
                            Type = "items",
                            Tooltip = "Project items in portfolio.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "id", Label = "Identifier", Type = "text", MaxLength = 50 },
                                new() { Key = "title", Label = "Project Title", Type = "text", MaxLength = 100 },
                                new() { Key = "image", Label = "Image URL", Type = "image", MaxLength = 500 },
                                new() { Key = "category", Label = "Category", Type = "text", MaxLength = 50 },
                                new() { Key = "span", Label = "Grid Span", Type = "text", MaxLength = 20 }
                            }
                        }
                    }
                },
                new()
                {
                    SectionKey = "testimonials",
                    DisplayName = "Testimonials",
                    Description = "Verified testimonials and endorsements from homeowners and corporate clients.",
                    IconName = "Quote",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "enabled", Label = "Section Enabled", Type = "boolean", Tooltip = "Display testimonials on public landing page." },
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Section category tag.", Placeholder = "e.g., CLIENT FEEDBACK" },
                        new() { Key = "heading", Label = "Section Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Main heading for testimonials.", Placeholder = "e.g., Client Experiences" },
                        new()
                        {
                            Key = "list",
                            Label = "Client Reviews",
                            Type = "items",
                            Tooltip = "Client testimonials with author attribution.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "quote", Label = "Client Quote", Type = "textarea", Required = true, MaxLength = 500 },
                                new() { Key = "author", Label = "Client Name", Type = "text", Required = true, MaxLength = 100 },
                                new() { Key = "location", Label = "Role / Location", Type = "text", MaxLength = 100 }
                            }
                        },
                        new()
                        {
                            Key = "testimonials",
                            Label = "Testimonials",
                            Type = "items",
                            Tooltip = "Client testimonials with author attribution.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "quote", Label = "Client Quote", Type = "textarea", Required = true, MaxLength = 500 },
                                new() { Key = "author", Label = "Client Name", Type = "text", Required = true, MaxLength = 100 },
                                new() { Key = "project", Label = "Role / Project", Type = "text", MaxLength = 100 }
                            }
                        }
                    }
                },
                new()
                {
                    SectionKey = "faq",
                    DisplayName = "FAQ",
                    Description = "Authoritative answers to common questions regarding process, warranties, and timelines.",
                    IconName = "MessageSquare",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Section category tag.", Placeholder = "e.g., FREQUENTLY ASKED QUESTIONS" },
                        new() { Key = "heading", Label = "Section Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Main heading for FAQ.", Placeholder = "e.g., Clear answers to common questions." },
                        new()
                        {
                            Key = "list",
                            Label = "Questions & Answers",
                            Type = "items",
                            Tooltip = "Questions and detailed answers rendered in the interactive accordion.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "question", Label = "Question", Type = "text", Required = true, MaxLength = 200 },
                                new() { Key = "answer", Label = "Answer", Type = "textarea", Required = true, MaxLength = 1000 }
                            }
                        },
                        new()
                        {
                            Key = "faqs",
                            Label = "FAQ Items",
                            Type = "items",
                            Tooltip = "Questions and detailed answers rendered in the interactive accordion.",
                            ItemFields = new List<SubFieldSchemaDto>
                            {
                                new() { Key = "question", Label = "Question", Type = "text", Required = true, MaxLength = 200 },
                                new() { Key = "answer", Label = "Answer", Type = "textarea", Required = true, MaxLength = 1000 }
                            }
                        }
                    }
                },
                new()
                {
                    SectionKey = "contact",
                    DisplayName = "Contact",
                    Description = "Contact intro and call-to-action details for prospective clients.",
                    IconName = "Phone",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Eyebrow Tag", Type = "text", MaxLength = 100, Tooltip = "Section category tag.", Placeholder = "e.g., GET IN TOUCH" },
                        new() { Key = "heading", Label = "Section Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Main heading for the contact section.", Placeholder = "e.g., Let's Discuss Your Project." },
                        new() { Key = "description", Label = "Section Description", Type = "textarea", MaxLength = 500, Tooltip = "Supporting invitation explaining next steps.", Placeholder = "e.g., Reach out to schedule an initial design consultation..." },
                        new() { Key = "ctaLabel", Label = "Submit Button Label", Type = "text", MaxLength = 50, Tooltip = "Text displayed on the contact form button.", Placeholder = "e.g., Request Consultation" }
                    }
                },
                new()
                {
                    SectionKey = "footer",
                    DisplayName = "Footer",
                    Description = "Website footer brand statement, copyright text, and secondary details.",
                    IconName = "FileText",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "shortDescription", Label = "Brand Summary", Type = "textarea", MaxLength = 300, Tooltip = "Brief brand summary displayed in the footer column.", Placeholder = "e.g., Transforming residential spaces with bespoke interiors..." },
                        new() { Key = "copyrightText", Label = "Copyright Text", Type = "text", MaxLength = 150, Tooltip = "Copyright disclaimer line at the bottom of the page.", Placeholder = "e.g., All rights reserved." }
                    }
                }
            }
        };
    }

    private static WebsiteTemplateDefinition CreateStandardBusinessTemplate()
    {
        return new WebsiteTemplateDefinition
        {
            TemplateId = "standard-business-v1",
            Name = "Standard Business Presence",
            Description = "Universal professional layout for service businesses, consultancies, and commercial contractors.",
            Sections = new List<WebsiteSectionSchemaDto>
            {
                new()
                {
                    SectionKey = "hero",
                    DisplayName = "Hero Section",
                    Description = "High impact introduction to your business capabilities and call to action.",
                    IconName = "Sparkles",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "eyebrow", Label = "Category Tag", Type = "text", MaxLength = 100, Tooltip = "Business specialization or status tagline." },
                        new() { Key = "headline", Label = "Headline", Type = "text", Required = true, MaxLength = 200, Tooltip = "Primary business statement." },
                        new() { Key = "subheadline", Label = "Subheadline", Type = "textarea", MaxLength = 500, Tooltip = "Supporting description of your work." },
                        new() { Key = "primaryCta", Label = "Primary Button", Type = "text", MaxLength = 50, Tooltip = "Primary call to action button text." }
                    }
                },
                new()
                {
                    SectionKey = "about",
                    DisplayName = "About Us",
                    Description = "Detailed background, operational philosophy, and core achievements.",
                    IconName = "ShieldCheck",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "title", Label = "Title", Type = "text", Required = true, MaxLength = 200, Tooltip = "Section header." },
                        new() { Key = "description", Label = "Company Story", Type = "textarea", MaxLength = 1000, Tooltip = "Narrative describing company background and value." }
                    }
                },
                new()
                {
                    SectionKey = "services",
                    DisplayName = "Our Services",
                    Description = "Structured overview of primary offerings and deliverables.",
                    IconName = "Layers",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "heading", Label = "Heading", Type = "text", Required = true, MaxLength = 200, Tooltip = "Header for services section." },
                        new() { Key = "description", Label = "Description", Type = "textarea", MaxLength = 500, Tooltip = "Introductory text for services." }
                    }
                },
                new()
                {
                    SectionKey = "why-choose-us",
                    DisplayName = "Why Choose Us",
                    Description = "Key differentiators, certifications, and customer guarantees.",
                    IconName = "Award",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "heading", Label = "Heading", Type = "text", Required = true, MaxLength = 200 },
                        new() { Key = "description", Label = "Description", Type = "textarea", MaxLength = 500 }
                    }
                },
                new()
                {
                    SectionKey = "our-work",
                    DisplayName = "Our Work",
                    Description = "Curated showcase of completed works and project portfolio.",
                    IconName = "Eye",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "heading", Label = "Heading", Type = "text", Required = true, MaxLength = 200 },
                        new() { Key = "description", Label = "Description", Type = "textarea", MaxLength = 500 }
                    }
                },
                new()
                {
                    SectionKey = "testimonials",
                    DisplayName = "Testimonials",
                    Description = "Social proof, endorsements, and customer reviews.",
                    IconName = "Quote",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "heading", Label = "Heading", Type = "text", Required = true, MaxLength = 200 }
                    }
                },
                new()
                {
                    SectionKey = "faq",
                    DisplayName = "FAQ",
                    Description = "Frequently asked questions and direct answers.",
                    IconName = "MessageSquare",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "heading", Label = "Heading", Type = "text", Required = true, MaxLength = 200 }
                    }
                },
                new()
                {
                    SectionKey = "contact",
                    DisplayName = "Contact",
                    Description = "Inquiry introduction and CTA.",
                    IconName = "Phone",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "heading", Label = "Heading", Type = "text", Required = true, MaxLength = 200 }
                    }
                },
                new()
                {
                    SectionKey = "footer",
                    DisplayName = "Footer",
                    Description = "Footer brand statement and copyright line.",
                    IconName = "FileText",
                    Fields = new List<SectionFieldSchemaDto>
                    {
                        new() { Key = "shortDescription", Label = "Description", Type = "textarea", MaxLength = 300 }
                    }
                }
            }
        };
    }

    public static string? ValidateSectionFields(string? templateId, string sectionKey, JsonElement fields)
    {
        if (fields.ValueKind != JsonValueKind.Object)
        {
            return "Payload must be a JSON object.";
        }

        var jsonText = fields.GetRawText();
        var unescapedText = Regex.Unescape(jsonText);
        if (Regex.IsMatch(jsonText, @"<\s*script\b", RegexOptions.IgnoreCase) ||
            Regex.IsMatch(unescapedText, @"<\s*script\b", RegexOptions.IgnoreCase) ||
            Regex.IsMatch(unescapedText, @"javascript:", RegexOptions.IgnoreCase))
        {
            return "HTML scripts and unsafe tags are not allowed.";
        }

        var normalizedKey = NormalizeSectionKey(sectionKey);
        var schema = GetSectionSchema(templateId, normalizedKey);
        if (schema == null)
        {
            return $"Section '{sectionKey}' is not supported by this website template.";
        }

        var allowedKeys = schema.Fields.Select(f => f.Key).ToHashSet();

        foreach (var prop in fields.EnumerateObject())
        {
            if (!allowedKeys.Contains(prop.Name))
            {
                return $"Field '{prop.Name}' is not supported for section '{sectionKey}'.";
            }

            var fieldDef = schema.Fields.First(f => f.Key == prop.Name);
            if (fieldDef.MaxLength.HasValue && prop.Value.ValueKind == JsonValueKind.String)
            {
                var str = prop.Value.GetString() ?? "";
                if (str.Length > fieldDef.MaxLength.Value)
                {
                    return $"Field '{prop.Name}' exceeds maximum length of {fieldDef.MaxLength.Value} characters.";
                }
            }
        }

        return null;
    }
}
