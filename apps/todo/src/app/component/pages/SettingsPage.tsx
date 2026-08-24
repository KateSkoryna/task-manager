import { useTranslation } from 'react-i18next';
import { usePreferences } from '../../hooks/usePreferences';
import ContentSkeleton from '../elements/ContentSkeleton';
import ErrorFallback from '../elements/ErrorFallback';
import AppearanceSection from '../settings/AppearanceSection';
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
    <div className="space-y-10">
      <AppearanceSection />
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
