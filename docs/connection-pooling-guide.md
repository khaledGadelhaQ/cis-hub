# Database Connection Pooling Configuration Guide

## Environment Variables for Optimal Connection Pooling

Add these to your `.env` files:

```bash
# Primary Database Connection with Connection Pooling
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?connection_limit=20&pool_timeout=60000"

# Alternative: Separate Connection Pool Parameters
DB_CONNECTION_LIMIT=20
DB_POOL_TIMEOUT=60000
DB_STATEMENT_TIMEOUT=30000

# For Production: Consider connection pooling at infrastructure level
# DATABASE_URL="postgresql://username:password@pgbouncer-host:6432/database_name"
```

## Connection Pool Configuration Explanation

### `connection_limit=20`
- **What**: Maximum number of connections in the pool
- **Why**: Prevents database overload while maintaining performance
- **Calculation**: 
  - Formula: `(Number of CPU cores * 2) + Number of disks`
  - For most applications: 10-30 connections
  - For high-traffic: 50-100 connections

### `pool_timeout=60000` (60 seconds)
- **What**: Maximum time to wait for an available connection
- **Why**: Prevents indefinite waiting during traffic spikes
- **Best Practice**: 30-120 seconds depending on application

### Performance Benefits:
1. **Connection Reuse**: Eliminates overhead of creating/destroying connections
2. **Resource Management**: Prevents database connection exhaustion
3. **Consistent Performance**: Predictable response times under load
4. **Memory Efficiency**: Single PrismaClient instance uses less memory

## Monitoring Connection Pool Health

Use the PrismaService health check:
```typescript
// In any service
const isHealthy = await this.prismaService.healthCheck();
```

## Production Considerations

1. **PgBouncer**: Use for additional connection pooling layer
2. **Read Replicas**: Distribute read operations
3. **Connection Monitoring**: Track pool utilization
4. **Graceful Shutdown**: Ensure proper connection cleanup
