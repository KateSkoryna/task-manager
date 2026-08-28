import { useTranslation } from 'react-i18next';
import Button from './Button';
import Text from './Text';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  className?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-danger/10 border border-danger text-danger p-6 rounded-lg ${className}`}
    >
      <Text as="h2" className="text-xl font-bold mb-2" dataTestId="error-title">
        {t('error.title')}
      </Text>
      <Text as="p" dataTestId="error-message">
        {error.message}
      </Text>
      {resetErrorBoundary && (
        <Button
          onClick={resetErrorBoundary}
          variant="secondary"
          className="mt-4"
        >
          {t('error.tryAgain')}
        </Button>
      )}
    </div>
  );
};

export default ErrorFallback;
