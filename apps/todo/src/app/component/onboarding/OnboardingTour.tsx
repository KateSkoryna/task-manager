import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePreferences } from '../../hooks/usePreferences';
import { useMobileMenuStore } from '../../store/mobileMenuStore';
import { loadDriver } from './loadDriver';
import { buildTourSteps } from './tourSteps';

// Rendered right away, because the next stop looks for its target at once.
const setMenuOpen = (isOpen: boolean) =>
  flushSync(() => useMobileMenuStore.getState().setOpen(isOpen));
const closeMenu = () => useMobileMenuStore.getState().setOpen(false);

/**
 * Runs the first-run tour on the Today page, once per user: finishing or
 * skipping it stores `onboardingSeen` on the server. Help can run it again
 * through router state, which leaves the stored flag alone.
 */
function OnboardingTour() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences, updatePreferences } = usePreferences();

  // Read once: clearing the router state below must not stop a running tour.
  const replayRequested = useRef(
    Boolean((location.state as { replayTour?: boolean } | null)?.replayTour)
  );
  const isFirstRun = preferences !== undefined && !preferences.onboardingSeen;
  const shouldRun = isFirstRun || replayRequested.current;
  // A failed save rolls `onboardingSeen` back to false; without this the tour
  // would start again right after the user finished it.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!shouldRun || hasStarted.current) return;
    if (replayRequested.current) navigate('.', { replace: true, state: null });

    let cancelled = false;
    let tour: ReturnType<Awaited<ReturnType<typeof loadDriver>>> | undefined;

    loadDriver().then((driver) => {
      if (cancelled) return;
      hasStarted.current = true;
      tour = driver({
        showProgress: true,
        // Only the popover responds; the highlighted element is not clickable.
        disableActiveInteraction: true,
        popoverClass: 'onboarding-popover',
        nextBtnText: t('onboarding.next'),
        prevBtnText: t('onboarding.previous'),
        doneBtnText: t('onboarding.done'),
        progressText: t('onboarding.progress'),
        steps: buildTourSteps(t, setMenuOpen),
        // Unlike `onDestroyed`, this also fires when the tour is closed before
        // its first highlight animation has finished. Calling `destroy()`
        // here does not trigger the hook again.
        onDestroyStarted: () => {
          if (isFirstRun) updatePreferences({ onboardingSeen: true });
          closeMenu();
          tour?.destroy();
        },
      });
      tour.drive();
    });

    return () => {
      cancelled = true;
      // Leaving the page mid-tour is not finishing or skipping it, and a
      // direct destroy() skips the hook above, so nothing is stored.
      if (tour?.isActive()) {
        closeMenu();
        tour.destroy();
      }
    };
    // Only the decision to run matters; later preference changes must not
    // restart or cut short a tour in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRun]);

  return null;
}

export default OnboardingTour;
