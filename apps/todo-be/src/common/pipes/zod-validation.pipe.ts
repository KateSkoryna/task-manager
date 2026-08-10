import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';
import { createValidationErrorFromZod } from '../validation/validation-error';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(
        createValidationErrorFromZod(result.error, value)
      );
    }
    return result.data;
  }
}
