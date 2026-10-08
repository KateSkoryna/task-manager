import { useTranslation } from 'react-i18next';
import { useAfterDelay } from '../../hooks/useAfterDelay';

// The free-tier server sleeps when idle; a quick sign-in never shows this.
const SLOW_AFTER_MS = 4000;

function SlowServerNotice({ pending }: { pending: boolean }) {
  const { t } = useTranslation();
  const isSlow = useAfterDelay(pending, SLOW_AFTER_MS);

  return (
    <p role="status" className="mt-3 text-sm text-muted">
      {pending && isSlow ? t('auth.slowServer') : null}
    </p>
  );
}

export default SlowServerNotice;
