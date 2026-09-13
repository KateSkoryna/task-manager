import { useTranslation } from 'react-i18next';
import { Trash2, Sparkles } from 'lucide-react';
import { TodoItem, TodoList } from '@shared/types';
import { AgentProposal } from '../../hooks/useAgentChat';
import Button from '../elements/Button';

const findTaskById = (
  id: unknown,
  lists: TodoList[],
  inboxTodos: TodoItem[]
): { todo: TodoItem; listName: string | null } | null => {
  if (typeof id !== 'string') return null;
  const inboxMatch = inboxTodos.find((todo) => todo.id === id);
  if (inboxMatch) return { todo: inboxMatch, listName: null };
  for (const list of lists) {
    const match = list.todos.find((todo) => todo.id === id);
    if (match) return { todo: match, listName: list.name };
  }
  return null;
};

interface ProposalCardProps {
  proposal: AgentProposal;
  lists: TodoList[];
  inboxTodos: TodoItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Step 3.2's server-side guarantee — a destructive or multi-task write never
 * happens without an explicit confirmation round trip — made visible: this
 * is the only place in the chat panel that can trigger a write.
 */
const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  lists,
  inboxTodos,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const isDestructive = proposal.toolName === 'delete_task';
  const input = proposal.input as { id?: unknown } | null;
  const target = findTaskById(input?.id, lists, inboxTodos);

  return (
    <div
      className="mt-2 rounded-card border border-default bg-surface p-3"
      role="group"
      aria-label={
        isDestructive
          ? t('agent.proposal.deleteTitle')
          : t('agent.proposal.confirmTitle')
      }
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        {isDestructive ? (
          <Trash2 className="h-4 w-4 text-danger" />
        ) : (
          <Sparkles className="h-4 w-4 text-accent" />
        )}
        {isDestructive
          ? t('agent.proposal.deleteTitle')
          : t('agent.proposal.confirmTitle')}
      </div>

      {target && (
        <div className="mt-2 rounded-inner bg-surface-subtle px-3 py-2">
          <p className="text-sm font-medium text-primary">{target.todo.name}</p>
          <p className="text-xs text-muted">
            {target.listName ?? t('tasks.inbox')}
          </p>
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          dataTestId="chat-proposal-cancel"
        >
          {isDestructive
            ? t('agent.proposal.keep')
            : t('agent.proposal.notYet')}
        </Button>
        <Button
          variant={isDestructive ? 'destructive' : 'primary'}
          onClick={onConfirm}
          dataTestId="chat-proposal-confirm"
        >
          {isDestructive
            ? t('agent.proposal.delete')
            : t('agent.proposal.addTask')}
        </Button>
      </div>
    </div>
  );
};

export default ProposalCard;
