# School Management Frontend

The School Management Frontend is a web application for managing school communities. It provides role-based experiences
for principals, teachers, and students, including school profiles, teacher and student records, profile management, and
links between students and teachers.

The application is built as a single-page Angular app and communicates with a separate backend API.

## Frontend tech stack

- **Angular 22** with standalone components and the Angular Router
- **TypeScript 6**
- **Angular Material** and **Angular CDK** for UI controls and interaction patterns
- **SCSS** for global and component styles
- **RxJS** for reactive data flows
- **Vitest** for unit testing

## UI and component structure

The application is organized by responsibility under `school-management-frontend/src/app`:

```text
school-management-frontend/src/app/
├── core/       API configuration, models, guards, interceptors, and services
├── features/   Route-level screens grouped by domain and user role
├── layout/     Shared application shell and navigation chrome
└── shared/     Reusable dialogs and UI components
```

Feature screens cover authentication and principal registration, session selection, school dashboards and profiles, and
teacher and student dashboards, details, lists, and forms. The shared shell provides common navigation for authenticated
sessions. Route guards protect role-specific and school-scoped pages, while feature screens are loaded lazily through
the router.

## Getting started

### Prerequisites

- Node.js and npm, or Node.js and Yarn
- Access to the backend API (the default API URL is `http://localhost:8080`)

### Install dependencies

From the repository root, install dependencies in the frontend project directory using **one** package manager:

```bash
cd school-management-frontend

# npm
npm ci

# or Yarn
yarn install
```

### Run locally

From `school-management-frontend/`, start the Angular development server:

```bash
# npm
npm start

# or Yarn
yarn start
```

Open [http://localhost:4200](http://localhost:4200). The dev server reloads the application as source files change.

The API base URL is configured in `school-management-frontend/src/app/core/api-config.ts`. Update it if your backend is
running at a different address.

## Build and tests

Run these commands from `school-management-frontend/`:

```bash
# Build
npm run build
# or
yarn build

# Unit tests
npm test
# or
yarn test
```

## Backend repository

The backend is maintained separately: [Backend repository](https://github.com/elifb123123/school-management-backend).

