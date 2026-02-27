# Codebase Issue Backlog (Proposed Tasks)

## 1) Typo / terminology cleanup
**Task:** Rename the docs title `SuperAdmin Dashboard Integration Notes` to `Super Admin Dashboard Integration Notes` for consistency with the `Admin*` naming used in code.

**Why:** The repo consistently uses `Admin` terms in code (`AdminDashboard`, `AdminUsers`, `AdminSettings`), while the docs heading uses merged wording (`SuperAdmin`), which reads like a typo/label inconsistency.

**Suggested scope:**
- Update heading in `docs_superadmin_dashboard.md`.
- Optionally align any related route/menu labels if they currently show `SuperAdmin`.

## 2) Bug fix
**Task:** Enforce a 6-digit OTP in profile update verification before enabling **Verify OTP**.

**Why:** `Profile` OTP input truncates to 6 digits, but the verify button is enabled at 4 digits (`otp.length < 4`), allowing invalid-length submissions and avoidable backend errors.

**Suggested scope:**
- In `src/screens/Profile.tsx`, change disabled guard from `< 4` to `< 6`.
- Add user-facing helper/error text that profile OTP must be 6 digits.

## 3) Documentation discrepancy
**Task:** Reconcile README flow description with actual verification payload behavior.

**Why:** README states verification is "phone + email", but the verify screen derives identity from `phone/mobile` query param and submits phone + otp in register verify flow. This can mislead integrators into thinking email is required in that step.

**Suggested scope:**
- Update README wording to clarify OTP is validated against the registration identity, with `phone/mobile` as required field in current frontend flow.
- Optionally document when email participates (delivery channel vs verification identifier).

## 4) Test improvement
**Task:** Add unit tests for API base URL and fallback behavior (`src/services/api/baseUrl.ts` + `src/services/api/authApi.ts`).

**Why:** Base URL configuration is a critical production safety boundary. Current repo has no tests, so regressions (e.g., accidental same-origin fallback in prod) could reintroduce silent routing failures.

**Suggested scope:**
- Add tests for `normalizeBase`, `canUseSameOriginFallback`, and `assertApiBaseConfigured` with dev/prod env scenarios.
- Add tests for candidate base selection behavior used by auth requests.
