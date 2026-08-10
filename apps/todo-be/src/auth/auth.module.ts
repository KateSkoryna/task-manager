import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_MODEL_NAME, userSchema } from '../app/models/user.model';
import { FirebaseModule } from '../integrations/firebase/firebase.module';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseTokenGuard } from './firebase-token.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    FirebaseModule,
    MongooseModule.forFeature([{ name: USER_MODEL_NAME, schema: userSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseTokenGuard, FirebaseAuthGuard],
  exports: [AuthService, FirebaseTokenGuard, FirebaseAuthGuard],
})
export class AuthModule {}
