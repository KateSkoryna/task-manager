import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatsPeriod } from '@shared/types';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StatsPeriodPipe } from './stats-period.pipe';
import { UserService } from './user.service';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users/:userId/stats')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get todo statistics' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        pending: { type: 'number' },
        completionRate: { type: 'number' },
      },
    },
  })
  getStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period', StatsPeriodPipe) period: StatsPeriod
  ) {
    return this.userService.getStats(user.id, period);
  }
}
