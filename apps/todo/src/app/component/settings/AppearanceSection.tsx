import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../../hooks/useTheme';
import SegmentedControl from '../elements/SegmentedControl';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'uk', label: 'Українська' },
];

function AppearanceSection() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const currentLanguage =
    LANGUAGES.find((language) => i18n.language.startsWith(language.code))
      ?.code ?? 'en';

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-lg font-bold text-primary">
        {t('settings.appearance.title')}
      </h2>

      <div className="flex flex-col gap-1">
        <span className="text-primary font-medium">
          {t('settings.appearance.theme')}
        </span>
        <SegmentedControl<Theme>
          ariaLabel={t('settings.appearance.theme')}
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: t('settings.appearance.themeLight') },
            { value: 'dark', label: t('settings.appearance.themeDark') },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-primary font-medium">
          {t('settings.appearance.language')}
        </span>
        <SegmentedControl
          ariaLabel={t('settings.appearance.language')}
          value={currentLanguage}
          onChange={(code) => i18n.changeLanguage(code)}
          options={LANGUAGES.map(({ code, label }) => ({
            value: code,
            label,
          }))}
        />
      </div>
    </div>
  );
}

export default AppearanceSection;
