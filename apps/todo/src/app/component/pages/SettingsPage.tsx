import { useTranslation } from 'react-i18next';

function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-dark-bg">{t('settings.title')}</h1>
      <p className="text-secondary-dark-bg">{t('settings.comingSoon')}</p>
    </div>
  );
}

export default SettingsPage;
