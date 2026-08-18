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

// ─── Edit Panel ───────────────────────────────────────────────────────────────

type EditFormValues = {
  name: string;
  status: TodoStatus;
  dueDate: string;
  location: string;
  notes: string;
  listName: string;
  priority: TodoListPriority | '';
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
  list: TodoList;
  onSave: (todoUpdates: UpdateTodoItem, listUpdates: UpdateTodoList) => void;
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
      dueDate: todo.dueDate ?? '',
      location: todo.location ?? '',
      notes: todo.notes ?? '',
      listName: list.name,
      priority: list.priority ?? '',
      category: list.category ?? '',
      image: todo.image ?? null,
    },
  });

  const editImage = watch('image');

  const statusOptions: DropdownOption<TodoStatus>[] = [
    { value: 'pending', label: t('tasks.status_pending') },
    { value: 'successful', label: t('tasks.status_successful') },
    { value: 'failed', label: t('tasks.status_failed') },
  ];
  const priorityOptions: DropdownOption<TodoListPriority>[] = [
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
      dueDate: data.dueDate || null,
      location: data.location.trim() || null,
      notes: data.notes.trim() || null,
      ...(dirtyFields.image ? { image: data.image } : {}),
    });
    const listResult = todolistUpdateSchema.safeParse({
      name: data.listName.trim() || list.name,
      priority: data.priority,
      category: data.category,
    });

    if (!todoResult.success || !listResult.success) {
      setValidationError(
        todoResult.error?.issues[0]?.message ??
          listResult.error?.issues[0]?.message ??
          'Please check the form values.'
      );
      return;
    }

    setValidationError(null);
    onSave(todoResult.data, listResult.data);
  };

  const labelClass = 'text-xs text-secondary-dark-bg font-medium w-20 shrink-0';
  const inputClass =
    'flex-1 px-2 py-2 rounded-lg border border-secondary-bg focus:border-accent focus:outline-none bg-white text-dark-bg text-sm';
  const dropdownClass =
    'flex min-w-[160px] cursor-pointer list-none items-center justify-between rounded-lg border border-secondary-bg bg-white px-2 py-2 text-sm text-dark-bg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-details-marker]:hidden';
  const dropdownMenuClass =
    'z-50 w-max min-w-[160px] max-w-[220px] list-none overflow-hidden rounded-lg border border-secondary-bg bg-white p-0 shadow-lg';
  const actionBtnClass =
    'w-6 h-6 flex items-center justify-center shrink-0 rounded-lg text-secondary-dark-bg transition-colors outline-none cursor-pointer';

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex flex-col h-full p-6"
    >
      <h2 className="text-xl font-bold text-dark-bg mb-5">
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

        <div className="border-t border-secondary-bg pt-3 mt-1 space-y-3">
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
              id={`edit-todo-priority-label-${todo.id}`}
              className={labelClass}
            >
              {t('tasks.priority')}
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id={`edit-todo-priority-summary-${todo.id}`}
                  ariaLabelledby={`edit-todo-priority-label-${todo.id}`}
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-secondary-bg hover:border-accent hover:bg-accent/10 text-secondary-dark-bg hover:text-dark-bg transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
            {imageError && <p className="text-red-500 text-xs">{imageError}</p>}
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
                  className={`${actionBtnClass} hover:text-red-500`}
                  aria-label="Remove image"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-5 border-t border-secondary-bg mt-5">
        {validationError && (
          <p className="text-sm text-red-500 mr-auto" role="alert">
            {validationError}
          </p>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary-dark-bg hover:text-dark-bg transition-colors"
          aria-label="Cancel todo edit"
          data-testid={'cancel-todo-edit-button-' + todo.id}
        >
          {t('tasks.cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-accent text-dark-bg rounded-lg hover:opacity-90 transition-opacity"
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

const STATUS_TEXT_COLORS: Record<string, string> = {
  pending: 'text-triadic-orange',
  successful: 'text-green-500',
  failed: 'text-triadic-purple',
};

const PRIORITY_TEXT_COLORS: Record<string, string> = {
  high: 'text-triadic-orange',
  medium: 'text-triadic-blue',
  low: 'text-triadic-purple',
};

export function TaskDetailPanel({
  todo,
  list,
  onDelete,
  onStartEdit,
}: {
  todo: TodoItem;
  list: TodoList;
  onDelete: (id: string) => void;
  onStartEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-dark-bg leading-snug">
              {todo.name}
            </h2>

            <div className="space-y-2 text-sm text-secondary-dark-bg mt-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                <span>
                  {t('tasks.list')}{' '}
                  <span className="font-medium text-dark-bg">{list.name}</span>
                </span>
              </div>
              {list.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                  <span>
                    {t('tasks.created')}{' '}
                    {dayjs(list.createdAt).format('DD/MM/YYYY')}
                  </span>
                </div>
              )}
              {todo.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                  <span>
                    {t('tasks.due')} {dayjs(todo.dueDate).format('DD/MM/YYYY')}
                  </span>
                </div>
              )}
              {todo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                  <span>{todo.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                <span>
                  {t('tasks.status')}{' '}
                  <span
                    className={`font-medium ${STATUS_TEXT_COLORS[todo.status]}`}
                  >
                    {t(`tasks.status_${todo.status}`)}
                  </span>
                </span>
              </div>
              {list.priority && (
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                  <span>
                    {t('tasks.priority')}{' '}
                    <span
                      className={`font-medium ${
                        PRIORITY_TEXT_COLORS[list.priority]
                      }`}
                    >
                      {t(`tasks.priority_${list.priority}`)}
                    </span>
                  </span>
                </div>
              )}
              {list.category && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 shrink-0 text-secondary-dark-bg" />
                  <span>
                    {t('tasks.category')}{' '}
                    <span className="font-medium text-triadic-blue">
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
              className="w-32 h-32 object-cover rounded-lg border border-secondary-bg shrink-0"
            />
          )}
        </div>

        {todo.notes && (
          <div className="border-t border-secondary-bg pt-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-secondary-dark-bg" />
              <span className="text-sm font-semibold text-dark-bg">
                {t('tasks.notes')}
              </span>
            </div>
            <p className="text-sm text-secondary-dark-bg leading-relaxed whitespace-pre-wrap">
              {todo.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          onClick={() => onDelete(todo.id)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-triadic-orange text-white hover:opacity-90 transition-opacity"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={onStartEdit}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-triadic-orange text-white hover:opacity-90 transition-opacity"
          aria-label="Edit task"
        >
          <Pencil size={18} />
        </button>
      </div>
    </div>
  );
}
