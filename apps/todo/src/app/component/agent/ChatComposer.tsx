import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, Mic } from 'lucide-react';
import IconButton from '../elements/IconButton';
import { useSpeechInput } from '../../hooks/useSpeechInput';

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

const ChatComposer: React.FC<ChatComposerProps> = ({ disabled, onSend }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const speech = useSpeechInput();

  // Interim results replace the composer's value as they arrive so voice
  // feeds the exact same field typing does; the text renders muted while
  // listening (not yet finalised) and turns normal once recognition stops.
  useEffect(() => {
    if (speech.isListening) setValue(speech.transcript);
  }, [speech.isListening, speech.transcript]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    // Recognition is `continuous`, so without this a still-listening
    // session keeps recomputing `speech.transcript` after send and the
    // effect above would repopulate the just-cleared input with stale text.
    if (speech.isListening) speech.stop();
    onSend(text);
    setValue('');
  };

  return (
    <form
      className="flex flex-col gap-1 border-t border-default p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('agent.composerPlaceholder')}
          disabled={disabled}
          aria-label={t('agent.composerPlaceholder')}
          data-testid="chat-composer-input"
          className={`flex-1 rounded-inner border border-default bg-surface-subtle px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-50 ${
            speech.isListening ? 'text-muted' : 'text-primary'
          }`}
        />
        {speech.isSupported && (
          <IconButton
            type="button"
            active={speech.isListening}
            disabled={disabled}
            onClick={() =>
              speech.isListening ? speech.stop() : speech.start()
            }
            ariaLabel={
              speech.isListening ? t('agent.micStop') : t('agent.micStart')
            }
            dataTestId="chat-composer-mic"
          >
            <Mic className="h-4 w-4" />
          </IconButton>
        )}
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label={t('agent.send')}
          data-testid="chat-composer-send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      {speech.error && (
        <p role="alert" className="text-xs text-danger">
          {t(`agent.speechError.${speech.error}`)}
        </p>
      )}
    </form>
  );
};

export default ChatComposer;
