# Advanced Cloudflare Features for AutoRAG AI Chat

## Current Implementation Analysis

### ✅ What You Already Have:
- **Workers with Assets Binding**: Serving static site from edge
- **KV Namespaces**: Rate limiting and contact messages
- **AutoRAG Integration**: AI search with streaming responses
- **Edge Computing**: Single worker handling routing, CSP, forms
- **Observability Logs**: Basic logging enabled
- **Sentry Integration**: Error tracking on edge and client

### 🚀 Advanced Features You Can Add

---

## 1. AI Gateway Integration (RECOMMENDED)

**What It Does**: Cloudflare AI Gateway sits between your application and AI models, providing caching, analytics, rate limiting, and cost control.

**Benefits**:
- **Response Caching**: Cache identical queries (can save 70%+ on API costs)
- **Rate Limiting**: Per-user or global limits on AI requests
- **Analytics Dashboard**: Track usage patterns, popular queries, response times
- **A/B Testing**: Test different prompts or models side-by-side
- **Cost Tracking**: Monitor spending on AI API calls in real-time
- **Fallback Logic**: Automatic retry with exponential backoff

### Implementation:

#### Step 1: Create AI Gateway in Cloudflare Dashboard
```bash
# Navigate to: AI > AI Gateway > Create Gateway
# Gateway Name: blakeoxford-ai-gateway
# Copy the gateway URL
```

#### Step 2: Update `wrangler.toml`:
```toml
[vars]
AI_GATEWAY_ID = "blakeoxford-ai-gateway"
AI_GATEWAY_ENDPOINT = "https://gateway.ai.cloudflare.com/v1/<account-id>/blakeoxford-ai-gateway/cloudflare/autorag"
```

#### Step 3: Modify `functions/edge-computing.js`:
```javascript
// In /api/ai-search handler, replace direct AutoRAG call with AI Gateway
const upstreamEndpoint = env.AI_GATEWAY_ENDPOINT
  ? env.AI_GATEWAY_ENDPOINT
  : env.AI_SEARCH_API_ENDPOINT;

const upstreamResponse = await fetch(upstreamEndpoint, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': `Bearer ${upstreamToken}`,
    // Add cache control headers for AI Gateway
    'cf-aig-cache-ttl': '3600', // Cache for 1 hour
    'cf-aig-skip-cache': query.includes('latest') ? 'true' : 'false', // Skip cache for "latest" queries
  },
  body: JSON.stringify(requestBody),
});
```

#### Step 4: Add Query Fingerprinting for Better Caching:
```javascript
// Generate cache key based on normalized query
function normalizeQueryForCache(query) {
  return query.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

const cacheKey = normalizeQueryForCache(query);
// Include in request metadata
```

**Expected Impact**:
- 50-70% reduction in AutoRAG API costs from caching
- Real-time analytics on most asked questions
- Better rate limiting per user/session

---

## 2. Workers Analytics Engine

**What It Does**: Real-time analytics for edge-computed data without client-side tracking.

**Benefits**:
- Track AI query patterns
- Monitor response quality (feedback correlation)
- Identify slow queries or errors
- Privacy-friendly (server-side only)
- No impact on Lighthouse scores

### Implementation:

#### Step 1: Add binding to `wrangler.toml`:
```toml
[[analytics_engine_datasets]]
binding = "AI_ANALYTICS"
```

#### Step 2: Instrument AI Search Handler:
```javascript
// In functions/edge-computing.js, after successful AI response
if (env.AI_ANALYTICS) {
  env.AI_ANALYTICS.writeDataPoint({
    blobs: [
      query.slice(0, 100), // First 100 chars of query
      message.slice(0, 200), // First 200 chars of response
      request.headers.get('cf-connecting-ip') || 'unknown',
      request.headers.get('user-agent')?.slice(0, 100) || 'unknown',
    ],
    doubles: [
      sources.length, // Number of sources returned
      message.length, // Response length
      Date.now() - startTime, // Response time in ms
    ],
    indexes: [
      sentiment || 'neutral', // If feedback included
    ],
  });
}
```

#### Step 3: Query Analytics via GraphQL:
```graphql
query {
  viewer {
    accounts(filter: { accountTag: "cc3bb24ae3c87cff38c2be85df3dab29" }) {
      analyticsEngineDatasets {
        analyticsEngineQueries(
          filter: { datasetName: "AI_ANALYTICS" }
          orderBy: [timestamp_DESC]
          limit: 100
        ) {
          data
        }
      }
    }
  }
}
```

