# Hadarni Backend Documentation

This project is an Express + MongoDB backend for the Hadarni app.

## Base URL

- Local: `http://localhost:3000`
- User routes: `/user`

## Environment Variables

Required:

- `MONGO` or `MONGODB_URI` or `MONGO_URI` or `DATABASE_URL`
- `JWT_SECRET`
- `AUTH_EMAIL`
- `AUTH_PASS`

Optional:

- `APP_URL`
- `PUBLIC_APP_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `GOOGLE_CLIENT_ID`

## Authentication

Most private routes require:

```http
Authorization: Bearer <JWT_TOKEN>
```

## User Routes

### Public routes

#### `POST /user/register`
Registers a new user and sends a verification email.

Body:

```json
{
  "name": "Ali",
  "email": "ali@example.com",
  "password": "123456",
  "famillyname": "Ahmed",
  "dateOfBirth": "2000-01-01",
  "username": "ali123",
  "phone": "555000111",
  "image": "",
  "isLessor": false
}
```

#### `POST /user/verify`
Verifies the email code and returns a JWT.

Body:

```json
{
  "email": "ali@example.com",
  "code": "472916"
}
```

#### `POST /user/send-code`
Sends a new verification/reset code to an existing user.

Body:

```json
{
  "email": "ali@example.com"
}
```

#### `POST /user/login`
Logs in with email and password.

Body:

```json
{
  "email": "ali@example.com",
  "password": "123456"
}
```

#### `POST /user/google`
Google sign-up / sign-in using a Google ID token.

Body:

```json
{
  "credential": "GOOGLE_ID_TOKEN"
}
```

#### `POST /user/forget`
Starts password reset flow and sends a reset code.

Body:

```json
{
  "email": "ali@example.com"
}
```

#### `POST /user/confirm`
Confirms the password reset code and returns a short-lived token.

Body:

```json
{
  "email": "ali@example.com",
  "code": "472916"
}
```

#### `GET /user/copy-code?code=472916&brand=Hadarni`
Opens a small page that copies the code to the clipboard.

## Protected routes

#### `PUT /user/password`
Updates the password.

Body:

```json
{
  "password": "oldPassword",
  "newPassword": "newPassword123"
}
```

If the JWT contains `action = "reset-password"`, only `newPassword` is required.

#### `PUT /user/:id/images`
Uploads one image and stores it in Cloudinary.

Form-data:

- Key: `images`
- Type: file

#### `POST /user/me/saved/:id`
Adds a property to saved items.

#### `DELETE /user/me/saved/:id`
Removes a property from saved items.

#### `GET /user/me/saved`
Returns the saved properties for the current user.

#### `PUT /user/me`
Updates the current user profile.

Body fields can include:

- `name`
- `famillyname`
- `username`
- `phone`
- `email`
- `dateOfBirth`
- `image`
- `isLessor`

## Postman Examples

### Google sign-in

`POST http://localhost:3000/user/google`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "credential": "PASTE_GOOGLE_ID_TOKEN_HERE"
}
```

### Login

`POST http://localhost:3000/user/login`

Body:

```json
{
  "email": "ali@example.com",
  "password": "123456"
}
```

### Protected route

Example:

`GET http://localhost:3000/user/me/saved`

Headers:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Notes

- The backend supports Gmail by default and can also use custom SMTP if `SMTP_HOST` is set.
- Google sign-in requires `GOOGLE_CLIENT_ID` on the server.
- The copy-code mail button opens a browser page because email clients do not allow reliable clipboard access.
