import { Types } from 'mongoose';
import { Todo } from '../app/models/todo.model';
import { Todolist } from '../app/models/todoList.model';
import { TodoService } from './todo.service';

describe('TodoService.findAllOwned', () => {
  const service = new TodoService(Todo, Todolist);

  it('returns every todo owned by the user when no list is given', async () => {
    const userId = new Types.ObjectId().toString();
    const otherUserId = new Types.ObjectId().toString();
    const listId = new Types.ObjectId();

    await Todo.create({ name: 'Inbox task', userId });
    await Todo.create({ name: 'Listed task', userId, todolistId: listId });
    await Todo.create({ name: "Someone else's task", userId: otherUserId });

    const result = await service.findAllOwned(userId);

    expect(result.map((todo) => todo.name).sort()).toEqual([
      'Inbox task',
      'Listed task',
    ]);
  });

  it('leaves archived todos out', async () => {
    const userId = new Types.ObjectId().toString();

    await Todo.create({ name: 'Active task', userId });
    await Todo.create({ name: 'Old task', userId, archivedAt: new Date() });

    const result = await service.findAllOwned(userId);

    expect(result.map((todo) => todo.name)).toEqual(['Active task']);
  });

  it('scopes to one list when todolistId is given', async () => {
    const userId = new Types.ObjectId().toString();
    const listId = new Types.ObjectId();
    const otherListId = new Types.ObjectId();

    await Todo.create({ name: 'In the list', userId, todolistId: listId });
    await Todo.create({
      name: 'In another list',
      userId,
      todolistId: otherListId,
    });
    await Todo.create({ name: 'Inbox task', userId });

    const result = await service.findAllOwned(userId, listId.toString());

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('In the list');
  });

  it('returns an empty array for a user with no todos', async () => {
    const result = await service.findAllOwned(new Types.ObjectId().toString());

    expect(result).toEqual([]);
  });
});

describe('TodoService.archiveCompleted', () => {
  const service = new TodoService(Todo, Todolist);

  it("archives only the user's completed, not-yet-archived todos", async () => {
    const userId = new Types.ObjectId().toString();
    const otherUserId = new Types.ObjectId().toString();
    const alreadyArchived = new Date('2026-01-01');

    await Todo.create({ name: 'Done', userId, status: 'successful' });
    await Todo.create({ name: 'Pending', userId, status: 'pending' });
    await Todo.create({
      name: 'Done and archived',
      userId,
      status: 'successful',
      archivedAt: alreadyArchived,
    });
    await Todo.create({
      name: "Someone else's",
      userId: otherUserId,
      status: 'successful',
    });

    const result = await service.archiveCompleted(userId);

    expect(result).toEqual({ count: 1 });
    const byName = Object.fromEntries(
      (await Todo.find({})).map((todo) => [todo.name, todo.archivedAt])
    );
    expect(byName['Done']).toBeInstanceOf(Date);
    expect(byName['Pending']).toBeNull();
    // An earlier archive date is kept, not overwritten.
    expect(byName['Done and archived']).toEqual(alreadyArchived);
    expect(byName["Someone else's"]).toBeNull();
  });
});
