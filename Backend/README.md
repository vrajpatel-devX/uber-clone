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

---

## Captain Endpoints

### POST `/captains/register`

#### Description

Registers a new captain (driver) account. The endpoint validates the incoming request data including vehicle details, checks for duplicate emails, hashes the password, creates the captain in the database, and returns a JWT authentication token along with the captain object.

---

#### HTTP Method

`POST`

#### URL

```
/captains/register
```

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field                  | Type     | Required | Description                                                      |
|------------------------|----------|----------|------------------------------------------------------------------|
| `fullname.firstname`   | `string` | ✅ Yes   | Captain's first name (minimum **3** characters)                  |
| `fullname.lastname`    | `string` | ❌ No    | Captain's last name (minimum **3** characters if provided)       |
| `email`                | `string` | ✅ Yes   | A valid email address                                            |
| `password`             | `string` | ✅ Yes   | Captain's password (minimum **6** characters)                    |
| `vehicle.color`        | `string` | ✅ Yes   | Vehicle color (minimum **3** characters)                         |
| `vehicle.plate`        | `string` | ✅ Yes   | Vehicle plate number (minimum **3** characters)                  |
| `vehicle.capacity`     | `number` | ✅ Yes   | Vehicle passenger capacity (minimum **1**)                       |
| `vehicle.vehicleType`  | `string` | ✅ Yes   | Type of vehicle — must be one of: `car`, `motorcycle`, or `auto` |

#### Example Request

```json
{
  "fullname": {
    "firstname": "Vraj",
    "lastname": "Patel"
  },
  "email": "captain.vraj@example.com",
  "password": "secret123",
  "vehicle": {
    "color": "Black",
    "plate": "GJ-05-AB-1234",
    "capacity": 4,
    "vehicleType": "car"
  }
}
```

---

#### Responses

##### ✅ `201 Created` — Registration Successful

