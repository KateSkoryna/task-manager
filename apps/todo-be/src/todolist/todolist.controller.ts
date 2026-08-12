import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
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
  PaginationQuery,
  TodolistCreateInput,
  TodolistUpdateInput,
  todolistCreateSchema,
  todolistUpdateSchema,
} from '@shared/types';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { zodToApiSchema } from '../common/openapi/zod-schema';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe';
import { PaginationQueryPipe } from '../common/pipes/pagination-query.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TodolistService } from './todolist.service';

@ApiTags('todo lists')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users/:userId/todolists')
export class TodolistController {
  constructor(private readonly todolistService: TodolistService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user todo lists' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
    @Query(new PaginationQueryPipe()) query: PaginationQuery
  ) {
    return this.todolistService.findAll(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a todo list' })
  @ApiParam({ name: 'userId' })
  @ApiBody({ schema: zodToApiSchema(todolistCreateSchema) })
  @ApiResponse({ status: 201, schema: { type: 'object' } })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(todolistCreateSchema)) body: TodolistCreateInput
  ) {
    return this.todolistService.create(user.id, body);
  }

  @Put(':todolistId')
  @ApiOperation({ summary: 'Update a todo list' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'todolistId' })
  @ApiBody({ schema: zodToApiSchema(todolistUpdateSchema) })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('todolistId', new MongoIdPipe()) id: string,
    @Body(new ZodValidationPipe(todolistUpdateSchema)) body: TodolistUpdateInput
  ) {
    const list = await this.todolistService.update(id, user.id, body);
    if (!list) throw new NotFoundException({ message: 'Todolist not found' });
    return list;
  }

  @Delete(':todolistId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a todo list' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'todolistId' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('todolistId', new MongoIdPipe()) id: string
  ) {
    const list = await this.todolistService.delete(id, user.id);
    if (!list) throw new NotFoundException({ message: 'Todolist not found' });
  }
}
