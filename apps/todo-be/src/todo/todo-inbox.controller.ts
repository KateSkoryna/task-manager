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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  TodoCreateInput,
  TodoUpdateInput,
  todoCreateSchema,
  todoUpdateSchema,
} from '@shared/types';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { zodToApiSchema } from '../common/openapi/zod-schema';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TodoService } from './todo.service';

/**
 * List-agnostic todo operations: the inbox (todos with no list) plus
 * updating/deleting a todo regardless of which list, if any, currently owns
 * it. Moving a todo between the inbox and a list is just an update with a
 * different `todolistId`.
 */
@ApiTags('todos')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users/:userId/todos')
export class TodoInboxController {
  constructor(private readonly todoService: TodoService) {}

  private async requireList(id: string, userId: string): Promise<void> {
    if (!(await this.todoService.listExists(id, userId))) {
      throw new NotFoundException({ message: 'Todolist not found' });
    }
  }

  @Get('inbox')
  @ApiOperation({ summary: 'List the authenticated user inbox todos' })
  @ApiParam({ name: 'userId' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { type: 'object' } },
  })
  findInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.todoService.findInbox(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a todo without choosing a list (inbox by default)',
  })
  @ApiParam({ name: 'userId' })
  @ApiBody({ schema: zodToApiSchema(todoCreateSchema) })
  @ApiResponse({ status: 201, schema: { type: 'object' } })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(todoCreateSchema)) body: TodoCreateInput
  ) {
    if (body.todolistId) {
      await this.requireList(body.todolistId, user.id);
    }
    return this.todoService.create(body.todolistId ?? null, body, user.id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a todo, optionally moving it between the inbox and a list',
  })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: zodToApiSchema(todoUpdateSchema) })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new MongoIdPipe()) id: string,
    @Body(new ZodValidationPipe(todoUpdateSchema)) body: TodoUpdateInput
  ) {
    if (body.todolistId) {
      await this.requireList(body.todolistId, user.id);
    }
    const todo = await this.todoService.updateOwned(id, user.id, body);
    if (!todo) throw new NotFoundException({ message: 'Todo not found' });
    return todo;
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new MongoIdPipe()) id: string
  ) {
    const todo = await this.todoService.deleteOwned(id, user.id);
    if (!todo) throw new NotFoundException({ message: 'Todo not found' });
  }
}
