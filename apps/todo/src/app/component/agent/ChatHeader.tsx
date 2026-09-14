import { useTranslation } from 'react-i18next';
import { Sparkles, X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-default p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent text-on-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-primary">{t('agent.name')}</p>
          <p className="text-xs text-muted">{t('agent.tagline')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('agent.close')}
        data-testid="chat-panel-close"
        className="flex h-8 w-8 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatHeader;
