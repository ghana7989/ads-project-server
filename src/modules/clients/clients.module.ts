import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsHeartbeatService } from './clients-heartbeat.service';
import { ClientsController } from './clients.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientsHeartbeatService],
  exports: [ClientsService],
})
export class ClientsModule {}
