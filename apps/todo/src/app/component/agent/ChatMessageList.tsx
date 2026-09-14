import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { TodoItem, TodoList } from '@shared/types';
import { AgentChatMessage, AgentProposal } from '../../hooks/useAgentChat';
import { mergeClassNames } from '../../lib/classNames';
import { toolCallLabel, extractLinkableTasks } from './agentToolLabels';
import ProposalCard from './ProposalCard';

// Close enough to the bottom that a new message should still auto-scroll —
// past this, the user is deliberately reading back and a new arrival
// shouldn't yank them back down.
const NEAR_BOTTOM_THRESHOLD_PX = 80;

interface ChatMessageListProps {
  messages: AgentChatMessage[];
  isStreaming: boolean;
  pendingProposal: AgentProposal | null;
  lists: TodoList[];
  inboxTodos: TodoItem[];
  onConfirmProposal: () => void;
  onCancelProposal: () => void;
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
        style={{ animationDelay: `${i * 120}ms` }}
      />
    ))}
  </div>
);

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isStreaming,
  pendingProposal,
  lists,
  inboxTodos,
  onConfirmProposal,
  onCancelProposal,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stickToBottom) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isStreaming, pendingProposal, stickToBottom]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setStickToBottom(distanceFromBottom <= NEAR_BOTTOM_THRESHOLD_PX);
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageId = lastMessage?.id;
  // The streaming assistant bubble itself is the progress indicator once it
  // has anything to show; the dots only fill the gap before that — between
  // the user's message landing and the first token or tool call arriving.
  const assistantHasVisibleContent =
    lastMessage?.role === 'assistant' &&
    (lastMessage.text.length > 0 || !!lastMessage.toolCalls?.length);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      className="flex-1 space-y-3 overflow-y-auto p-3"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={mergeClassNames(
            'flex',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          <div className="max-w-[85%]">
            {message.text && (
              <div
                className={mergeClassNames(
                  'rounded-card px-3 py-2 text-sm whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'bg-primary text-app'
                    : 'bg-surface-subtle text-primary'
                )}
              >
                {message.text}
              </div>
            )}

            {!!message.toolCalls?.length && (
              <div className="mt-1.5 flex flex-col items-start gap-1.5">
                {message.toolCalls.flatMap((toolCall, index) => {
                  const linkedTasks = extractLinkableTasks(toolCall);
                  if (linkedTasks.length > 0) {
                    return linkedTasks.map((task) => (
                      <button
                        key={`${message.id}-tool-${index}-${task.id}`}
                        type="button"
                        onClick={() =>
                          navigate('/tasks', {
                            state: { todoId: task.id, listId: task.todolistId },
                          })
                        }
                        className="flex max-w-full items-center gap-1.5 rounded-inner border border-default bg-surface px-2.5 py-1.5 text-left text-xs text-primary transition-colors hover:border-accent hover:bg-surface-subtle"
                      >
                        <ArrowUpRight className="h-3 w-3 shrink-0 text-muted" />
                        <span className="truncate">{task.name}</span>
                      </button>
                    ));
                  }
                  const label = toolCallLabel(t, toolCall);
                  if (label == null) return [];
                  return [
                    <span
                      key={`${message.id}-tool-${index}`}
                      className="inline-flex items-center rounded-pill border border-default bg-surface px-badge-x py-badge-y text-metadata font-medium text-muted"
                    >
                      {label}
                    </span>,
                  ];
                })}
              </div>
            )}

            {pendingProposal && message.id === lastMessageId && (
              <ProposalCard
                proposal={pendingProposal}
                lists={lists}
                inboxTodos={inboxTodos}
                onConfirm={onConfirmProposal}
                onCancel={onCancelProposal}
              />
            )}
          </div>
        </div>
      ))}

      {isStreaming && !assistantHasVisibleContent && <TypingIndicator />}
    </div>
  );
};

export default ChatMessageList;
