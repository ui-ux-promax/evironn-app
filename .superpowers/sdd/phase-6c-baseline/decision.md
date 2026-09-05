Decision: NO_CHANGE

Measurement decision record

Mode: requestStarts
Reasons: run 1 owner fails strict rank; run 2 owner fails strict rank; run 3 owner fails strict rank; owner median does not exceed combined non-owner median

Candidate Decision Rule

1. Existing local Playwright and Chromium surface used; no installation, login, deployment, provider/database mutation, or secret access.
2. Exact HERO_VIDEO_PATHS request starts are counted before the fixed endpoint; no interaction occurred.
3. Owner ranking uses all three complete home ledgers, per-run combined non-owner values, then medians. Ties fail.
4. Catalog/PDP are guardrails; no catalog/PDP/shared-cache/auth/provider/security change is authorized.
5. Owner change, if authorized, is exactly preload="auto" to preload="none" with activation-time video.load() preserved.

Home repeats comparable: true
Exact hero request evidence in at least two home runs: true
Activation-time load preserved: true
Owner preload contract: preload="auto" to preload="none"
Playwright/browser versions match all observations: true
Cache identity comparable across all ten observations: true
Cold classification: cold candidate; platform cold state unproven
Neither load nor readyState === "complete" is a comparability requirement.
Exact-owner request-start median: 16
Exact-owner observed-byte median: unavailable
Per-run combined non-owner request starts: [67,67,67]
Per-run combined non-owner bytes: [null,null,null]
Combined non-owner request-start median: 67
Combined non-owner observed-byte median: unavailable
Owner/combined decision medians: request starts owner=16; combined non-owner=67; mode=requestStarts

Home request/resource evidence

- home-run-1: comparable=true; owner starts=16; owner bytes=null; total starts=83; total bytes=unavailable
  groups={"document":{"requestStarts":1,"observedBytes":12782,"completedRequests":1,"failedRequests":0,"inFlightRequests":0},"script":{"requestStarts":16,"observedBytes":null,"completedRequests":13,"failedRequests":0,"inFlightRequests":3},"stylesheet":{"requestStarts":8,"observedBytes":63603,"completedRequests":8,"failedRequests":0,"inFlightRequests":0},"font":{"requestStarts":7,"observedBytes":null,"completedRequests":3,"failedRequests":0,"inFlightRequests":4},"image":{"requestStarts":30,"observedBytes":null,"completedRequests":4,"failedRequests":0,"inFlightRequests":26},"heroProductVideo":{"requestStarts":16,"observedBytes":null,"completedRequests":0,"failedRequests":0,"inFlightRequests":16},"otherVideo":{"requestStarts":5,"observedBytes":null,"completedRequests":0,"failedRequests":0,"inFlightRequests":5},"other":{"requestStarts":0,"observedBytes":0,"completedRequests":0,"failedRequests":0,"inFlightRequests":0}}
  owner URLs=["https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4","https://evironn-app.vercel.app/assets/hero/sofa-reverse.mp4","https://evironn-app.vercel.app/assets/hero/chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-dining-forward.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-dining-reverse.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-island-forward.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-island-reverse.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-bed-forward.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-bed-reverse.mp4","https://evironn-app.vercel.app/assets/hero/terrace-chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/terrace-chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/terrace-sofa-forward.mp4","https://evironn-app.vercel.app/assets/hero/terrace-sofa-reverse.mp4"]
