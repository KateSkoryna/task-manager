import {
  agentToolCallSchema,
  completeTaskInput,
  createTasksInput,
  deleteTaskInput,
  findTasksInput,
  listTasksInput,
  TOOL_NAMES,
  updateTaskInput,
} from './agent-tools.schemas';

describe('createTasksInput', () => {
  it('accepts a valid single-task payload', () => {
    const result = createTasksInput.safeParse({
      tasks: [{ name: 'Buy milk' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown top-level field', () => {
    const result = createTasksInput.safeParse({
      tasks: [{ name: 'Buy milk' }],
      extra: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown field on a nested task', () => {
    const result = createTasksInput.safeParse({
      tasks: [{ name: 'Buy milk', unknownField: 'x' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an oversized notes string on a nested task', () => {
    const result = createTasksInput.safeParse({
      tasks: [{ name: 'Buy milk', notes: 'x'.repeat(2001) }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty tasks array', () => {
    const result = createTasksInput.safeParse({ tasks: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an empty input', () => {
    const result = createTasksInput.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('updateTaskInput', () => {
  it('accepts a valid partial update', () => {
    const result = updateTaskInput.safeParse({ id: 'abc', priority: 'high' });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown field', () => {
    const result = updateTaskInput.safeParse({ id: 'abc', bogus: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects an oversized notes string', () => {
    const result = updateTaskInput.safeParse({
      id: 'abc',
      notes: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an update with no fields beyond id', () => {
    const result = updateTaskInput.safeParse({ id: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty input', () => {
    const result = updateTaskInput.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('completeTaskInput', () => {
  it('accepts a valid id', () => {
    expect(completeTaskInput.safeParse({ id: 'abc' }).success).toBe(true);
  });

  it('rejects an unknown field', () => {
    expect(completeTaskInput.safeParse({ id: 'abc', extra: 1 }).success).toBe(
      false
    );
  });

  it('rejects an empty input', () => {
    expect(completeTaskInput.safeParse({}).success).toBe(false);
  });
});

describe('deleteTaskInput', () => {
  it('accepts a valid id', () => {
    expect(deleteTaskInput.safeParse({ id: 'abc' }).success).toBe(true);
  });

  it('rejects an unknown field', () => {
    expect(deleteTaskInput.safeParse({ id: 'abc', extra: 1 }).success).toBe(
      false
    );
  });

  it('rejects an empty input', () => {
    expect(deleteTaskInput.safeParse({}).success).toBe(false);
  });
});

describe('listTasksInput', () => {
  it('accepts an empty input', () => {
    expect(listTasksInput.safeParse({}).success).toBe(true);
  });

  it('accepts an explicit null todolistId for the inbox', () => {
    expect(listTasksInput.safeParse({ todolistId: null }).success).toBe(true);
  });

  it('rejects an unknown field', () => {
    expect(listTasksInput.safeParse({ extra: 1 }).success).toBe(false);
  });
});

describe('findTasksInput', () => {
  it('accepts a valid query', () => {
    expect(findTasksInput.safeParse({ query: 't-shirt' }).success).toBe(true);
  });

  it('rejects an unknown field', () => {
    expect(
      findTasksInput.safeParse({ query: 't-shirt', extra: 1 }).success
    ).toBe(false);
  });

  it('rejects an empty query', () => {
    expect(findTasksInput.safeParse({ query: '' }).success).toBe(false);
  });

  it('rejects an oversized query', () => {
    expect(findTasksInput.safeParse({ query: 'x'.repeat(201) }).success).toBe(
      false
    );
  });

  it('rejects an empty input', () => {
    expect(findTasksInput.safeParse({}).success).toBe(false);
  });
});

describe('agentToolCallSchema', () => {
  it('discriminates on name and validates the matching input', () => {
    const result = agentToolCallSchema.safeParse({
      name: 'delete_task',
      input: { id: 'abc' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an input shape that does not match its declared name', () => {
    const result = agentToolCallSchema.safeParse({
      name: 'delete_task',
      input: { tasks: [{ name: 'Buy milk' }] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown tool name', () => {
    const result = agentToolCallSchema.safeParse({
      name: 'wipe_database',
      input: {},
    });
    expect(result.success).toBe(false);
  });

  it('has one union member per declared tool name', () => {
    const names = agentToolCallSchema.options.map(
      (option) => option.shape.name.value
    );
    expect(names.sort()).toEqual([...TOOL_NAMES].sort());
  });

  it('rejects an unknown field on the envelope itself', () => {
    const result = agentToolCallSchema.safeParse({
      name: 'delete_task',
      input: { id: 'abc' },
      extraTopLevel: true,
    });
    expect(result.success).toBe(false);
  });
});
