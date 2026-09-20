# Real Time Order Tracking System

A Spring Boot backend that simulates an order lifecycle, from placing an order till it gets
delivered, with status updates going out over **Apache Kafka** and reaching the customer over email.

It is a monolith on purpose, the idea was to keep the project simple and still practice
event driven flow, JWT based security and containerised setup.

---

## Tech Stack

| Area | Used |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.5.6 |
| Database | MongoDB |
| Messaging | Apache Kafka 4.2.1 (KRaft mode) |
| Security | Spring Security + JWT (jjwt) |
| Docs | Swagger / OpenAPI |
| Mail | Spring Mail (Gmail SMTP) |
| Build | Maven |
| Containers | Docker, Docker Compose |

---

## What it does

- User registers and logs in, token comes back in the response and also in a cookie
- Logged in user can place an order, see their orders, track one order and cancel an order
- Every order event is published to Kafka and a consumer sends the email
- The tracking screen is fed by that same consumer over server sent events, so a status
  change shows up without refreshing anything
- Failed events are retried and whatever still fails lands in a `failed_events` collection
- Same event is never mailed twice, handled events are noted in `processed_events`
- Admin can list users and look them up by id or email

---

## Order status flow

An order can only move one step at a time, the allowed moves are:

```
PENDING -> CONFIRMED -> PROCESSING -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED -> RETURNED
```

- Cancellation is allowed only till **PACKED**
- **CANCELLED** and **RETURNED** are final, nothing can happen after them
- Skipping a stage is not allowed, for example PENDING straight to DELIVERED is rejected

---

## Getting started

### Prerequisites

- Java 17
- Docker and Docker Compose (easiest way to get Mongo and Kafka up)
- A Gmail account with an app password, for sending the mails

### 1. Environment file

```bash
cp .env.example .env
```

Then fill in your own values:

| Variable | What it is |
|---|---|
| `MAIL_USERNAME` | gmail address used for sending mails |
| `MAIL_PASSWORD` | 16 character gmail app password, not your login password |
| `EMAIL_SENDER` | address shown in the from field |
| `JWT_SECRET` | base64url encoded secret used to sign the token |
| `EXPIRATION_TIME` | token validity in milliseconds, 3600000 is one hour |
| `CORS_ALLOWED_ORIGINS` | frontend urls allowed to call the api, comma separated |

`.env` is git ignored, so the real values never get committed.

### 2. Run everything in Docker

```bash
docker compose up --build
```

This starts MongoDB, Kafka and the backend. App comes up on `http://localhost:8080`.

### 3. Frontend

```bash
cd order_frontend
cp .env.example .env
npm install
npm run dev
```

Opens on `http://localhost:3000`, which is the origin the backend allows by default.

### 4. Or run only the infra and start the app from the IDE

```bash
docker compose up mongo kafka
cd order_backend
./mvnw spring-boot:run
```

Kafka advertises two listeners, `kafka:29092` for the containers and `localhost:9092`
for anything running on the host, so both ways work without changing any config.

---

## API

Base path is `/api/v1`. Swagger UI is at `http://localhost:8080/swagger-ui.html`.

### Auth — open endpoints

| Method | Path | What it does |
|---|---|---|
| POST | `/auth/sign-up` | register a new user |
| POST | `/auth/sign-in` | login, returns the jwt |
| POST | `/auth/sign-out` | clears the cookie and revokes the token |
| GET | `/auth/me` | profile of the signed in user, **needs login** |

Signing out revokes the token, it does not only drop the cookie. The id of the token
goes into `revoked_tokens` and the auth filter refuses it from then on. Mongo removes
the row by itself once the token would have expired anyway.

### Order — needs login

| Method | Path | What it does |
|---|---|---|
| POST | `/order/generateOrder` | place a new order |
| GET | `/order/orders?page=0&size=10` | your orders, paginated |
| GET | `/order/fetch/{orderId}` | one order |
| PUT | `/order/update/{orderId}` | move the order to the next status, **ADMIN only** |
| DELETE | `/order/cancel/{orderId}` | cancel the order |
| GET | `/order/stream/{orderId}` | live status of one order, server sent events |

Page starts from **0** and size can be between 1 and 100.

Moving an order forward is an admin job. A customer can place an order, watch it and
cancel it, but cannot mark it delivered. An admin can read and move any order, everybody
else only their own.

### Admin — needs ADMIN role

| Method | Path | What it does |
|---|---|---|
| GET | `/admin/users?page=0&size=10` | all users, paginated |
| GET | `/admin/id/{id}` | user by id |
| GET | `/admin/email/{email}` | user by email |

### Sending the token

Either header or cookie works:

```
Authorization: Bearer <token>
```

---

## Live tracking

`GET /api/v1/order/stream/{orderId}` keeps the connection open and sends an event every
time the status of that order changes.

The push does not come from the service which saved the change, it comes from the Kafka
consumer:

```
PUT /order/update/{id}  ->  order saved  ->  order_update_event  ->  consumer
                                                                      |-> email
                                                                      `-> sse push -> browser
```

So the screen moves only after the event has actually travelled through Kafka and come
back, the same path the email takes.

Worth knowing:

- Connections are held in memory, so this works as written for one backend instance. With
  more than one, a client only receives the events of the instance it is connected to, and
  that would need something shared in between, redis pub/sub for example.
- A ping is sent every 25 seconds so idle connections are not dropped.
- The browser reconnects on its own, and the first event on a new connection is always the
  current status, so nothing is missed while it was away.
- The stream is guarded exactly like the normal fetch, you can only open one for your own
  order.

---

## Error responses

| Code | When |
|---|---|
| 400 | request body or query param failed validation |
| 401 | no token, expired token or a wrong one |
| 403 | logged in but role is not allowed |
| 404 | user or order not found |
| 409 | email already registered, or an order status change which is not allowed |

---

## Project structure

```
order_frontend/src        # react frontend, see order_frontend/README.md
order_backend/src/main/java/com/reon/order_backend
├── config        # security and swagger configuration
├── controller    # rest endpoints
├── document      # mongo documents
├── dto           # request and response objects
├── email         # mail sending
├── exception     # custom exceptions and the global handler
├── jwt           # token utils, filter and entry point
├── kafka         # topic config and the consumer
├── mapper        # entity to dto conversion
├── repository    # mongo repositories
└── service       # business logic
```

---

## Still to do

- Proper product document instead of keeping items as plain strings
- Alert the admin when an event reaches the dead letter topic
- Test cases
- Jenkins pipeline for build and deploy
