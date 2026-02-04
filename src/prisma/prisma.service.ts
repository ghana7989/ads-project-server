import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
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
    // Create PostgreSQL connection pool with SSL enabled
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for cloud-hosted databases like Render
      },
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);

    // Initialize PrismaClient with adapter
    super({
      adapter,
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
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}
