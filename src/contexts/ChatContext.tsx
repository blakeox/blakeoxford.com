/**
 * Chat Context
 *
 * React context for sharing chat state across components.
 * Provides a centralized state management for the chat widget.
 *
 * @module contexts/ChatContext
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
} from 'react';

import type { ChatMessage, ChatState, LoadingPhase, SearchFallback } from '../lib/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatContextState {
  // Core state
  isOpen: boolean;
  messages: ChatMessage[];
  inputValue: string;
  chatState: ChatState;
  loadingPhase: LoadingPhase;
  error: string | null;

  // Settings
  useMemory: boolean;

  // Session
  sessionStartTime: number;
  streamingMessageId: string | null;

  // Fallback
  fallbackResults: SearchFallback[];

  // Retry
  retryCount: number;
  lastFailedQuery: string;

  // UI toggles
  showDigest: boolean;
  showAnalytics: boolean;
  showAdvancedControls: boolean;
  showFallbackSuggestions: boolean;

  // Expanded state
  expandedSources: Record<string, boolean>;
  expandedIndividualSources: Record<string, boolean>;
}

export type ChatAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_CHAT_STATE'; payload: ChatState }
  | { type: 'SET_LOADING_PHASE'; payload: LoadingPhase }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USE_MEMORY'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_STREAMING_ID'; payload: string | null }
  | { type: 'SET_FALLBACK_RESULTS'; payload: SearchFallback[] }
  | { type: 'SET_RETRY_COUNT'; payload: number }
  | { type: 'SET_LAST_FAILED_QUERY'; payload: string }
  | { type: 'TOGGLE_DIGEST' }
  | { type: 'TOGGLE_ANALYTICS' }
  | { type: 'TOGGLE_ADVANCED_CONTROLS' }
  | { type: 'SET_SHOW_FALLBACK'; payload: boolean }
  | { type: 'TOGGLE_EXPANDED_SOURCE'; payload: string }
  | { type: 'TOGGLE_INDIVIDUAL_SOURCE'; payload: string }
  | { type: 'RESET_STATE' };

export interface ChatContextValue {
  state: ChatContextState;
  dispatch: Dispatch<ChatAction>;
  // Convenience actions
  openChat: () => void;
  closeChat: () => void;
  setInput: (value: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  toggleMemory: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: ChatContextState = {
  isOpen: false,
  messages: [],
  inputValue: '',
  chatState: 'idle',
  loadingPhase: null,
  error: null,
  useMemory: true,
  sessionStartTime: Date.now(),
  streamingMessageId: null,
  fallbackResults: [],
  retryCount: 0,
  lastFailedQuery: '',
  showDigest: false,
  showAnalytics: false,
  showAdvancedControls: false,
  showFallbackSuggestions: false,
  expandedSources: {},
  expandedIndividualSources: {},
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function chatReducer(state: ChatContextState, action: ChatAction): ChatContextState {
  switch (action.type) {
    case 'OPEN_CHAT':
      return { ...state, isOpen: true, error: null };

    case 'CLOSE_CHAT':
      return { ...state, isOpen: false };

    case 'SET_INPUT':
      return { ...state, inputValue: action.payload };

    case 'SET_CHAT_STATE':
      return { ...state, chatState: action.payload };

    case 'SET_LOADING_PHASE':
      return { ...state, loadingPhase: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_USE_MEMORY':
      return { ...state, useMemory: action.payload };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        ),
      };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], expandedSources: {}, expandedIndividualSources: {} };

    case 'SET_STREAMING_ID':
      return { ...state, streamingMessageId: action.payload };

    case 'SET_FALLBACK_RESULTS':
      return { ...state, fallbackResults: action.payload };

    case 'SET_RETRY_COUNT':
      return { ...state, retryCount: action.payload };

    case 'SET_LAST_FAILED_QUERY':
      return { ...state, lastFailedQuery: action.payload };

    case 'TOGGLE_DIGEST':
      return { ...state, showDigest: !state.showDigest };

    case 'TOGGLE_ANALYTICS':
      return { ...state, showAnalytics: !state.showAnalytics };

    case 'TOGGLE_ADVANCED_CONTROLS':
      return { ...state, showAdvancedControls: !state.showAdvancedControls };

    case 'SET_SHOW_FALLBACK':
      return { ...state, showFallbackSuggestions: action.payload };

    case 'TOGGLE_EXPANDED_SOURCE':
      return {
        ...state,
        expandedSources: {
          ...state.expandedSources,
          [action.payload]: !state.expandedSources[action.payload],
        },
      };

    case 'TOGGLE_INDIVIDUAL_SOURCE':
      return {
        ...state,
        expandedIndividualSources: {
          ...state.expandedIndividualSources,
          [action.payload]: !state.expandedIndividualSources[action.payload],
        },
      };

    case 'RESET_STATE':
      return { ...initialState, sessionStartTime: Date.now() };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface ChatProviderProps {
  children: ReactNode;
  initialMessages?: ChatMessage[];
}

export function ChatProvider({ children, initialMessages }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    messages: initialMessages || [],
  });

  // Memoized action creators
  const openChat = useCallback(() => dispatch({ type: 'OPEN_CHAT' }), []);
  const closeChat = useCallback(() => dispatch({ type: 'CLOSE_CHAT' }), []);
  const setInput = useCallback(
    (value: string) => dispatch({ type: 'SET_INPUT', payload: value }),
    []
  );
  const addMessage = useCallback(
    (message: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: message }),
    []
  );
  const updateMessage = useCallback(
    (id: string, updates: Partial<ChatMessage>) =>
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } }),
    []
  );
  const clearMessages = useCallback(() => dispatch({ type: 'CLEAR_MESSAGES' }), []);
  const setError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    []
  );
  const toggleMemory = useCallback(
    () => dispatch({ type: 'SET_USE_MEMORY', payload: !state.useMemory }),
    [state.useMemory]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      state,
      dispatch,
      openChat,
      closeChat,
      setInput,
      addMessage,
      updateMessage,
      clearMessages,
      setError,
      toggleMemory,
    }),
    [
      state,
      openChat,
      closeChat,
      setInput,
      addMessage,
      updateMessage,
      clearMessages,
      setError,
      toggleMemory,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook to access chat context
 * @throws If used outside of ChatProvider
 */
export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

/**
 * Hook to access chat state only (for components that don't need actions)
 */
export function useChatState(): ChatContextState {
  const { state } = useChatContext();
  return state;
}

/**
 * Hook to access chat dispatch only
 */
export function useChatDispatch(): Dispatch<ChatAction> {
  const { dispatch } = useChatContext();
  return dispatch;
}
