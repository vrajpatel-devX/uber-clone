# Ride service

Ride lifecycle: fare quote, create ride (user), confirm / start / end (captain). Integrates with **User**, **Captain**, and **Map** services over HTTP, and pushes realtime updates via **Socket.IO**.

## Run

- **Port:** `process.env.PORT` or `3003` (see `index.js`).
- **HTTP + WebSocket:** `http` server wraps Express; `initializeSocket(server)` enables Socket.IO on the same port.
- **Base URL:** routes are mounted at `/rides` (e.g. `http://localhost:3003/rides/...`).

## Environment

| Variable | Used for |
|----------|-----------|
| `USER_SERVICE_URL` | User by id (`get-user-by-id`), socket update (`users/update-socket-id`) |
| `CAPTAIN_SERVICE_URL` | Captain by id, `update-socket-id-location` from socket |
| `MAP_SERVICE_URL` | `get-coordinates`, `get-captains-in-radius` during ride creation |
| `JWT_SECRET` | Not used directly in listed files; tokens are validated by User/Captain services |

**Note:** `middlewares/auth.middleware.js` calls `http://localhost:3000` and `http://localhost:3001` for profile validation. Controllers use `USER_SERVICE_URL`, `CAPTAIN_SERVICE_URL`, `MAP_SERVICE_URL`. Align hosts/ports via env or proxy for production.

## Layout

| Path | Role |
|------|------|
| `index.js` | Express + `http.Server`, `/rides` router, socket init |
| `routes/ride.routes.js` | Routes + `express-validator` |
| `controllers/ride.controller.js` | Orchestration, Map/Captain calls, socket emits |
| `services/ride.service.js` | Fare math, OTP, DB updates for ride state |
| `models/ride.model.js` | Mongoose `ride` schema |
| `middlewares/auth.middleware.js` | `authUser`, `authCaptain` (HTTP to User/Captain profile) |
| `socket.js` | Socket.IO: `join`, `update-location-captain`; `sendMessageToSocketId` for server emits |

## Data model (`ride`)

| Field | Notes |
|-------|--------|
| `user` | ObjectId, required |
| `captain` | ObjectId, set on confirm |
| `pickup`, `destination` | Strings, required |
| `fare` | Number, required (computed from Map distance/time + vehicle type) |
| `status` | `pending` \| `accepted` \| `ongoing` \| `completed` \| `cancelled` (default `pending`) |
| `duration` | Seconds (optional; not set in listed service flows) |
| `distance` | Meters (optional; not set in listed service flows) |
| `paymentID`, `orderId`, `signature` | Optional strings |
| `otp` | String, required, **`select: false`** (excluded unless explicitly selected) |

`vehicleType` is used only when creating the ride to pick one of the fare tiers; it is not stored on the schema in the current model.

## Authentication

- **`authUser`:** Token from cookie or `Authorization: Bearer`. Validates via `GET {USER}/users/profile` (middleware uses `localhost:3000` in code). Sets `req.user` (must include `_id` for controllers).
- **`authUser` response shape:** Controllers expect a user object with `_id` (e.g. `req.user._id`).
- **`authCaptain`:** Validates via `GET {CAPTAIN}/captains/profile`. Sets `req.captain` from `response.data.captain` (middleware uses `localhost:3001` in code).

## Service layer (`ride.service.js`)

| Export | Behaviour |
|--------|-----------|
| `getFare(pickup, destination, token)` | Calls Map `get-distance-time`, then computes rounded fares for `auto`, `car`, `moto` (base + per-km + per-minute). |
| `createRide({ user, pickup, destination, vehicleType, token })` | `getFare`, then creates ride with `fare[vehicleType]` and a 6-digit OTP (`crypto.randomInt`). |
| `confirmRide({ rideId, captain })` | Sets `status: accepted`, assigns `captain`; returns ride with `+otp` selected. |
| `startRide({ rideId, otp, captain })` | Requires `accepted`, OTP match; sets `ongoing`. |
| `endRide({ rideId, captain })` | Requires `ongoing` and matching captain; sets `completed`. |

## Realtime (`socket.js`)

- **`join`:** `{ userId, userType }` — updates user or captain socket id on the respective service.
- **`update-location-captain`:** `{ userId, location: { ltd, lng } }` — forwards to Captain service.
- **Server emits** (via `sendMessageToSocketId`): `new-ride`, `ride-confirmed`, `ride-started`, `ride-ended` to the target `socketId`.

## API reference

All HTTP paths are prefixed with `/rides`.

### `POST /create`

**Auth:** `authUser`.

**Body:**

```json
{
  "pickup": "string (min 3)",
  "destination": "string (min 3)",
  "vehicleType": "auto" | "car" | "moto"
}
```

The handler reads `userId` from the body but **creates the ride with `req.user._id`** (see controller).

**Flow:** `createRide` → Map geocode pickup → Map `get-captains-in-radius` (radius **2 km**) → clears OTP in JSON response (`ride.otp = ""`) → emits `new-ride` to each captain’s `socketId` in radius.

**Responses:** `201` ride JSON (OTP cleared in response) · `400` validation · `500` `{ message }`.

---

### `GET /get-fare`

**Auth:** `authUser`.

**Query:** `pickup`, `destination` (strings, min 3).

**Responses:** `200` fare object `{ auto, car, moto }` · `400` validation · `500` `{ message }`.

---

### `POST /confirm`

**Auth:** `authCaptain`.

**Body:** `{ "rideId": "<MongoId>" }`.

**Responses:** `200` ride enriched with `user` and `captain` from User/Captain HTTP APIs · emits `ride-confirmed` to user’s `socketId` · `400` validation · `500` `{ message }`.

---

### `GET /start-ride`

**Auth:** `authCaptain`.

**Query:** `rideId` (MongoId), `otp` (string, length 6).

**Responses:** `200` enriched ride · emits `ride-started` to user · `400` validation · `500` `{ message }`.

---

### `POST /end-ride`

**Auth:** `authCaptain`.

**Body:** `{ "rideId": "<MongoId>" }`.

**Responses:** `200` enriched ride · emits `ride-ended` to user · `400` validation · `500` `{ message }`.

---

## Related files

- `controllers/ride.controller.js`
- `models/ride.model.js`
- `routes/ride.routes.js`
- `services/ride.service.js`
