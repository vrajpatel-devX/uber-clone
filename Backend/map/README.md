# Map service

Geocoding, distance/time (Distance Matrix), place autocomplete, and a proxy to **nearby captains** via the Captain service. All map routes require an **authenticated user** (JWT validated against the User service).

## Run

- **Port:** `process.env.PORT` or `3002` (see `index.js`).
- **Env:** `GOOGLE_MAPS_API` (Google Maps APIs key). MongoDB is connected via `./db/db` if your deployment needs it.
- **Base URL:** routes are mounted at `/maps` (e.g. `http://localhost:3002/maps/...`).

## Dependencies on other services

| Purpose | URL (as in code) |
|--------|-------------------|
| User profile / auth for `authUser` | `GET http://localhost:3000/users/profile` with `Authorization: Bearer <token>` |
| Captains in radius | `GET http://localhost:3001/captains/get-captains-in-radius?ltd=&lng=&radius=` |

Change host/port in `middlewares/auth.middleware.js` and `services/maps.service.js` for non-local deployments.

## Layout

| Path | Role |
|------|------|
| `index.js` | Express app, `/maps` router |
| `routes/maps.routes.js` | Routes + `express-validator` query rules |
| `controllers/map.controller.js` | Validation, HTTP responses |
| `services/maps.service.js` | Google APIs (axios) + Captain HTTP call |
| `middlewares/auth.middleware.js` | `authUser` (used on all map routes); `authCaptain` (defined, not used in `maps.routes.js`) |

## Authentication (`authUser`)

- Token from `req.cookies.token` or `Authorization: Bearer <token>`.
- Validates by calling the **User** service profile endpoint; on success, `req.user` is set to the response body.
- Missing/invalid token or failed profile call → `401 Unauthorized`.

## Service layer (`maps.service.js`)

| Function | Behaviour |
|----------|-----------|
| `getAddressCoordinate(address)` | Geocoding API → `{ ltd: lat, lng }` (first result) or throws |
| `getDistanceTime(origin, destination)` | Distance Matrix API → first `rows[0].elements[0]`; `ZERO_RESULTS` throws |
| `getAutoCompleteSuggestions(input)` | Places Autocomplete → array of description strings |
| `getCaptainsInTheRadius(ltd, lng, radius)` | **HTTP GET** to Captain service; `radius` in **km**. Does not forward the user JWT to Captain in the current implementation |

**Note:** `map.controller.getCaptainsInTheRadius` passes `(ltd, lng, radius, token)` into the service, but `getCaptainsInTheRadius` in the service only accepts three arguments; the token is unused server-side.

## API reference

All paths are prefixed with `/maps`. All listed routes use **`authUser`** unless noted.

### `GET /get-coordinates`

Resolve an address to coordinates.

**Query:** `address` — string, min length 3.

**Responses:** `200` body from service: `{ ltd, lng }` · `400` validation errors · `404` `{ message: 'Coordinates not found' }` when geocoding fails.

---

### `GET /get-distance-time`

**Query:** `origin`, `destination` — strings, each min length 3.

**Responses:** `200` — Distance Matrix element object (distance, duration, etc.) · `400` validation errors · `500` `{ message: 'Internal server error' }`.

---

### `GET /get-suggestions`

**Query:** `input` — string, min length 3 (search text for autocomplete).

**Responses:** `200` — array of suggestion strings · `400` validation errors · `500` internal error.

---

### `GET /get-captains-in-radius`

**Query:** `ltd`, `lng`, `radius` — numeric (`express-validator` `isNumeric()`). Radius is in **kilometres** (passed through to Captain service).

**Responses:** `200` — data returned by Captain service · `400` validation errors · `500` internal error.

---

## Related files

- `controllers/map.controller.js`
- `routes/maps.routes.js`
- `services/maps.service.js`
