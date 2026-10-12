import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

/** Who is signed in. Phones only: the sidebar shows this on larger screens. */
function AccountSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="w-full space-y-4 rounded-card border border-default bg-surface p-5 shadow-card md:hidden">
      <h2 className="text-lg font-bold text-primary">
        {t('settings.account.title')}
      </h2>
      <div className="flex items-center gap-3">
        <div className="flex size-avatar shrink-0 items-center justify-center rounded-full bg-accent font-bold text-on-accent">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-bold text-primary">
            {user?.displayName}
          </p>
          <p className="truncate text-small text-muted">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}

export default AccountSection;
