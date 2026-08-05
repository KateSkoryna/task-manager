import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { environment } from '../../environments/environment';

const firebaseApp = initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(firebaseApp);

if (!environment.production) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
