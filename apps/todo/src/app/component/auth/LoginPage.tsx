import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/apiClient';
import { provisionUserFetcher } from '../../fetchers/auth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import womanImage from '../../../assets/woman.webp';
import Checkbox from '../elements/Checkbox';
import Button from '../elements/Button';
import AuthLayout from './AuthLayout';
import {
  AUTH_INPUT_CLASS as INPUT_CLASS,
  AUTH_PASSWORD_INPUT_CLASS as PASSWORD_INPUT_CLASS,
} from './authInputClasses';

// Fixed Google brand colors — exempt from the semantic token system per
// guideline §4.6/§5.2; do not replace with theme tokens.
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginPage() {
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setIsPending(true);
    try {
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(
        auth,
        formData.get('email') as string,
        formData.get('password') as string
      );
      navigate('/');
    } catch {
      setError(t('auth.login.error'));
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsPending(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      try {
        await apiClient.get('/auth/user');
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'response' in err &&
          (err as { response?: { status?: number } }).response?.status === 401
        ) {
          const { displayName, email } = credential.user;
          const firstName = displayName?.split(' ')[0] ?? '';
          const lastName = displayName?.split(' ').slice(1).join(' ') ?? '';
          const username = (email ?? '').split('@')[0];
          const user = await provisionUserFetcher(
            firstName,
            lastName,
            username
          );
          setUser(user);
        }
      }
      navigate('/');
    } catch {
      setError(t('auth.login.googleError'));
    } finally {
      setIsPending(false);
    }
  };

  const illustration = (
    <div className="hidden md:flex w-1/2 bg-white items-center justify-center overflow-hidden">
      <img
        src={womanImage}
        alt="Woman with phone illustration"
        className="object-contain h-4/5 w-4/5"
      />
    </div>
  );

  return (
    <AuthLayout illustration={illustration} illustrationSide="right">
      <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-surface">
        <h1 className="text-3xl font-bold text-primary mb-8">
          {t('auth.login.title')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.login.emailPlaceholder')}
              required
              className={INPUT_CLASS}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.login.passwordPlaceholder')}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={PASSWORD_INPUT_CLASS}
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onChange={setRememberMe}
            label={t('auth.login.rememberMe')}
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? t('auth.login.signingIn') : t('auth.login.button')}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
            disabled={isPending}
            className="w-full text-sm"
          >
            <GoogleIcon />
            {t('auth.login.continueWithGoogle')}
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted">
          {t('auth.login.noAccount')}{' '}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            {t('auth.login.createOne')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
