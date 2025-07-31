# Analytics Module Consolidation Migration Plan

## 🎯 **Objective**
Replace the dual `AnalyticsManager` and `AnalyticsModule` with a single consolidated `Analytics` class to simplify architecture and reduce code duplication.

## 📋 **API Migration Mapping**

### Old APIs → New APIs

#### AnalyticsManager Methods:
```typescript
// OLD: AnalyticsManager
const manager = new AnalyticsManager(config);
manager.trackEvent(category, action, label, value, customData);
manager.trackPageView(page);
manager.trackNavigation(from, to, method);
manager.getEvents();
manager.getPerformanceMetrics();
manager.getUserJourney();

// NEW: Analytics
const analytics = Analytics.getInstance(config);
analytics.track({ category, action, label, value, custom: customData });
analytics.trackPageView(page, title);
analytics.trackNavigation({ from, to, method });
analytics.getEvents();
analytics.getPerformanceMetrics();
analytics.getUserJourney();
```

#### AnalyticsModule Methods:
```typescript
// OLD: AnalyticsModule
const module = new AnalyticsModule(config);
module.trackEvent(eventName, eventData);
module.trackPageView(path);
module.trackFormSubmission(formName, data);
module.trackSearch(query, source);
module.trackNavigation(from, to, method);
module.trackScrollDepth(depth, direction);
module.trackPerformance(metricName, value, unit);
module.trackError(errorType, errorMessage, additionalData);

// NEW: Analytics
const analytics = Analytics.getInstance(config);
analytics.track({ category: 'custom', action: eventName, custom: eventData });
analytics.trackPageView(path);
analytics.trackForm({ formName, ...data });
analytics.trackSearch({ query, source });
analytics.trackNavigation({ from, to, method });
analytics.trackScroll({ depth, direction });
// Performance tracking is automatic
analytics.trackError({ errorType, errorMessage, ...additionalData });
```

## 🔄 **Migration Steps**

### Phase 1: Update Module Exports
- ✅ Update `src/scripts/modules/index.ts` to export new Analytics
- ✅ Mark old modules as deprecated

### Phase 2: Update Global Type Definitions
- ✅ Update `src/global.d.ts` to replace `analyticsModule` with `analytics`

### Phase 3: Update Usage in Components
- ✅ Update `src/scripts/features/ModernNavBar.ts`
- ✅ Update any other components using analytics

### Phase 4: Create Compatibility Layer (Optional)
- Create backward compatibility functions if needed
- Gradually migrate all usage to new API

### Phase 5: Remove Old Modules
- Remove `AnalyticsManager.ts` and `AnalyticsModule.ts`
- Clean up legacy exports

## 📁 **Files Requiring Updates**

1. **Core Module Files:**
   - `src/scripts/modules/index.ts` - Update exports
   - `src/global.d.ts` - Update window interface

2. **Feature Components:**
   - `src/scripts/features/ModernNavBar.ts` - Replace analytics usage

3. **Configuration:**
   - Update any config files referencing old modules

## 🔧 **Breaking Changes**

1. **Window Global Variable:**
   - `window.analyticsModule` → `window.analytics`
   - `window.analyticsManager` → `window.analytics`

2. **Initialization Functions:**
   - `initAnalyticsModule()` → `initAnalytics()`
   - `initAnalyticsManager()` → `Analytics.getInstance()`

3. **Method Signatures:**
   - Unified `track()` method replaces various tracking methods
   - More structured data objects instead of separate parameters

## ⚡ **Benefits After Migration**

- **Single Import:** Only need to import `Analytics` instead of two classes
- **Singleton Pattern:** Consistent instance across the application
- **Better Type Safety:** Consolidated interfaces and better TypeScript support
- **Reduced Bundle Size:** Eliminates duplicate code and functionality
- **Simplified API:** Single `track()` method for all event types
- **Better Performance Monitoring:** Integrated performance tracking

## 🧪 **Testing Strategy**

1. Update all existing analytics tests to use new API
2. Verify event tracking still works with all providers
3. Test performance monitoring integration
4. Validate backward compatibility if maintained

## 📈 **Expected Impact**

- **Bundle Size Reduction:** ~15-20% for analytics-related code
- **Maintainability:** Single source of truth for analytics logic
- **Developer Experience:** Simpler API, better autocomplete
- **Performance:** Reduced initialization overhead
