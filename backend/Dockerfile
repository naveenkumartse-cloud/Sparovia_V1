# Multi-stage Dockerfile for Sparovia .NET 9 API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files first for efficient caching
COPY ["Sparovia.sln", "./"]
COPY ["src/Sparovia.Domain/Sparovia.Domain.csproj", "src/Sparovia.Domain/"]
COPY ["src/Sparovia.Application/Sparovia.Application.csproj", "src/Sparovia.Application/"]
COPY ["src/Sparovia.Infrastructure/Sparovia.Infrastructure.csproj", "src/Sparovia.Infrastructure/"]
COPY ["src/Sparovia.API/Sparovia.API.csproj", "src/Sparovia.API/"]
COPY ["tests/Sparovia.IntegrationTests/Sparovia.IntegrationTests.csproj", "tests/Sparovia.IntegrationTests/"]

RUN dotnet restore "src/Sparovia.API/Sparovia.API.csproj"

# Copy full source and build
COPY src/ src/
WORKDIR "/src/src/Sparovia.API"
RUN dotnet publish "Sparovia.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_EnableWriteXorExecute=0

# Install native dependencies required by graphics runtimes (SkiaSharp / libfontconfig)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
    libfreetype6 \
    libharfbuzz0b \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Sparovia.API.dll"]
