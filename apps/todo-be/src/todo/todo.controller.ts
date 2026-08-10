import {
  Body,
  Controller,
  Delete,
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

@ApiTags('todos')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users/:userId/todolists/:todolistId/todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  private async requireList(id: string, userId: string): Promise<void> {
    if (!(await this.todoService.listExists(id, userId))) {
      throw new NotFoundException({ message: 'Todolist not found' });
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a todo in a list' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'todolistId' })
  @ApiBody({ schema: zodToApiSchema(todoCreateSchema) })
  @ApiResponse({ status: 201, schema: { type: 'object' } })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('todolistId', new MongoIdPipe('todolistId')) todolistId: string,
    @Body(new ZodValidationPipe(todoCreateSchema)) body: TodoCreateInput
  ) {
    await this.requireList(todolistId, user.id);
    return this.todoService.create(todolistId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'todolistId' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: zodToApiSchema(todoUpdateSchema) })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('todolistId', new MongoIdPipe('todolistId')) todolistId: string,
    @Param('id', new MongoIdPipe()) id: string,
    @Body(new ZodValidationPipe(todoUpdateSchema)) body: TodoUpdateInput
  ) {
    await this.requireList(todolistId, user.id);
    const todo = await this.todoService.update(id, todolistId, body);
    if (!todo) throw new NotFoundException({ message: 'Todo not found' });
    return todo;
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'todolistId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('todolistId', new MongoIdPipe('todolistId')) todolistId: string,
    @Param('id', new MongoIdPipe()) id: string
  ) {
    await this.requireList(todolistId, user.id);
    const todo = await this.todoService.delete(id, todolistId);
    if (!todo) throw new NotFoundException({ message: 'Todo not found' });
  }
}
