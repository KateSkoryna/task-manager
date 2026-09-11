import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 bg-app px-content-mobile pt-2 pb-2 md:px-content-tablet md:pt-1 md:pb-1 lg:px-content-desktop">
      <p className="text-xs text-muted text-center md:text-left">
        {t('footer.rights', { year })}
      </p>
    </footer>
  );
}

export default Footer;
