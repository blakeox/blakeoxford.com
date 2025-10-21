# Enable Cloudflare Workers Analytics Engine

**Date**: October 20, 2025  
**Status**: ⚠️ Required before deployment

## Issue

The Phase 1 deployment requires Cloudflare Workers Analytics Engine to be enabled in your account. You received this error:

```
You need to enable Analytics Engine. Head to the Cloudflare Dashboard to enable:
https://dash.cloudflare.com/cc3bb24ae3c87cff38c2be85df3dab29/workers/analytics-engine
```

## What is Analytics Engine?

Workers Analytics Engine is a **FREE** feature (included in your Workers Paid plan) that provides:
- Real-time analytics for your Workers
- SQL-queryable datasets
- Zero additional cost for up to 10M events per month
- Sub-second query performance

## How to Enable

### Option 1: Quick Enable (Recommended)

1. **Visit the direct link provided in the error**:
   ```
   https://dash.cloudflare.com/cc3bb24ae3c87cff38c2be85df3dab29/workers/analytics-engine
   ```

2. **Click "Enable Analytics Engine"** button

3. **Confirm** - No payment required, it's included free

4. **Deploy again**:
   ```bash
   wrangler deploy
   ```

### Option 2: Manual Navigation

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Analytics Engine** tab
4. Click **Enable Analytics Engine** button
5. Deploy:
   ```bash
   wrangler deploy
   ```

## After Enabling

Once enabled, your deployment will include:

✅ **AI_ANALYTICS** dataset binding  
✅ Real-time query tracking  
✅ Cache hit/miss metrics  
✅ Response time monitoring  
✅ Query pattern analysis  

## Deployment Command

After enabling Analytics Engine:

```bash
# Full deployment with all Phase 1 optimizations
wrangler deploy

# You should see:
# ✨ Success! Uploaded XX files
# 🌎 Deploying...
# ✅ Successfully deployed blakeoxford-com
```

## Verify Deployment

After successful deployment, test the new features:

### 1. Test Cache (first query will be slow, second fast)

```bash
# First query - cache MISS
curl -X POST https://blakeoxford.com/api/ai-search \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session" \
  -d '{"query": "What are Blake'\''s skills"}' \
  -i | grep -E "x-cache-status|x-response-time"

# Expected: x-cache-status: MISS, x-response-time: ~500-1000

# Second query - cache HIT
curl -X POST https://blakeoxford.com/api/ai-search \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session" \
  -d '{"query": "What are Blake'\''s skills"}' \
  -i | grep -E "x-cache-status|x-response-time"

# Expected: x-cache-status: HIT, x-response-time: <10ms
```

### 2. Check Analytics Data

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Click **Analytics Engine** tab
3. Run this query:

```sql
SELECT
  blob2 AS event_type,
  COUNT(*) AS total_queries,
  AVG(double3) AS avg_response_time_ms
FROM AI_ANALYTICS
WHERE timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY event_type;
```

Expected output:
```
event_type   | total_queries | avg_response_time_ms
-------------|---------------|---------------------
CACHE_HIT    | 5            | 3.2
API_CALL     | 3            | 847.5
```

### 3. Test Rate Limiting

```bash
# Rapid-fire 12 requests (should hit limit at 11th)
for i in {1..12}; do
  echo "Request $i:"
  curl -s -X POST https://blakeoxford.com/api/ai-search \
    -H "Content-Type: application/json" \
    -d '{"query": "test '$i'"}' | jq -r '.error // "OK"'
done

# Expected: First 10 succeed, 11th and 12th return rate limit error
```

## Alternative: Deploy Without Analytics (Temporary)

If you want to deploy immediately without analytics, temporarily remove the analytics binding:

### Temporary Fix

1. Edit `wrangler.toml`:
```toml
# Comment out analytics temporarily
# [[analytics_engine_datasets]]
# binding = "AI_ANALYTICS"
```

2. Edit `functions/edge-computing.js` to skip analytics:
```javascript
// Find all instances of:
if (env.AI_ANALYTICS) {

// Change to:
if (false && env.AI_ANALYTICS) { // Disabled until Analytics Engine enabled
```

3. Deploy:
```bash
wrangler deploy
```

**Note**: You'll still get caching and rate limiting, just no analytics tracking. Re-enable later after activating Analytics Engine.

## Cost Information

**Analytics Engine Pricing**:
- First 10M events/month: **FREE**
- Next 10M events/month: $0.25 per million
- Query execution: FREE

**Your Expected Usage** (2,300 AI queries/month):
- Events: ~2,300/month (well under 10M free tier)
- Cost: **$0.00/month**

## Troubleshooting

### "Analytics Engine not available"
- Ensure you're on a Workers Paid plan ($5/month minimum)
- Check that you've clicked "Enable" in the dashboard
- Wait 1-2 minutes after enabling before deploying

### "Dataset not found"
- The dataset is auto-created on first write
- No manual setup needed beyond enabling the feature

### "Permission denied"
- Verify you have admin access to the Cloudflare account
- Check that the API token has Workers permissions

## Support

If you encounter issues:
1. Check [Cloudflare Analytics Engine Docs](https://developers.cloudflare.com/analytics/analytics-engine/)
2. Review [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
3. Contact Cloudflare Support if Analytics Engine won't enable

---

**Next Step**: Visit the dashboard link above to enable Analytics Engine, then run `wrangler deploy` again.
