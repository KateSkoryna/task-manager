import { useTranslation } from 'react-i18next';
import { usePreferences } from '../../hooks/usePreferences';
import ContentSkeleton from '../elements/ContentSkeleton';
import ErrorFallback from '../elements/ErrorFallback';
import PreferencesForm from '../settings/PreferencesForm';

function SettingsPage() {
  const { t } = useTranslation();
  const {
    preferences,
    isLoading,
    isError,
    error,
    refetch,
    updatePreferences,
    isUpdating,
  } = usePreferences();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-bg">{t('settings.title')}</h1>
      {isLoading && <ContentSkeleton />}
      {!isLoading && isError && (
        <ErrorFallback
          error={error ?? new Error(t('settings.loadError'))}
          resetErrorBoundary={refetch}
        />
      )}
      {!isLoading && !isError && preferences && (
        <PreferencesForm
          preferences={preferences}
          isSaving={isUpdating}
          onSave={updatePreferences}
        />
      )}
    </div>
  );
}

export default SettingsPage;
