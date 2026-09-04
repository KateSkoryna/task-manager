import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TodoList,
  TodoListPriority,
  TodoListCategory,
  todolistCreateSchema,
} from '@shared/types';
import { useTranslation } from 'react-i18next';
import Input from '../elements/Input';
import Button from '../elements/Button';
import Text from '../elements/Text';
import Dropdown from '../elements/Dropdown';
import DatePickerInput from '../elements/DatePickerInput';

export type TodoListFormOpts = {
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
};

type TodoListFormProps = {
  onSubmit: (name: string, opts?: TodoListFormOpts) => void;
  isSubmitting?: boolean;
  todoList?: TodoList;
};

type FormInput = z.input<typeof todolistCreateSchema>;
type FormOutput = z.output<typeof todolistCreateSchema>;

const TodoListForm: React.FC<TodoListFormProps> = ({
  onSubmit,
  isSubmitting = false,
  todoList,
}) => {
  const { t } = useTranslation();
  const isEditing = !!todoList;
  const [showMore, setShowMore] = useState(isEditing);
  const { userId } = useParams<{ userId: string }>();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(todolistCreateSchema),
    defaultValues: {
      name: todoList?.name ?? '',
      priority: todoList?.priority ?? '',
      category: todoList?.category ?? '',
      dueDate: todoList?.dueDate ?? '',
      notes: todoList?.notes ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: todoList?.name ?? '',
      priority: todoList?.priority ?? '',
      category: todoList?.category ?? '',
      dueDate: todoList?.dueDate ?? '',
      notes: todoList?.notes ?? '',
    });
    setShowMore(isEditing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, todoList?.id, reset]);

  const onFormSubmit = (data: FormOutput) => {
    const opts: TodoListFormOpts = {
      priority: data.priority,
      category: data.category,
      dueDate: data.dueDate ?? null,
      notes: data.notes ?? null,
    };
    onSubmit(data.name, opts);
    reset();
    setShowMore(false);
  };

  const priorityOptions = [
    { value: 'low' as TodoListPriority, label: t('tasks.priority_low') },
    { value: 'medium' as TodoListPriority, label: t('tasks.priority_medium') },
    { value: 'high' as TodoListPriority, label: t('tasks.priority_high') },
  ];

  const categoryOptions = [
    { value: 'home' as TodoListCategory, label: t('tasks.category_home') },
    {
      value: 'education' as TodoListCategory,
      label: t('tasks.category_education'),
    },
    { value: 'work' as TodoListCategory, label: t('tasks.category_work') },
    { value: 'family' as TodoListCategory, label: t('tasks.category_family') },
    { value: 'health' as TodoListCategory, label: t('tasks.category_health') },
  ];

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-surface rounded-card shadow-card p-6 border border-default"
    >
      <Text as="h2" className="text-xl font-bold text-primary mb-4">
        {isEditing
          ? t('todoListForm.editList')
          : t('todoListForm.createNewList')}
      </Text>
      <div className="flex flex-col sm:flex-row gap-3 items-baseline">
        <Text as="p" className="text-primary font-medium">
          {t('todoListForm.listName')}
        </Text>
        <div className="flex-1">
          <Input
            {...register('name', { required: t('todoListForm.nameEmpty') })}
            type="text"
            placeholder={t('todoListForm.listNamePlaceholder')}
            invalid={!!errors.name}
            inputTestId="todolist-form-input"
            id="todolist-form-input"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowMore((v) => !v)}
        >
          {showMore ? t('todoListForm.less') : t('todoListForm.more')}
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              showMore ? 'rotate-180' : ''
            }`}
          />
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          dataTestId="todolist-form-submit-button"
        >
          {isEditing
            ? t('tasks.save')
            : isSubmitting
            ? t('todoListForm.creating')
            : t('todoListForm.create')}
        </Button>
      </div>

      {errors.name && (
        <Text
          as="p"
          className="text-danger mt-2"
          dataTestId="todolist-form-error"
        >
          {errors.name.message}
        </Text>
      )}

      {showMore && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              id="list-priority-label"
              className="text-sm font-medium text-primary"
            >
              {t('todoListForm.priority')}
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="list-priority"
                  ariaLabelledby="list-priority-label"
                  value={field.value || null}
                  onChange={(value: TodoListPriority | null) =>
                    field.onChange(value ?? '')
                  }
                  options={priorityOptions}
                  nullOption={{ label: t('todoListForm.noPriority') }}
                  placeholder={t('todoListForm.noPriority')}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              id="list-category-label"
              className="text-sm font-medium text-primary"
            >
              {t('todoListForm.category')}
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="list-category"
                  ariaLabelledby="list-category-label"
                  value={field.value || null}
                  onChange={(value: TodoListCategory | null) =>
                    field.onChange(value ?? '')
                  }
                  options={categoryOptions}
                  nullOption={{ label: t('todoListForm.noCategory') }}
                  placeholder={t('todoListForm.noCategory')}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-primary"
              htmlFor="list-due-date"
            >
              {t('todoListForm.dueDate')}
            </label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  id="list-due-date"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-primary"
              htmlFor="list-notes"
            >
              {t('todoListForm.notes')}
            </label>
            <textarea
              id="list-notes"
              {...register('notes')}
              placeholder={t('todoListForm.notesPlaceholder')}
              rows={2}
              className="px-3 py-2 rounded-inner border border-default focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent bg-surface-subtle text-primary placeholder:text-muted resize-none"
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default TodoListForm;
