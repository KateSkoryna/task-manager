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
    expect(todoUpdateSchema.safeParse({ dueDate: fixture.dueDate }).success).toBe(
      false
    );
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
