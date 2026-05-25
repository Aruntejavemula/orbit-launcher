# Orbit Launcher - System Design Document

## Overview
Orbit Launcher is a centralized dashboard application designed to help users track their app subscriptions, trials, and renewals. It offers a visual grid of tools, upcoming renewal insights, spending tracking, and cross-platform accessibility.

## System Architecture
The application is built on a modern, decoupled client-server architecture:
- **Frontend:** A responsive Single Page Application (SPA) built with React and TypeScript, packaged for Web, Desktop (Electron), and Mobile (Capacitor).
- **Backend:** A RESTful API built with Python (FastAPI), providing high-performance asynchronous endpoints.
- **Database:** PostgreSQL for persistent storage with Redis for background job queuing.

## Technology Stack

### Frontend (Client)
- **Core:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons), Framer Motion (Animations)
- **State Management & Data Fetching:** TanStack React Query, LocalStorage (for offline/initial state persistence)
- **Testing:** Vitest, Playwright (E2E), React Testing Library
- **Cross-Platform:** Electron (Windows/macOS/Linux), Capacitor (iOS/Android)
- **PWA Support:** Vite PWA Plugin, Workbox

### Backend (Server)
- **Framework:** FastAPI
- **Database ORM:** SQLAlchemy (async with `asyncpg`)
- **Database Migrations:** Alembic
- **Task Queue:** Arq (backed by Redis) for background jobs like sending emails and push notifications.
- **Authentication:** JWT (JSON Web Tokens) with secure cookie and Bearer token support.
- **Error Tracking:** Sentry
- **Rate Limiting:** Slowapi

## Data Models

1. **User (`users`)**: Represents registered users, tracking basic info like name, email, and authentication details.
2. **AppItem (`apps`)**: The core entity representing a tracked subscription/app.
   - *Fields:* Name, URL, Category, Plan (paid, free, trial), Billing Frequency (monthly, quarterly, yearly), Monthly Cost, Expires At, etc.
3. **Preferences (`preferences`)**: User-specific settings (theme, compact mode, currency, notification preferences, budget).
4. **Reminders (`reminders`) & ReminderLogs (`reminder_logs`)**: Rules for when to notify users about expiring trials or upcoming renewals (via email or push).
5. **UsageSession (`usage_sessions`)**: Tracks when and how often users launch specific apps to generate insights.
6. **ApiKey (`api_keys`)**: For developer/programmatic access.
7. **PushSubscription (`push_subscriptions`)**: Stores web push subscription details for sending notifications.

## Key Features

1. **App Grid Dashboard**: A visual overview of all tracked applications with smart urgency badges (e.g., trials expiring soon).
2. **Subscription Management**: Add, edit, or delete tracked apps with custom categories and billing details.
3. **Calendar View**: A visual calendar representation of upcoming renewals and trial expirations.
4. **Insights & Spending**: Analytical views to track total spending, budget utilization, and tool usage frequency.
5. **Cross-Platform Availability**: Accessible via web browser, installable as a PWA, or native desktop/mobile apps.
6. **Reminders & Push Notifications**: Automated alerts for upcoming charges.

## Directory Structure Highlights
- `/frontend/src/components`: Reusable UI components.
- `/frontend/src/pages`: Top-level route components (Home, Insights, Calendar, Settings).
- `/frontend/src/types.ts`: Shared TypeScript interfaces mirroring backend models.
- `/backend/models`: SQLAlchemy ORM definitions.
- `/backend/routers`: FastAPI route handlers (auth, apps, insights, etc.).
- `/backend/schemas`: Pydantic models for request/response validation.
