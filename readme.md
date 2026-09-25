# API Endpoints

## Run everything

Start both services and their separate MongoDB instances with one command:

```bash
docker compose up
```

The users API is available at `http://localhost:3001` and the posts API at
`http://localhost:3002`. MongoDB data is kept in named Docker volumes.

## User Service

```text
POST   /users
GET    /users
GET    /users/:userId
PATCH  /users/:userId
DELETE /users/:userId
```

### Optional request bodies

**POST `/users`**

```json
{
  "username": "jassy",
  "email": "jassy@example.com",
  "password": "password123"
}
```

**PATCH `/users/:userId`**

```json
{
  "username": "new-name",
  "bio": "Backend developer"
}
```

---

## Auth

```text
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
```

### Optional request bodies

**POST `/auth/login`**

```json
{
  "email": "jassy@example.com",
  "password": "password123"
}
```

---

## Post Service

```text
POST   /posts
GET    /posts
GET    /posts/:postId
PATCH  /posts/:postId
DELETE /posts/:postId
```

### Optional request bodies

**POST `/posts`**

```json
{
  "content": "Hello world"
}
```

**PATCH `/posts/:postId`**

```json
{
  "content": "Updated content"
}
```

---

## Internal

```text
GET /internal/users/:userId
```
