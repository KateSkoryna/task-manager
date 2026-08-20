// --- TODO TYPES ---
export type TodoStatus = 'pending' | 'successful' | 'failed';

/** How urgent the task is, independent of which list it belongs to. */
export type TodoPriority = 'low' | 'medium' | 'high';

/** Which surface created the task. */
export type TodoSource = 'web' | 'telegram';

export interface NewTodoItem {
  name: string;
  status?: TodoStatus;
  todolistId?: string | null;
  dueDate?: string | null;
  location?: string | null;
  notes?: string | null;
  completedAt?: string | null;
  image?: string | null;
  order?: number;
  priority?: TodoPriority;
  source?: TodoSource;
}

export interface TodoItem extends NewTodoItem {
  id: string;
  status: TodoStatus;
  todolistId: string | null;
  order: number;
  priority: TodoPriority;
  source: TodoSource;
}

export interface UpdateTodoItem {
  name?: string;
  status?: TodoStatus;
  todolistId?: string | null;
  dueDate?: string | null;
  location?: string | null;
  notes?: string | null;
  completedAt?: string | null;
  image?: string | null;
  order?: number;
  priority?: TodoPriority;
}

// --- TODOLIST TYPES ---
export type TodoListPriority = 'low' | 'medium' | 'high';
export type TodoListCategory =
  | 'home'
  | 'education'
  | 'work'
  | 'family'
  | 'health';

export interface NewTodoList {
  name: string;
  userId: string;
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
}

export interface TodoList extends NewTodoList {
  id: string;
  todos: TodoItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateTodoList {
  name?: string;
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: string | null;
  notes?: string | null;
}
