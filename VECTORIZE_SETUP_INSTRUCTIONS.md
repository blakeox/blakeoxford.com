# 🔍 Vectorize Setup - Final Steps

## ✅ Step 1: Create Index - COMPLETE!

```bash
wrangler vectorize create blakeoxford-content --dimensions=768 --metric=cosine
```

**Status**: ✅ Index created successfully!

---

## 🔑 Step 2: Get Your Cloudflare API Token

### Option A: Use Existing Token (If You Have One)

If you already have a Cloudflare API token with Workers AI permissions:

```bash
export CLOUDFLARE_API_TOKEN=your-existing-token
```

### Option B: Create New Token (Recommended)

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Edit Cloudflare Workers"** (or create custom)
4. Permissions needed:
   - Account → Workers AI → Edit
   - Account → Account Settings → Read
5. Click **"Continue to summary"**
6. Click **"Create Token"**
7. **Copy the token** (you won't see it again!)

### Option C: Use Account ID + API Key (Alternative)

If you prefer using your Global API Key:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find "Global API Key" → Click "View"
3. Copy the key

Then set both:
```bash
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_API_KEY=your-global-api-key
```

---

## 📊 Step 3: Run Indexing Script

Once you have the token:

```bash
# Set the token
export CLOUDFLARE_API_TOKEN=your-token-here

# Run the indexer
pnpm vectorize:index
```

**What this does**:
- Reads 3 blog posts and 7 projects
- Generates 768-dimensional embeddings for each
- Calls Workers AI BGE model for vector generation
- Saves to `vectorize-data.json`

**Expected output**:
```
🚀 Vectorize Content Indexer
📁 Found content:
   Blog posts: 3
   Projects: 7
   Total: 10

📊 Indexing 10 items into Vectorize...

[1/10] Processing: blog/ai-statistics-future-decision-making
  ✓ Generated 768-dimensional vector
[2/10] Processing: projects/LLM-note-coaching
  ✓ Generated 768-dimensional vector
...

✅ Indexing complete!
```

---

## 📤 Step 4: Upload Vectors to Vectorize

After indexing completes:

```bash
wrangler vectorize insert blakeoxford-content --file=vectorize-data.json
```

**Expected output**:
```
⬆️  Uploading 10 vectors to blakeoxford-content
✨ Successfully inserted 10 vectors
```

---

## 🚀 Step 5: Deploy (Already Done!)

Your Worker is already deployed with Vectorize binding! ✅

---

## 🧪 Step 6: Test Semantic Search

```bash
# Test 1: AI projects
curl -X POST https://blakeoxford.com/api/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "AI and machine learning projects", "limit": 3}' | jq

# Test 2: Healthcare work
curl -X POST https://blakeoxford.com/api/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "healthcare technology", "limit": 3}' | jq

# Test 3: Cloud infrastructure
curl -X POST https://blakeoxford.com/api/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "cloud infrastructure work", "limit": 3}' | jq
```

**Expected**: JSON results with relevant content ranked by semantic similarity!

---

## 📋 Quick Reference

### Get Your Account ID

```bash
# From wrangler
wrangler whoami

# Or check wrangler.toml
grep account_id wrangler.toml
```

### Check Index Status

```bash
# View index details
wrangler vectorize get blakeoxford-content

# Should show:
# - Dimensions: 768
# - Metric: cosine
# - Vector count: 10 (after upload)
```

### Re-index When You Add New Content

```bash
# After publishing new blog post or project:
export CLOUDFLARE_API_TOKEN=your-token
pnpm vectorize:index
wrangler vectorize insert blakeoxford-content --file=vectorize-data.json
```

---

## ✅ Progress Checklist

- [x] **Step 1**: Create Vectorize index ✅
- [x] **Step 2**: Get Cloudflare API token ⏳ (you need to do this)
- [ ] **Step 3**: Run indexing script
- [ ] **Step 4**: Upload vectors
- [x] **Step 5**: Deploy Worker ✅
- [ ] **Step 6**: Test semantic search

---

## 🎯 Next: Get Your API Token

The only thing left is getting your Cloudflare API token and running steps 3-4!

Choose **Option B** above (Create New Token) for best security, or use your existing token if you have one.

Then run:
```bash
export CLOUDFLARE_API_TOKEN=your-token
pnpm vectorize:index
wrangler vectorize insert blakeoxford-content --file=vectorize-data.json
```

That's it! 🚀