- home-run-2: comparable=true; owner starts=16; owner bytes=295074; total starts=83; total bytes=unavailable
  groups={"document":{"requestStarts":1,"observedBytes":12785,"completedRequests":1,"failedRequests":0,"inFlightRequests":0},"script":{"requestStarts":16,"observedBytes":null,"completedRequests":12,"failedRequests":0,"inFlightRequests":4},"stylesheet":{"requestStarts":8,"observedBytes":63597,"completedRequests":8,"failedRequests":0,"inFlightRequests":0},"font":{"requestStarts":7,"observedBytes":null,"completedRequests":3,"failedRequests":0,"inFlightRequests":4},"image":{"requestStarts":30,"observedBytes":2843410,"completedRequests":3,"failedRequests":0,"inFlightRequests":27},"heroProductVideo":{"requestStarts":16,"observedBytes":295074,"completedRequests":0,"failedRequests":0,"inFlightRequests":16},"otherVideo":{"requestStarts":5,"observedBytes":147713,"completedRequests":0,"failedRequests":0,"inFlightRequests":5},"other":{"requestStarts":0,"observedBytes":0,"completedRequests":0,"failedRequests":0,"inFlightRequests":0}}
  owner URLs=["https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4","https://evironn-app.vercel.app/assets/hero/sofa-reverse.mp4","https://evironn-app.vercel.app/assets/hero/chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-dining-forward.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-dining-reverse.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-island-forward.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-island-reverse.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-bed-forward.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-bed-reverse.mp4","https://evironn-app.vercel.app/assets/hero/terrace-chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/terrace-chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/terrace-sofa-forward.mp4","https://evironn-app.vercel.app/assets/hero/terrace-sofa-reverse.mp4"]
- home-run-3: comparable=true; owner starts=16; owner bytes=null; total starts=83; total bytes=unavailable
  groups={"document":{"requestStarts":1,"observedBytes":12782,"completedRequests":1,"failedRequests":0,"inFlightRequests":0},"script":{"requestStarts":16,"observedBytes":null,"completedRequests":13,"failedRequests":0,"inFlightRequests":3},"stylesheet":{"requestStarts":8,"observedBytes":63077,"completedRequests":8,"failedRequests":0,"inFlightRequests":0},"font":{"requestStarts":7,"observedBytes":null,"completedRequests":3,"failedRequests":0,"inFlightRequests":4},"image":{"requestStarts":30,"observedBytes":2925929,"completedRequests":4,"failedRequests":0,"inFlightRequests":26},"heroProductVideo":{"requestStarts":16,"observedBytes":null,"completedRequests":0,"failedRequests":0,"inFlightRequests":16},"otherVideo":{"requestStarts":5,"observedBytes":null,"completedRequests":0,"failedRequests":0,"inFlightRequests":5},"other":{"requestStarts":0,"observedBytes":0,"completedRequests":0,"failedRequests":0,"inFlightRequests":0}}
  owner URLs=["https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4","https://evironn-app.vercel.app/assets/hero/sofa-reverse.mp4","https://evironn-app.vercel.app/assets/hero/chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-dining-forward.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-dining-reverse.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-island-forward.mp4","https://evironn-app.vercel.app/assets/hero/kitchen-island-reverse.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-bed-forward.mp4","https://evironn-app.vercel.app/assets/hero/bedroom-bed-reverse.mp4","https://evironn-app.vercel.app/assets/hero/terrace-chair-forward.mp4","https://evironn-app.vercel.app/assets/hero/terrace-chair-reverse.mp4","https://evironn-app.vercel.app/assets/hero/terrace-sofa-forward.mp4","https://evironn-app.vercel.app/assets/hero/terrace-sofa-reverse.mp4"]
- cold-candidate: first observed request only; platform cold state unproven; fingerprint=consistent

Owner component: components/evironn/home/hero-product-media.tsx
Application-file preservation: No application production file or application test outside measurement evidence changes on NO_CHANGE.
Task 3: skipped because Candidate Decision Rule did not pass.
Task 4: jump directly to Task 4 closeout on NO_CHANGE; no Task 3 implementation.
No evidence supports broader change, media removal, image-quality reduction, dynamic-cache change, or catalog/PDP optimization.
Decision rationale: run 1 owner fails strict rank; run 2 owner fails strict rank; run 3 owner fails strict rank; owner median does not exceed combined non-owner median
