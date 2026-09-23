import { useTranslation } from 'react-i18next';
import { mergeClassNames } from '../../lib/classNames';

type FooterProps = {
  className?: string;
};

function Footer({ className }: FooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      className={mergeClassNames(
        'shrink-0 bg-app px-content-mobile pt-4 pb-4 md:px-content-tablet md:pt-3 md:pb-3 lg:px-content-desktop',
        className
      )}
    >
      <p className="text-xs text-muted text-center md:text-left">
        {t('footer.rights', { year })}
      </p>
    </footer>
  );
}

export default Footer;
