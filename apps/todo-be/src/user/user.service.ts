import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StatsPeriod, UserStats } from '@shared/types';
import { ITodoDocument, TODO_MODEL_NAME } from '../app/models/todo.model';
import { executeOperation } from '../common/utils/execute-operation';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(TODO_MODEL_NAME)
    private readonly todoModel: Model<ITodoDocument>
  ) {}

  getStats(userId: string, period: StatsPeriod): Promise<UserStats> {
    return executeOperation('Error fetching stats', async () => {
      const periodStart = new Date();
      if (period === 'day') periodStart.setDate(periodStart.getDate() - 1);
      else if (period === 'week')
        periodStart.setDate(periodStart.getDate() - 7);
      else if (period === 'month')
        periodStart.setMonth(periodStart.getMonth() - 1);
      else periodStart.setFullYear(periodStart.getFullYear() - 1);

      /**
       * Matches `userId` on the todo directly rather than joining through its
       * list. The previous `$lookup`/`$unwind` silently dropped every todo with
       * `todolistId: null`, so inbox tasks — which is where the agent puts
       * everything by default — were missing from every statistic.
       *
       * This requires `userId` to be populated; `tools/migrations/001` backfills
       * it for documents created before the field existed.
       */
      const results = await this.todoModel.aggregate<{
        _id: string;
        count: number;
      }>([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            createdAt: { $gte: periodStart },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const counts: Record<string, number> = {
        pending: 0,
        successful: 0,
        failed: 0,
      };
      for (const result of results) counts[result._id] = result.count;
      const total = counts.pending + counts.successful + counts.failed;
      return {
        total,
        successful: counts.successful,
        failed: counts.failed,
        pending: counts.pending,
        completionRate:
          total > 0
            ? Math.round(((counts.successful + counts.failed) / total) * 100)
            : 0,
      };
    });
  }
}
