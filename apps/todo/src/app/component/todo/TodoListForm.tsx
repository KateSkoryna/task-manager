import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TodoListPriority,
  TodoListCategory,
  todolistCreateSchema,
} from '@shared/types';
import { useTranslation } from 'react-i18next';
import Input from '../elements/Input';
import Button from '../elements/Button';
import Text from '../elements/Text';
import DetailsSelect from '../elements/DetailsSelect';
import DatePickerInput from '../elements/DatePickerInput';

type TodoListFormOpts = {
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
};

type TodoListFormProps = {
  onSubmit: (name: string, opts?: TodoListFormOpts) => void;
  isSubmitting: boolean;
};

type FormInput = z.input<typeof todolistCreateSchema>;
type FormOutput = z.output<typeof todolistCreateSchema>;

const TodoListForm: React.FC<TodoListFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);
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
      name: '',
      priority: '',
      category: '',
      dueDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    reset();
    setShowMore(false);
  }, [userId, reset]);

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
      className="bg-white rounded-lg shadow-lg p-6 border-2 border-secondary-bg"
    >
      <Text as="h2" className="text-xl font-bold text-dark-bg mb-4">
        {t('todoListForm.createNewList')}
      </Text>
      <div className="flex flex-col sm:flex-row gap-3 items-baseline">
        <Text as="p" className="text-dark-bg font-medium">
          {t('todoListForm.listName')}
        </Text>
        <Input
          {...register('name', { required: t('todoListForm.nameEmpty') })}
          type="text"
          placeholder={t('todoListForm.listNamePlaceholder')}
          className={`flex-1 px-4 py-2 rounded-lg border-2 ${
            errors.name ? 'border-red-500' : 'border-secondary-bg'
          } focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent bg-base-bg text-dark-bg placeholder-secondary-dark-bg`}
          inputTestId="todolist-form-input"
          id="todolist-form-input"
        />
        <Button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="px-4 py-2 bg-secondary-bg text-dark-bg font-medium rounded hover:bg-accent hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {showMore ? t('todoListForm.less') : t('todoListForm.more')}
        </Button>
        <Button
          type="submit"
          className="px-6 py-2 bg-accent text-black font-semibold rounded hover:bg-dark-bg hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          disabled={isSubmitting}
          dataTestId="todolist-form-submit-button"
        >
          {isSubmitting ? t('todoListForm.creating') : t('todoListForm.create')}
        </Button>
      </div>

      {errors.name && (
        <Text
          as="p"
          className="text-red-500 mt-2"
          dataTestId="todolist-form-error"
        >
          {errors.name.message}
        </Text>
      )}

      {showMore && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-dark-bg"
              htmlFor="list-priority"
            >
              {t('todoListForm.priority')}
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <DetailsSelect
                  id="list-priority"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={priorityOptions}
                  placeholder={t('todoListForm.noPriority')}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-dark-bg"
              htmlFor="list-category"
            >
              {t('todoListForm.category')}
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <DetailsSelect
                  id="list-category"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={categoryOptions}
                  placeholder={t('todoListForm.noCategory')}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-dark-bg"
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
              className="text-sm font-medium text-dark-bg"
              htmlFor="list-notes"
            >
              {t('todoListForm.notes')}
            </label>
            <textarea
              id="list-notes"
              {...register('notes')}
              placeholder={t('todoListForm.notesPlaceholder')}
              rows={2}
              className="px-3 py-2 rounded-lg border-2 border-secondary-bg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent bg-base-bg text-dark-bg placeholder-secondary-dark-bg resize-none"
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default TodoListForm;
