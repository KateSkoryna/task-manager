import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '../elements/Button';
import { REPLAY_TOUR_STATE } from './tourSteps';

function TourSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-3 rounded-card border border-default bg-surface p-5">
      <h2 className="text-lg font-bold text-primary">{t('help.tour.title')}</h2>
      <p className="text-muted">{t('help.tour.description')}</p>
      <Button
        variant="secondary"
        dataTestId="help-replay-tour"
        onClick={() => navigate('/', { state: REPLAY_TOUR_STATE })}
      >
        {t('help.tour.replay')}
      </Button>
    </div>
  );
}

export default TourSection;
