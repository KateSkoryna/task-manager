import { useEffect, useRef, useState } from 'react';
import {
  useAddInboxTodoMutation,
  useEditTodoMutation,
  useInboxTodosQuery,
  useParseTodoMutation,
} from '../fetchers/api';

export interface QuickCaptureEnrichment {
  id: string;
  previousName: string;
}

/**
 * "Create first, enrich after" for the Inbox quick-capture input: the raw
 * text becomes a task immediately, then an AI parse fills in due date and
 * priority in the background. Shared by every quick-capture input in the
 * app (Inbox section, Dashboard) so the behavior — and its safety guard
 * against clobbering a manual edit made while the parse was in flight —
 * stays in one place.
 */
export const useQuickCaptureTodo = () => {
  const { data: todos = [] } = useInboxTodosQuery();
  const [enrichment, setEnrichment] = useState<QuickCaptureEnrichment | null>(
    null
  );

  const addInboxTodo = useAddInboxTodoMutation();
  const editTodo = useEditTodoMutation();
  const parseTodo = useParseTodoMutation();

  // The parse round trip can take several seconds; read from a ref rather
  // than the `todos` closure captured at submit time, so the enrichment
  // check below sees the task's latest name, not a stale one.
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  function submit(rawText: string) {
    const text = rawText.trim();
    if (!text) return;
    setEnrichment(null);

    addInboxTodo.mutate(
      { name: text },
      {
        onSuccess: (created) => {
          parseTodo.mutate(text, {
            onSuccess: (parsed) => {
              if (parsed.ambiguous) return;
              // If the user already edited the task while the parse was in
              // flight, its name will have moved on from the raw capture —
              // leave their edit alone rather than clobbering it.
              const current = todosRef.current.find((t) => t.id === created.id);
              if (current && current.name !== text) return;

              editTodo.mutate(
                {
                  id: created.id,
                  name: parsed.name,
                  priority: parsed.priority,
                  ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
                },
                {
                  onSuccess: () =>
                    setEnrichment({ id: created.id, previousName: text }),
                }
              );
            },
          });
        },
      }
    );
  }

  function undo() {
    if (!enrichment) return;
    editTodo.mutate({
      id: enrichment.id,
      name: enrichment.previousName,
      dueDate: null,
      priority: 'medium',
    });
    setEnrichment(null);
  }

  return { enrichment, submit, undo };
};