**Expected Impact**:
- Understand which topics users ask about most
- Identify queries that produce poor responses (for RAG tuning)
- Track response time trends over time

---

## 3. Durable Objects for Stateful Sessions

**What It Does**: Persistent, low-latency storage for per-user conversation state.

**Benefits**:
- True conversation continuity across page reloads
- Collaborative sessions (multiple tabs, same conversation)
- User preferences stored at edge
- Faster than KV for frequent updates

### Implementation:

#### Step 1: Create Durable Object Class:
```javascript
// functions/conversation-session.js
export class ConversationSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.conversations = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (request.method === 'POST') {
      // Save conversation state
      const { messages, preferences } = await request.json();
      await this.state.storage.put(`conversation:${sessionId}`, {
        messages,
        preferences,
        updatedAt: Date.now(),
      });
      return new Response(JSON.stringify({ saved: true }));
    }

    if (request.method === 'GET') {
      // Retrieve conversation state
      const data = await this.state.storage.get(`conversation:${sessionId}`);
      return new Response(JSON.stringify(data || {}));
    }

    if (request.method === 'DELETE') {
      // Clear conversation
      await this.state.storage.delete(`conversation:${sessionId}`);
      return new Response(JSON.stringify({ cleared: true }));
    }
  }
}
```

#### Step 2: Add to `wrangler.toml`:
```toml
[[durable_objects.bindings]]
name = "CONVERSATIONS"
class_name = "ConversationSession"
script_name = "blakeoxford-com"

[[migrations]]
tag = "v1"
new_classes = ["ConversationSession"]
```

#### Step 3: Use in Edge Function:
```javascript
// In functions/edge-computing.js
if (url.pathname === '/api/ai-conversation') {
  const sessionId = request.headers.get('x-session-id') || crypto.randomUUID();
  const durableObjectId = env.CONVERSATIONS.idFromName(sessionId);
  const stub = env.CONVERSATIONS.get(durableObjectId);
  return stub.fetch(request);
}
```

**Expected Impact**:
- Conversations persist across page reloads
- Faster conversation loading (< 10ms vs 100ms+ with KV)
- Enable multi-device sync

---

## 4. D1 Database for Query Analytics

**What It Does**: SQLite database at the edge for structured data.

**Benefits**:
- Store query history with structured metadata
- Track user feedback with relational joins
- Generate insights reports (top queries, satisfaction rates)
- Export data for fine-tuning AutoRAG

### Implementation:

#### Step 1: Create D1 Database:
```bash
wrangler d1 create ai-chat-analytics
```

#### Step 2: Add to `wrangler.toml`:
```toml
[[d1_databases]]
binding = "AI_DB"
database_name = "ai-chat-analytics"
database_id = "<your-database-id>"
```

#### Step 3: Create Schema:
```sql
-- migrations/0001_initial.sql
CREATE TABLE queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  response_length INTEGER,
  source_count INTEGER,
  response_time_ms INTEGER,
  created_at INTEGER NOT NULL,
  session_id TEXT,
  user_agent TEXT
);

CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id TEXT NOT NULL,
  sentiment TEXT CHECK(sentiment IN ('positive', 'negative')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (query_id) REFERENCES queries(id)
);

CREATE INDEX idx_queries_created ON queries(created_at);
CREATE INDEX idx_feedback_query ON feedback(query_id);
```

