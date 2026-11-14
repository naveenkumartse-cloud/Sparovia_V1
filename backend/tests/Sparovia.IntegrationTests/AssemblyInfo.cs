using Xunit;

// Integration tests share a database instance (PostgreSQL sparovia_dev).
// Disabling parallelization across test classes ensures deterministic test isolation
// and prevents concurrent database race conditions.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
