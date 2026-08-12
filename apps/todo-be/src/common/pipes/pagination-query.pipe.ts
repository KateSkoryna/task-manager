import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQuery, paginationQuerySchema } from '@shared/types';
import {
  createValidationError,
  createValidationErrorFromZod,
} from '../validation/validation-error';

@Injectable()
export class PaginationQueryPipe
  implements PipeTransform<unknown, PaginationQuery>
{
  transform(value: unknown): PaginationQuery {
    const result = paginationQuerySchema.safeParse(value ?? {});
    if (!result.success) {
      throw new BadRequestException(
        createValidationErrorFromZod(result.error, value)
      );
    }
    const { cursor } = result.data;
    if (cursor && !Types.ObjectId.isValid(cursor)) {
      throw new BadRequestException(
        createValidationError([{ field: 'cursor', value: cursor }])
      );
    }
    return result.data;
  }
}
