import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './authenticated-user';
import { FirebaseTokenGuard } from './firebase-token.guard';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly tokenGuard: FirebaseTokenGuard,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.tokenGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const firebaseUser = request.firebaseUser!;
    const profile = await this.authService.findByFirebaseUid(
      firebaseUser.firebaseUid
    );
    if (!profile) {
      throw new UnauthorizedException({ message: 'User profile not found' });
    }
    request.user = {
      id: profile.id,
      firebaseUid: firebaseUser.firebaseUid,
      email: firebaseUser.email,
    };
    if (request.params.userId && request.params.userId !== profile.id) {
      throw new ForbiddenException({ message: 'Forbidden' });
    }
    return true;
  }
}
