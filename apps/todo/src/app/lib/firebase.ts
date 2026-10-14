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

// In development the auth emulator runs on the developer's machine. A phone
// opening the app through a tunnel cannot reach 127.0.0.1, so there the
// requests go to the page's own address, which the dev server proxies.
const isLocalBrowser = ['localhost', '127.0.0.1'].includes(
  window.location.hostname
);

if (!environment.production) {
  connectAuthEmulator(
    auth,
    isLocalBrowser ? 'http://127.0.0.1:9099' : window.location.origin,
    { disableWarnings: true }
  );
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
