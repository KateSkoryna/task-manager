import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth } from '../../lib/firebase';
import Input from '../elements/Input';
import Button from '../elements/Button';

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setIsPending(true);
    try {
      await sendPasswordResetEmail(auth, formData.get('email') as string);
      setSubmitted(true);
    } catch {
      setError(t('auth.forgotPassword.error'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center py-8 px-4">
      <div className="bg-surface rounded-lg shadow-menu border border-default p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">
          {t('auth.forgotPassword.title')}
        </h1>

        {submitted ? (
          <div className="text-center space-y-4">
            <p className="text-primary">
              {t('auth.forgotPassword.successMessage')}
            </p>
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline text-sm"
            >
              {t('auth.forgotPassword.backToSignIn')}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-muted text-sm mb-6 text-center">
              {t('auth.forgotPassword.description')}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="w-full"
              >
                {isPending
                  ? t('auth.forgotPassword.sending')
                  : t('auth.forgotPassword.sendButton')}
              </Button>
            </form>

            <p className="mt-4 text-center text-primary text-sm">
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                {t('auth.forgotPassword.backToSignIn')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