#### Step 4: Insert Data:
```javascript
// In /api/ai-search handler, after successful response
if (env.AI_DB) {
  await env.AI_DB.prepare(`
    INSERT INTO queries (id, query, response_length, source_count, response_time_ms, created_at, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    messageId,
    query.slice(0, 500),
    message.length,
    sources.length,
    Date.now() - startTime,
    Date.now(),
    sessionId
  ).run();
}
```

#### Step 5: Query Insights:
```javascript
// New endpoint: /api/ai-insights
const topQueries = await env.AI_DB.prepare(`
  SELECT
    query,
    COUNT(*) as count,
    AVG(response_time_ms) as avg_time,
    COUNT(f.id) as feedback_count,
    SUM(CASE WHEN f.sentiment = 'positive' THEN 1 ELSE 0 END) as positive_feedback
  FROM queries q
  LEFT JOIN feedback f ON q.id = f.query_id
  WHERE q.created_at > ?
  GROUP BY query
  ORDER BY count DESC
  LIMIT 20
`).bind(Date.now() - 30*24*60*60*1000).all(); // Last 30 days
```

**Expected Impact**:
- Identify content gaps (frequently asked but poorly answered)
- Measure satisfaction trends over time
- Export training data for AutoRAG improvement

---

## 5. KV Cache for Popular Responses

**What It Does**: Cache full AI responses for ultra-common queries.

**Benefits**:
- Instant responses for FAQs (< 5ms)
- Zero AutoRAG API cost for cached queries
- Automatic expiration and refresh

### Implementation:

#### Step 1: Add KV Namespace:
```toml
[[kv_namespaces]]
binding = "AI_RESPONSE_CACHE"
id = "<new-namespace-id>"
```

#### Step 2: Implement Cache Layer:
```javascript
// In /api/ai-search handler, before AutoRAG call
const cacheKey = `response:${normalizeQueryForCache(query)}`;

// Try cache first
if (env.AI_RESPONSE_CACHE) {
  const cached = await env.AI_RESPONSE_CACHE.get(cacheKey, 'json');
  if (cached && Date.now() - cached.timestamp < 7*24*60*60*1000) { // 7 days
    // Return cached response with metadata
    cached.fromCache = true;
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { ...baseCorsHeaders, 'x-cache-status': 'HIT' }
    });
  }
}

// ... make AutoRAG call ...

// Cache successful responses
if (env.AI_RESPONSE_CACHE && message && sources.length > 0) {
  await env.AI_RESPONSE_CACHE.put(cacheKey, JSON.stringify({
    message,
    sources,
    timestamp: Date.now(),
  }), {
    expirationTtl: 7*24*60*60, // 7 days
  });
}
```

#### Step 3: Add Cache Warming Script:
```javascript
// scripts/warm-ai-cache.js
const commonQueries = [
  "What are Blake's skills?",
  "What is Blake's latest project?",
  "How can I contact Blake?",
  "What technologies does Blake use?",
  // Add more common queries
];

for (const query of commonQueries) {
  await fetch('https://blakeoxford.com/api/ai-search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
}
```

**Expected Impact**:
- 90%+ of users get instant responses for common questions
- Reduced AutoRAG costs by caching top 20% of queries

---

## 6. Rate Limiting with Turnstile Integration

**What It Does**: Advanced bot protection and per-user rate limiting for AI endpoints.

**Benefits**:
- Prevent AI API abuse
- Fair usage across users
- Adaptive rate limits based on behavior

### Implementation:

```javascript
// In /api/ai-search handler, add sophisticated rate limiting
async function checkRateLimit(env, clientIp, sessionId) {
  const now = Date.now();
  const window = 60 * 1000; // 1 minute

  // Per-IP limit: 10 requests per minute
  const ipKey = `ratelimit:ip:${clientIp}`;
  const ipCount = await env.RATE_LIMIT_KV.get(ipKey, 'json') || { count: 0, reset: now + window };

  if (now > ipCount.reset) {
    ipCount.count = 0;
    ipCount.reset = now + window;
  }

  ipCount.count++;
  await env.RATE_LIMIT_KV.put(ipKey, JSON.stringify(ipCount), { expirationTtl: 120 });

  if (ipCount.count > 10) {
    return { limited: true, reason: 'ip', resetIn: ipCount.reset - now };
  }

  // Per-session limit: 30 requests per minute (more generous for legitimate users)
  if (sessionId) {
    const sessionKey = `ratelimit:session:${sessionId}`;
    const sessionCount = await env.RATE_LIMIT_KV.get(sessionKey, 'json') || { count: 0, reset: now + window };

    if (now > sessionCount.reset) {
      sessionCount.count = 0;
      sessionCount.reset = now + window;
    }

    sessionCount.count++;
    await env.RATE_LIMIT_KV.put(sessionKey, JSON.stringify(sessionCount), { expirationTtl: 120 });

    if (sessionCount.count > 30) {
      return { limited: true, reason: 'session', resetIn: sessionCount.reset - now };
    }
  }

  return { limited: false };
}

// Use in handler
const rateLimit = await checkRateLimit(
  env,
  request.headers.get('cf-connecting-ip'),
  request.headers.get('x-session-id')
);

if (rateLimit.limited) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    resetIn: rateLimit.resetIn
  }), {
    status: 429,
    headers: {
      ...baseCorsHeaders,
      'retry-after': Math.ceil(rateLimit.resetIn / 1000)
    }
  });
}
```

**Expected Impact**:
- Protect against abuse and bot traffic
- Fair resource allocation
- Lower costs from prevented spam

---

## 7. Edge-Side Prompt Engineering

**What It Does**: Dynamically enhance queries at the edge based on analytics and patterns.

**Benefits**:
- Improve response quality without client changes
- A/B test prompt strategies
- Apply learned optimizations globally

### Implementation:

```javascript
// In /api/ai-search handler, add intelligent query enhancement
async function enhanceQueryWithEdgeIntelligence(query, env) {
  // Check if this query type historically gets poor responses
  if (env.AI_DB) {
    const similar = await env.AI_DB.prepare(`
      SELECT
        AVG(CASE WHEN f.sentiment = 'positive' THEN 1 ELSE 0 END) as satisfaction
      FROM queries q
      LEFT JOIN feedback f ON q.id = f.query_id
      WHERE q.query LIKE ?
    `).bind(`%${query.split(' ').slice(0, 3).join('%')}%`).first();

    // If satisfaction < 50%, add extra context
    if (similar && similar.satisfaction < 0.5) {
      return `${query} (Please provide detailed, specific examples with measurable outcomes.)`;
    }
  }

  return query;
}

