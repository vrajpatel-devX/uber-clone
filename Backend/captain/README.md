# Captain service

Captain (driver) microservice: registration, login, JWT auth, live location / socket updates, and nearby-captain lookup for matching rides.

## Run

- **Port:** `process.env.PORT` or `3001` (see `index.js`).
- **Env:** `JWT_SECRET`, MongoDB connection (via `./db/db`), and any variables your `db` module expects.
- **Base URL:** routes are mounted at `/captains` (e.g. `http://localhost:3001/captains/...`).

## Layout

| Path | Role |
|------|------|
| `index.js` | Express app, CORS, JSON, cookies, `/captains` router |
| `routes/captain.routes.js` | HTTP routes + `express-validator` rules |
| `controllers/captain.controller.js` | Request/response, validation errors |
| `services/captain.service.js` | Create captain, radius query |
| `models/captain.model.js` | Mongoose schema, JWT + password helpers |
| `middlewares/auth.middleware.js` | `authCaptain` — JWT from cookie or `Authorization: Bearer` |
| `models/blacklistToken.model.js` | Logout token blacklist (used by controller + middleware) |

## Data model (`captain`)

| Field | Notes |
|-------|--------|
| `fullname.firstname` | Required, min 3 chars |
| `fullname.lastname` | Optional, min 3 if set |
| `email` | Required, unique, lowercase |
| `password` | Required, hashed; `select: false` by default |
| `socketId` | Optional string for realtime |
| `status` | `active` \| `inactive`, default `inactive` |
| `vehicle` | `color`, `plate`, `capacity` (number ≥ 1), `vehicleType`: `car` \| `motorcycle` \| `auto` |
| `location.ltd` / `location.lng` | Numbers; used with `$geoWithin` in service |

**Methods:** `generateAuthToken()` (JWT, 24h, payload `_id`), `comparePassword(plain)`. **Statics:** `hashPassword(plain)`.

## Service layer

- **`createCaptain({...})`** — Validates required fields, creates a captain document with nested `fullname` and `vehicle`.
- **`getCaptainsInTheRadius(ltd, lng, radius)`** — `radius` in **kilometres**; uses MongoDB `$geoWithin` / `$centerSphere`. Ensure `location` is populated and indexes match your MongoDB geospatial setup.

## Authentication

- **Login** returns JSON `{ token, captain }` and sets HTTP-only cookie `token` (see `loginCaptain`).
- **Protected routes** use `authCaptain`: token from `req.cookies.token` **or** `Authorization: Bearer <token>`.
- **Logout** (`GET` with auth): stores token in blacklist, clears cookie, returns success.
- Invalid/expired/blacklisted tokens → `401 Unauthorized`.

## API reference

All paths are prefixed with `/captains`.

### `POST /register`

Register a new captain.

**Body (JSON):**

```json
{
  "fullname": { "firstname": "string", "lastname": "string" },
  "email": "user@example.com",
  "password": "string",
  "vehicle": {
    "color": "string",
    "plate": "string",
    "capacity": 4,
    "vehicleType": "car"
  }
}
```

**Validation:** email; firstname ≥ 3; password ≥ 6; vehicle color/plate ≥ 3; capacity ≥ 1; `vehicleType` ∈ `car`, `motorcycle`, `auto`.

**Responses:** `201` `{ token, captain }` · `400` validation errors or `Captain already exist`.

---

### `POST /login`

**Body:** `{ "email", "password" }` (password ≥ 6).

**Responses:** `200` `{ token, captain }` + `Set-Cookie: token` · `401` invalid credentials.

---

### `GET /profile`

**Auth:** required (`authCaptain`).

**Responses:** `200` `{ captain: req.captain }`.

---

### `GET /logout`

**Auth:** required.

**Responses:** `200` `{ message: 'Logout successfully' }` — token blacklisted, cookie cleared.

---

### `POST /update-socket-id-location`

Updates `socketId` and/or `location` for a captain by id. **No `authCaptain` on this route in code** — treat as internal/trusted or add auth if exposed publicly.

**Body (JSON):**

```json
{
  "userId": "<captain Mongo _id>",
  "socketId": "optional",
  "location": { "ltd": 0, "lng": 0 }
}
```

Only provided fields are merged. **Responses:** `200` success message · `500` on error.

---

### `GET /get-captains-in-radius`

**Query:** `ltd`, `lng`, `radius` (radius in km, as used in `captain.service.js`).

**Responses:** `200` array of captains · `500` on error.

---

### `GET /get-captain-by-id/:id`

**Params:** `id` — MongoDB ObjectId string.

**Responses:** `200` captain document · `404` not found · `500` on error.

## Related files

- Controllers: `controllers/captain.controller.js`
- Model: `models/captain.model.js`
- Services: `services/captain.service.js`
