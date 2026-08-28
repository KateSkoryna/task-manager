// --- Todolist Selectors ---
export const getTodolistTitle = () => cy.get("[data-testid='todolist-title']");
export const getTodolistItems = () =>
  cy.get("div[data-testid^='todolist-item-']");

export const getTodolistItem = (name: string) =>
  cy
    .get("div[data-testid^='todolist-item-']")
    .contains(name)
    .parents("div[data-testid^='todolist-item-']")
    .first();

export const getTodolistFormInput = () =>
  cy.get("input[data-testid='todolist-form-input']").first();

export const getTodolistFormSubmitButton = () =>
  cy.get("button[data-testid='todolist-form-submit-button']").first();

export const getTodolistItemDeleteButton = (listName: string) =>
  getTodolistItem(listName).find(
    "button[data-testid='todolist-item-delete-button']"
  );

export const getTodolistItemEditButton = (listName: string) =>
  getTodolistItem(listName).find(
    "button[data-testid='todolist-item-edit-button']"
  );

// --- Todo (Task) Selectors ---
export const getTodoItems = () => cy.get("div[data-testid^='todo-item-']");

// Finding a specific task by name
export const getTodoItem = (name: string) =>
  cy
    .get("div[data-testid^='todo-item-']")
    .contains(name)
    .parents("div[data-testid^='todo-item-']")
    .first();

export const getTodoItemInList = (todolistName: string, todoName: string) =>
  getTodolistItem(todolistName)
    .find("div[data-testid^='todo-item-']")
    .contains(todoName)
    .parents("div[data-testid^='todo-item-']")
    .first();

export const getTodoFormInput = () =>
  cy.get("input[data-testid='todo-form-input']").first();

export const getTodoFormInputInList = (todolistName: string) =>
  getTodolistItem(todolistName)
    .find("input[data-testid='todo-form-input']")
    .first();

export const getTodoFormSubmitButton = () =>
  cy.get("button[data-testid='todo-form-submit-button']").first();

export const getTodoFormSubmitButtonInList = (todolistName: string) =>
  getTodolistItem(todolistName)
    .find("button[data-testid='todo-form-submit-button']")
    .first();

export const getTodoItemCompleteCheckbox = (name: string) =>
  getTodoItem(name).find("input[data-testid^='todo-item-complete-checkbox-']");

export const getTodoItemCompleteCheckboxInList = (
  todolistName: string,
  todoName: string
) =>
  getTodoItemInList(todolistName, todoName).find(
    "input[data-testid^='todo-item-complete-checkbox-']"
  );

export const getTodoItemDeleteButton = (name: string) =>
  getTodoItem(name).find("button[data-testid^='todo-item-delete-button-']");

export const getTodoItemDeleteButtonInList = (
  todolistName: string,
  todoName: string
) =>
  getTodoItemInList(todolistName, todoName).find(
    "button[data-testid^='todo-item-delete-button-']"
  );

export const getTodoItemEditButton = (name: string) =>
  getTodoItem(name).find("button[data-testid^='edit-todo-button-']");

export const getTodoItemEditButtonInList = (
  todolistName: string,
  todoName: string
) =>
  getTodoItemInList(todolistName, todoName).find(
    "button[data-testid^='edit-todo-button-']"
  );

export const getEditTodoInputInList = (
  todolistName: string,
  todoName: string
) =>
  getTodoItemInList(todolistName, todoName).find(
    "input[data-testid^='edit-todo-input-']"
  );

export const getSaveTodoEditButtonInList = (
  todolistName: string,
  todoName: string
) =>
  getTodoItemInList(todolistName, todoName).find(
    "button[data-testid^='save-todo-edit-button-']"
  );

export const getCancelTodoEditButtonInList = (
  todolistName: string,
  todoName: string
) =>
  getTodoItemInList(todolistName, todoName).find(
    "button[data-testid^='cancel-todo-edit-button-']"
  );

// --- Global UI ---
export const getErrorMessage = () => cy.get("[data-testid='error-message']");
export const getLoader = () => cy.get("[data-testid='loader']");
