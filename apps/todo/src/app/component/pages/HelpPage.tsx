import { useTranslation } from 'react-i18next';

function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 pt-6">
      <p className="text-muted">{t('help.comingSoon')}</p>
    </div>
  );
}

export default HelpPage;
