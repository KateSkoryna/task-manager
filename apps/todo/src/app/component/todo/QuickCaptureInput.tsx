import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../elements/Input';
import Button from '../elements/Button';
import { useQuickCaptureTodo } from '../../hooks/useQuickCaptureTodo';

interface QuickCaptureInputProps {
  inputTestId: string;
  submitTestId: string;
  noticeTestId: string;
  undoTestId: string;
}

/** The always-visible "type a task, AI fills in the rest" input, shared by
 * every Inbox quick-capture surface in the app. */
function QuickCaptureInput({
  inputTestId,
  submitTestId,
  noticeTestId,
  undoTestId,
}: QuickCaptureInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const { enrichment, aiHintShown, submit, undo } = useQuickCaptureTodo();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    submit(text);
    setText('');
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 xl:flex-row xl:items-center"
      >
        <div className="xl:flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('tasks.quickCapturePlaceholder')}
            inputTestId={inputTestId}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full shrink-0 text-sm xl:w-auto"
          dataTestId={submitTestId}
        >
          <Plus className="h-4 w-4" />
          {t('tasks.quickCaptureAdd')}
        </Button>
      </form>

      {aiHintShown && (
        <p
          className="text-xs text-muted bg-surface-subtle rounded-inner px-3 py-2"
          data-testid={`${noticeTestId}-ai-off`}
        >
          {t('tasks.aiOffHint')}{' '}
          <Link
            to="/settings"
            className="text-notification-dot hover:underline"
          >
            {t('tasks.aiOffHintLink')}
          </Link>
        </p>
      )}

      {enrichment && (
        <div
          className="flex items-center justify-between gap-2 text-xs text-muted bg-surface-subtle rounded-inner px-3 py-2"
          data-testid={noticeTestId}
        >
          <span>
            <span role="img" aria-label="">
              ✨
            </span>{' '}
            {t('tasks.enriched')}
          </span>
          <button
            type="button"
            onClick={undo}
            className="text-accent hover:underline shrink-0"
            data-testid={undoTestId}
          >
            {t('tasks.undo')}
          </button>
        </div>
      )}
    </div>
  );
}

export default QuickCaptureInput;
