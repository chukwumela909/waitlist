# Copilot instructions (waitlist frontend)

## Repo shape
- `waitlist/` is a static site (plain HTML/CSS/vanilla JS). There is no build step or framework.
- The form + admin pages talk to a separate API repo (`../waitlist-api`).

## Key flows
- Waitlist signup is implemented in `js/main.js` and posts JSON to `POST {API_BASE}/api/waitlist`.
- Success is detected as `res.ok && responseData.success`; errors are shown from `responseData.details[]` or `responseData.error`.
- `API_BASE` defaults to `https://waitlist-api-qiep.onrender.com` in `js/main.js`, but pages can override via `window.WAITLIST_API_BASE`.

## Admin dashboard
- `admin.html` loads `js/admin.js` and polls `GET {API_BASE}/api/waitlist/stats`.
- `admin.html` currently hard-sets `window.WAITLIST_API_BASE = 'http://localhost:8000'` (update this if your local API port differs).

## Conventions to follow
- Keep client/server contract aligned with `waitlist-api/docs/API.md` (request field names like `phoneNumber`, `yearsOfExperience`, `notifyEarlyAccess`, `agreedToTerms`).
- Don’t add build tooling or new UI systems unless explicitly requested; changes should be minimal and in-place.

## Quick manual test
- Use `test-api.html` to sanity-check the API from the browser.
