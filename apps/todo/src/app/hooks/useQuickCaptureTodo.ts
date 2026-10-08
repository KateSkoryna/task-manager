import { useEffect, useRef, useState } from 'react';
import {
  useAddInboxTodoMutation,
  useEditTodoMutation,
  useInboxTodosQuery,
  useParseTodoMutation,
} from '../fetchers/api';
import { TodoPriority } from '@shared/types';
import { usePreferences } from './usePreferences';

/** Fields the user filled in by hand under "More". */
export interface QuickCaptureExtras {
  priority?: TodoPriority;
  dueDate?: string;
  notes?: string;
}

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
 *
 * Fields the user chose by hand are saved as given and the AI parse is
 * skipped, so it can never overwrite an explicit choice.
 */
export const useQuickCaptureTodo = () => {
  const { data: todos = [] } = useInboxTodosQuery();
  const [enrichment, setEnrichment] = useState<QuickCaptureEnrichment | null>(
    null
  );

  const addInboxTodo = useAddInboxTodoMutation();
  const editTodo = useEditTodoMutation();
  const parseTodo = useParseTodoMutation();
  const { preferences } = usePreferences();
  // Only an explicit "off" skips the parse; while preferences are still
  // loading, the server remains the one that decides.
  const aiIsOff = preferences?.aiConsent === false;

  // The parse round trip can take several seconds; read from a ref rather
  // than the `todos` closure captured at submit time, so the enrichment
  // check below sees the task's latest name, not a stale one.
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  function submit(rawText: string, extras: QuickCaptureExtras = {}) {
    const text = rawText.trim();
    if (!text) return;
    const hasExtras = Object.values(extras).some(Boolean);
    setEnrichment(null);

    addInboxTodo.mutate(
      { name: text, ...extras },
      {
        onSuccess: (created) => {
          if (aiIsOff || hasExtras) return;
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

  return { enrichment, aiIsOff, submit, undo };
};
