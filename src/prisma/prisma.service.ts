import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    // Parse DATABASE_URL and ensure SSL is configured correctly
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Determine if SSL should be used (typically for cloud-hosted databases)
    // If DATABASE_URL contains sslmode=require or we're in production, use SSL
    const useSSL =
      databaseUrl.includes('sslmode=require') ||
      databaseUrl.includes('render.com') ||
      process.env.NODE_ENV === 'production';

    // Create PostgreSQL connection pool with SSL enabled
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: useSSL
        ? {
            rejectUnauthorized: false, // Accept self-signed certificates
          }
        : false, // No SSL for local development
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);

    // Initialize PrismaClient with adapter
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');

      // Test database connection with a simple query
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database connection verified');
    } catch (error) {
      this.logger.error('❌ Database connection failed');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(
        `Database URL (masked): ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`,
      );

      // Don't throw the error in production to prevent app crash
      // The app will still start but database operations will fail
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}
