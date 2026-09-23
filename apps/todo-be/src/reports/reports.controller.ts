import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DEFAULT_PAGE_SIZE,
  GenerateReportInput,
  MAX_NARRATIVE_ATTEMPTS,
  MAX_PAGE_SIZE,
  ReportPeriod,
  generateReportSchema,
} from '@shared/types';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { zodToApiSchema } from '../common/openapi/zod-schema';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserPreferencesService } from '../user/user-preferences.service';
import { ReportPeriodPipe } from './report-period.pipe';
import { ReportsService } from './reports.service';

const AI_CONSENT_REQUIRED = {
  code: 'ai_consent_required',
  message: 'Enable AI assistance in your preferences to use AI insights.',
};

const NARRATIVE_LIMIT_EXCEEDED = {
  code: 'narrative_limit_exceeded',
  message: `You've reached the limit of ${MAX_NARRATIVE_ATTEMPTS} AI insight generations for this report.`,
};

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users/:userId/reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly userPreferencesService: UserPreferencesService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List previously generated reports for a period' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['weekly', 'monthly', 'yearly'],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object' } },
        nextCursor: { type: 'string', nullable: true },
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period', ReportPeriodPipe) period: ReportPeriod,
    @Query('limit', new DefaultValuePipe(DEFAULT_PAGE_SIZE), ParseIntPipe)
    limit: number,
    @Query('cursor') cursor?: string,
    @Query('sort') sort?: string
  ) {
    // Listing never generates - Reports is a library of documents the user
    // explicitly asked for, not a live view that materializes one on read.
    if (sort !== undefined && sort !== 'asc' && sort !== 'desc') {
      throw new BadRequestException({
        message: "Invalid sort. Must be one of: 'asc', 'desc'",
      });
    }
    const sortDirection = sort as 'asc' | 'desc' | undefined;

    let before: Date | undefined;
    if (cursor !== undefined) {
      before = new Date(cursor);
      if (Number.isNaN(before.getTime())) {
        throw new BadRequestException({ message: 'Invalid cursor' });
      }
    }

    return this.reportsService.list(user.id, period, {
      limit: Math.min(limit, MAX_PAGE_SIZE),
      before,
      sort: sortDirection,
    });
  }

  @Post()
  @ApiOperation({
    summary:
      'Generate a report for a period, or return the existing one unchanged',
  })
  @ApiParam({ name: 'userId' })
  @ApiBody({ schema: zodToApiSchema(generateReportSchema) })
  @ApiResponse({ status: 201, schema: { type: 'object' } })
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(generateReportSchema))
    body: GenerateReportInput
  ) {
    const referenceDate = body.referenceDate
      ? new Date(body.referenceDate)
      : new Date();
    return this.reportsService.generate(user.id, body.period, referenceDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one report, including its task snapshot' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new MongoIdPipe()) id: string
  ) {
    const report = await this.reportsService.findById(user.id, id);
    if (!report) throw new NotFoundException({ message: 'Report not found' });
    return report;
  }

  @Post(':id/narrative')
  @ApiOperation({
    summary: 'Generate an AI narrative and productivity tips for a report',
  })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, schema: { type: 'object' } })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({
    status: 403,
    description: 'The user has not enabled AI assistance in preferences',
  })
  @ApiResponse({
    status: 429,
    description: `The report already used its ${MAX_NARRATIVE_ATTEMPTS} allowed AI insight generations`,
  })
  async generateNarrative(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new MongoIdPipe()) id: string
  ) {
    const preferences = await this.userPreferencesService.findByUserId(user.id);
    if (!preferences?.aiConsent) {
      throw new ForbiddenException(AI_CONSENT_REQUIRED);
    }

    const result = await this.reportsService.generateNarrative(user.id, id);
    if (result === null) {
      throw new NotFoundException({ message: 'Report not found' });
    }
    if (result === 'limit_exceeded') {
      throw new HttpException(
        NARRATIVE_LIMIT_EXCEEDED,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return result;
  }
}
