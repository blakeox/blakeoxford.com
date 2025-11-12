# 🎯 Quick Start: Vectorize Setup (Steps 1-3)

You've already completed Step 1 (creating the index). Here's how to finish Steps 2-3:

---

## ✅ Step 1: Create Index - COMPLETE!

```bash
wrangler vectorize create blakeoxford-content --dimensions=768 --metric=cosine
```

**Status**: ✅ Done!

---

## 🔑 Step 2: Get Your Cloudflare API Token

### Easiest Method: Create API Token (2 minutes)

1. Open: <https://dash.cloudflare.com/profile/api-tokens>
2. Click **"Create Token"**
3. Click **"Use template"** next to **"Edit Cloudflare Workers"**
4. Scroll down and click **"Continue to summary"**
5. Click **"Create Token"**
6. **Copy the token** (you won't see it again!)

---

## 📊 Step 3: Run Indexing (3 Options)

### Option A: Interactive (Easiest - Recommended)

```bash
./scripts/run-vectorize-index.sh
```

The script will ask for your token and run the indexer.

### Option B: Set Environment Variable

```bash
# Set token for this session
export CLOUDFLARE_API_TOKEN=your-token-here

# Run indexer
pnpm vectorize:index
```

### Option C: Inline Token (One Command)

```bash
CLOUDFLARE_API_TOKEN=your-token pnpm vectorize:index
```

---

## 📤 Step 4: Upload Vectors

After indexing completes, upload to Vectorize:

```bash
wrangler vectorize insert blakeoxford-content --file=vectorize-data.json
```

**Expected output**:

```text
⬆️  Uploading 10 vectors to blakeoxford-content
✨ Successfully inserted 10 vectors
```

---

## ✅ Done!

Your semantic search is now ready! Test it:

```bash
curl -X POST https://blakeoxford.com/api/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "AI projects", "limit": 3}' | jq
```

---

## 🆘 Troubleshooting

### "CLOUDFLARE_API_TOKEN not set"

Run Option A above (`./scripts/run-vectorize-index.sh`)

### "Permission denied: run-vectorize-index.sh"

```bash
chmod +x scripts/run-vectorize-index.sh
```

### "Failed to generate embedding"

Your API token needs "Workers AI" permissions. Create a new token with the "Edit Cloudflare Workers" template.

---

**Total Time**: 5-10 minutes  
**Result**: Semantic search ready to deploy! 🚀
