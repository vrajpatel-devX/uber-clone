# Backend API Documentation

## User Endpoints

### POST `/users/register`

#### Description

Registers a new user account. The endpoint validates the incoming request data, checks for duplicate emails, hashes the password, creates the user in the database, and returns a JWT authentication token along with the user object.

---

#### HTTP Method

`POST`

#### URL

```
/users/register
```

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field                  | Type     | Required | Description                                      |
|------------------------|----------|----------|--------------------------------------------------|
| `fullname.firstname`   | `string` | ✅ Yes   | User's first name (minimum **3** characters)     |
| `fullname.lastname`    | `string` | ❌ No    | User's last name (minimum **3** characters if provided) |
| `email`                | `string` | ✅ Yes   | A valid email address (minimum **5** characters) |
| `password`             | `string` | ✅ Yes   | User's password (minimum **6** characters)       |

#### Example Request

```json
{
  "fullname": {
    "firstname": "Vraj",
    "lastname": "Patel"
  },
  "email": "vraj@example.com",
  "password": "secret123"
}
```

---

#### Responses

##### ✅ `201 Created` — Registration Successful

Returned when the user is successfully created.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "660f1a2b3c4d5e6f7a8b9c0d",
    "fullname": {
      "firstname": "Vraj",
      "lastname": "Patel"
    },
    "email": "vraj@example.com"
  }
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when the request body fails validation (e.g., invalid email, short password, missing firstname).

```json
{
  "errors": [
    {
      "msg": "Invalid Email",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "First name must be at least 3 characters long",
      "param": "fullname.firstname",
      "location": "body"
    },
    {
      "msg": "Password must be at least 6 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

##### ❌ `400 Bad Request` — User Already Exists

Returned when a user with the provided email already exists in the database.

```json
{
  "message": "User already exist"
}
```

---

#### Status Codes Summary

| Status Code | Description                                          |
|-------------|------------------------------------------------------|
| `201`       | User registered successfully, token returned         |
| `400`       | Validation failed or user with that email already exists |

---

#### Notes

- The password is **hashed** using `bcrypt` (10 salt rounds) before being stored.
- On successful registration, a **JWT token** is generated with a **24-hour** expiry.
- The `password` field is excluded from the user object in responses (`select: false` in the schema).

---

### POST `/users/login`

#### Description

Authenticates an existing user. The endpoint validates the incoming request data, looks up the user by email, compares the provided password against the stored hash, and on success returns a JWT authentication token (also set as a cookie) along with the user object.

---

#### HTTP Method

`POST`

#### URL

```
/users/login
```

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field      | Type     | Required | Description                                |
|------------|----------|----------|--------------------------------------------|
| `email`    | `string` | ✅ Yes   | A valid email address                      |
| `password` | `string` | ✅ Yes   | User's password (minimum **6** characters) |

#### Example Request

```json
{
  "email": "vraj@example.com",
  "password": "secret123"
}
```

---

#### Responses

##### ✅ `200 OK` — Login Successful

Returned when the credentials are valid. A `token` cookie is also set on the response.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "660f1a2b3c4d5e6f7a8b9c0d",
    "fullname": {
      "firstname": "Vraj",
      "lastname": "Patel"
    },
    "email": "vraj@example.com"
  }
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when the request body fails validation (e.g., invalid email format or short password).

```json
{
  "errors": [
    {
      "msg": "Invalid Email",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 6 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

##### ❌ `401 Unauthorized` — Invalid Credentials

Returned when no user is found with the given email, or the password does not match.

```json
{
  "message": "Invalid email or password"
}
```

---

#### Status Codes Summary

| Status Code | Description                                              |
|-------------|----------------------------------------------------------|
| `200`       | Login successful, token returned and set as cookie       |
| `400`       | Validation failed (invalid email format or short password) |
| `401`       | Invalid email or password                                |

---

#### Notes

- The password is compared using `bcrypt.compare()` against the stored hash.
- On successful login, a **JWT token** is generated with a **24-hour** expiry.
- The token is returned in the response body **and** set as a `token` cookie.
- The `password` field is excluded from the user object in responses (`select: false` in the schema).

---

### GET `/users/profile`

#### Description

Returns the profile of the currently authenticated user. This is a **protected** endpoint — a valid JWT token must be provided via a cookie or the `Authorization` header.

---

#### HTTP Method

`GET`

#### URL

```
/users/profile
```

---

#### Authentication

Requires a valid JWT token sent in **one** of the following ways:

| Method                | Format                          |
|-----------------------|---------------------------------|
| **Cookie**            | `token=<jwt_token>`             |
| **Authorization Header** | `Bearer <jwt_token>`         |

> The token must not be blacklisted. Blacklisted tokens are rejected with `401`.

---

#### Request Body

_No request body required._

---

#### Responses

##### ✅ `200 OK` — Profile Retrieved

Returns the authenticated user's profile object.

```json
{
  "_id": "660f1a2b3c4d5e6f7a8b9c0d",
  "fullname": {
    "firstname": "Vraj",
    "lastname": "Patel"
  },
  "email": "vraj@example.com"
}
```

##### ❌ `401 Unauthorized`

Returned when no token is provided, the token is invalid/expired, or the token has been blacklisted.

```json
{
  "message": "Unauthorized"
}
```

---

#### Status Codes Summary

| Status Code | Description                                      |
|-------------|--------------------------------------------------|
| `200`       | User profile returned successfully               |
| `401`       | Missing, invalid, expired, or blacklisted token  |

---

### GET `/users/logout`

#### Description

Logs out the currently authenticated user by clearing the `token` cookie and blacklisting the JWT token so it cannot be reused. This is a **protected** endpoint.

---

#### HTTP Method

`GET`

#### URL

```
/users/logout
```

---

#### Authentication

Requires a valid JWT token sent in **one** of the following ways:

| Method                | Format                          |
|-----------------------|---------------------------------|
| **Cookie**            | `token=<jwt_token>`             |
| **Authorization Header** | `Bearer <jwt_token>`         |

---

#### Request Body

_No request body required._

---

#### Responses

##### ✅ `200 OK` — Logout Successful

The `token` cookie is cleared and the token is added to the blacklist.

```json
{
  "message": "Logged out"
}
```

##### ❌ `401 Unauthorized`

Returned when no token is provided, the token is invalid/expired, or the token has already been blacklisted.

```json
{
  "message": "Unauthorized"
}
```

---

#### Status Codes Summary

| Status Code | Description                                         |
|-------------|-----------------------------------------------------|
| `200`       | Logged out successfully, token blacklisted          |
| `401`       | Missing, invalid, expired, or blacklisted token     |

---

#### Notes

- The token is added to a **blacklist** collection in the database, preventing reuse even if it hasn't expired.
- The `token` cookie is cleared from the client via `res.clearCookie('token')`.
