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
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-14 md:right-6 group z-50 flex size-14 shrink-0 items-center justify-center rounded-control bg-action text-on-action shadow-[0_0.75rem_1.75rem_-0.5rem_rgba(20,25,25,0.45)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:scale-105 focus-visible:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent print:hidden"
      >
        <Sparkles className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 motion-reduce:transition-none" />
      </button>
    );
  }

  return (
    <>
      {/* Dims the page so the eye stays on the chat; a click on it closes the chat. */}
      <div
        aria-hidden="true"
        data-testid="chat-panel-backdrop"
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-40 bg-sidebar/50 motion-safe:animate-fade-in print:hidden"
      />
      <div
        role="dialog"
        aria-label={t('agent.name')}
        data-testid="chat-panel"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-6 z-50 flex h-[32rem] max-h-[calc(100dvh-9rem)] w-96 max-w-[calc(100vw-3rem)] flex-col md:bottom-6 md:max-h-[calc(100dvh-3rem)] overflow-hidden rounded-card border border-default bg-surface shadow-[0_1.5rem_3.5rem_-0.75rem_rgba(20,25,25,0.4)] print:hidden"
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
          <p role="alert" className="px-3 pb-1 text-small text-danger">
            {error}
          </p>
        )}
        <ChatComposer disabled={isStreaming} onSend={send} />
      </div>
    </>
  );
};

export default ChatPanel;
