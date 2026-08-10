import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
import { createValidationError } from '../validation/validation-error';

@Injectable()
export class MongoIdPipe implements PipeTransform<string, string> {
  constructor(private readonly field = 'id') {}

  transform(value: string): string {
    if (!value || !Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        createValidationError([{ field: this.field, value: value ?? '' }])
      );
    }
    return value;
  }
}
