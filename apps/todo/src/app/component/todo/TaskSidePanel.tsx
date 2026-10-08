import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Archive,
  Trash2,
  ImagePlus,
  Upload,
  Plus,
  Inbox as InboxIcon,
  X,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  TodoItem,
  TodoList,
  TodoPriority,
  TodoListPriority,
  TodoListCategory,
  UpdateTodoItem,
  UpdateTodoList,
  TodoStatus,
  todoUpdateSchema,
  todolistUpdateSchema,
} from '@shared/types';
import { useAuthStore } from '../../store/authStore';
import { uploadImage } from '../../lib/imageUtils';
import DatePickerInput from '../elements/DatePickerInput';
import Dropdown, { DropdownOption } from '../elements/Dropdown';
import Badge from '../elements/Badge';
import Button from '../elements/Button';
import IconButton from '../elements/IconButton';
import TodoListForm from './TodoListForm';
import { CreateTodoListOpts } from '../../fetchers/todolist';

// ─── Edit Panel ───────────────────────────────────────────────────────────────

type EditFormValues = {
  name: string;
  status: TodoStatus;
  taskPriority: TodoPriority;
  dueDate: string;
  location: string;
  notes: string;
  /** The list the task belongs to; null is the Inbox. */
  listId: string | null;
  /** The chosen list's priority and category; both empty for the Inbox. */
  listPriority: TodoListPriority | '';
  category: TodoListCategory | '';
  image: string | null;
};

/** Dropdown entry that opens the create-list form instead of picking a list. */
const NEW_LIST = '__new__';

