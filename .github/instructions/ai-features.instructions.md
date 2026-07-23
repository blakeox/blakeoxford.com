---
description: AI features, chat widget, and RAG implementation
applyTo: '{src/components/composites/AIChatWidget.astro,src/features/chat/**,functions/ConversationDO.ts,functions/routes/ai-search/**,src/lib/{ai-search.ts,ai-search-types.ts,chat/**},src/services/AISearchService.ts}'
---

# AI Features Instructions

Guidelines for developing AI-powered features including the chat widget, RAG system, and semantic search.

---

## 1. Architecture Overview

### AI Chat Components

- **AIChatWidget.astro** — Astro mount (`src/components/composites/`)
- **AIChatIsland.tsx** / **ChatLauncherIsland.tsx** — React entry points under `src/features/chat/`
- **features/chat/components/** — Message UI, header, input, status
- **features/command-center/** — Find overlay (handoff into Ask)
- **features/overlay/** — Shared overlay shell + suggestion chips

### Backend Services

- **ConversationDO.ts** - Durable Object for stateful conversations
- **Workers AI** - On-edge LLM inference
- **Vectorize** - Semantic search over content
- **Analytics Engine** - Usage tracking

### Library Files

- `src/lib/ai-search.ts` / `src/lib/ai-search-types.ts` - thin Ask client + shared types
- `src/services/AISearchService.ts` - HTTP/streaming client for `/api/ai-search`
- `src/lib/chat/` - Types, helpers, constants, conversation/WS utilities
- `src/features/chat/hooks/` - Chat controller and orchestration hooks
- `src/lib/hooks/` - Shared DOM/browser hooks (compat re-exports for chat hooks)

### Edge Worker

- Entry: `functions/index.ts` (routes under `functions/routes/`, shared under `functions/shared/`)
- Ask API: `functions/routes/ai-search/`
---

## 2. Chat Widget Integration

### Adding to Pages

```astro
---
import AIChatWidget from '@/components/composites/AIChatWidget.astro';
---

<AIChatWidget />
```

### Client-Side Hydration

Uses Astro Islands pattern with `client:only="react"`:

```astro
<AIChatIsland client:only="react" />
```

**Why client:only**: Chat requires full React runtime with hooks, state management, and WebSocket connections.

---

## 3. RAG (Retrieval-Augmented Generation)

### Content Indexing

#### Vectorize Setup

1. Generate embeddings from content:
```bash
pnpm vectorize:index
```

2. Script: `scripts/vectorize-content.mjs`

3. Indexed content:
   - Blog posts
   - Project descriptions
   - Documentation

#### Index Configuration

In `wrangler.toml`:
```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "blakeoxford-content"
```

### Query Flow

1. **User Input** → AI chat widget
2. **Semantic Search** → Vectorize query for relevant content
3. **Context Assembly** → Top K results with metadata
4. **LLM Generation** → Workers AI with augmented context
5. **Response** → Message with source citations

### Source Citations

Each AI response includes sources:

```typescript
interface AIChatSource {
  title: string;
  url: string;
  snippet?: string;
  score?: number;
}
```

Displayed in `MessageBubble.tsx` with expandable details.

---

## 4. Real-Time Features

### WebSocket Communication

**Durable Object**: `ConversationDurableObject`

**Connection**:
```javascript
const ws = new WebSocket(
  `wss://blakeoxford.com/ws?sessionId=${sessionId}&userId=${userId}`
);
```

**Message Types**:
- `init` - Initial state and session info
- `message` - Chat messages (user/assistant)
- `typing` - Typing indicators
- `presence` - User join/leave events
- `error` - Error notifications

### Typing Indicators

**Start typing**:
```javascript
ws.send(JSON.stringify({ type: 'typing', isTyping: true }));
```

**Stop typing**:
```javascript
ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
```

### Presence Tracking

Durable Object tracks:
- Active connections
- User sessions
- Connection timestamps
- Last activity

---

## 5. AI Response Caching

### Cache Strategy

- **Storage**: `AI_RESPONSE_CACHE` KV namespace
- **Key**: Hash of query + context
- **TTL**: Configurable per response type
- **Invalidation**: Manual or time-based

### Implementation

```javascript
const cacheKey = `ai:${hashQuery(query)}`;
const cached = await env.AI_RESPONSE_CACHE.get(cacheKey, 'json');

if (cached) {
  return cached;
}

const response = await generateResponse(query);
await env.AI_RESPONSE_CACHE.put(cacheKey, JSON.stringify(response), {
  expirationTtl: 3600
});
```

---

## 6. Rate Limiting

### Per-User Limits

In `ConversationDO.js`:

```javascript
checkRateLimit(userId) {
  const limit = this.rateLimit.get(userId);
  const now = Date.now();
  
  if (limit && limit.count >= MAX_REQUESTS && now < limit.resetTime) {
    return false; // Rate limited
  }
  
  // Update or create limit
  this.rateLimit.set(userId, {
    count: (limit?.count || 0) + 1,
    resetTime: now + RATE_LIMIT_WINDOW
  });
  
  return true;
}
```

### Global Rate Limiting

Edge Worker (`functions/index.ts`) implements:
- Per-IP limits
- Per-session limits
- Configurable windows and thresholds

---

## 7. Error Handling

### Client-Side Error Boundary

```tsx
<ErrorBoundary>
  <AIChatIsland />
</ErrorBoundary>
```

Catches React errors and displays user-friendly fallback.

### Server-Side Errors

```javascript
try {
  const response = await env.AI.run(model, params);
  return response;
} catch (error) {
  sentry.captureException(error);
  
  return {
    message: "I'm having trouble processing your request.",
    error: true
  };
}
```

### WebSocket Reconnection

Automatic reconnection with exponential backoff:

```typescript
const reconnect = () => {
  const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
  setTimeout(() => connect(), delay);
};
```

---

## 8. Analytics & Monitoring

### AI Analytics

Track via Analytics Engine:

```javascript
env.AI_ANALYTICS.writeDataPoint({
  blobs: [query, response],
  doubles: [responseTime, tokenCount],
  indexes: [sessionId, userId]
});
```

### Metrics to Track

- Query volume
- Response times
- Token usage
- Error rates
- Cache hit rates
- User satisfaction (feedback)

### Feedback System

Storage: `AI_FEEDBACK_KV`

```javascript
await env.AI_FEEDBACK_KV.put(
  `feedback:${messageId}`,
  JSON.stringify({ rating, comment, timestamp })
);
```

---

## 9. Message Processing

### Input Validation

In `src/lib/message-validation.ts`:

```typescript
export function validateMessage(text: string): ValidationResult {
  // Length check
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'Message too long' };
  }
  
  // Content safety
  if (containsProhibitedContent(text)) {
    return { valid: false, error: 'Invalid content' };
  }
  
  return { valid: true };
}
```

### Response Processing

In `src/lib/message-processing.ts`:

- Clean snippets from sources
- Format citations
- Parse markdown
- Sanitize HTML output

---

## 10. Development & Testing

### Local Development

AI search proxy in `astro.config.mjs` handles development:

```javascript
if (process.env.NODE_ENV !== 'production') {
  vite: {
    plugins: [createDevAISearchProxy()]
  }
}
```

### Environment Variables

Required for AI features:

- `AI_SEARCH_API_ENDPOINT` - Vectorize endpoint
- `AI_SEARCH_API_TOKEN` - Authentication token
- `PUBLIC_ENABLE_AI_CHAT` - Feature flag

### Testing Strategies

**Unit Tests**:
- Message validation
- Helper functions
- State management

**Integration Tests**:
- WebSocket connections
- RAG query flow
- Cache behavior

**E2E Tests**:
- Chat widget interaction
- Message sending/receiving
- Error scenarios

---

## 11. Best Practices

### Performance

- Cache AI responses aggressively
- Use streaming for long responses
- Lazy load chat widget
- Debounce typing indicators

### User Experience

- Show loading states clearly
- Provide source citations
- Handle errors gracefully
- Support keyboard navigation

### Privacy

- No PII in analytics
- Clear data retention policy
- User consent for chat history
- Secure WebSocket connections

### Cost Optimization

- Implement response caching
- Use appropriate model sizes
- Set reasonable token limits
- Monitor usage patterns

---

## 12. Configuration

### Chat Constants

In `src/lib/chat-constants.ts`:

```typescript
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  MAX_HISTORY_LENGTH: 20,
  TYPING_TIMEOUT: 3000,
  RECONNECT_ATTEMPTS: 5,
  CACHE_TTL: 3600
};
```

### Model Selection

Workers AI models:
- `@cf/meta/llama-2-7b-chat-int8` - General chat
- `@cf/mistral/mistral-7b-instruct-v0.1` - Instruction following
- `@cf/meta/llama-3-8b-instruct` - Latest model

Choose based on:
- Response quality requirements
- Latency constraints
- Token limits
- Cost considerations

---

## Reference Documents

- `src/lib/chat-types.ts` - TypeScript type definitions
- `functions/ConversationDO.js` - WebSocket implementation
- `VECTORIZE_SETUP_INSTRUCTIONS.md` - RAG setup guide
- Cloudflare AI Docs: https://developers.cloudflare.com/workers-ai/
