# Contributing to Coros

First off — thank you for considering contributing to Coros. Every contribution matters, whether it's a bug fix, a new feature, an improvement to the docs, or just sharing feedback.

---

## Before You Start

- Check the [open issues](https://github.com/coros-hq/coros/issues) to see if your idea or bug is already tracked
- For major changes, open an issue first to discuss what you'd like to change — this saves everyone time
- Browse issues tagged [`good first issue`](https://github.com/coros-hq/coros/labels/good%20first%20issue) if you're looking for a starting point

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm
- Docker + Docker Compose

### Getting Started

```bash
# Clone the repo
git clone https://github.com/coros-hq/coros.git
cd coros

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start the backend stack
docker compose -f apps/api/docker-compose.yml up -d

# Start the frontend
pnpm nx run @org/web:dev:development
```

Visit `http://localhost:5173` for the web app and `http://localhost:3000/v1/api` for the API.

---

## Project Structure

```
coros/
├── apps/
│   ├── web/               ← React Router v7 frontend
│   └── api/               ← NestJS backend
├── libs/
│   └── shared-types/      ← shared DTOs and interfaces
```

---

## Architecture Decisions to Keep in Mind

These are non-negotiable and must be respected in all contributions:

- **Multi-tenancy** — every entity must be scoped by `organizationId`
- **Soft deletes** — use `@DeleteDateColumn` (`deletedAt`), never hard delete
- **Shared types** — DTOs and interfaces go in `libs/shared-types`, not duplicated across apps
- **Consistent error shape** — all errors must follow `{ status, message, errors[] }`
- **StorageService abstraction** — never use local file system directly, always go through StorageService

---

## Making Changes

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Make sure everything works locally
5. Commit with a clear message
   ```bash
   git commit -m "feat: add leave request notifications"
   ```
6. Push your branch
   ```bash
   git push origin feature/your-feature-name
   ```
7. Open a Pull Request against the `main` branch

---

## Commit Message Format

We follow a simple convention:

| Prefix | When to use |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring without behavior change |
| `chore:` | Build, config, or tooling changes |

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Add screenshots if your change affects the UI
- Make sure existing functionality isn't broken

---

## Reporting Bugs

Open an issue and include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version, Docker version)

---

## Feature Requests

Open an issue with the `feature request` label or drop it in [GitHub Discussions](https://github.com/coros-hq/coros/discussions). We read everything.

---

## License

By contributing to Coros, you agree that your contributions will be licensed under the [AGPL-3.0 License](LICENSE).

---

<p align="center">Built in public · contributions welcome · thank you 🙏</p>
