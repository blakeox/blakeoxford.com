import { useEffect } from 'react';

import { AI_CHAT_ASK, type AiChatAskDetail } from '../chat/ai-chat-bridge';
import { closeSearch, registerAiChatClose } from '../../utils/headerController';

type UseAiChatBridgeOptions = {
  openChat: () => void;
  closeChat: () => void;
  setInputValue: (value: string) => void;
  sendQuery: (query: string) => Promise<void>;
  focusInput: () => void;
};

export function useAiChatBridge({
  openChat,
  closeChat,
  setInputValue,
  sendQuery,
  focusInput,
}: UseAiChatBridgeOptions): void {
  useEffect(() => registerAiChatClose(closeChat), [closeChat]);

  useEffect(() => {
    const handleAsk = (event: Event) => {
      const detail = (event as CustomEvent<AiChatAskDetail>).detail;
      if (!detail?.query?.trim()) return;

      closeSearch();
      setInputValue(detail.query.trim());
      openChat();
      focusInput();

      if (detail.autoSend) {
        void sendQuery(detail.query.trim());
      }
    };

    window.addEventListener(AI_CHAT_ASK, handleAsk as EventListener);
    return () => window.removeEventListener(AI_CHAT_ASK, handleAsk as EventListener);
  }, [focusInput, openChat, sendQuery, setInputValue]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if (detail?.open) {
        closeSearch();
      }
    };

    window.addEventListener('ai-chat:state', handleOpen as EventListener);
    return () => window.removeEventListener('ai-chat:state', handleOpen as EventListener);
  }, []);
}
