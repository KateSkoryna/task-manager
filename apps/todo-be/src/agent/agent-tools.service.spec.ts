import { Logger } from '@nestjs/common';
import { TodoItem } from '@shared/types';
import {
  AgentToolsService,
  PHASE_10_TASK_THRESHOLD,
} from './agent-tools.service';
import { AgentSessionService } from './agent-session.service';
import { TodoService } from '../todo/todo.service';

const makeTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 'todo-1',
  name: 'Buy milk',
  status: 'pending',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
  ...overrides,
});

describe('AgentToolsService', () => {
  let todoService: jest.Mocked<TodoService>;
  let agentSessionService: jest.Mocked<AgentSessionService>;
  let service: AgentToolsService;

  beforeEach(() => {
    todoService = {
      create: jest.fn(),
      updateOwned: jest.fn(),
      deleteOwned: jest.fn(),
      findAllOwned: jest.fn(),
      listExists: jest.fn(),
    } as unknown as jest.Mocked<TodoService>;
    agentSessionService = {
      createConfirmation: jest.fn(),
      consumeConfirmation: jest.fn(),
    } as unknown as jest.Mocked<AgentSessionService>;
    service = new AgentToolsService(todoService, agentSessionService);
  });

  describe('createTasks', () => {
    it('creates every task in the inbox and returns them', async () => {
      const created = [makeTodo({ id: 'a' }), makeTodo({ id: 'b' })];
      todoService.create
        .mockResolvedValueOnce(created[0])
        .mockResolvedValueOnce(created[1]);

      const result = await service.createTasks('user-1', {
        tasks: [
          {
            name: 'Buy milk',
            dueDate: null,
            priority: 'medium',
            notes: null,
            ambiguous: false,
          },
          {
            name: 'Call mom',
            dueDate: '2026-09-10',
            priority: 'high',
            notes: null,
            ambiguous: false,
          },
        ],
      });

      expect(result).toEqual({ ok: true, data: created });
      expect(todoService.create).toHaveBeenCalledTimes(2);
      expect(todoService.create).toHaveBeenNthCalledWith(
        1,
        null,
        { name: 'Buy milk', dueDate: null, notes: null, priority: 'medium' },
        'user-1'
      );
    });
  });

  describe('updateTask', () => {
    it('updates the task and returns it', async () => {
      const updated = makeTodo({ priority: 'high' });
      todoService.updateOwned.mockResolvedValue(updated);

      const result = await service.updateTask('user-1', {
        id: 'todo-1',
        priority: 'high',
      });

      expect(result).toEqual({ ok: true, data: updated });
      expect(todoService.updateOwned).toHaveBeenCalledWith('todo-1', 'user-1', {
        priority: 'high',
      });
    });

    it('returns not_found when the task does not exist or is not owned', async () => {
      todoService.updateOwned.mockResolvedValue(null);

      const result = await service.updateTask('user-1', {
        id: 'missing',
        priority: 'high',
      });

      expect(result).toEqual({ ok: false, reason: 'not_found' });
    });

    it('moves the task to another list once ownership of that list is confirmed', async () => {
      const updated = makeTodo({ todolistId: 'list-1' });
      todoService.listExists.mockResolvedValue(true);
      todoService.updateOwned.mockResolvedValue(updated);

      const result = await service.updateTask('user-1', {
        id: 'todo-1',
        todolistId: 'list-1',
      });

      expect(result).toEqual({ ok: true, data: updated });
      expect(todoService.listExists).toHaveBeenCalledWith('list-1', 'user-1');
    });

    it('refuses to move a task to a list the user does not own', async () => {
      todoService.listExists.mockResolvedValue(false);

      const result = await service.updateTask('user-1', {
        id: 'todo-1',
        todolistId: 'someone-elses-list',
      });

      expect(result).toEqual({ ok: false, reason: 'todolist_not_found' });
      expect(todoService.updateOwned).not.toHaveBeenCalled();
    });

    it('moves the task to the inbox without an ownership check', async () => {
      const updated = makeTodo({ todolistId: null });
      todoService.updateOwned.mockResolvedValue(updated);

      const result = await service.updateTask('user-1', {
        id: 'todo-1',
        todolistId: null,
      });

      expect(result).toEqual({ ok: true, data: updated });
      expect(todoService.listExists).not.toHaveBeenCalled();
    });
  });

  describe('completeTask', () => {
    it('marks the task successful with a completion date', async () => {
      const completed = makeTodo({ status: 'successful' });
      todoService.updateOwned.mockResolvedValue(completed);

      const result = await service.completeTask('user-1', { id: 'todo-1' });

      expect(result).toEqual({ ok: true, data: completed });
      expect(todoService.updateOwned).toHaveBeenCalledWith(
        'todo-1',
        'user-1',
        expect.objectContaining({
          status: 'successful',
          completedAt: expect.any(String),
        })
      );
    });

    it('returns not_found when the task does not exist or is not owned', async () => {
      todoService.updateOwned.mockResolvedValue(null);

      const result = await service.completeTask('user-1', { id: 'missing' });

      expect(result).toEqual({ ok: false, reason: 'not_found' });
    });
  });

  describe('deleteTask', () => {
    it('never deletes without a confirmation token, and proposes one instead', async () => {
      agentSessionService.createConfirmation.mockResolvedValue('token-abc');

      const result = await service.deleteTask('user-1', 'chat-1', {
        id: 'todo-1',
      });

      expect(result).toEqual({
        ok: false,
        reason: 'confirmation_required',
        proposal: {
          toolName: 'delete_task',
          input: { id: 'todo-1' },
          token: 'token-abc',
        },
      });
      expect(agentSessionService.createConfirmation).toHaveBeenCalledWith(
        'user-1',
        'chat-1',
        'delete_task',
        { id: 'todo-1' }
      );
      expect(todoService.deleteOwned).not.toHaveBeenCalled();
    });

    it('deletes once a valid confirmation token is consumed', async () => {
      const deleted = makeTodo();
      agentSessionService.consumeConfirmation.mockResolvedValue(true);
      todoService.deleteOwned.mockResolvedValue(deleted);

      const result = await service.deleteTask('user-1', 'chat-1', {
        id: 'todo-1',
        confirmationToken: 'token-abc',
      });

      expect(result).toEqual({ ok: true, data: deleted });
      expect(agentSessionService.consumeConfirmation).toHaveBeenCalledWith(
        'user-1',
        'chat-1',
        'token-abc',
        'delete_task',
        { id: 'todo-1' }
      );
      expect(todoService.deleteOwned).toHaveBeenCalledWith('todo-1', 'user-1');
    });

    it('refuses to replay an already-consumed confirmation token', async () => {
      agentSessionService.consumeConfirmation.mockResolvedValue(false);
      agentSessionService.createConfirmation.mockResolvedValue('token-new');

      const result = await service.deleteTask('user-1', 'chat-1', {
        id: 'todo-1',
        confirmationToken: 'token-abc',
      });

      expect(result).toEqual({
        ok: false,
        reason: 'confirmation_required',
        proposal: {
          toolName: 'delete_task',
          input: { id: 'todo-1' },
          token: 'token-new',
        },
      });
      expect(todoService.deleteOwned).not.toHaveBeenCalled();
    });

    it('passes the current id to consumeConfirmation, not just the token, so a token cannot be redirected onto a different task', async () => {
      agentSessionService.consumeConfirmation.mockResolvedValue(false);
      agentSessionService.createConfirmation.mockResolvedValue('token-new');

      await service.deleteTask('user-1', 'chat-1', {
        id: 'todo-2',
        confirmationToken: 'token-for-todo-1',
      });

      expect(agentSessionService.consumeConfirmation).toHaveBeenCalledWith(
        'user-1',
        'chat-1',
        'token-for-todo-1',
        'delete_task',
        { id: 'todo-2' }
      );
      expect(todoService.deleteOwned).not.toHaveBeenCalled();
    });

    it('returns not_found when a confirmed task does not exist or is not owned', async () => {
      agentSessionService.consumeConfirmation.mockResolvedValue(true);
      todoService.deleteOwned.mockResolvedValue(null);

      const result = await service.deleteTask('user-1', 'chat-1', {
        id: 'missing',
        confirmationToken: 'token-abc',
      });

      expect(result).toEqual({ ok: false, reason: 'not_found' });
    });
  });

  describe('listTasks', () => {
    it('lists the inbox when todolistId is explicitly null', async () => {
      const inbox = [makeTodo()];
      todoService.findAllOwned.mockResolvedValue(inbox);

      const result = await service.listTasks('user-1', { todolistId: null });

      expect(result).toEqual({ ok: true, data: inbox });
      expect(todoService.findAllOwned).toHaveBeenCalledWith('user-1', null);
    });

    it('lists a specific list when todolistId is a string', async () => {
      const listTodos = [makeTodo({ todolistId: 'list-1' })];
      todoService.findAllOwned.mockResolvedValue(listTodos);

      const result = await service.listTasks('user-1', {
        todolistId: 'list-1',
      });

      expect(result).toEqual({ ok: true, data: listTodos });
      expect(todoService.findAllOwned).toHaveBeenCalledWith('user-1', 'list-1');
    });

    it('lists everything when todolistId is omitted', async () => {
      const all = [
        makeTodo(),
        makeTodo({ id: 'todo-2', todolistId: 'list-1' }),
      ];
      todoService.findAllOwned.mockResolvedValue(all);

      const result = await service.listTasks('user-1', {});

      expect(result).toEqual({ ok: true, data: all });
      expect(todoService.findAllOwned).toHaveBeenCalledWith(
        'user-1',
        undefined
      );
    });
  });

  describe('findTasks', () => {
    it('returns only the allow-listed fields, never image or notes', async () => {
      todoService.findAllOwned.mockResolvedValue([
        makeTodo({
          id: 'todo-1',
          notes: 'secret notes',
          image: 'data:image/png;base64,abc',
        }),
      ]);

      const result = await service.findTasks('user-1', { query: 't-shirt' });

      expect(result).toEqual({
        ok: true,
        data: {
          tasks: [
            {
              id: 'todo-1',
              name: 'Buy milk',
              dueDate: null,
              priority: 'medium',
              status: 'pending',
              todolistId: null,
            },
          ],
          truncated: false,
        },
      });
      expect(todoService.findAllOwned).toHaveBeenCalledWith('user-1');
    });

    it("queries only the requesting user's tasks, with no list filter", async () => {
      todoService.findAllOwned.mockResolvedValue([makeTodo({ id: 'mine' })]);

      await service.findTasks('user-1', { query: 'anything' });

      expect(todoService.findAllOwned).toHaveBeenCalledWith('user-1');
      expect(todoService.findAllOwned).toHaveBeenCalledTimes(1);
    });

    it('caps the result at 500 tasks and reports the truncation', async () => {
      const many = Array.from({ length: 600 }, (_, i) =>
        makeTodo({ id: `todo-${i}` })
      );
      todoService.findAllOwned.mockResolvedValue(many);

      const result = await service.findTasks('user-1', { query: 'anything' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.tasks).toHaveLength(500);
        expect(result.data.truncated).toBe(true);
      }
    });

    it('warns once when the task-count threshold is exceeded, without logging the query or task names', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      const many = Array.from({ length: PHASE_10_TASK_THRESHOLD + 1 }, (_, i) =>
        makeTodo({ id: `todo-${i}`, name: `secret task name ${i}` })
      );
      todoService.findAllOwned.mockResolvedValue(many);

      await service.findTasks('user-1', { query: 'a secret query' });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain('PLAN.md Phase 10 trigger reached');
      expect(message).not.toContain('secret task name');
      expect(message).not.toContain('a secret query');
      warnSpy.mockRestore();
    });

    it('stays silent below both thresholds', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      todoService.findAllOwned.mockResolvedValue([makeTodo()]);

      await service.findTasks('user-1', { query: 'anything' });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
