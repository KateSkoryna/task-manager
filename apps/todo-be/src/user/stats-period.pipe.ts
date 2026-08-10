import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { StatsPeriod } from '@shared/types';

const VALID_PERIODS: StatsPeriod[] = ['day', 'week', 'month', 'year'];

@Injectable()
export class StatsPeriodPipe
  implements PipeTransform<string | undefined, StatsPeriod>
{
  transform(value?: string): StatsPeriod {
    const period = (value || 'week') as StatsPeriod;
    if (!VALID_PERIODS.includes(period)) {
      throw new BadRequestException({
        message: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}`,
      });
    }
    return period;
  }
}
