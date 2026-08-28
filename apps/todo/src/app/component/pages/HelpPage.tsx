import { useTranslation } from 'react-i18next';

function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-primary">{t('help.title')}</h1>
      <p className="text-muted">{t('help.comingSoon')}</p>
    </div>
  );
}

export default HelpPage;
