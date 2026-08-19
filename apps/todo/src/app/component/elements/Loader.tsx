import Text from './Text';

interface LoaderProps {
  message?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  message = 'Loading...',
  className = 'h-64',
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent"></div>
      <Text as="p" className="ml-4 text-2xl text-dark-bg">
        {message}
      </Text>
    </div>
  );
};

export default Loader;
