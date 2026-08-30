import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 bg-app px-content-mobile pt-4 pb-4 md:px-content-tablet md:pt-2 md:pb-4 lg:px-content-desktop">
      <p className="text-xs text-muted text-center md:text-left">
        {t('footer.rights', { year })}
      </p>
    </footer>
  );
}

export default Footer;
