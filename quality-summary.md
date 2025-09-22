# Quality Summary

Generated: 2025-09-11T13:30:02.979Z

### Performance Baselines
- /: load=1100ms trend=0.00% ➖ 
- /about: load=1050ms trend=0.00% ➖ 
- /projects: load=1200ms trend=0.00% ➖ 
- /blog: load=1250ms trend=0.00% ➖ 

### API Diff Reports

_No API baseline changes detected._

### Reliability Composite

- Composite Score: 60.0 (Grade C)
- Components => Mutation: 0.0, Flakiness: 100.0, Performance: 100.0

### Search Relevance

- Strict Pass: 100.0%
- Top-3 Pass: 100.0%


### Accessibility Trend

- Recent totals: -3, -3, -3, 4, 4, 4
- Trend slope: 1.80 (regressing) ▁▁▁███

### Long Task Probe

- Routes: / max:0.0 over50:0 | /about max:0.0 over50:0 | /projects max:0.0 over50:0

### Visual Stability Notes

- 2025-09-19: Stabilized Firefox full-page visuals on /blog and /about by waiting for `document.fonts.ready`, waiting for `load` on content routes, and increasing the screenshot expectation timeout. Kept existing baselines; updated /about Firefox snapshot once after verified stability.
