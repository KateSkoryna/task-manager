import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { REPORT_PERIODS, ReportPeriod } from '@shared/types';

@Injectable()
export class ReportPeriodPipe
  implements PipeTransform<string | undefined, ReportPeriod | 'all'>
{
  /** `all` lists every period; a missing value still means weekly. */
  transform(value?: string): ReportPeriod | 'all' {
    if (value === 'all') return 'all';
    const period = (value || 'weekly') as ReportPeriod;
    if (!REPORT_PERIODS.includes(period)) {
      throw new BadRequestException({
        message: `Invalid period. Must be one of: ${[
          ...REPORT_PERIODS,
          'all',
        ].join(', ')}`,
      });
    }
    return period;
  }
}
