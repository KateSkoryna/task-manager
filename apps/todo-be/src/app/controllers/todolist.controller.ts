import { Request, Response } from 'express';
import { TodolistRepository } from '../repositories/todolist.repository';
import {
  createValidationError,
  createValidationErrorFromZod,
} from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  todolistCreateSchema,
  todolistUpdateSchema,
} from '@shared/types';
import mongoose from 'mongoose';

export const TodolistController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId;
      const lists = await TodolistRepository.findAll(userId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching todolists',
        error: (error as Error).message,
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { todolistId } = req.params;
      const userId = (req as AuthRequest).userId;

      if (!mongoose.Types.ObjectId.isValid(todolistId)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'id', value: todolistId }]));
      }

      const list = await TodolistRepository.findById(todolistId, userId);
      if (!list) {
        return res.status(404).json({ message: 'Todolist not found' });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching todolist',
        error: (error as Error).message,
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).userId;
      const parsed = todolistCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json(createValidationErrorFromZod(parsed.error, req.body));
      }

      const newList = await TodolistRepository.create({
        ...parsed.data,
        userId,
      });
      res.status(201).json(newList);
    } catch (error) {
      res.status(500).json({
        message: 'Error creating todolist',
        error: (error as Error).message,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { todolistId } = req.params;
      const userId = (req as AuthRequest).userId;

      if (!mongoose.Types.ObjectId.isValid(todolistId)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'id', value: todolistId }]));
      }

      const parsed = todolistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json(createValidationErrorFromZod(parsed.error, req.body));
      }

      const updatedList = await TodolistRepository.update(
        todolistId,
        parsed.data,
        userId
      );
      if (!updatedList) {
        return res.status(404).json({ message: 'Todolist not found' });
      }
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({
        message: 'Error updating todolist',
        error: (error as Error).message,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { todolistId } = req.params;
      const userId = (req as AuthRequest).userId;

      if (!mongoose.Types.ObjectId.isValid(todolistId)) {
        return res
          .status(400)
          .json(createValidationError([{ field: 'id', value: todolistId }]));
      }

      const deletedList = await TodolistRepository.delete(todolistId, userId);
      if (!deletedList) {
        return res.status(404).json({ message: 'Todolist not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: 'Error deleting todolist',
        error: (error as Error).message,
      });
    }
  },
};
