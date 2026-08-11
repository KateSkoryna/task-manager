import {
  todoCreateSchema,
  todoUpdateSchema,
  todolistCreateSchema,
  todolistUpdateSchema,
} from '@shared/types';

describe('shared request schemas', () => {
  it('rejects the same invalid todo fixture at the shared boundary', () => {
    const fixture = { name: 'Task', dueDate: 'not-a-date' };

    expect(todoCreateSchema.safeParse(fixture).success).toBe(false);
    expect(
      todoUpdateSchema.safeParse({ dueDate: fixture.dueDate }).success
    ).toBe(false);
  });

  it('enforces completion metadata when creating a completed todo', () => {
    expect(
      todoCreateSchema.safeParse({ name: 'Done', status: 'successful' }).success
    ).toBe(false);
    expect(
      todoCreateSchema.safeParse({
        name: 'Done',
        status: 'successful',
        completedAt: '2026-04-01T00:00:00.000Z',
      }).success
    ).toBe(true);
  });

  it('rejects empty partial updates for todos and todo lists', () => {
    expect(todoUpdateSchema.safeParse({}).success).toBe(false);
    expect(todolistUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a Firebase Storage download URL for the todo image', () => {
    const result = todoCreateSchema.safeParse({
      name: 'Task',
      image:
        'https://firebasestorage.googleapis.com/v0/b/todo-app.appspot.com/o/todos%2Fuser1%2F123_photo.jpg?alt=media&token=abc',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a local Storage emulator URL for the todo image', () => {
    const result = todoCreateSchema.safeParse({
      name: 'Task',
      image: 'http://127.0.0.1:9199/v0/b/todo-app/o/todos%2Fuser1%2Fphoto.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a raw base64 data URI for the todo image', () => {
    const result = todoCreateSchema.safeParse({
      name: 'Task',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an image URL from a non-Firebase-Storage host', () => {
    const result = todoCreateSchema.safeParse({
      name: 'Task',
      image: 'https://evil.example.com/photo.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes an empty image string to null', () => {
    const result = todoCreateSchema.safeParse({ name: 'Task', image: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image).toBeNull();
    }
  });

  it('normalizes empty optional form values for todo lists', () => {
    const result = todolistCreateSchema.safeParse({
      name: 'Work',
      priority: '',
      category: '',
      dueDate: '',
      notes: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Work',
        priority: undefined,
        category: undefined,
        dueDate: null,
        notes: null,
      });
    }
  });
});
