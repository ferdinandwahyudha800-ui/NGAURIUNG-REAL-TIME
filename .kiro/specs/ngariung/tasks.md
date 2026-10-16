# Implementation Plan

## Overview

Rencana implementasi untuk aplikasi Ngariung dibagi menjadi 26 tasks yang mencakup setup proyek, backend services, REST APIs, frontend implementation, styling, testing, dan documentation. Tasks diorganisir berdasarkan dependencies dengan estimasi 6 minggu untuk 1 developer paruh waktu.

**Fase Implementasi:**
1. **Foundation (Week 1):** Setup proyek, database, models, migrations
2. **Backend Core (Week 2-3):** Authentication, services, SignalR hub, REST APIs
3. **Frontend Core (Week 4):** UI layout, SignalR client, rooms, messages
4. **Frontend Features (Week 5):** Send message, emoji, create room, DM, profile
5. **Polish & QA (Week 6):** Theme, testing, bug fixes, documentation

## Tasks

- [ ] 1. Setup Proyek dan Konfigurasi Dasar - Setup struktur proyek ASP.NET Core dengan dependencies, database, dan Docker
- [ ] 2. Buat Entity Models dan Database Context - Definisikan entity models (User, Room, RoomMember, Message) dan ApplicationDbContext
- [ ] 3. Buat Database Migrations dan Seed Data - Generate migration, auto-migration startup, seed ruang "umum"
- [ ] 4. Implementasi Authentication Service dan JWT - Service untuk registrasi, login, JWT generation dengan password hashing
- [ ] 5. Implementasi Rate Limiter Service - Rate limiter dengan sliding window algorithm untuk login, message, create room
- [ ] 6. Buat REST API Endpoints untuk Authentication - POST /api/auth/register, /login, /logout dengan validation
- [ ] 7. Konfigurasi JWT Authentication dan Authorization - Setup JWT middleware, [Authorize] attribute, SignalR token handling
- [ ] 8. Implementasi Room Service - Service untuk create, get, join, leave rooms, dan direct messages
- [ ] 9. Implementasi Message Store Service - Service untuk save dan get messages dengan pagination dan HTML escaping
- [ ] 10. Implementasi Presence Service - Service untuk tracking user presence (online/offline) dengan multiple connections
- [ ] 11. Implementasi SignalR Chat Hub - Hub dengan JoinRoom, SendMessage, StartTyping, MarkRead, lifecycle events
- [ ] 12. Buat REST API Endpoints untuk Rooms - GET/POST /api/rooms, GET /api/rooms/{id}, GET messages, POST DM
- [ ] 13. Buat REST API Endpoints untuk User Profile - PATCH /api/me, GET /api/users untuk update profile dan get users
- [ ] 14. Implementasi Frontend - Authentication UI - Login dan register forms dengan validation dan error handling
- [ ] 15. Implementasi Frontend - Chat UI Layout - Layout dengan sidebar, main area, member panel, responsive design
- [ ] 16. Implementasi Frontend - SignalR Connection dan Auto-Reconnect - HubConnection dengan exponential backoff reconnect
- [ ] 17. Implementasi Frontend - Room List dan Navigation - Display rooms, unread count, sorting, navigation
- [ ] 18. Implementasi Frontend - Message Display dan Infinite Scroll - Display messages, pagination, grouping, formatting
- [ ] 19. Implementasi Frontend - Send Message dan Typing Indicator - Send message, typing events, rate limit handling
- [ ] 20. Implementasi Frontend - Emoji Picker - Emoji picker panel dengan insert emoji ke message input
- [ ] 21. Implementasi Frontend - Create Room Dialog - Modal untuk create room dengan validation dan rate limiting
- [ ] 22. Implementasi Frontend - Direct Message Initiation - Users list dan start DM dengan user lain
- [ ] 23. Implementasi Frontend - User Profile dan Settings - Edit display name, change status, theme selection
- [ ] 24. Implementasi Theme Styles (Light/Dark Mode) - CSS untuk light/dark mode dengan proper contrast
- [ ] 25. Testing dan Bug Fixes - Unit tests, integration tests, manual testing, performance testing, bug fixes
- [ ] 26. Documentation dan Deployment Guide - README dengan setup, deployment, API docs, architecture

## Notes

**Estimasi Waktu Total:** 6 minggu untuk 1 developer paruh waktu

**Fase Implementasi:**
- **Week 1 (Foundation):** Tasks 1-3
- **Week 2 (Backend Services):** Tasks 4-10
- **Week 3 (SignalR & APIs):** Tasks 11-13
- **Week 4 (Frontend Core):** Tasks 14-18
- **Week 5 (Frontend Features):** Tasks 19-23
- **Week 6 (Polish & QA):** Tasks 24-26

**Prioritas:**
- P0 (Critical): Tasks 1-19 - Core functionality
- P1 (Important): Tasks 20-23 - Enhanced features
- P2 (Nice to have): Tasks 24-26 - Polish dan documentation

**Catatan:**
- Tasks dapat dikerjakan secara paralel jika dependencies sudah selesai
- Frontend tasks (14-23) bisa dimulai setelah backend APIs (Tasks 6, 12, 13) selesai
- Testing (Task 25) dilakukan incremental selama development, bukan hanya di akhir

## Task Dependency Graph

```json
{
  "waves": [
    {
      "name": "Wave 1: Foundation",
      "tasks": [1]
    },
    {
      "name": "Wave 2: Data Layer",
      "tasks": [2]
    },
    {
      "name": "Wave 3: Database Setup",
      "tasks": [3]
    },
    {
      "name": "Wave 4: Core Services",
      "tasks": [4, 5, 8, 9, 10]
    },
    {
      "name": "Wave 5: Authentication & APIs",
      "tasks": [6, 7]
    },
    {
      "name": "Wave 6: Real-time & Endpoints",
      "tasks": [11, 12, 13]
    },
    {
      "name": "Wave 7: Frontend Foundation",
      "tasks": [14]
    },
    {
      "name": "Wave 8: Frontend Layout",
      "tasks": [15]
    },
    {
      "name": "Wave 9: Frontend Connection",
      "tasks": [16]
    },
    {
      "name": "Wave 10: Frontend Core Features",
      "tasks": [17, 18]
    },
    {
      "name": "Wave 11: Frontend Messaging",
      "tasks": [19]
    },
    {
      "name": "Wave 12: Frontend Enhanced Features",
      "tasks": [20, 21, 22, 23]
    },
    {
      "name": "Wave 13: Styling",
      "tasks": [24]
    },
    {
      "name": "Wave 14: Quality Assurance",
      "tasks": [25]
    },
    {
      "name": "Wave 15: Documentation",
      "tasks": [26]
    }
  ]
}
```

**Task Dependencies:**
- Task 1 → Task 2
- Task 2 → Tasks 3, 4, 5, 8, 9, 10
- Task 4, 5 → Task 6
- Task 4 → Task 7
- Task 7, 8, 9, 10 → Task 11
- Task 8, 9 → Task 12
- Task 7, 10 → Task 13
- Task 6 → Task 14
- Task 14 → Task 15
- Task 15, 11 → Task 16
- Task 16, 12 → Task 17
- Task 17, 12 → Tasks 18, 21, 22
- Task 17, 13 → Task 23
- Task 18, 11 → Task 19
- Task 19 → Task 20
- Task 23 → Task 24
- All tasks → Task 25
- Task 25 → Task 26

**Critical Path:** 1 → 2 → 4 → 6 → 14 → 15 → 16 → 17 → 18 → 19 → 25 → 26 (13 tasks)
