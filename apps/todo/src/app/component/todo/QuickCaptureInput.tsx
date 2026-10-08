import { useId, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../elements/Input';
import Button from '../elements/Button';
import Dropdown from '../elements/Dropdown';
import DatePickerInput from '../elements/DatePickerInput';
import { TodoPriority } from '@shared/types';
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
  const fieldId = useId();
  const [text, setText] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [priority, setPriority] = useState<TodoPriority | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const { enrichment, aiIsOff, submit, undo } = useQuickCaptureTodo();

  const priorityOptions = [
    { value: 'low' as TodoPriority, label: t('tasks.priority_low') },
    { value: 'medium' as TodoPriority, label: t('tasks.priority_medium') },
    { value: 'high' as TodoPriority, label: t('tasks.priority_high') },
  ];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    submit(text, {
      priority: priority ?? undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });
    setText('');
    setPriority(null);
    setDueDate('');
    setNotes('');
    setShowMore(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center"
      >
        <div className="xl:flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(
              aiIsOff
                ? 'tasks.quickCapturePlaceholderPlain'
                : 'tasks.quickCapturePlaceholder'
            )}
            inputTestId={inputTestId}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowMore((v) => !v)}
          className="w-full shrink-0 text-sm xl:w-auto"
          dataTestId={`${inputTestId}-more`}
        >
          {showMore ? t('tasks.quickCaptureLess') : t('tasks.quickCaptureMore')}
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              showMore ? 'rotate-180' : ''
            }`}
          />
        </Button>
        {showMore && (
          <div className="grid grid-cols-1 gap-4 xl:order-last xl:basis-full sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  id={`${fieldId}-priority-label`}
                  className="text-sm font-medium text-primary"
                >
                  {t('tasks.taskPriority')}
                </label>
                <Dropdown
                  id={`${fieldId}-priority`}
                  data-testid={`${inputTestId}-priority`}
                  ariaLabelledby={`${fieldId}-priority-label`}
                  value={priority}
                  onChange={setPriority}
                  options={priorityOptions}
                  placeholder={t('tasks.taskPriority')}
                  fixedPosition
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${fieldId}-due-date`}
                  className="text-sm font-medium text-primary"
                >
                  {t('tasks.dueDate')}
                </label>
                <DatePickerInput
                  id={`${fieldId}-due-date`}
                  value={dueDate}
                  onChange={setDueDate}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${fieldId}-notes`}
                className="text-sm font-medium text-primary"
              >
                {t('tasks.notes')}
              </label>
              <textarea
                id={`${fieldId}-notes`}
                data-testid={`${inputTestId}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('tasks.notesPlaceholder')}
                rows={3}
                className="flex-1 px-3 py-2 rounded-inner border border-default focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent bg-surface-subtle text-primary placeholder:text-muted resize-none"
              />
            </div>
          </div>
        )}
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

      {aiIsOff && (
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
