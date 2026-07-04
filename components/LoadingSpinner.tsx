import { Loader2 } from 'lucide-react';

type LoadingSpinnerProps = {
  className?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = 'h-8 w-8 text-ink-200 animate-spin' }) => {
  return (
    <Loader2 className={className} />
  );
};

export default LoadingSpinner;
