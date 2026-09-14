import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AGENT_CANCEL_REPLY_TEXT,
  AGENT_CONFIRM_REPLY_TEXT,
} from '@shared/types';
import { AgentSseEvent, streamAgentMessage } from '../fetchers/agent';
import { invalidateTodoCaches } from '../fetchers/api';
import { useAuthStore } from '../store/authStore';

export interface AgentToolCallSummary {
  name: string;
  input: unknown;
  /** Set once the matching `tool_result` event arrives for this call. */
  result?: { ok: boolean; data?: unknown; reason?: string };
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: AgentToolCallSummary[];
}

export interface AgentProposal {
  toolName: string;
  input: unknown;
  token: string;
}

let messageIdCounter = 0;
const nextMessageId = () => `agent-msg-${++messageIdCounter}`;

/**
 * Drives the conversational agent's SSE stream for one `chatId`. Owns the
 * message log, the in-flight assistant reply, and any pending
 * confirmation proposal — `confirm`/`cancel` are plain-text replies rather
 * than a client-side token, because the server keeps the confirmation
 * token in the model's own turn context (Step 3.2) and echoes it back
 * itself once the model sees the user agree.
 */
export const useAgentChat = (chatId: string) => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<AgentProposal | null>(
    null
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  // Mirrors `isStreaming` but is read synchronously inside the streaming
  // closure below, where the `isStreaming` state variable would otherwise be
  // stale until the next render — see `queuedReplyRef`.
  const streamingRef = useRef(false);
  // A confirm/cancel reply clicked while the current turn is still streaming
  // (the `proposal` event doesn't end the stream — the model can keep
  // talking until `done`) can't send immediately, since `send` refuses to
  // start a second stream while one is in flight. Queue it and fire it the
  // moment the in-flight stream's `finally` runs, instead of silently
  // dropping the confirmation.
  const queuedReplyRef = useRef<string | null>(null);
  // A `proposal` event lands as soon as the tool call resolves to
  // `confirmation_required` — but the model's explanatory text for that
  // same turn ("Are you sure you want to delete this?") only comes from a
  // *separate*, later Gemini turn's `token`/`done` events (agent.service.ts
  // only asks the model to explain itself after the tool result is already
  // known). Showing the ProposalCard immediately would put the box on
  // screen before the sentence that explains it. So the proposal is always
  // held here first and only revealed once that turn's text is fully in
  // (at `done`) — or dropped if the same stream goes on to resolve the
  // action itself, which happens during confirm/cancel replies (see the
  // `tool_result` case below).
  const pendingProposalRef = useRef<AgentProposal | null>(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setError(null);
      setPendingProposal(null);
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), role: 'user', text: trimmed },
      ]);
      streamingRef.current = true;
      setIsStreaming(true);

      const assistantMessageId = nextMessageId();
      let hasAssistantMessage = false;
      const ensureAssistantMessage = () => {
        if (hasAssistantMessage) return;
        hasAssistantMessage = true;
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: 'assistant', text: '' },
        ]);
      };
      const updateAssistantMessage = (
        update: (message: AgentChatMessage) => AgentChatMessage
      ) => {
        ensureAssistantMessage();
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId ? update(message) : message
          )
        );
      };

      const handleEvent = (event: AgentSseEvent) => {
        switch (event.type) {
          case 'token':
            updateAssistantMessage((message) => ({
              ...message,
              text: message.text + event.text,
            }));
            break;
          case 'tool_call':
            updateAssistantMessage((message) => ({
              ...message,
              toolCalls: [
                ...(message.toolCalls ?? []),
                { name: event.name, input: event.input },
              ],
            }));
            break;
          case 'tool_result':
            if (event.result.ok) {
              invalidateTodoCaches(queryClient, user?.id);
              // A successful write means any proposal still showing is
              // stale: the backend's tool loop can ask for confirmation,
              // get it, and complete the write all within this one stream
              // (a fresh request has no way to carry a prior request's
              // confirmation token, so the model re-asks and then
              // immediately re-confirms itself once it holds the new
              // token) — without this, the UI keeps offering to delete a
              // task that's already gone.
              setPendingProposal(null);
            }
            if (
              event.result.ok ||
              event.result.reason !== 'confirmation_required'
            ) {
              // The action actually resolved (one way or another) within
              // this stream, so the pending ask held below is moot.
              pendingProposalRef.current = null;
            }
            // Tool calls and their results always alternate strictly in
            // order within one turn (agent.service.ts's dispatch loop), so
            // the most recent call is always the one this result belongs to.
            updateAssistantMessage((message) => {
              const toolCalls = message.toolCalls ?? [];
              if (toolCalls.length === 0) return message;
              const updated = [...toolCalls];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                result: event.result,
              };
              return { ...message, toolCalls: updated };
            });
            break;
          case 'proposal':
            // Held rather than shown immediately — see `pendingProposalRef`.
            pendingProposalRef.current = event.proposal;
            break;
          case 'done':
            // Reveal the proposal now that its explanatory text is fully
            // in, unless this same stream already resolved the action
            // itself (confirm/cancel replies: the model re-asks then
            // immediately re-confirms with the fresh token, clearing this
            // above before `done` ever runs).
            if (pendingProposalRef.current) {
              setPendingProposal(pendingProposalRef.current);
              pendingProposalRef.current = null;
            }
            updateAssistantMessage((message) => ({
              ...message,
              text: event.text,
            }));
            break;
          case 'error':
            setError(event.message);
            break;
        }
      };

      (async () => {
        try {
          for await (const event of streamAgentMessage(chatId, trimmed, {
            signal: abortController.signal,
          })) {
            handleEvent(event);
          }
        } catch (err) {
          if (abortController.signal.aborted) return;
          setError(
            err instanceof Error ? err.message : 'Something went wrong.'
          );
        } finally {
          if (abortControllerRef.current === abortController) {
            streamingRef.current = false;
            setIsStreaming(false);
            abortControllerRef.current = null;

            const queuedReply = queuedReplyRef.current;
            if (queuedReply) {
              queuedReplyRef.current = null;
              send(queuedReply);
            }
          }
        }
      })();
    },
    [chatId, queryClient, user?.id]
  );

  const confirm = useCallback(() => {
    if (!pendingProposal) return;
    setPendingProposal(null);
    if (streamingRef.current) {
      queuedReplyRef.current = AGENT_CONFIRM_REPLY_TEXT;
      return;
    }
    send(AGENT_CONFIRM_REPLY_TEXT);
  }, [pendingProposal, send]);

  const cancel = useCallback(() => {
    if (!pendingProposal) return;
    setPendingProposal(null);
    if (streamingRef.current) {
      queuedReplyRef.current = AGENT_CANCEL_REPLY_TEXT;
      return;
    }
    send(AGENT_CANCEL_REPLY_TEXT);
  }, [pendingProposal, send]);

  return {
    messages,
    send,
    isStreaming,
    error,
    pendingProposal,
    confirm,
    cancel,
  };
};