export function TodoEditPanel({
  todo,
  list,
  lists,
  onCreateList,
  onSave,
  onCancel,
}: {
  todo: TodoItem;
  list: TodoList | null;
  /** Every list the task could move to. */
  lists: TodoList[];
  onCreateList: (name: string, opts?: CreateTodoListOpts) => Promise<TodoList>;
  /** `listUpdates` change `targetList`, the list the task ends up in; both are
   * null for the Inbox. */
  onSave: (
    todoUpdates: UpdateTodoItem,
    listUpdates: UpdateTodoList | null,
    targetList: TodoList | null
  ) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.firebaseUid);
  const [imageError, setImageError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  // Lists made in this panel, shown before the page's list data catches up.
  const [createdLists, setCreatedLists] = useState<TodoList[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allLists = [
    ...lists,
    ...createdLists.filter(
      (created) => !lists.some((l) => l.id === created.id)
    ),
  ];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { dirtyFields },
  } = useForm<EditFormValues>({
    defaultValues: {
      name: todo.name,
      status: todo.status,
      taskPriority: todo.priority,
      dueDate: todo.dueDate ?? '',
      location: todo.location ?? '',
      notes: todo.notes ?? '',
      listId: list?.id ?? null,
      listPriority: list?.priority ?? '',
      category: list?.category ?? '',
      image: todo.image ?? null,
    },
  });

  const editImage = watch('image');

  const statusOptions: DropdownOption<TodoStatus>[] = [
    { value: 'pending', label: t('tasks.status_pending') },
    { value: 'successful', label: t('tasks.status_successful') },
    { value: 'failed', label: t('tasks.status_failed') },
  ];
  const priorityOptions: DropdownOption<TodoPriority>[] = [
    { value: 'low', label: t('tasks.priority_low') },
    { value: 'medium', label: t('tasks.priority_medium') },
    { value: 'high', label: t('tasks.priority_high') },
  ];
  const categoryOptions: DropdownOption<TodoListCategory>[] = [
    { value: 'home', label: t('tasks.category_home') },
    { value: 'education', label: t('tasks.category_education') },
    { value: 'work', label: t('tasks.category_work') },
    { value: 'family', label: t('tasks.category_family') },
    { value: 'health', label: t('tasks.category_health') },
  ];
  const listOptions: DropdownOption<string>[] = [
    ...allLists.map((l) => ({ value: l.id, label: l.name })),
    {
      value: NEW_LIST,
      label: t('tasks.addList'),
      icon: <Plus className="w-3 h-3 shrink-0" />,
    },
  ];

  // The list fields follow the chosen list; the Inbox has none.
  function showListSettings(chosen: TodoList | null) {
    setValue('listPriority', chosen?.priority ?? '');
    setValue('category', chosen?.category ?? '');
  }

  async function handleCreateList(name: string, opts?: CreateTodoListOpts) {
    setIsCreatingList(true);
    try {
      const created = await onCreateList(name, opts);
      setCreatedLists((prev) => [...prev, created]);
      setValue('listId', created.id, { shouldDirty: true });
      showListSettings(created);
      setShowNewListForm(false);
      setValidationError(null);
    } catch {
      setValidationError(t('tasks.listCreateFailed'));
      setShowNewListForm(false);
    } finally {
      setIsCreatingList(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setImageError(null);
    setImageUploading(true);
    try {
      const url = await uploadImage(file, userId);
      setValue('image', url, { shouldDirty: true });
    } catch (err) {
      setImageError((err as Error).message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setValue('image', null, { shouldDirty: true });
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFormSubmit = (data: EditFormValues) => {
    // The status dropdown can flip a task to/from 'successful' outside the
    // dedicated toggle action, so completedAt has to be kept in sync here too
    // — otherwise a task marked done via this form never shows up as completed.
    const statusChangedToSuccessful =
      data.status === 'successful' && todo.status !== 'successful';
    const statusChangedFromSuccessful =
      data.status !== 'successful' && todo.status === 'successful';

    const targetList = allLists.find((l) => l.id === data.listId) ?? null;
    const listChanged = (data.listId ?? null) !== (list?.id ?? null);

    const todoResult = todoUpdateSchema.safeParse({
      name: data.name.trim() || todo.name,
      status: data.status,
      priority: data.taskPriority,
      dueDate: data.dueDate || null,
      location: data.location.trim() || null,
      notes: data.notes.trim() || null,
      ...(listChanged ? { todolistId: data.listId } : {}),
      ...(dirtyFields.image ? { image: data.image } : {}),
      ...(statusChangedToSuccessful
        ? { completedAt: new Date().toISOString() }
        : statusChangedFromSuccessful
        ? { completedAt: null }
        : {}),
    });
    // Only an existing list has settings to save; the Inbox has none.
    const listResult = targetList
      ? todolistUpdateSchema.safeParse({
          priority: data.listPriority,
          category: data.category,
        })
      : null;

    if (!todoResult.success || (listResult && !listResult.success)) {
      setValidationError(
        todoResult.error?.issues[0]?.message ??
          listResult?.error?.issues[0]?.message ??
          'Please check the form values.'
      );
      return;
    }

    setValidationError(null);
    onSave(todoResult.data, listResult ? listResult.data : null, targetList);
  };

  const labelClass = 'text-xs text-muted font-medium';
  const inputClass =
    'w-full px-2 py-2 rounded-inner border border-default focus:border-accent focus:outline-none bg-surface-subtle text-primary text-sm';
  const dropdownClass =
    'flex w-full cursor-pointer list-none items-center justify-between rounded-inner border border-default bg-surface px-2 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-details-marker]:hidden';
  const dropdownMenuClass =
    'z-50 w-max min-w-[10rem] max-w-[13.75rem] list-none overflow-hidden rounded-inner border border-default bg-surface p-0 shadow-menu';
  const actionBtnClass =
    'w-6 h-6 flex items-center justify-center shrink-0 rounded-inner text-muted transition-colors outline-none cursor-pointer';

  return (
    <>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col h-full px-8 py-3 md:py-8"
      >
        <h2 className="text-xl font-bold text-primary mb-3 md:mb-5">
          {t('tasks.editTask')}
        </h2>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('tasks.name')}</label>
            <input
              {...register('name')}
              type="text"
              className={inputClass}
              data-testid={'edit-todo-input-' + todo.id}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
            <div className="flex flex-col gap-1">
              <label
                id={`edit-todo-status-label-${todo.id}`}
                className={labelClass}
              >
                {t('tasks.status')}
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={`edit-todo-status-summary-${todo.id}`}
                    data-testid={`edit-todo-status-${todo.id}`}
                    ariaLabelledby={`edit-todo-status-label-${todo.id}`}
                    value={field.value}
                    onChange={(value: TodoStatus | null) =>
                      value && field.onChange(value)
                    }
                    options={statusOptions}
                    placeholder={t('tasks.status')}
                    className={dropdownClass}
                    menuClassName={dropdownMenuClass}
                    fixedPosition
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                id={`edit-todo-task-priority-label-${todo.id}`}
                className={labelClass}
              >
                {t('tasks.taskPriority')}
              </label>
              <Controller
                name="taskPriority"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={`edit-todo-task-priority-summary-${todo.id}`}
                    data-testid={`edit-todo-task-priority-${todo.id}`}
                    ariaLabelledby={`edit-todo-task-priority-label-${todo.id}`}
                    value={field.value}
                    onChange={(value: TodoPriority | null) =>
                      value && field.onChange(value)
                    }
                    options={priorityOptions}
                    placeholder={t('tasks.taskPriority')}
                    className={dropdownClass}
                    menuClassName={dropdownMenuClass}
                    fixedPosition
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('tasks.dueDate')}</label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePickerInput
                    id={'edit-todo-due-date-' + todo.id}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>{t('tasks.location')}</label>
              <input
                type="text"
                {...register('location')}
                placeholder={t('tasks.locationPlaceholder')}
                className={inputClass}
                data-testid={'edit-todo-location-' + todo.id}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>{t('tasks.notes')}</label>
            <textarea
              {...register('notes')}
              placeholder={t('tasks.notesPlaceholder')}
              rows={3}
              className={`${inputClass} resize-none`}
              data-testid={'edit-todo-notes-' + todo.id}
            />
          </div>

          <div className="border-t border-default pt-3 mt-1 space-y-3">
            <div className="flex flex-col gap-1">
              <label
                id={`edit-todo-list-label-${todo.id}`}
                className={labelClass}
              >
                {t('tasks.list')}
              </label>
              <Controller
                name="listId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id={`edit-todo-list-summary-${todo.id}`}
                    data-testid={`edit-todo-list-${todo.id}`}
                    ariaLabelledby={`edit-todo-list-label-${todo.id}`}
                    value={field.value}
                    onChange={(value: string | null) => {
                      if (value === NEW_LIST) {
                        setShowNewListForm(true);
                        return;
                      }
                      field.onChange(value);
                      showListSettings(
                        allLists.find((l) => l.id === value) ?? null
                      );
                    }}
                    options={listOptions}
                    nullOption={{
                      label: t('tasks.inbox'),
                      icon: <InboxIcon className="w-3 h-3 shrink-0" />,
                    }}
                    placeholder={t('tasks.inbox')}
                    className={dropdownClass}
                    menuClassName={dropdownMenuClass}
                    fixedPosition
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 [&>*]:min-w-0">
              <div className="flex flex-col gap-1">
                <label
                  id={`edit-todo-list-priority-label-${todo.id}`}
                  className={labelClass}
                >
                  {t('tasks.listPriority')}
                </label>
                <Controller
                  name="listPriority"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id={`edit-todo-list-priority-summary-${todo.id}`}
                      ariaLabelledby={`edit-todo-list-priority-label-${todo.id}`}
                      value={field.value || null}
                      onChange={(value: TodoListPriority | null) =>
                        field.onChange(value ?? '')
                      }
                      options={priorityOptions}
                      nullOption={{ label: t('tasks.priority_none') }}
                      placeholder={t('tasks.priority_none')}
                      className={dropdownClass}
                      menuClassName={dropdownMenuClass}
                      fixedPosition
                      disabled={!watch('listId')}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  id={`edit-todo-category-label-${todo.id}`}
                  className={labelClass}
                >
                  {t('tasks.category')}
                </label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id={`edit-todo-category-summary-${todo.id}`}
                      ariaLabelledby={`edit-todo-category-label-${todo.id}`}
                      value={field.value || null}
                      onChange={(value: TodoListCategory | null) =>
                        field.onChange(value ?? '')
                      }
                      options={categoryOptions}
                      nullOption={{ label: t('tasks.category_none') }}
                      placeholder={t('tasks.category_none')}
                      className={dropdownClass}
                      menuClassName={dropdownMenuClass}
                      fixedPosition
                      disabled={!watch('listId')}
                    />
                  )}
                />
              </div>
            </div>

            {!watch('listId') && (
              <p
                className="text-xs text-muted"
                data-testid="edit-todo-inbox-note"
              >
                {t('tasks.inboxNoListSettings')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className={`${labelClass}`}>{t('tasks.image')}</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                data-testid={'edit-todo-image-' + todo.id}
              />
              {!editImage && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex w-full items-center justify-center gap-2 px-4 py-2 rounded-inner border-2 border-dashed border-default hover:border-accent hover:bg-accent/10 text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageUploading ? (
                    <>
                      <Upload size={16} className="animate-bounce" />
                      <span className="text-sm">{t('tasks.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={16} />
                      <span className="text-sm">{t('tasks.chooseImage')}</span>
                    </>
                  )}
                </button>
              )}
              {imageError && (
                <p className="text-danger text-xs">{imageError}</p>
              )}
              {editImage && (
                <div className="flex items-center gap-2">
                  <img
                    src={editImage}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={`${actionBtnClass} hover:text-danger`}
                    aria-label="Remove image"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-default mt-3 md:pt-5 md:mt-5">
          {validationError && (
            <p className="text-sm text-danger mr-auto" role="alert">
              {validationError}
            </p>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
            aria-label="Cancel todo edit"
            data-testid={'cancel-todo-edit-button-' + todo.id}
          >
            {t('tasks.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-accent text-on-accent rounded-inner hover:opacity-90 transition-opacity"
            aria-label="Save todo edit"
            data-testid={'save-todo-edit-button-' + todo.id}
          >
            {t('tasks.save')}
          </button>
        </div>
      </form>

      {/* Beside the form, not inside it: forms cannot be nested. */}
      {showNewListForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('tasks.addList')}
          data-testid="edit-todo-new-list-dialog"
          onClick={() => setShowNewListForm(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setShowNewListForm(false);
          }}
        >
          <div
            className="w-full max-w-md space-y-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end">
              <IconButton
                ariaLabel={t('tasks.cancel')}
                onClick={() => setShowNewListForm(false)}
              >
                <X className="size-4" />
              </IconButton>
            </div>
            <TodoListForm
              onSubmit={handleCreateList}
              isSubmitting={isCreatingList}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

// `todo.status` values map onto the redesign's status roles the same way
// TodoItem's marker does: 'pending' -> in progress, 'successful' ->
// completed, 'failed' -> not started.
const STATUS_TEXT_COLORS: Record<string, string> = {
  pending: 'text-status-progress',
  successful: 'text-status-complete',
  failed: 'text-status-open',
};

export function TaskDetailPanel({
  todo,
  list,
  onDelete,
  onArchive,
  onStartEdit,
}: {
  todo: TodoItem;
  list: TodoList | null;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onStartEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-primary leading-snug">
              {todo.name}
            </h2>
            <div className="mt-3">
              <Badge tone={`priority-${todo.priority}`}>
                {t(`tasks.priority_${todo.priority}`)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            {onArchive && (
              <button
                onClick={() => onArchive(todo.id)}
                aria-label={t('tasks.archive')}
                data-testid={'archive-todo-button-' + todo.id}
                className="flex items-center justify-center p-1.5 text-muted border border-default rounded-md hover:text-primary hover:border-primary transition-colors shrink-0"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(todo.id)}
              aria-label={t('tasks.delete')}
              data-testid={'delete-todo-button-' + todo.id}
              className="flex items-center justify-center p-1.5 text-muted border border-default rounded-md hover:text-danger hover:border-danger transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {todo.image && (
              <img
                src={todo.image}
                alt="Attached"
                className="w-32 h-32 object-cover rounded-card border border-default"
              />
            )}
          </div>
        </div>

        <div className="border-t border-default pt-4 space-y-2.5 text-sm">
          <div className="flex gap-3">
            <span className="w-24 shrink-0 text-muted">{t('tasks.list')}</span>
            <span className="font-medium text-primary">
              {list ? list.name : t('tasks.inbox')}
            </span>
          </div>
          {todo.dueDate && (
            <div className="flex gap-3">
              <span className="w-24 shrink-0 text-muted">{t('tasks.due')}</span>
              <span className="font-medium text-primary">
                {dayjs(todo.dueDate).format('DD/MM/YYYY')}
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <span className="w-24 shrink-0 text-muted">
              {t('tasks.status')}
            </span>
            <span
              className={`font-semibold ${STATUS_TEXT_COLORS[todo.status]}`}
            >
              {t(`tasks.status_${todo.status}`)}
            </span>
          </div>
          {list?.priority && (
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-muted">
                {t('tasks.listPriority')}
              </span>
              <Badge tone={`priority-${list.priority}`}>
                {t(`tasks.priority_${list.priority}`)}
              </Badge>
            </div>
          )}
          {list?.category && (
            <div className="flex gap-3">
              <span className="w-24 shrink-0 text-muted">
                {t('tasks.category')}
              </span>
              <span className="font-medium text-primary">
                {t(`tasks.category_${list.category}`)}
              </span>
            </div>
          )}
          {todo.location && (
            <div className="flex gap-3">
              <span className="w-24 shrink-0 text-muted">
                {t('tasks.location')}
              </span>
              <span className="font-medium text-primary">{todo.location}</span>
            </div>
          )}
          {list?.createdAt && (
            <div className="flex gap-3">
              <span className="w-24 shrink-0 text-muted">
                {t('tasks.created')}
              </span>
              <span className="font-medium text-primary">
                {dayjs(list.createdAt).format('DD/MM/YYYY')}
              </span>
            </div>
          )}
        </div>

        {todo.notes && (
          <div className="mt-4 rounded-inner bg-surface-subtle p-4">
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
              {todo.notes}
            </p>
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button
          variant="primary"
          onClick={onStartEdit}
          className="w-full"
          dataTestId={'edit-todo-button-' + todo.id}
        >
          {t('tasks.edit')}
        </Button>
      </div>
    </div>
  );
}
