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
