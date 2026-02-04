import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsHeartbeatService {
  private readonly logger = new Logger(ClientsHeartbeatService.name);
  private readonly HEARTBEAT_TIMEOUT_SECONDS = 60; // Mark offline if no heartbeat for 60 seconds

  constructor(private prisma: PrismaService) {}

  /**
   * Runs every 30 seconds to check for stale clients
   * Marks clients as offline if they haven't sent a heartbeat in the last 60 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkStaleClients(): Promise<void> {
    try {
      const timeoutDate = new Date(
        Date.now() - this.HEARTBEAT_TIMEOUT_SECONDS * 1000,
      );

      // Find clients that are marked as online but haven't been seen recently
      const staleClients = await this.prisma.client.findMany({
        where: {
          isOnline: true,
          OR: [{ lastSeen: { lt: timeoutDate } }, { lastSeen: null }],
        },
      });

      if (staleClients.length > 0) {
        this.logger.log(
          `Found ${staleClients.length} stale clients, marking as offline`,
        );

        // Mark all stale clients as offline
        const result = await this.prisma.client.updateMany({
          where: {
            id: { in: staleClients.map((c) => c.id) },
          },
          data: {
            isOnline: false,
          },
        });

        this.logger.log(
          `Marked ${result.count} clients as offline due to timeout`,
        );
      }
    } catch (error) {
      this.logger.error('Error checking stale clients:', error);
    }
  }

  /**
   * Manual check for stale clients (can be called from API)
   */
  async manualCheckStaleClients(): Promise<number> {
    const timeoutDate = new Date(
      Date.now() - this.HEARTBEAT_TIMEOUT_SECONDS * 1000,
    );

    const result = await this.prisma.client.updateMany({
      where: {
        isOnline: true,
        OR: [{ lastSeen: { lt: timeoutDate } }, { lastSeen: null }],
      },
      data: {
        isOnline: false,
      },
    });

    return result.count;
  }
}
