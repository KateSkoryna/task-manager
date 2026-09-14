import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePreferences } from '../../hooks/usePreferences';
import { useAgentChatId } from '../../hooks/useAgentChatId';
import { useAgentChat } from '../../hooks/useAgentChat';
import { useTodoListsQuery, useInboxTodosQuery } from '../../fetchers/api';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatComposer from './ChatComposer';

/**
 * The floating conversational agent, mounted once for the whole
 * authenticated app shell. Hidden entirely while AI consent is off, rather
 * than opening to a dead end that immediately 403s — `preferences.aiConsent`
 * gates every agent call server-side (Step 4.4).
 */
const ChatPanel: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { preferences } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);

  const chatId = useAgentChatId(user?.id ?? 'anonymous');
  const {
    messages,
    send,
    isStreaming,
    error,
    pendingProposal,
    confirm,
    cancel,
  } = useAgentChat(chatId);

  const { data: lists = [] } = useTodoListsQuery();
  const { data: inboxTodos = [] } = useInboxTodosQuery();

  if (!user || !preferences?.aiConsent) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        data-testid="chat-panel-launcher"
        onClick={() => setIsOpen(true)}
        aria-label={t('agent.open')}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-on-accent shadow-menu transition-transform hover:scale-105"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={t('agent.name')}
      data-testid="chat-panel"
      className="fixed bottom-6 right-6 z-50 flex h-[32rem] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-card border border-default bg-surface shadow-menu"
    >
      <ChatHeader onClose={() => setIsOpen(false)} />
      <ChatMessageList
        messages={messages}
        isStreaming={isStreaming}
        pendingProposal={pendingProposal}
        lists={lists}
        inboxTodos={inboxTodos}
        onConfirmProposal={confirm}
        onCancelProposal={cancel}
      />
      {error && (
        <p role="alert" className="px-3 pb-1 text-xs text-danger">
          {error}
        </p>
      )}
      <ChatComposer disabled={isStreaming} onSend={send} />
    </div>
  );
};

export default ChatPanel;
