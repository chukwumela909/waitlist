# Task Hub Waitlist API (Frontend Integration Guide)# Task Hub Waitlist API (Frontend Integration Guide)



Complete documentation for Task Hub's waitlist registration system.Complete documentation for Task Hub's waitlist registration system.



Base URL: `http://localhost:<PORT>` (example: `http://localhost:3000`)Base URL: `http://localhost:<PORT>` (example: `http://localhost:3000`)



All responses are JSON.All responses are JSON.



## Core Endpoints## Core Endpoints



### 1. Join Waitlist### 1. Join Waitlist

POST `/api/waitlist`POST `/api/waitlist`



Registers a service provider for the Task Hub waitlist with complete profile information.Request body:

```

**Request body:**{ "email": "user@example.com" }

```json```

{

  "fullName": "John Doe",Possible responses:

  "email": "john.doe@example.com",- 201 (success, email sent)

  "phoneNumber": "08012345678",```

  "primarySkill": "Carpentry / Joinery",{ "success": true, "message": "Successfully joined the waitlist! Check your email for confirmation." }

  "otherService": "Custom Furniture Design",```

  "city": "Lagos",- 201 (success, email queued/failed silently)

  "state": "Lagos",```

  "yearsOfExperience": "4–7 years",{ "success": true, "message": "Successfully joined the waitlist! (Email confirmation may be delayed)" }

  "portfolioLink": "https://instagram.com/johndoe",```

  "notifyEarlyAccess": true,- 400 (invalid email)

  "agreedToTerms": true```

}{ "success": false, "error": "Please provide a valid email address" }

``````

- 409 (already on waitlist)

**Field Specifications:**```

{ "success": false, "error": "This email is already on our waitlist" }

| Field | Type | Required | Validation | Description |```

|-------|------|----------|------------|-------------|- 500 (unexpected server error)

| `fullName` | string | Yes | Min 2, Max 100 chars | User's full name |```

| `email` | string | Yes | Valid email format | Must be unique |{ "success": false, "error": "Something went wrong. Please try again later." }

| `phoneNumber` | string | Yes | Nigerian format: `08012345678` or `+2348012345678` | Contact number |```

| `primarySkill` | string | Yes | Must be from approved list (see below) | Main service category |

| `otherService` | string | Conditional | Max 200 chars, required if `primarySkill` is "Other" | Specify custom service |Frontend handling tips:

| `city` | string | Yes | Min 2, Max 100 chars | City/town name |- Treat both 201 variants as success; show the message verbatim.

| `state` | string | Yes | Must be valid Nigerian state (see list below) | Nigerian state |- For 400/409 display the `error` field to the user.

| `yearsOfExperience` | string | Yes | Must be from approved list (see below) | Experience level |- Retry logic should NOT auto-resubmit on 409.

| `portfolioLink` | string | No | Valid URL format | Portfolio/social media link |

| `notifyEarlyAccess` | boolean | No | Default: `true` | Opt-in for early access notifications |### 2. Waitlist Stats (Optional display / admin UI)

| `agreedToTerms` | boolean | Yes | Must be `true` | Terms & privacy policy agreement |GET `/api/waitlist/stats`



**Primary Skills (approved list):**Success 200:

- `Carpentry / Joinery````

- `Plumbing`{ "success": true, "stats": { "total": 123, "confirmed": 120, "unconfirmed": 3 } }

- `Electrical````

- `Painting & Decorating`Failure 500:

- `Cleaning / Housekeeping````

- `Graphic Design`{ "success": false, "error": "Unable to fetch stats" }

- `Web Development````

- `Digital Marketing`

- `Content Writing / Copywriting`You can safely poll this (e.g. every 30–60s) if displaying live counters.

- `Virtual Assistant`

- `Other` (requires `otherService` field)### 3. Basic Availability Checks (Optional)

GET `/` → `{"status":"success","message":"Api is live"}`

**Years of Experience (approved list):**

- `Less than 1 year`GET `/health` → includes health metadata (you can ignore extra fields if not needed).

- `1–3 years`

- `4–7 years`## Error Shapes Summary

- `8+ years`

You will encounter only two top-level formats in current public endpoints:

**Nigerian States (approved list):**```

Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, FCT (Abuja), Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara// Successful operation

{ "success": true, ... }

**Possible Responses:**

// Handled failure (validation / duplicate / stats fetch failure / generic join failure)

✅ **201 Created (email sent successfully):**{ "success": false, "error": "Human readable message" }

```json```

{

  "success": true,Other internal error formats (`{ status: "error" | "fail", ... }`) are not expected from the exposed endpoints unless something unexpected bubbles up. If they appear, treat as generic failure.

  "message": "Successfully joined the waitlist! Check your email for confirmation."

}## Minimal Client Pseudocode

```

```ts

✅ **201 Created (email queued/failed silently):**async function joinWaitlist(email: string) {

```json  const res = await fetch('/api/waitlist', {

{    method: 'POST',

  "success": true,    headers: { 'Content-Type': 'application/json' },

  "message": "Successfully joined the waitlist! (Email confirmation may be delayed)"    body: JSON.stringify({ email })

}  });

```  const data = await res.json();

  if (res.ok && data.success) return { ok: true, message: data.message };

❌ **400 Bad Request (validation error):**  return { ok: false, message: data.error || data.message || 'Try again later' };

```json}

{```

  "success": false,

  "error": "Phone number is required",## Rate Limiting (Heads-Up)

  "details": [

    {If the user performs excessive requests they may receive:

      "field": "phoneNumber",Status: 429

      "message": "Phone number is required"```

    },{ "status": "error", "message": "Too many requests, please try again later." }

    {```

      "field": "agreedToTerms",Frontend: show a polite cooldown message; optional: back off for the remainder of the window.

      "message": "You must agree to the terms and privacy policy"

    }## cURL Examples

  ]

}```

```curl -X POST "http://localhost:3000/api/waitlist" \

  -H "Content-Type: application/json" \