// Apply before sending to AutoRAG
const enhancedQuery = await enhanceQueryWithEdgeIntelligence(query, env);
```

**Expected Impact**:
- Continuously improving response quality
- Self-optimizing based on user feedback

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ **KV Response Cache** - Immediate cost savings and speed boost
2. ✅ **Enhanced Rate Limiting** - Protect your AI budget
3. ✅ **Workers Analytics Engine** - Start collecting usage data

### Phase 2: Strategic (3-5 hours)
4. ✅ **AI Gateway Integration** - Comprehensive AI management
5. ✅ **D1 Database** - Structured analytics and insights
6. ✅ **Edge-Side Prompt Enhancement** - Quality improvements

### Phase 3: Advanced (5-10 hours)
7. ✅ **Durable Objects** - Persistent conversations
8. ⏭️ **Vectorize Integration** - Custom embeddings for better search
9. ⏭️ **R2 Storage** - Long-term conversation archives

---

## Cost Analysis

### Current (Estimated Monthly):
- Workers requests: ~$5 (1M requests)
- AutoRAG API: ~$50-100 (depends on usage)
- KV operations: ~$1
- **Total: ~$56-106/month**

### With Optimizations (Estimated Monthly):
- Workers requests: ~$5 (same)
- AutoRAG API: ~$15-30 (70% reduction from caching)
- KV operations: ~$2 (increased for cache)
- AI Gateway: **FREE**
- Analytics Engine: **FREE** (up to 10M events/month)
- D1 Database: **FREE** (up to 5M reads/month)
- Durable Objects: ~$2 (light usage)
- **Total: ~$24-39/month (60% savings!)**

---

## Monitoring & Observability

### Dashboard Recommendations:

1. **AI Gateway Dashboard** (Cloudflare):
   - Request volume trends
   - Cache hit rates
   - Error rates by query type
   - Cost per request

2. **Workers Analytics** (GraphQL):
   - Response time percentiles
   - Popular query patterns
   - User satisfaction trends

3. **Custom D1 Dashboard**:
   ```sql
   -- Daily summary query
   SELECT
     DATE(created_at/1000, 'unixepoch') as date,
     COUNT(*) as total_queries,
     AVG(response_time_ms) as avg_response_time,
     COUNT(DISTINCT session_id) as unique_users
   FROM queries
   WHERE created_at > ?
   GROUP BY date
   ORDER BY date DESC;
   ```

---

## Next Steps

1. **Choose Phase 1 features** to implement first
2. **Set up AI Gateway** in Cloudflare dashboard
3. **Create KV namespace** for response cache
4. **Add Analytics Engine binding** to wrangler.toml
5. **Deploy and monitor** impact on costs and performance

Would you like me to implement any of these features? I can start with Phase 1 (KV cache + enhanced rate limiting + analytics) which will give immediate benefits!
