

# Coros

### The open-source company OS

HR · Employees · Documents · Projects — in one unified platform.

[License](LICENSE)
[Status]()
[Stack]()
[PRs Welcome](CONTRIBUTING.md)

**[Live Demo](https://app.coros.click)** · **[Documentation](https://coros.click)** · **[Discord](https://discord.gg/Z5MrUb35)** · **[Report a Bug](https://github.com/coros-hq/coros/issues)**

<img width="2096" height="1178" alt="coros-dashboard" src="https://github.com/user-attachments/assets/35762c81-99c9-405a-a286-a2d9fb7b5b6a" />

---

## Why Coros?

Most small businesses run on 4–6 disconnected SaaS tools — one for HR, one for docs, one for projects. Each costs money per seat, stores data somewhere you don't control, and talks to nothing else.

Coros replaces that stack with a single platform you own and self-host. One login. One source of truth. No per-seat pricing.

---

## Features

- 👥 **HR Management** — departments, positions, leave requests and approvals
- 🧑‍💼 **Employee Profiles** — contracts, status, full history
- 📁 **Document Management** — upload, assign to employees or projects
- 📋 **Projects & Tasks** — kanban board, assignments, priorities
- 📢 **Announcements** — organization-wide updates with read tracking
- 🔔 **Notifications** — in-app notification center and activity feed
- 🔎 **Global Search** — cross-module search across all your data
- 📈 **Reports & Insights** — dashboard metrics and visual summaries
- 🔐 **Role-based Access** — Admin, Manager, Employee out of the box
- 🏢 **Multi-tenant** — manage multiple organizations from one instance
- 🎨 **Organization Branding** — custom logo and brand color, themed across the entire app
- 🐳 **Self-host in minutes** — single Docker Compose command

---

## Getting Started

### Option 1 — Docker (Recommended)

```bash
git clone https://github.com/coros-hq/coros.git
cd coros

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose -f apps/api/docker-compose.yml up -d --build
```

Visit `http://localhost:5173` — that's it.

### Option 2 — Local Development

```bash
git clone https://github.com/coros-hq/coros.git
cd coros

pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start DB + API in Docker, frontend locally
docker compose -f apps/api/docker-compose.yml up -d
pnpm nx run @org/web:dev:development
```

> **Requirements:** Node.js 20+, pnpm, Docker + Docker Compose

---

## Tech Stack


| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | React Router v7 + shadcn/ui + Tailwind CSS |
| Backend  | NestJS + TypeORM                           |
| Database | PostgreSQL                                 |
| Monorepo | NX Workspace + pnpm                        |
| Auth     | JWT + Refresh Tokens + RBAC                |
| Storage  | Local (dev) → S3 (prod)                    |


---

## Project Structure

```
coros/
├── apps/
│   ├── web/               ← React Router v7 frontend
│   └── api/               ← NestJS backend
├── libs/
│   └── shared-types/      ← shared DTOs and interfaces
├── docker-compose.yml
└── nx.json
```

---

## Roadmap

### v1 — Shipped ✅

- Auth system (JWT + RBAC)
- HR and Employee management
- Document management
- Projects and Tasks with kanban
- Dashboard, notifications, global search
- Organization branding
- Reporting and analytics
- Production Docker setup

### v2 — In Progress 🚧

- Time tracking
- Payroll basics
- Public API + webhooks
- Email notifications
- Mobile-responsive polish
- Audit log

### Future

- SSO / SAML
- Zapier / n8n integration
- Marketplace for modules

> Vote on features or suggest new ones in [GitHub Discussions](https://github.com/coros-hq/coros/discussions).

## Self-hosting vs Cloud


|                | Self-hosted | Cloud (coming soon) |
| -------------- | ----------- | ------------------- |
| Cost           | Free        | Paid                |
| Data ownership | Yours       | Ours (EU servers)   |
| Updates        | Manual      | Automatic           |
| Support        | Community   | Priority            |


---

## License

Licensed under [AGPL-3.0](LICENSE). Free to self-host and modify. If you offer Coros as a hosted service, you must open-source your modifications.

---

## Community

- 💬 [Discord](#) — chat with the team and community
- 🐦 [Twitter/X](https://twitter.com/corosapp) — follow for updates
- 💡 [GitHub Discussions](https://github.com/coros-hq/coros/discussions) — ideas, feedback, questions
- ⭐ Star the repo if Coros is useful to you — it helps a lot

---

Built in public · AGPL-3.0 · Made for SMBs who deserve better tools
