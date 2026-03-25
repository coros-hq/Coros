# Coros

> The open-source company OS — HR, employees, documents and projects in one place.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![Status](https://img.shields.io/badge/status-active%20development-orange)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20NestJS%20%2B%20PostgreSQL-informational)

---

## What is Coros?

Coros is an open-source company operating system built for small and medium businesses. Instead of juggling multiple disconnected tools, Coros brings HR, employee management, documents, projects and tasks into a single unified platform.

Self-host it on your own infrastructure, or use the cloud-hosted version — same product, your choice.

---

## Features

- 👥 **HR Management** — departments, positions, leave requests
- 🧑‍💼 **Employee Profiles** — contracts, status, history
- 📁 **Document Management** — upload, assign, organize
- 📋 **Projects & Tasks** — kanban board, assignments, priorities
- 📢 **Announcements** — organization-wide updates and reads
- 🔔 **Notifications** — in-app notification center and activity feed
- 🔎 **Global Search** — cross-module search for fast navigation
- 📈 **Reports & Insights** — dashboard metrics and visual summaries
- 🔐 **Role-based Access Control** — Admin, Manager, Employee
- 🏢 **Multi-tenant** — manage multiple organizations
- 🐳 **Self-host in minutes** — single Docker Compose command

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Router v7 + shadcn/ui + Tailwind CSS |
| Backend | NestJS + TypeORM |
| Database | PostgreSQL |
| Monorepo | NX Workspace + pnpm |
| Auth | JWT + Refresh Tokens |
| Storage | Local (dev) → S3/Cloudflare R2 (prod) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker + Docker Compose

### Self-host with Docker

```bash
# Clone the repository
git clone https://github.com/coros-hq/coros.git
cd coros

# Start the database
docker-compose up -d

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run both apps
pnpm nx run-many --target=serve --projects=web,api
```

Visit `http://localhost:5173` for the web app and `http://localhost:3000/api` for the API.

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

- [x] Project setup and architecture
- [x] Auth system (JWT + RBAC)
- [x] HR and Employee management
- [x] Document management
- [x] Projects and Tasks
- [x] Dashboard and notifications
- [ ] Reporting and analytics expansion
- [ ] Production Docker setup
- [ ] Landing page and public launch

---

## Contributing

Coros is built in public and contributions are welcome. The project is in active early development — the best way to contribute right now is to try it out, open issues, and share feedback.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

Coros is licensed under the [AGPL-3.0 License](LICENSE). You are free to self-host and modify it. If you offer it as a hosted service, you must open source your modifications.

---

## Stay in the Loop

This project is being built in public. Follow the journey:

- 🐦 Twitter/X — [@corosapp](#)
- ⭐ Star the repo to follow progress
- 💬 Open an issue to share feedback or ideas

---

<p align="center">Built with ❤️ and shipped in public</p>