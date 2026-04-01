# User service

End-user accounts: registration, login, JWT auth, profile, logout (token blacklist), socket id updates for realtime, and lookup by id for other microservices.

## Run

- **Port:** `process.env.PORT` or `3000` (see `index.js`).
- **Env:** `JWT_SECRET`, MongoDB connection via `./db/db`.
- **Base URL:** routes are mounted at `/users` (e.g. `http://localhost:3000/users/...`).

## Layout

| Path | Role |
|------|------|
| `index.js` | Express app, CORS, JSON, cookies, `/users` router |
| `routes/user.routes.js` | HTTP routes + `express-validator` |
| `controllers/user.controller.js` | Request/response handling |
| `services/user.service.js` | `createUser` |
| `models/user.model.js` | Mongoose schema, JWT + password helpers |
| `models/blacklistToken.model.js` | Logout token blacklist (used by auth + logout) |
| `middlewares/auth.middleware.js` | `authUser` — JWT from cookie or `Authorization` header |

## Data model (`user`)

| Field | Notes |
|-------|--------|
| `fullname.firstname` | Required, min 3 chars |
| `fullname.lastname` | Optional in practice; schema minlength 3 if present |
| `email` | Required, unique, minlength 5 |
| `password` | Required, hashed; `select: false` by default |
| `socketId` | Optional; set by Ride socket `join` flow via `POST /update-socket-id` |

**Methods:** `generateAuthToken()` (JWT, 24h, payload `_id`), `comparePassword(plain)`. **Statics:** `hashPassword(plain)`.

## Authentication (`authUser`)

- Token from `req.cookies.token` or `Authorization: Bearer <token>`.
- Rejects missing token, blacklisted token, invalid/expired JWT.
- Sets `req.user` to the loaded Mongoose document.

## Service layer (`user.service.js`)

- **`createUser({ firstname, lastname, email, password })`** — Requires `firstname`, `email`, `password`; builds nested `fullname` and creates the document.

## API reference

All paths are prefixed with `/users`.

### `POST /register`

**Body:**

```json
{
  "fullname": { "firstname": "string", "lastname": "string" },
  "email": "user@example.com",
  "password": "string"
}
```

**Validation:** email; firstname ≥ 3; password ≥ 6.

**Responses:** `201` `{ token, user }` · `400` validation errors or `User already exist`.

---

### `POST /login`

**Body:** `{ "email", "password" }` (password ≥ 6).

**Responses:** `200` `{ token, user }` + `Set-Cookie: token` · `401` invalid credentials.

---

### `GET /profile`

**Auth:** required (`authUser`).

**Responses:** `200` — user document as JSON (`req.user`). Other services (e.g. Map/Ride middleware) call this path to validate tokens.

---

### `GET /logout`

**Auth:** required.

**Behaviour:** Clears the `token` cookie, appends the token to the blacklist, returns success.

**Note:** The handler reads the token after `res.clearCookie('token')`. In the same request, the token may still be available from `Authorization: Bearer ...` or from the cookie snapshot depending on runtime; if logout ever fails to blacklist, use the `Authorization` header or fix order (read token → blacklist → clear cookie).

---

### `POST /update-socket-id`

Updates `socketId` for a user. **No `authUser` on this route** in the current router — protect or restrict if exposed publicly.

**Body:**

```json
{
  "userId": "<Mongo _id>",
  "socketId": "optional string"
}
```

**Responses:** `200` `{ message: 'SocketId updated' }` · `500` on error.

---

### `GET /get-user-by-id/:id`

**Params:** `id` — MongoDB ObjectId.

**Responses:** `200` user document · `404` not found · `500` on error.

## Related files

- `controllers/user.controller.js`
- `middlewares/auth.middleware.js`
- `models/user.model.js`
- `routes/user.routes.js`
- `services/user.service.js`
