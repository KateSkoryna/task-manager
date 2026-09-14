import { useState } from 'react';
import { generateId } from '../lib/id';

const storageKey = (userId: string) => `todo-agent-chat-id:${userId}`;

/**
 * One conversation thread per user, persisted across reloads and panel
 * open/close so the backend's rolling turn window (`AgentSession`) keeps
 * seeing the same `chatId` — otherwise every page refresh would silently
 * start a brand new conversation.
 */
export const useAgentChatId = (userId: string): string => {
  const [chatId] = useState(() => {
    try {
      const existing = localStorage.getItem(storageKey(userId));
      if (existing) return existing;
      const created = generateId('chat');
      localStorage.setItem(storageKey(userId), created);
      return created;
    } catch {
      // Best-effort persistence: a full/blocked storage still returns a
      // usable id for this session, it just won't survive a reload.
      return generateId('chat');
    }
  });

  return chatId;
};
