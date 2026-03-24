# FaceAttend Monorepo

This workspace contains a React client and an Express/MySQL server.

## Project Structure

- `client/` - Vite + React frontend
- `server/` - Express backend and database setup
- `package.json` - root scripts to run client and server together

## Common Commands

From the repository root:

- `npm run dev` - run frontend and backend in development mode
- `npm run start` - run preview frontend + production backend
- `npm run seed` - seed backend database

## Notes

- Keep runtime-generated files out of git (node_modules, build artifacts, uploads).
- Use `client/README.md` and `server/README.md` for app-specific details.
