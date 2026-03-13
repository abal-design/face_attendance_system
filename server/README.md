# FaceAttend Server

MySQL backend scaffold for the existing FaceAttend frontend.

## Stack

- Express
- Sequelize
- MySQL
- JWT authentication
- bcrypt password hashing

## Structure

```text
server/
├── database/
├── uploads/
├── server.js
├── package.json
└── src/
    ├── app.js
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    └── utils/
```

## Setup

1. Copy `.env.example` to `.env`.
2. Create the MySQL database by running `database/schema.sql`.
3. From the `server` folder run `npm install`.
4. Start the server with `npm run dev`.

## Environment

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=faceattend
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_SYNC=true
DB_LOGGING=false
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
```

## API Base URL

The client is already configured for:

```text
http://localhost:5000/api
```

## Available Route Groups

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/stats`
- `GET/POST/PUT/DELETE /api/students`
- `GET/POST/PUT/DELETE /api/teachers`
- `GET/POST/PUT/DELETE /api/departments`
- `GET/POST/PUT/DELETE /api/classes`
- `GET/POST/PUT/DELETE /api/attendance`
- `GET/POST/PUT/DELETE /api/schedule`
- `GET/POST /api/reports`
- `GET/POST/PATCH/DELETE /api/notifications`
- `GET/PUT /api/settings`

## Notes

- This is a scaffolded backend starter. The client still uses mock data in many screens, so frontend integration work is still required.
- `DB_SYNC=true` is convenient during local development. Use migrations or set it to `false` before production deployment.
