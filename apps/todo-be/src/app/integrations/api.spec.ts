import request from 'supertest';
import app, { TEST_USER_ID } from '../test-app';
import mongoose from 'mongoose';
import { Todo } from '../models/todo.model';
import { Todolist } from '../models/todoList.model';
import { TodoList } from '@shared/types';

describe('API Integration Tests', () => {
  let todolistId: string;
  let todoId: string;

  beforeEach(async () => {
    const todolist = await Todolist.create({
      name: 'Test Todolist',
      userId: TEST_USER_ID,
    });
    todolistId = todolist._id.toString();
  });

  // --- Todolist API Tests ---
  describe('Todolist API', () => {
    it('should create a new todolist', async () => {
      const res = await request(app)
        .post('/api/users/me/todolists')
        .send({ name: 'My New List' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('My New List');

      const dbTodolist = await Todolist.findById(res.body.id);
      expect(dbTodolist).toBeDefined();
      expect(dbTodolist?.name).toBe('My New List');
    });

    it('should return 400 if missing name for creating todolist', async () => {
      const res = await request(app).post('/api/users/me/todolists').send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.fields).toEqual([{ field: 'name', value: '' }]);
    });

    it('should get all todolists for the authenticated user', async () => {
      await Todolist.create({ name: 'Another List', userId: TEST_USER_ID });
      const res = await request(app).get('/api/users/me/todolists');

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).toHaveProperty('id');
      expect(
        res.body.some((list: TodoList) => list.name === 'Test Todolist')
      ).toBeTruthy();
      expect(
        res.body.some((list: TodoList) => list.name === 'Another List')
      ).toBeTruthy();
    });

    it('records the populated payload size for an image-heavy list', async () => {
      const imageUrl =
        'https://firebasestorage.googleapis.com/v0/b/demo-todo/o/todos%2Fbaseline-user%2Frepresentative-image.jpg?alt=media&token=00000000-0000-0000-0000-000000000000';

      await Todo.insertMany(
        Array.from({ length: 10 }, (_, index) => ({
          name: `Image todo ${index + 1}`,
          todolistId,
          image: imageUrl,
        }))
      );

      const res = await request(app).get('/api/users/me/todolists');
      const payloadBytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].todos).toHaveLength(10);
      expect(payloadBytes).toBeLessThanOrEqual(10_000);
      console.info(`Image-heavy list payload baseline: ${payloadBytes} bytes`);
    });

    it('should not return todolists belonging to other users', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      await Todolist.create({ name: 'Other User List', userId: otherUserId });
      const res = await request(app).get('/api/users/me/todolists');

      expect(res.statusCode).toEqual(200);
      expect(
        res.body.some((list: TodoList) => list.name === 'Other User List')
      ).toBeFalsy();
    });

    it('should get a todolist by id', async () => {
      const res = await request(app).get(
        `/api/users/me/todolists/${todolistId}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(todolistId);
      expect(res.body.name).toBe('Test Todolist');
    });

    it('should return 404 for non-existent todolist id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(
        `/api/users/me/todolists/${nonExistentId}`
      );

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Todolist not found');
    });

    it('should return 404 for todolist belonging to another user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const otherList = await Todolist.create({
        name: 'Other User List',
        userId: otherUserId,
      });
      const res = await request(app).get(
        `/api/users/me/todolists/${otherList._id.toString()}`
      );

      expect(res.statusCode).toEqual(404);
    });

    it('should update a todolist', async () => {
      const updatedName = 'Updated Test Todolist';
      const res = await request(app)
        .put(`/api/users/me/todolists/${todolistId}`)
        .send({ name: updatedName });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(updatedName);

      const dbTodolist = await Todolist.findById(todolistId);
      expect(dbTodolist?.name).toBe(updatedName);
    });

    it('should return 404 if todolist not found for update', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/users/me/todolists/${nonExistentId}`)
        .send({ name: 'Non Existent' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Todolist not found');
    });

    it('should return 400 if missing name for updating todolist', async () => {
      const res = await request(app)
        .put(`/api/users/me/todolists/${todolistId}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.fields).toEqual([{ field: 'name', value: '' }]);
    });

    it('should delete a todolist', async () => {
      const res = await request(app).delete(
        `/api/users/me/todolists/${todolistId}`
      );

      expect(res.statusCode).toEqual(204);

      const dbTodolist = await Todolist.findById(todolistId);
      expect(dbTodolist).toBeNull();
    });

    it('should return 404 if todolist not found for delete', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).delete(
        `/api/users/me/todolists/${nonExistentId}`
      );

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Todolist not found');
    });
  });

  // --- Todo API Tests ---
  describe('Todo API', () => {
    beforeEach(async () => {
      const todo = await Todo.create({
        name: 'Initial Todo',
        todolistId: new mongoose.Types.ObjectId(todolistId),
      });
      todoId = todo._id.toString();
    });

    it('should create a new todo', async () => {
      const res = await request(app)
        .post(`/api/users/me/todolists/${todolistId}/todos`)
        .send({ name: 'Buy groceries' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Buy groceries');
      expect(res.body.todolistId).toBe(todolistId);
      expect(res.body.status).toBe('pending');

      const dbTodo = await Todo.findById(res.body.id);
      expect(dbTodo).toBeDefined();
      expect(dbTodo?.name).toBe('Buy groceries');
    });

    it('should return 400 if missing name for creating todo', async () => {
      const res = await request(app)
        .post(`/api/users/me/todolists/${todolistId}/todos`)
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.fields).toEqual([{ field: 'name', value: '' }]);
    });

    it('should get a todo by id', async () => {
      const res = await request(app).get(
        `/api/users/me/todolists/${todolistId}/todos/${todoId}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(todoId);
      expect(res.body.name).toBe('Initial Todo');
    });

    it('should return 404 for non-existent todo id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(
        `/api/users/me/todolists/${todolistId}/todos/${nonExistentId}`
      );

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Todo not found');
    });

    it('should update a todo', async () => {
      const updatedName = 'Updated Initial Todo';
      const res = await request(app)
        .put(`/api/users/me/todolists/${todolistId}/todos/${todoId}`)
        .send({ name: updatedName, status: 'successful' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(updatedName);
      expect(res.body.status).toBe('successful');

      const dbTodo = await Todo.findById(todoId);
      expect(dbTodo?.name).toBe(updatedName);
      expect(dbTodo?.status).toBe('successful');
    });

    it('should return 404 if todo not found for update', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/users/me/todolists/${todolistId}/todos/${nonExistentId}`)
        .send({ name: 'Non Existent' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Todo not found');
    });

    it('should return 400 if no fields provided for update', async () => {
      const res = await request(app)
        .put(`/api/users/me/todolists/${todolistId}/todos/${todoId}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.fields).toEqual([{ field: '', value: '' }]);
    });

    it('should delete a todo', async () => {
      const res = await request(app).delete(
        `/api/users/me/todolists/${todolistId}/todos/${todoId}`
      );

      expect(res.statusCode).toEqual(204);

      const dbTodo = await Todo.findById(todoId);
      expect(dbTodo).toBeNull();
    });

    it('should return 404 if todo not found for delete', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).delete(
        `/api/users/me/todolists/${todolistId}/todos/${nonExistentId}`
      );

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Todo not found');
    });
  });

  // --- Stats API Tests ---
  describe('Stats API', () => {
    it('should return zero stats when no todos exist', async () => {
      const res = await request(app).get('/api/users/me/stats?period=week');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        completionRate: 0,
      });
    });

    it('should return correct counts for default period', async () => {
      await Todo.create({ name: 'Pending', todolistId });
      await Todo.create({ name: 'Done', todolistId, status: 'successful' });

      const res = await request(app).get('/api/users/me/stats');
      expect(res.statusCode).toEqual(200);
      expect(res.body.total).toBe(2);
      expect(res.body.pending).toBe(1);
      expect(res.body.successful).toBe(1);
      expect(res.body.completionRate).toBe(50);
    });

    it('should return 400 for invalid period', async () => {
      const res = await request(app).get('/api/users/me/stats?period=invalid');
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Invalid period');
    });

    it('should accept all valid periods', async () => {
      for (const period of ['day', 'week', 'month', 'year']) {
        const res = await request(app).get(
          `/api/users/me/stats?period=${period}`
        );
        expect(res.statusCode).toEqual(200);
      }
    });
  });

  // --- Todolist and Todo Interaction Tests ---
  describe('Todolist and Todo Interactions', () => {
    it('should populate todos when fetching a todolist', async () => {
      const newTodolist = await Todolist.create({
        name: 'List with Todos',
        userId: TEST_USER_ID,
      });
      await Todo.create({ name: 'Task 1', todolistId: newTodolist._id });
      await Todo.create({ name: 'Task 2', todolistId: newTodolist._id });

      const res = await request(app).get(
        `/api/users/me/todolists/${newTodolist._id.toString()}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('List with Todos');
      expect(res.body.todos).toBeDefined();
      expect(res.body.todos.length).toBe(2);
      expect(res.body.todos[0].name).toBe('Task 1');
      expect(res.body.todos[1].name).toBe('Task 2');
    });
  });
});
