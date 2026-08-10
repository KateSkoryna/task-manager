import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentFirebaseUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, FirebasePrincipal } from './authenticated-user';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseTokenGuard } from './firebase-token.guard';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('user')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUser(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.authService.findById(user.id);
    if (!profile) throw new NotFoundException({ message: 'User not found' });
    return profile;
  }

  @Post('provision')
  @UseGuards(FirebaseTokenGuard)
  @ApiOperation({ summary: 'Create or link a user profile' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiResponse({ status: 201, description: 'Provisioned user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  provision(
    @Body() body: { firstName?: string; lastName?: string; username?: string },
    @CurrentFirebaseUser() firebaseUser: FirebasePrincipal
  ) {
    return this.authService.provision(
      firebaseUser.firebaseUid,
      firebaseUser.email,
      body
    );
  }
}