Returned when the captain is successfully created.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "captain": {
    "_id": "660f1a2b3c4d5e6f7a8b9c0d",
    "fullname": {
      "firstname": "Vraj",
      "lastname": "Patel"
    },
    "email": "captain.vraj@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "Black",
      "plate": "GJ-05-AB-1234",
      "capacity": 4,
      "vehicleType": "car"
    }
  }
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when the request body fails validation.

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
    },
    {
      "msg": "Color must be at least 3 characters long",
      "param": "vehicle.color",
      "location": "body"
    },
    {
      "msg": "Plate must be at least 3 characters long",
      "param": "vehicle.plate",
      "location": "body"
    },
    {
      "msg": "Capacity must be at least 1",
      "param": "vehicle.capacity",
      "location": "body"
    },
    {
      "msg": "Invalid vehicle type",
      "param": "vehicle.vehicleType",
      "location": "body"
    }
  ]
}
```

##### ❌ `400 Bad Request` — Captain Already Exists

Returned when a captain with the provided email already exists in the database.

```json
{
  "message": "Captain already exist"
}
```

---

#### Status Codes Summary

| Status Code | Description                                                |
|-------------|------------------------------------------------------------|
| `201`       | Captain registered successfully, token returned            |
| `400`       | Validation failed or captain with that email already exists |

---

#### Notes

- The password is **hashed** using `bcrypt` (10 salt rounds) before being stored.
- On successful registration, a **JWT token** is generated with a **24-hour** expiry.
- The `password` field is excluded from the captain object in responses (`select: false` in the schema).
- New captains are created with a default `status` of `inactive`.
- The `vehicleType` field only accepts: `car`, `motorcycle`, or `auto`.

---

### POST `/captains/login`

#### Description

Authenticates an existing captain. The endpoint validates the request data, looks up the captain by email, compares the provided password against the stored hash, and on success returns a JWT authentication token (also set as a cookie) along with the captain object.

---

#### HTTP Method

`POST`

#### URL

```
/captains/login
```

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field      | Type     | Required | Description                                |
|------------|----------|----------|--------------------------------------------|
| `email`    | `string` | ✅ Yes   | A valid email address                      |
| `password` | `string` | ✅ Yes   | Captain's password (minimum **6** characters) |

#### Example Request

```json
{
  "email": "captain.vraj@example.com",
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
  "captain": {
    "_id": "660f1a2b3c4d5e6f7a8b9c0d",
    "fullname": {
      "firstname": "Vraj",
      "lastname": "Patel"
    },
    "email": "captain.vraj@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "Black",
      "plate": "GJ-05-AB-1234",
      "capacity": 4,
      "vehicleType": "car"
    }
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

Returned when no captain is found with the given email, or the password does not match.

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
- The `password` field is excluded from the captain object in responses (`select: false` in the schema).

---

### GET `/captains/profile`

#### Description

Returns the profile of the currently authenticated captain. This is a **protected** endpoint — a valid JWT token must be provided via a cookie or the `Authorization` header.

---

#### HTTP Method

`GET`

#### URL

```
/captains/profile
```

---

#### Authentication

Requires a valid JWT token sent in **one** of the following ways:

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

> The token must not be blacklisted. Blacklisted tokens are rejected with `401`.

---

#### Request Body

_No request body required._

---

#### Responses

##### ✅ `200 OK` — Profile Retrieved

Returns the authenticated captain's profile object.

```json
{
  "captain": {
    "_id": "660f1a2b3c4d5e6f7a8b9c0d",
    "fullname": {
      "firstname": "Vraj",
      "lastname": "Patel"
    },
    "email": "captain.vraj@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "Black",
      "plate": "GJ-05-AB-1234",
      "capacity": 4,
      "vehicleType": "car"
    }
  }
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
| `200`       | Captain profile returned successfully            |
| `401`       | Missing, invalid, expired, or blacklisted token  |

---

### GET `/captains/logout`

#### Description

Logs out the currently authenticated captain by clearing the `token` cookie and blacklisting the JWT token so it cannot be reused. This is a **protected** endpoint.

---

#### HTTP Method

`GET`

#### URL

```
/captains/logout
```

---

#### Authentication

Requires a valid JWT token sent in **one** of the following ways:

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Request Body

_No request body required._

---

#### Responses

##### ✅ `200 OK` — Logout Successful

The `token` cookie is cleared and the token is added to the blacklist.

```json
{
  "message": "Logout successfully"
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

---

## Maps Endpoints

> **All Maps endpoints are protected.** A valid user JWT token must be provided via a cookie (`token=<jwt_token>`) or the `Authorization` header (`Bearer <jwt_token>`).

---

### GET `/maps/get-coordinates`

#### Description

Returns the geographic coordinates (latitude and longitude) for a given address string. Uses the **Google Maps Geocoding API** under the hood.

---

#### HTTP Method

`GET`

#### URL

```
/maps/get-coordinates
```

---

#### Authentication

Requires a valid **user** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Query Parameters

| Parameter   | Type     | Required | Description                                      |
|-------------|----------|----------|--------------------------------------------------|
| `address`   | `string` | ✅ Yes   | The address to geocode (minimum **3** characters) |

#### Example Request

```
GET /maps/get-coordinates?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA
```

---

#### Responses

##### ✅ `200 OK` — Coordinates Retrieved

Returns the latitude (`ltd`) and longitude (`lng`) of the provided address.

```json
{
  "ltd": 37.4224764,
  "lng": -122.0842499
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when the `address` query parameter is missing, not a string, or shorter than 3 characters.

```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "address",
      "location": "query"
    }
  ]
}
```

##### ❌ `404 Not Found` — Coordinates Not Found

Returned when the Google Maps API cannot geocode the given address.

```json
{
  "message": "Coordinates not found"
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

| Status Code | Description                                                |
|-------------|------------------------------------------------------------|
| `200`       | Coordinates returned successfully                          |
| `400`       | Validation failed (missing or invalid `address` parameter) |
| `401`       | Missing, invalid, expired, or blacklisted token            |
| `404`       | Unable to geocode the provided address                     |

---

#### Notes

- Uses the `GOOGLE_MAPS_API` environment variable for the API key.
- The response uses `ltd` (not `lat`) for the latitude field.
- Internally calls the **Google Maps Geocoding API** (`/maps/api/geocode/json`).

---

### GET `/maps/get-distance-time`

#### Description

Returns the distance and estimated travel time between an origin and a destination. Uses the **Google Maps Distance Matrix API** under the hood.

---

#### HTTP Method

`GET`

#### URL

```
/maps/get-distance-time
```

---

#### Authentication

Requires a valid **user** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Query Parameters

| Parameter      | Type     | Required | Description                                            |
|----------------|----------|----------|--------------------------------------------------------|
| `origin`       | `string` | ✅ Yes   | Starting location / address (minimum **3** characters) |
| `destination`  | `string` | ✅ Yes   | Ending location / address (minimum **3** characters)   |

#### Example Request

```
GET /maps/get-distance-time?origin=New+York,NY&destination=Los+Angeles,CA
```

---

#### Responses

##### ✅ `200 OK` — Distance & Time Retrieved

Returns a Google Maps Distance Matrix element containing distance and duration.

```json
{
  "distance": {
    "text": "4,489 km",
    "value": 4489491
  },
  "duration": {
    "text": "1 day 16 hours",
    "value": 144000
  },
  "status": "OK"
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when `origin` or `destination` query parameters are missing, not a string, or shorter than 3 characters.

```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "origin",
      "location": "query"
    },
    {
      "msg": "Invalid value",
      "param": "destination",
      "location": "query"
    }
  ]
}
```

##### ❌ `500 Internal Server Error`

Returned when the Google Maps API fails, returns no routes, or an unexpected error occurs.

```json
{
  "message": "Internal server error"
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

| Status Code | Description                                                          |
|-------------|----------------------------------------------------------------------|
| `200`       | Distance and time returned successfully                              |
| `400`       | Validation failed (missing or invalid `origin`/`destination`)        |
| `401`       | Missing, invalid, expired, or blacklisted token                      |
| `500`       | Google Maps API error, no routes found, or internal server error     |

---

#### Notes

- Uses the `GOOGLE_MAPS_API` environment variable for the API key.
- Internally calls the **Google Maps Distance Matrix API** (`/maps/api/distancematrix/json`).
- If the API returns `ZERO_RESULTS` for the route, a `500` error is returned.
- The `distance.value` is in **meters** and `duration.value` is in **seconds**.

---

### GET `/maps/get-suggestions`

#### Description

Returns a list of autocomplete place suggestions for a given text input. Uses the **Google Maps Places Autocomplete API** under the hood.

---

#### HTTP Method

`GET`

#### URL

```
/maps/get-suggestions
```

---

#### Authentication

Requires a valid **user** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Query Parameters

| Parameter | Type     | Required | Description                                                  |
|-----------|----------|----------|--------------------------------------------------------------|
| `input`   | `string` | ✅ Yes   | The search text for autocomplete (minimum **3** characters)  |

#### Example Request

```
GET /maps/get-suggestions?input=Times+Squ
```

---

#### Responses

##### ✅ `200 OK` — Suggestions Retrieved

Returns an array of place description strings.

```json
[
  "Times Square, Manhattan, NY, USA",
  "Times Square, Causeway Bay, Hong Kong",
  "Times Square Shopping Centre, Pretoria, South Africa"
]
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when the `input` query parameter is missing, not a string, or shorter than 3 characters.

```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "input",
      "location": "query"
    }
  ]
}
```

##### ❌ `500 Internal Server Error`

Returned when the Google Maps API fails or an unexpected error occurs.

```json
{
  "message": "Internal server error"
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

| Status Code | Description                                                      |
|-------------|------------------------------------------------------------------|
| `200`       | Suggestions returned successfully                                |
| `400`       | Validation failed (missing or invalid `input` parameter)         |
| `401`       | Missing, invalid, expired, or blacklisted token                  |
| `500`       | Google Maps API error or internal server error                   |

---

#### Notes

- Uses the `GOOGLE_MAPS_API` environment variable for the API key.
- Internally calls the **Google Maps Places Autocomplete API** (`/maps/api/place/autocomplete/json`).
- Only the `description` field from each prediction is returned (not the full prediction object).
- Empty/falsy descriptions are filtered out from the response.

---

## Ride Endpoints

> **All Ride endpoints are protected.** A valid user JWT token must be provided via a cookie (`token=<jwt_token>`) or the `Authorization` header (`Bearer <jwt_token>`).

---

### POST `/rides/create`

#### Description

Creates a new ride request for a user. It calculates the fare based on the given pickup and destination locations, generates a random OTP for the ride, saves the ride request into the database, and alerts nearby captains via socket connections.

---

#### HTTP Method

`POST`

#### URL

```
/rides/create
```

---

#### Authentication

Requires a valid **user** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field         | Type     | Required | Description                                                    |
|---------------|----------|----------|----------------------------------------------------------------|
| `pickup`      | `string` | ✅ Yes   | The starting location of the ride (minimum **3** characters)   |
| `destination` | `string` | ✅ Yes   | The ending location of the ride (minimum **3** characters)     |
| `vehicleType` | `string` | ✅ Yes   | Type of vehicle — must be one of: `auto`, `car`, or `moto`     |

#### Example Request

```json
{
  "pickup": "Times Square, New York, NY",
  "destination": "Central Park, New York, NY",
  "vehicleType": "car"
}
```

---

#### Responses

##### ✅ `201 Created` — Ride Created Successfully

Returns the created ride object.

```json
{
  "_id": "660f7b8c9d0e1f2a3b4c5d6e",
  "user": "660f1a2b3c4d5e6f7a8b9c0d",
  "pickup": "Times Square, New York, NY",
  "destination": "Central Park, New York, NY",
  "fare": 150,
  "status": "pending",
  "otp": ""
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when the request body fails validation (e.g., missing parameters or invalid vehicle type).

```json
{
  "errors": [
    {
      "msg": "Invalid pickup address",
      "param": "pickup",
      "location": "body"
    },
    {
      "msg": "Invalid destination address",
      "param": "destination",
      "location": "body"
    },
    {
      "msg": "Invalid vehicle type",
      "param": "vehicleType",
      "location": "body"
    }
  ]
}
```

##### ❌ `401 Unauthorized`

Returned when no token is provided, the token is invalid/expired, or the token has been blacklisted.

```json
{
  "message": "Unauthorized"
}
```

##### ❌ `500 Internal Server Error`

Returned when an unexpected error occurs during fare calculation or saving the ride.

```json
{
  "message": "Internal server error"
}
```

---

#### Status Codes Summary

| Status Code | Description                                          |
|-------------|------------------------------------------------------|
| `201`       | Ride created successfully                            |
| `400`       | Validation failed for the request body               |
| `401`       | Missing, invalid, expired, or blacklisted token      |
| `500`       | Internal server error                                |

---

#### Notes

- Uses Google Maps Distance Matrix API internally to calculate distance and duration.
- Generates a **6-digit random OTP**. When returning the ride object via this endpoint, the OTP is emitted as empty (`""`).
- Pushes a `new-ride` socket event to captains in a 2 km radius of the pickup location.

---

### GET `/rides/get-fare`

#### Description

Calculates and returns the estimated fare for different vehicle types (`auto`, `car`, `moto`) based on the distance and time between the given pickup and destination locations.

---

#### HTTP Method

`GET`

#### URL

```
/rides/get-fare
```

---

#### Authentication

Requires a valid **user** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Query Parameters

| Parameter      | Type     | Required | Description                                            |
|----------------|----------|----------|--------------------------------------------------------|
| `pickup`       | `string` | ✅ Yes   | Starting location / address (minimum **3** characters) |
| `destination`  | `string` | ✅ Yes   | Ending location / address (minimum **3** characters)   |

#### Example Request

```
GET /rides/get-fare?pickup=Times+Square,+New+York,+NY&destination=Central+Park,+New+York,+NY
```

---

#### Responses

##### ✅ `200 OK` — Fare Estimated Successfully

Returns an object with estimated fares for different vehicle types.

```json
{
  "auto": 120,
  "car": 250,
  "moto": 80
}
```

##### ❌ `400 Bad Request` — Validation Errors

Returned when `pickup` or `destination` query parameters are missing or shorter than 3 characters.

```json
{
  "errors": [
    {
      "msg": "Invalid pickup address",
      "param": "pickup",
      "location": "query"
    },
    {
      "msg": "Invalid destination address",
      "param": "destination",
      "location": "query"
    }
  ]
}
```

##### ❌ `401 Unauthorized`

Returned when no token is provided, the token is invalid/expired, or the token has been blacklisted.

```json
{
  "message": "Unauthorized"
}
```

##### ❌ `500 Internal Server Error`

Returned when the Google Maps API fails or an unexpected error occurs during calculation.

```json
{
  "message": "Internal server error"
}
```

---

#### Status Codes Summary

| Status Code | Description                                                          |
|-------------|----------------------------------------------------------------------|
| `200`       | Fare successfully estimated                                          |
| `400`       | Validation failed (missing or invalid `pickup`/`destination`)        |
| `401`       | Missing, invalid, expired, or blacklisted token                      |
| `500`       | Google Maps API error or internal server error                       |

---

#### Notes

- Uses Google Maps Distance Matrix API internally to fetch distance and duration.
- The base fare, per kilometer rate, and per minute rate vary between the vehicle types (`auto`, `car`, `moto`) for calculations.

---

### POST `/rides/confirm`

#### Description

Allows a captain to confirm/accept a ride request. Updates the ride status to `accepted`, assigns the captain to the ride, and emits a `ride-confirmed` socket event to the user.

---

#### HTTP Method

`POST`

#### URL

```
/rides/confirm
```

---

#### Authentication

Requires a valid **captain** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field      | Type     | Required | Description                                                    |
|------------|----------|----------|----------------------------------------------------------------|
| `rideId`   | `string` | ✅ Yes   | The valid MongoID of the ride to be confirmed                  |

#### Example Request

```json
{
  "rideId": "660f7b8c9d0e1f2a3b4c5d6e"
}
```

---

#### Responses

##### ✅ `200 OK` — Ride Confirmed Successfully

Returns the updated ride object (with populated user and captain).

##### ❌ `400 Bad Request` — Validation Errors

Returned when `rideId` is missing or is not a valid MongoID.

##### ❌ `500 Internal Server Error`

Returned when the ride is not found or an unexpected error occurs.

---

### POST `/rides/start`

#### Description

Allows a captain to start a confirmed ride. Validates the provided OTP, updates the ride status to `ongoing`, and emits a `ride-started` socket event to the user.

---

#### HTTP Method

`POST`

#### URL

```
/rides/start
```

---

#### Authentication

Requires a valid **captain** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Query Parameters

| Parameter  | Type     | Required | Description                                                    |
|------------|----------|----------|----------------------------------------------------------------|
| `rideId`   | `string` | ✅ Yes   | The valid MongoID of the ride to be started                    |
| `otp`      | `string` | ✅ Yes   | The valid OTP provided by the user to the captain              |

#### Example Request

```
POST /rides/start?rideId=660f7b8c9d0e1f2a3b4c5d6e&otp=123456
```

---

#### Responses

##### ✅ `200 OK` — Ride Started Successfully

Returns the updated ride object (with populated user and captain).

##### ❌ `400 Bad Request` — Validation Errors

Returned when `rideId` or `otp` query parameters are missing or invalid.

##### ❌ `500 Internal Server Error`

Returned when the ride is not found, the ride is not in the `accepted` state, the OTP is invalid, or an unexpected error occurs.

---

### POST `/rides/end`

#### Description

Allows a captain to end an ongoing ride. Updates the ride status to `completed` and emits a `ride-ended` socket event to the user.

---

#### HTTP Method

`POST`

#### URL

```
/rides/end
```

---

#### Authentication

Requires a valid **captain** JWT token.

| Method                    | Format                  |
|---------------------------|-------------------------|
| **Cookie**                | `token=<jwt_token>`     |
| **Authorization Header**  | `Bearer <jwt_token>`    |

---

#### Request Body

The request body must be sent as **JSON** (`Content-Type: application/json`).

| Field      | Type     | Required | Description                                                    |
|------------|----------|----------|----------------------------------------------------------------|
| `rideId`   | `string` | ✅ Yes   | The valid MongoID of the ongoing ride to be ended              |

#### Example Request

```json
{
  "rideId": "660f7b8c9d0e1f2a3b4c5d6e"
}
```

---

#### Responses

##### ✅ `200 OK` — Ride Ended Successfully

Returns the updated ride object (with populated user and captain).

##### ❌ `400 Bad Request` — Validation Errors

Returned when `rideId` is missing or is not a valid MongoID.

##### ❌ `500 Internal Server Error`

Returned when the ride is not found, the ride is not in the `ongoing` state, or an unexpected error occurs.

---
