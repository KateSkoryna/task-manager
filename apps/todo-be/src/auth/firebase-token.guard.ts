import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from '../integrations/firebase/firebase.constants';
import { AuthenticatedRequest } from './authenticated-user';

@Injectable()
export class FirebaseTokenGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: typeof admin
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: 'Authorization token required',
      });
    }
    try {
      const decoded = await this.firebase.auth().verifyIdToken(header.slice(7));
      request.firebaseUser = {
        firebaseUid: decoded.uid,
        email: decoded.email ?? '',
      };
      return true;
    } catch {
      throw new UnauthorizedException({ message: 'Invalid or expired token' });
    }
  }
}
