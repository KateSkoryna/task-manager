import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react';

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

const ChatComposer: React.FC<ChatComposerProps> = ({ disabled, onSend }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  return (
    <form
      className="flex items-center gap-2 border-t border-default p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('agent.composerPlaceholder')}
        disabled={disabled}
        aria-label={t('agent.composerPlaceholder')}
        data-testid="chat-composer-input"
        className="flex-1 rounded-inner border border-default bg-surface-subtle px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label={t('agent.send')}
        data-testid="chat-composer-send"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </form>
  );
};

export default ChatComposer;
