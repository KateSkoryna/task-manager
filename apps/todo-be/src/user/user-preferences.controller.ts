import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  UserPreferencesUpdate,
  userPreferencesUpdateSchema,
} from '@shared/types';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { zodToApiSchema } from '../common/openapi/zod-schema';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserPreferencesService } from './user-preferences.service';

@ApiTags('preferences')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users/:userId/preferences')
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user preferences' })
  @ApiParam({ name: 'userId' })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  async get(@CurrentUser() user: AuthenticatedUser) {
    const preferences = await this.preferencesService.findByUserId(user.id);
    if (!preferences) {
      throw new NotFoundException({ message: 'User not found' });
    }
    return preferences;
  }

  @Patch()
  @ApiOperation({ summary: 'Update the authenticated user preferences' })
  @ApiParam({ name: 'userId' })
  @ApiBody({ schema: zodToApiSchema(userPreferencesUpdateSchema) })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(userPreferencesUpdateSchema))
    body: UserPreferencesUpdate
  ) {
    const preferences = await this.preferencesService.update(user.id, body);
    if (!preferences) {
      throw new NotFoundException({ message: 'User not found' });
    }
    return preferences;
  }
}
