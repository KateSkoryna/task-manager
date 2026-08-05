import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, Upload, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Input from '../elements/Input';
import Button from '../elements/Button';
import DatePickerInput from '../elements/DatePickerInput';
import { uploadImage } from '../../lib/imageUtils';
import { useAuthStore } from '../../store/authStore';
import { todoCreateSchema } from '@shared/types';

type NewTodoOpts = {
  dueDate?: string;
  location?: string;
  notes?: string;
  image?: string | null;
};

type FormProps = {
  onAddTodo: (name: string, opts?: NewTodoOpts) => void;
};

type FormInput = z.input<typeof todoCreateSchema>;
type FormOutput = z.output<typeof todoCreateSchema>;

const TodoForm: React.FC<FormProps> = ({ onAddTodo }) => {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.firebaseUid);
  const [showExtra, setShowExtra] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(todoCreateSchema),
    defaultValues: { name: '', dueDate: '', location: '', notes: '' },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setImageError(null);
    setImageUploading(true);
    try {
      const url = await uploadImage(file, userId);
      setImage(url);
    } catch (err) {
      setImageError((err as Error).message);
      setImage(null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFormSubmit = (data: FormOutput) => {
    const opts: NewTodoOpts = {};
    if (data.dueDate) opts.dueDate = data.dueDate;
    if (data.location?.trim()) opts.location = data.location.trim();
    if (data.notes?.trim()) opts.notes = data.notes.trim();
    if (image) opts.image = image;
    onAddTodo(data.name.trim(), Object.keys(opts).length ? opts : undefined);
    reset();
    setShowExtra(false);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="flex flex-col sm:flex-row gap-3 items-baseline">
        <label htmlFor="new-todo-name" className="text-dark-bg font-medium">
          {t('todoForm.todoName')}
        </label>
        <Input
          {...register('name', { required: t('todoForm.titleEmpty') })}
          id="new-todo-name"
          type="text"
          placeholder={t('todoForm.addPlaceholder')}
          className={`flex-1 px-4 py-2 rounded-lg border-2 ${
            errors.name ? 'border-red-500' : 'border-secondary-bg'
          } focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent bg-white text-dark-bg placeholder-secondary-dark-bg`}
          inputTestId="todo-form-input"
        />
        <Button
          type="submit"
          className="px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-dark-bg hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          dataTestId="todo-form-submit-button"
        >
          {t('todoForm.add')}
        </Button>
      </div>

      {errors.name && (
        <p
          className="text-red-500 text-sm mt-1"
          data-testid="todo-error-message"
        >
          {errors.name.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowExtra((v) => !v)}
        className="mt-2 text-sm text-secondary-dark-bg hover:text-dark-bg underline focus:outline-none"
        data-testid="todo-form-toggle-extra"
      >
        {showExtra ? t('todoForm.hideOptions') : t('todoForm.moreOptions')}
      </button>

      {showExtra && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-baseline">
            <label
              htmlFor="new-todo-due-date"
              className="text-dark-bg font-medium w-24"
            >
              {t('todoForm.dueDate')}
            </label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  id="new-todo-due-date"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-baseline">
            <label
              htmlFor="new-todo-location"
              className="text-dark-bg font-medium w-24"
            >
              {t('todoForm.location')}
            </label>
            <input
              id="new-todo-location"
              type="text"
              {...register('location')}
              placeholder={t('todoForm.locationPlaceholder')}
              className="flex-1 px-3 py-2 rounded-lg border-2 border-secondary-bg focus:border-accent focus:outline-none bg-white text-dark-bg placeholder-secondary-dark-bg"
              data-testid="todo-form-location"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-baseline">
            <label
              htmlFor="new-todo-notes"
              className="text-dark-bg font-medium w-24"
            >
              {t('todoForm.notes')}
            </label>
            <textarea
              id="new-todo-notes"
              {...register('notes')}
              placeholder={t('todoForm.notesPlaceholder')}
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border-2 border-secondary-bg focus:border-accent focus:outline-none bg-white text-dark-bg placeholder-secondary-dark-bg resize-none"
              data-testid="todo-form-notes"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-baseline">
            <label
              htmlFor="new-todo-image"
              className="text-dark-bg font-medium w-24"
            >
              {t('todoForm.image')}
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="new-todo-image"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                data-testid="todo-form-image"
              />
              {!image && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-secondary-bg hover:border-accent hover:bg-accent/10 text-secondary-dark-bg hover:text-dark-bg transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageUploading ? (
                    <>
                      <Upload size={16} className="animate-bounce" />
                      <span className="text-sm">{t('todoForm.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={16} />
                      <span className="text-sm">
                        {t('todoForm.chooseImage')}
                      </span>
                    </>
                  )}
                </button>
              )}
              {imageError && (
                <p className="text-red-500 text-sm">{imageError}</p>
              )}
              {image && (
                <div className="flex items-center gap-2">
                  <img
                    src={image}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="w-6 h-6 flex items-center justify-center shrink-0 rounded-lg text-secondary-dark-bg hover:text-red-500 transition-colors outline-none cursor-pointer"
                    aria-label="Remove image"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default TodoForm;
