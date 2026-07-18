/**
 * Tests for ChatContext
 *
 * @module tests/vitest/ChatContext.test
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ChatProvider,
  useChatContext,
  useChatState,
  useChatDispatch,
} from '../../src/contexts/ChatContext';
import type { ChatMessage } from '../../src/lib/chat';
import type { ReactNode } from 'react';

// Helper wrapper for tests
const wrapper = ({ children }: { children: ReactNode }) => <ChatProvider>{children}</ChatProvider>;

describe('ChatContext', () => {
  describe('ChatProvider', () => {
    it('provides initial state', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      expect(result.current.state.isOpen).toBe(false);
      expect(result.current.state.messages).toEqual([]);
      expect(result.current.state.inputValue).toBe('');
      expect(result.current.state.chatState).toBe('idle');
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.useMemory).toBe(true);
    });

    it('accepts initial messages', () => {
      const initialMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ];

      const customWrapper = ({ children }: { children: ReactNode }) => (
        <ChatProvider initialMessages={initialMessages}>{children}</ChatProvider>
      );

      const { result } = renderHook(() => useChatContext(), { wrapper: customWrapper });

      expect(result.current.state.messages).toHaveLength(1);
      expect(result.current.state.messages[0].content).toBe('Hello');
    });
  });

  describe('Actions', () => {
    it('opens and closes chat', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      expect(result.current.state.isOpen).toBe(false);

      act(() => {
        result.current.openChat();
      });
      expect(result.current.state.isOpen).toBe(true);

      act(() => {
        result.current.closeChat();
      });
      expect(result.current.state.isOpen).toBe(false);
    });

    it('sets input value', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      act(() => {
        result.current.setInput('test input');
      });
      expect(result.current.state.inputValue).toBe('test input');
    });

    it('adds messages', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      const message: ChatMessage = {
        id: 'test-id',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.state.messages).toHaveLength(1);
      expect(result.current.state.messages[0].content).toBe('Test message');
    });

    it('updates messages', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      const message: ChatMessage = {
        id: 'test-id',
        role: 'user',
        content: 'Original',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.updateMessage('test-id', { content: 'Updated' });
      });

      expect(result.current.state.messages[0].content).toBe('Updated');
    });

    it('clears messages', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      act(() => {
        result.current.addMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Test 1',
          timestamp: Date.now(),
        });
        result.current.addMessage({
          id: 'msg-2',
          role: 'assistant',
          content: 'Test 2',
          timestamp: Date.now(),
        });
      });

      expect(result.current.state.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.state.messages).toHaveLength(0);
    });

    it('sets error', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      act(() => {
        result.current.setError('Test error');
      });
      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });
      expect(result.current.state.error).toBeNull();
    });

    it('toggles memory', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      expect(result.current.state.useMemory).toBe(true);

      act(() => {
        result.current.toggleMemory();
      });
      expect(result.current.state.useMemory).toBe(false);

      act(() => {
        result.current.toggleMemory();
      });
      expect(result.current.state.useMemory).toBe(true);
    });
  });

  describe('Dispatch actions', () => {
    it('handles SET_CHAT_STATE', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'SET_CHAT_STATE', payload: 'loading' });
      });
      expect(result.current.state.chatState).toBe('loading');
    });

    it('handles SET_LOADING_PHASE', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'SET_LOADING_PHASE', payload: 'searching' });
      });
      expect(result.current.state.loadingPhase).toBe('searching');
    });

    it('handles TOGGLE_DIGEST', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      expect(result.current.state.showDigest).toBe(false);

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_DIGEST' });
      });
      expect(result.current.state.showDigest).toBe(true);
    });

    it('handles TOGGLE_EXPANDED_SOURCE', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_EXPANDED_SOURCE', payload: 'msg-1' });
      });
      expect(result.current.state.expandedSources['msg-1']).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'TOGGLE_EXPANDED_SOURCE', payload: 'msg-1' });
      });
      expect(result.current.state.expandedSources['msg-1']).toBe(false);
    });

    it('handles RESET_STATE', () => {
      const { result } = renderHook(() => useChatContext(), { wrapper });

      // Modify state
      act(() => {
        result.current.openChat();
        result.current.setInput('test');
        result.current.addMessage({
          id: 'test',
          role: 'user',
          content: 'test',
          timestamp: Date.now(),
        });
      });

      // Reset
      act(() => {
        result.current.dispatch({ type: 'RESET_STATE' });
      });

      expect(result.current.state.isOpen).toBe(false);
      expect(result.current.state.inputValue).toBe('');
      expect(result.current.state.messages).toHaveLength(0);
    });
  });

  describe('Hooks', () => {
    it('useChatState returns state only', () => {
      const { result } = renderHook(() => useChatState(), { wrapper });

      expect(result.current.isOpen).toBeDefined();
      expect(result.current.messages).toBeDefined();
    });

    it('useChatDispatch returns dispatch only', () => {
      const { result } = renderHook(() => useChatDispatch(), { wrapper });

      expect(typeof result.current).toBe('function');
    });

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useChatContext());
      }).toThrow('useChatContext must be used within a ChatProvider');

      consoleSpy.mockRestore();
    });
  });
});