Common validation errors:  -d '{"email":"user@example.com"}'

- `"Please provide a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)"`

- `"Please select a valid Nigerian state"`curl http://localhost:3000/api/waitlist/stats

- `"Please specify your service when selecting 'Other'"````

- `"You must agree to the terms and privacy policy"`

- `"Full name must be at least 2 characters"`## Glossary

- confirmed: user successfully saved + confirmation email attempt done (flag true when email send succeeded).

❌ **409 Conflict (email already registered):**- unconfirmed: user saved but confirmation email not yet (or failed) — still valid.

```json

{---

  "success": false,Doc version: 2.0.0 (frontend-focused)

  "error": "This email is already on our waitlist"Last updated: 2025-08-26

}
```

❌ **500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Something went wrong. Please try again later."
}
```

**Frontend Handling Tips:**
- Display validation `details` array for inline form errors
- Treat both 201 responses as success
- Show `error` field content to users
- Don't auto-retry on 409 (duplicate email)
- For phone validation, accept both formats: `080...` and `+234...`

---

### 2. Waitlist Stats
GET `/api/waitlist/stats`

Returns comprehensive statistics broken down by service category, location, and experience level.

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 1247,
    "confirmed": 1180,
    "unconfirmed": 67,
    "bySkill": {
      "Graphic Design": 342,
      "Web Development": 298,
      "Carpentry / Joinery": 187,
      "Plumbing": 156,
      "Digital Marketing": 143,
      "Electrical": 89,
      "Content Writing / Copywriting": 32
    },
    "byState": {
      "Lagos": 623,
      "FCT": 187,
      "Ogun": 143,
      "Rivers": 98,
      "Kano": 76,
      "Enugu": 54
    },
    "byExperience": {
      "4–7 years": 456,
      "1–3 years": 389,
      "8+ years": 267,
      "Less than 1 year": 135
    }
  }
}
```

**Failure Response (500):**
```json
{
  "success": false,
  "error": "Unable to fetch stats"
}
```

**Usage Notes:**
- Safe to poll every 30–60 seconds for live dashboards
- Breakdowns only show categories with at least 1 user
- Stats are cached briefly on the server side

---

### 3. Basic Availability Checks (Optional)

**Root Endpoint:**
```
GET / → {"status":"success","message":"Api is live"}
```

**Health Check:**
```
GET /health → Includes uptime, database status, timestamp
```

---

## Error Response Summary

All endpoints use consistent error formats:

**Success:**
```json
{ "success": true, ... }
```

**Client Errors (4xx):**
```json
{ 
  "success": false, 
  "error": "Human-readable message",
  "details": [...]  // Optional validation details
}
```

**Server Errors (5xx):**
```json
{ "success": false, "error": "Something went wrong. Please try again later." }
```

---

## Rate Limiting

Users exceeding rate limits will receive:

**Status: 429 Too Many Requests**
```json
{
  "status": "error",
  "message": "Too many requests, please try again later."
}
```

**Frontend handling:**
- Show polite cooldown message
- Optionally implement exponential backoff
- Check `Retry-After` header for wait time

---

## Minimal Client Implementation (TypeScript)

```typescript
interface WaitlistData {
  fullName: string;
  email: string;
  phoneNumber: string;
  primarySkill: string;
  otherService?: string;
  city: string;
  state: string;
  yearsOfExperience: string;
  portfolioLink?: string;
  notifyEarlyAccess?: boolean;
  agreedToTerms: boolean;
}

async function joinWaitlist(data: WaitlistData) {
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const result = await res.json();
  
  if (res.ok && result.success) {
    return { ok: true, message: result.message };
  }
  
  return { 
    ok: false, 
    message: result.error || 'Registration failed',
    details: result.details || []
  };
}

async function getStats() {
  const res = await fetch('/api/waitlist/stats');
  const data = await res.json();
  return data.success ? data.stats : null;
}
```

---

## cURL Examples

**Join waitlist:**
```bash
curl -X POST "http://localhost:3000/api/waitlist" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Okoro",
    "email": "jane@example.com",
    "phoneNumber": "08087654321",
    "primarySkill": "Graphic Design",
    "city": "Abuja",
    "state": "FCT",
    "yearsOfExperience": "4–7 years",
    "portfolioLink": "https://behance.net/janeokoro",
    "notifyEarlyAccess": true,
    "agreedToTerms": true
  }'
```

**Get stats:**
```bash
curl http://localhost:3000/api/waitlist/stats
```

---

## Data Privacy & Security

- Email addresses are unique and stored securely
- Phone numbers are validated for Nigerian format
- Location data limited to state/city (no GPS coordinates)
- Portfolio links are optional and not validated for content
- Terms agreement is mandatory and tracked with timestamp

---

## Glossary

- **confirmed**: User saved + confirmation email successfully sent
- **unconfirmed**: User saved but email pending/failed (still valid registration)
- **primarySkill**: Main service category the provider offers
- **otherService**: Custom service description when "Other" is selected

---

**Doc version:** 3.0.0 (Full Registration)  
**Last updated:** November 9, 2025
