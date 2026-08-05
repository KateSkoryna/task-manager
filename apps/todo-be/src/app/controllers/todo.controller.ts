import { Request, Response } from 'express';
import { TodoRepository } from '../repositories/todo.repository';
import { TodolistRepository } from '../repositories/todolist.repository';
import {
  createValidationError,
  createValidationErrorFromZod,
} from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { todoCreateSchema, todoUpdateSchema } from '@shared/types';
import mongoose from 'mongoose';

export const TodoController = {
  getById: async (req: Request, res: Response) => {
    try {
      const { todolistId, id } = req.params;
      const userId = (req as AuthRequest).userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'id', value: id }]));
      }

      const todolist = await TodolistRepository.findById(todolistId, userId);
      if (!todolist) {
        return res.status(404).json({ message: 'Todolist not found' });
      }

      const todo = await TodoRepository.findById(id);
      if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
      }
      res.json(todo);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching todo',
        error: (error as Error).message,
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { todolistId } = req.params;
      const userId = (req as AuthRequest).userId;
      if (!todolistId || !mongoose.Types.ObjectId.isValid(todolistId)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'todolistId', value: todolistId ?? '' }]));
      }

      const parsed = todoCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json(createValidationErrorFromZod(parsed.error, req.body));
      }

      const todolist = await TodolistRepository.findById(todolistId, userId);
      if (!todolist) {
        return res.status(404).json({ message: 'Todolist not found' });
      }

      const newTodo = await TodoRepository.create(todolistId, {
        ...parsed.data,
        dueDate: parsed.data.dueDate ?? null,
        location: parsed.data.location ?? null,
        notes: parsed.data.notes ?? null,
        completedAt: parsed.data.completedAt ?? null,
        image: parsed.data.image ?? null,
      });
      res.status(201).json(newTodo);
    } catch (error) {
      res.status(500).json({
        message: 'Error creating todo',
        error: (error as Error).message,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { todolistId, id } = req.params;
      const userId = (req as AuthRequest).userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'id', value: id }]));
      }

      const parsed = todoUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json(createValidationErrorFromZod(parsed.error, req.body));
      }

      const todolist = await TodolistRepository.findById(todolistId, userId);
      if (!todolist) {
        return res.status(404).json({ message: 'Todolist not found' });
      }

      const updatedTodo = await TodoRepository.update(id, parsed.data);
      if (!updatedTodo) {
        return res.status(404).json({ message: 'Todo not found' });
      }
      res.json(updatedTodo);
    } catch (error) {
      res.status(500).json({
        message: 'Error updating todo',
        error: (error as Error).message,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { todolistId, id } = req.params;
      const userId = (req as AuthRequest).userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'id', value: id }]));
      }

      const todolist = await TodolistRepository.findById(todolistId, userId);
      if (!todolist) {
        return res.status(404).json({ message: 'Todolist not found' });
      }

      const deletedTodo = await TodoRepository.delete(id);
      if (!deletedTodo) {
        return res.status(404).json({ message: 'Todo not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: 'Error deleting todo',
        error: (error as Error).message,
      });
    }
  },
};
