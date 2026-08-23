import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  MAX_DELIVERY_HOUR,
  MIN_DELIVERY_HOUR,
  REPORT_CADENCES,
  REPORT_TONES,
  ReportCadence,
  ReportTone,
  UserPreferences,
  UserPreferencesUpdate,
  detectTimezone,
  userPreferencesUpdateSchema,
} from '@shared/types';
import Button from '../elements/Button';
import Checkbox from '../elements/Checkbox';
import Dropdown, { DropdownOption } from '../elements/Dropdown';
import TimezoneField from './TimezoneField';

type SaveOptions = {
  onSuccess?: () => void;
  onError?: () => void;
};

type Props = {
  preferences: UserPreferences;
  isSaving: boolean;
  onSave: (updates: UserPreferencesUpdate, options?: SaveOptions) => void;
};

const HOURS = Array.from(
  { length: MAX_DELIVERY_HOUR - MIN_DELIVERY_HOUR + 1 },
  (_, i) => i + MIN_DELIVERY_HOUR
);

function PreferencesForm({ preferences, isSaving, onSave }: Props) {
  const { t, i18n } = useTranslation();
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserPreferencesUpdate>({
    resolver: zodResolver(userPreferencesUpdateSchema),
    defaultValues: {
      timezone:
        preferences.timezone === 'UTC'
          ? detectTimezone()
          : preferences.timezone,
      reportCadence: preferences.reportCadence,
      deliveryHour: preferences.deliveryHour,
      tone: preferences.tone,
      aiConsent: preferences.aiConsent,
    },
  });

  const cadenceOff = watch('reportCadence') === 'off';

  const cadenceOptions: DropdownOption<ReportCadence>[] = REPORT_CADENCES.map(
    (value) => ({ value, label: t(`settings.cadence_${value}`) })
  );
  const toneOptions: DropdownOption<ReportTone>[] = REPORT_TONES.map(
    (value) => ({ value, label: t(`settings.tone_${value}`) })
  );
  const hourFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { hour: 'numeric' }),
    [i18n.language]
  );
  const hourOptions: DropdownOption<string>[] = HOURS.map((hour) => ({
    value: String(hour),
    label: hourFormatter.format(new Date(2000, 0, 1, hour)),
  }));

  const onSubmit = (data: UserPreferencesUpdate) => {
    setSaveError(false);
    setSaved(false);
    onSave(data, {
      onSuccess: () => setSaved(true),
      onError: () => setSaveError(true),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-xl"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="settings-timezone" className="text-dark-bg font-medium">
          {t('settings.timezone')}
        </label>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <TimezoneField
              id="settings-timezone"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('settings.timezonePlaceholder')}
              invalid={!!errors.timezone}
              data-testid="settings-timezone"
            />
          )}
        />
        {errors.timezone && (
          <p
            className="text-red-500 text-sm"
            data-testid="settings-timezone-error"
          >
            {t('settings.timezoneInvalid')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="settings-cadence" className="text-dark-bg font-medium">
          {t('settings.reportCadence')}
        </label>
        <Controller
          name="reportCadence"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="settings-cadence"
              ariaLabel={t('settings.reportCadence')}
              value={field.value ?? 'off'}
              onChange={(value) => field.onChange(value ?? 'off')}
              options={cadenceOptions}
              placeholder={t('settings.reportCadence')}
              data-testid="settings-cadence"
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="settings-delivery-hour"
          className="text-dark-bg font-medium"
        >
          {t('settings.deliveryHour')}
        </label>
        <Controller
          name="deliveryHour"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="settings-delivery-hour"
              ariaLabel={t('settings.deliveryHour')}
              value={String(field.value ?? MIN_DELIVERY_HOUR)}
              onChange={(value) =>
                field.onChange(
                  value !== null ? Number(value) : MIN_DELIVERY_HOUR
                )
              }
              options={hourOptions}
              placeholder={t('settings.deliveryHour')}
              disabled={cadenceOff}
              data-testid="settings-delivery-hour"
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="settings-tone" className="text-dark-bg font-medium">
          {t('settings.tone')}
        </label>
        <Controller
          name="tone"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="settings-tone"
              ariaLabel={t('settings.tone')}
              value={field.value ?? 'neutral'}
              onChange={(value) => field.onChange(value ?? 'neutral')}
              options={toneOptions}
              placeholder={t('settings.tone')}
              data-testid="settings-tone"
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Controller
          name="aiConsent"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="settings-ai-consent"
              checked={field.value ?? false}
              onChange={field.onChange}
              label={t('settings.aiConsent')}
            />
          )}
        />
        <p className="text-sm text-secondary-dark-bg">
          {t('settings.aiConsentDescription')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-dark-bg hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          dataTestId="settings-save-button"
        >
          {isSaving ? t('settings.saving') : t('settings.save')}
        </Button>
        {saved && !isSaving && (
          <span
            className="text-sm text-secondary-dark-bg"
            data-testid="settings-saved-message"
          >
            {t('settings.saved')}
          </span>
        )}
      </div>
      {saveError && (
        <p className="text-red-500 text-sm" data-testid="settings-save-error">
          {t('settings.saveError')}
        </p>
      )}
    </form>
  );
}

export default PreferencesForm;
