import { useTranslation } from 'react-i18next';
import { Sparkles, X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-default p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-action text-on-action">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-body font-bold text-primary">
            {t('agent.name')}
          </p>
          <p className="truncate text-small text-muted">{t('agent.tagline')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('agent.close')}
        data-testid="chat-panel-close"
        className="flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-primary focus-visible:bg-surface-subtle focus-visible:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-priority-high-bg"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatHeader;
