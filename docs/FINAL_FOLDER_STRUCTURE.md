# VedaAI Folder Structure

This file maps the final, predictable, and hardened workspace folder layout.

```txt
TestRepo/
├── apps/
│   ├── backend/
│   │   ├── prisma/             # Schema configuration and seeding scripts
│   │   └── src/
│   │       ├── config/         # Database and environment handlers
│   │       ├── controllers/    # HTTP route endpoint controllers
│   │       ├── middlewares/    # Authentication and rate limits
│   │       ├── routes/         # Express endpoint router paths
│   │       ├── security/       # Consolidated RBAC permissions and mappings
│   │       ├── services/       # Consolidated core business services
│   │       └── workflows/      # Workflow state engine transition rules
│   └── frontend/
│       └── src/
│           ├── app/            # Next.js App Router views
│           ├── components/     # Role-aware Sidebar layouts and shared UIs
│           └── config/         # Routing permission matrices
├── docs/                       # Consolidated architecture and security docs
├── ENVIRONMENT_REFERENCE.md    # System environment variables guide
└── README.md                   # Platform summary
```
