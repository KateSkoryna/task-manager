import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpPage from './HelpPage';
import { REPLAY_TOUR_STATE } from '../onboarding/tourSteps';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HelpPage', () => {
  it('replays the tour from the Today page', async () => {
    render(<HelpPage />);

    await userEvent.click(screen.getByTestId('help-replay-tour'));

    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: REPLAY_TOUR_STATE,
    });
  });
});
