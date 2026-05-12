# Loopar — Local DB Servers

Spin up all four supported engines (MySQL, PostgreSQL, MariaDB, MSSQL) on
their default ports for end-to-end testing of the Loopar installer + ORM
abstraction layer.

## Prerequisites

- [OrbStack](https://orbstack.dev) (already installed) or Docker Desktop.
- The `docker compose` CLI (bundled with both).

## Up / Down

```sh
# from the repo root
docker compose -f dev-databases/docker-compose.yml up -d
docker compose -f dev-databases/docker-compose.yml down

# wipe data volumes — clean slate every time you re-test the installer
docker compose -f dev-databases/docker-compose.yml down -v
```

## Loopar Connector form values

| Engine    | Host        | Port  | User  | Password      |
|-----------|-------------|-------|-------|---------------|
| mysql     | `localhost` | 3306  | root  | root          |
| mariadb   | `localhost` | 3307  | root  | root          |
| postgres  | `localhost` | 5432  | root  | root          |
| mssql     | `localhost` | 1433  | sa    | `Loopar!2026` |

MSSQL forces a complex password so we can't use `root/root`. The others
keep it simple intentionally — these are dev-only.

## Verify a server is up before pointing Loopar at it

```sh
# mysql
docker exec -it loopar-mysql mysql -uroot -proot -e "SELECT VERSION();"

# postgres
docker exec -it loopar-postgres psql -U root -c "SELECT version();"

# mariadb
docker exec -it loopar-mariadb mariadb -uroot -proot -e "SELECT VERSION();"

# mssql
docker exec -it loopar-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Loopar!2026' -C -Q "SELECT @@VERSION"
```

## Reset a single engine without touching the others

```sh
docker compose -f dev-databases/docker-compose.yml stop mysql
docker compose -f dev-databases/docker-compose.yml rm -fv mysql
docker compose -f dev-databases/docker-compose.yml up -d mysql
```

## Notes

- **Healthchecks**: the compose file includes one per service. After `up -d`
  give them ~5–10 seconds to settle (MSSQL needs ~30s). Use `docker compose ps`
  to see when they go from `(starting)` to `(healthy)`.

- **MariaDB on port 3307**: chosen so it doesn't clash with MySQL on 3306.
  Loopar's connector form just takes whatever port you type.

- **Ports already in use**: if you already have a MySQL on 3306, edit the
  compose file's `ports` mapping for `mysql` to `"3307:3306"` (or any free
  port) and adjust the connector form accordingly.
