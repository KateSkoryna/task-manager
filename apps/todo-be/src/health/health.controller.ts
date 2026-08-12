import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Connection } from 'mongoose';

const CONNECTION_STATE_LABELS = [
  'disconnected',
  'connected',
  'connecting',
  'disconnecting',
] as const;

function connectionStateLabel(state: number): string {
  return CONNECTION_STATE_LABELS[state] ?? 'unknown';
}

@ApiExcludeController()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  ready(): { status: 'ok'; mongo: string } {
    const mongo = connectionStateLabel(this.connection.readyState);
    if (this.connection.readyState !== 1) {
      throw new ServiceUnavailableException({ status: 'not ready', mongo });
    }
    return { status: 'ok', mongo };
  }
}
