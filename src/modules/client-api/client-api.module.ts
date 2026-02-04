import { Module } from '@nestjs/common';
import { ClientApiService } from './client-api.service';
import { ClientApiController } from './client-api.controller';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [ClientsModule],
  controllers: [ClientApiController],
  providers: [ClientApiService],
})
export class ClientApiModule {}
