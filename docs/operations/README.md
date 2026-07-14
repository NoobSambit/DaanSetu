# Operations Index

Operations docs explain how to run, verify, seed, deploy, and administer the project.

```mermaid
flowchart LR
  Setup[Local setup] --> Env[Environment]
  Env --> Dev[Run dev server]
  Dev --> Verify[Verification]
  Env --> DB[Database and seed]
  DB --> Verify
  Verify --> Deploy[Deployment checklist]
  Env --> Admin[Admin bootstrap]
```

- [Local development](local-development.md)
- [Environment variables](environment-variables.md)
- [Database and seed data](database-and-seed-data.md)
- [Verification](verification.md)
- [Deployment checklist](deployment-checklist.md)
- [Admin bootstrap](admin-bootstrap.md)
