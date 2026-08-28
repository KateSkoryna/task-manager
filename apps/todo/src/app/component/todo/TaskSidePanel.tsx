import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  ClipboardList,
  MapPin,
  FileText,
  Calendar,
  Trash2,
  Pencil,
  ImagePlus,
  Upload,
  Flag,
  CircleDot,
  Tag,
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
import IconButton from '../elements/IconButton';

// ─── Edit Panel ───────────────────────────────────────────────────────────────

type EditFormValues = {
  name: string;
  status: TodoStatus;
  taskPriority: TodoPriority;
  dueDate: string;
  location: string;
  notes: string;
  listName: string;
  listPriority: TodoListPriority | '';
  category: TodoListCategory | '';
  image: string | null;
};

export function TodoEditPanel({
  todo,
  list,
  onSave,
  onCancel,
}: {
  todo: TodoItem;
  list: TodoList | null;
  onSave: (
    todoUpdates: UpdateTodoItem,
    listUpdates: UpdateTodoList | null
  ) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.firebaseUid);
  const [imageError, setImageError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      listName: list?.name ?? '',
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
    const todoResult = todoUpdateSchema.safeParse({
      name: data.name.trim() || todo.name,
      status: data.status,
      priority: data.taskPriority,
      dueDate: data.dueDate || null,
      location: data.location.trim() || null,
      notes: data.notes.trim() || null,
      ...(dirtyFields.image ? { image: data.image } : {}),
    });
    const listResult = list
      ? todolistUpdateSchema.safeParse({
          name: data.listName.trim() || list.name,
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
    onSave(todoResult.data, listResult ? listResult.data : null);
  };

  const labelClass = 'text-xs text-muted font-medium w-20 shrink-0';
  const inputClass =
    'flex-1 px-2 py-2 rounded-inner border border-default focus:border-accent focus:outline-none bg-surface-subtle text-primary text-sm';
  const dropdownClass =
    'flex min-w-[10rem] cursor-pointer list-none items-center justify-between rounded-inner border border-default bg-surface px-2 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-details-marker]:hidden';
  const dropdownMenuClass =
    'z-50 w-max min-w-[10rem] max-w-[13.75rem] list-none overflow-hidden rounded-inner border border-default bg-surface p-0 shadow-menu';
  const actionBtnClass =
    'w-6 h-6 flex items-center justify-center shrink-0 rounded-inner text-muted transition-colors outline-none cursor-pointer';

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex flex-col h-full p-6"
    >
      <h2 className="text-xl font-bold text-primary mb-5">
        {t('tasks.editTask')}
      </h2>

      <div className="flex-1 space-y-3 overflow-y-auto">
        <div className="flex items-center gap-2">
          <label className={labelClass}>{t('tasks.name')}</label>
          <input
            {...register('name')}
            type="text"
            className={inputClass}
            data-testid={'edit-todo-input-' + todo.id}
          />
        </div>

        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          <label className={labelClass}>{t('tasks.location')}</label>
          <input
            type="text"
            {...register('location')}
            placeholder={t('tasks.locationPlaceholder')}
            className={inputClass}
            data-testid={'edit-todo-location-' + todo.id}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className={labelClass}>{t('tasks.notes')}</label>
          <textarea
            {...register('notes')}
            placeholder={t('tasks.notesPlaceholder')}
            rows={3}
            className={`${inputClass} resize-none`}
            data-testid={'edit-todo-notes-' + todo.id}
          />
        </div>

        {list && (
          <div className="border-t border-default pt-3 mt-1 space-y-3">
            <div className="flex items-center gap-2">
              <label className={labelClass}>{t('tasks.listName')}</label>
              <input
                {...register('listName')}
                type="text"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
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
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-2">
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
                  />
                )}
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          <label className={`${labelClass} pt-2`}>{t('tasks.image')}</label>
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
                className="flex items-center gap-2 px-4 py-2 rounded-inner border-2 border-dashed border-default hover:border-accent hover:bg-accent/10 text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
            {imageError && <p className="text-danger text-xs">{imageError}</p>}
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

      <div className="flex gap-2 justify-end pt-5 border-t border-default mt-5">
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
  onStartEdit,
}: {
  todo: TodoItem;
  list: TodoList | null;
  onDelete: (id: string) => void;
  onStartEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-primary leading-snug">
              {todo.name}
            </h2>

            <div className="space-y-2 text-sm text-muted mt-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 shrink-0 text-muted" />
                <span>
                  {t('tasks.list')}{' '}
                  <span className="font-medium text-primary">
                    {list ? list.name : t('tasks.inbox')}
                  </span>
                </span>
              </div>
              {list?.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0 text-muted" />
                  <span>
                    {t('tasks.created')}{' '}
                    {dayjs(list.createdAt).format('DD/MM/YYYY')}
                  </span>
                </div>
              )}
              {todo.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0 text-muted" />
                  <span>
                    {t('tasks.due')} {dayjs(todo.dueDate).format('DD/MM/YYYY')}
                  </span>
                </div>
              )}
              {todo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-muted" />
                  <span>{todo.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 shrink-0 text-muted" />
                <span>
                  {t('tasks.status')}{' '}
                  <span
                    className={`font-medium ${STATUS_TEXT_COLORS[todo.status]}`}
                  >
                    {t(`tasks.status_${todo.status}`)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 shrink-0 text-muted" />
                <span className="flex items-center gap-1.5">
                  {t('tasks.taskPriority')}
                  <Badge tone={`priority-${todo.priority}`}>
                    {t(`tasks.priority_${todo.priority}`)}
                  </Badge>
                </span>
              </div>
              {list?.priority && (
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 shrink-0 text-muted" />
                  <span className="flex items-center gap-1.5">
                    {t('tasks.listPriority')}
                    <Badge tone={`priority-${list.priority}`}>
                      {t(`tasks.priority_${list.priority}`)}
                    </Badge>
                  </span>
                </div>
              )}
              {list?.category && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 shrink-0 text-muted" />
                  <span>
                    {t('tasks.category')}{' '}
                    <span className="font-medium text-primary">
                      {t(`tasks.category_${list.category}`)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {todo.image && (
            <img
              src={todo.image}
              alt="Attached"
              className="w-32 h-32 object-cover rounded-card border border-default shrink-0"
            />
          )}
        </div>

        {todo.notes && (
          <div className="border-t border-default pt-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted" />
              <span className="text-sm font-semibold text-primary">
                {t('tasks.notes')}
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
              {todo.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <IconButton
          size="menu"
          onClick={() => onDelete(todo.id)}
          ariaLabel="Delete task"
          className="hover:text-danger"
        >
          <Trash2 size={18} />
        </IconButton>
        <IconButton size="menu" onClick={onStartEdit} ariaLabel="Edit task">
          <Pencil size={18} />
        </IconButton>
      </div>
    </div>
  );
}
