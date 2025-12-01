# Bolmate Base Frontend

React + TypeScript frontend powered by Vite. Provides a simple layout, routing, and an example form that calls the Flask backend.

## Scripts
- `npm run dev` – start the dev server on port 3000
- `npm run build` – create a production build
- `npm run preview` – preview the production build locally

## Environment
Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend URL (defaults to `http://localhost:5000`).

## Structure
```
src/
  components/   # Shared layout components
  pages/        # Routed screens (Home, Users)
  styles/       # Minimal styling
```
