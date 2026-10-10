# Sparovia V1

Sparovia V1 is an advanced platform with a clean architecture .NET 9 backend and a Next.js frontend.

## Architecture

- **Frontend**: Next.js (React), Tailwind CSS, Framer Motion. Located in `frontend/`.
- **Backend**: .NET 9, Clean Architecture, Entity Framework Core, PostgreSQL. Located in `backend/`.

## Local Development Requirements

- Node.js 18+ (for frontend)
- .NET 9 SDK (for backend)
- PostgreSQL (or Supabase local development)

## Setup Instructions

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and adjust variables.
4. Run the development server: `npm run dev`
5. The application will be available at `http://localhost:3000`

### Backend
1. Navigate to the backend directory: `cd backend`
2. Copy `.env.example` to `.env` (or configure user secrets / appsettings.Development.json).
3. Ensure PostgreSQL is running and update the `DefaultConnection` string in `appsettings.json` or environment variables.
4. Create the initial database migration (if domain models are present): `dotnet ef migrations add InitialCreate --project Sparovia.Infrastructure --startup-project Sparovia.API`
5. Run the API: `dotnet run --project Sparovia.API`
6. The API health check is available at `http://localhost:5000/api/v1/health` (port may vary based on launchSettings.json).

## Testing

### Backend
To run unit and integration tests:
```bash
cd backend
dotnet test
```

## Conventions

- **Clean Architecture**: Domain depends on nothing. Application depends on Domain. Infrastructure and API depend on Application.
- **REST API**: All endpoints should follow RESTful conventions under `/api/v1`.
- **Global Error Handling**: Unhandled exceptions are caught by global middleware, returning standard error structures.
- **Tenant Isolation**: Object storage and database records must consider tenant context (to be implemented in security phase).

## Documentation

Sparovia V1 canonical source-of-truth documentation is organized under `docs/`:

| Document | Responsibility |
|---|---|
| [`docs/DESIGN.md`](docs/DESIGN.md) | Canonical visual design system authority for Sparovia brand and platform UI (Editorial Cobalt palette, Inter typography, surfaces, borders, radii, and accessibility targets). |
| [`docs/BUILD_IMAGE_STUDIO_REBUILD.md`](docs/BUILD_IMAGE_STUDIO_REBUILD.md) | Canonical implementation prompt and specification for the Image Quality Studio rebuild (adaptive deterministic enhancements, before/after comparison, lifecycle, and publishing boundaries). |
| [`docs/PILOT_V1_PRODUCT_SPECIFICATION.md`](docs/PILOT_V1_PRODUCT_SPECIFICATION.md) | Canonical product specification defining Pilot V1 scope, business context, AI assistance boundaries, and invariants. |
| [`docs/PILOT_V1_DOMAIN_DATA_MODEL.md`](docs/PILOT_V1_DOMAIN_DATA_MODEL.md) | Canonical domain entities, relationships, invariants, and aggregate lifecycle constraints. |
| [`docs/PILOT_V1_API_SPECIFICATION.md`](docs/PILOT_V1_API_SPECIFICATION.md) | Canonical REST API contracts, DTO schemas, and authorization requirements. |
| [`docs/PILOT_V1_UX_SCREEN_SPECIFICATION.md`](docs/PILOT_V1_UX_SCREEN_SPECIFICATION.md) | Canonical user journeys, screen structures, interaction states, and feedback patterns. |
| [`docs/PILOT_V1_IMPLEMENTATION_PLAN.md`](docs/PILOT_V1_IMPLEMENTATION_PLAN.md) | Canonical phased engineering roadmap, module dependencies, test strategy, and Definition of Done. |

*(Historical note: Legacy specifications `PILOT_V1_SPAROVIA_THEME.md` and `PILOT_V1_AI_IMAGE_SPECIFICATION.md` have been retired and superseded by `docs/DESIGN.md` and `docs/BUILD_IMAGE_STUDIO_REBUILD.md` respectively.)*
