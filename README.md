# FocusList

FocusList is a compact task dashboard for keeping a daily work list under control. It started as a simple ToDo app and grew into a small full-stack project with a FastAPI backend, SQLite persistence, a vanilla JavaScript frontend, Docker runtime, and GitLab CI/CD.

Recommended repository name: `focus-list`.

Other good names if you want alternatives:

- `focus-board`
- `task-pulse`
- `daily-focus`

## Idea

The project is not trying to be a heavy project-management system. Its job is narrower: give one person a clean place to capture tasks, see progress, filter the list, and close completed work without leaving the page.

The current UI is built around a "focus dashboard":

- progress ring for completed work;
- counters for all, active, and completed tasks;
- search with highlighted matches;
- filters for all, active, and completed tasks;
- inline task editing;
- one-click completion toggle;
- cleanup for completed tasks.

## Features

- Create tasks.
- Edit task text inline.
- Mark tasks as completed or return them to active work.
- Delete individual tasks.
- Clear all completed tasks from the UI.
- Search tasks on the client.
- Filter tasks by status.
- Persist tasks in SQLite.
- Serve frontend and API from one FastAPI application.
- Run locally or with Docker Compose.
- Build, lint, test, deploy, and notify through GitLab CI.

## Architecture

```text
Browser
  |
  | GET /
  | GET /static/*
  | fetch /api/tasks
  v
FastAPI app: Api/main.py
  |
  | SQLAlchemy async session
  v
SQLite database
```

The project intentionally keeps the architecture small:

- `Api/main.py` owns the FastAPI app, API routes, SQLAlchemy model, Pydantic schema, database startup, and static file serving.
- `Web/index.html` defines the dashboard layout.
- `Web/main.js` manages client-side state, rendering, filters, search, editing, and API calls.
- `Web/style.css` contains the responsive dashboard styling.
- `tests/test_models.py` covers basic schema and serialization behavior.
- `.gitlab-ci.yml` defines lint, test, build, deploy, and notify jobs.
- `Dockerfile` and `docker-compose.yml` define the container runtime.

This layout is practical for a learning project or a small demo. If the app grows, the backend can be split into modules for database setup, models, schemas, and routers.

## Tech Stack

Backend:

- Python
- FastAPI
- Pydantic
- SQLAlchemy async ORM
- SQLite
- aiosqlite
- greenlet
- Uvicorn

Frontend:

- HTML
- CSS
- Vanilla JavaScript
- Fetch API

Infrastructure:

- Docker
- Docker Compose
- GitLab CI/CD
- Ruff
- Pytest
- Telegram deploy notifications through a shell script

## Project Structure

```text
.
├── Api/
│   ├── main.py
│   └── requirements.txt
├── Web/
│   ├── index.html
│   ├── main.js
│   └── style.css
├── ci/
│   └── template.yml
├── scripts/
│   └── notify_telegram.sh
├── tests/
│   └── test_models.py
├── .gitlab-ci.yml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Requirements

For local development:

- Python 3.11 recommended
- `pip`
- Docker and Docker Compose if you want containerized runtime

The CI pipeline uses `python:3.11-alpine`.

## Local Setup

Create and activate a virtual environment:

```sh
python3 -m venv .venv
source .venv/bin/activate
```

Install runtime and development dependencies:

```sh
python3 -m pip install -r Api/requirements.txt pytest ruff
```

Run the application:

```sh
uvicorn Api.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000
```

By default, local SQLite data is stored in:

```text
Api/ToDoList.db
```

You can override the database path:

```sh
DB_PATH=/tmp/focus-list.db uvicorn Api.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker Run

Build and start the app:

```sh
docker-compose up --build
```

Open:

```text
http://localhost:8000
```

Docker Compose persists the SQLite database in the local `data/` directory:

```text
./data/ToDoList.db
```

Stop the app:

```sh
docker-compose down
```

## API

Base task endpoint:

```text
/api/tasks
```

Task shape:

```json
{
  "id": 1,
  "text": "Prepare release notes",
  "completed": false
}
```

Endpoints:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Returns the web app HTML. |
| `GET` | `/static/*` | Serves frontend assets from `Web/`. |
| `GET` | `/api/tasks` | Returns all tasks ordered by `id`. Empty state is `[]`. |
| `POST` | `/api/tasks` | Creates a task. |
| `PUT` | `/api/tasks/{id}` | Updates task text and completion state. |
| `PATCH` | `/api/tasks/{id}/toggle` | Toggles task completion. |
| `DELETE` | `/api/tasks/{id}` | Deletes a task. |

Create a task with curl:

```sh
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"text":"Review CI pipeline","completed":false}'
```

Toggle a task:

```sh
curl -X PATCH http://localhost:8000/api/tasks/1/toggle
```

Delete a task:

```sh
curl -X DELETE http://localhost:8000/api/tasks/1
```

## Testing And Quality

Run tests:

```sh
python3 -m pytest -q
```

Run lint:

```sh
ruff check Api
```

Compile-check backend files:

```sh
python3 -m compileall Api
```

Check frontend JavaScript syntax if Node.js is available:

```sh
node --check Web/main.js
```

## CI/CD

The GitLab pipeline contains these stages:

- `lint`
- `test`
- `build`
- `deploy`
- `notify`

Pipeline behavior:

- `lint-job` installs Ruff and checks `Api/`.
- `unit-tests` installs runtime dependencies plus Pytest and runs the test suite.
- `build-job` installs backend dependencies, copies `Api/` and `Web/` into `build/`, and runs Python compile checks.
- `deploy-job` runs on `master`, pulls the current branch on the deployment host, rebuilds Docker Compose, and starts the app.
- `notify-success` and `notify-failure` send Telegram notifications through `scripts/notify_telegram.sh`.

Deployment variables used by CI:

```text
DEPLOY_PATH=/home/vboxuser/todolist
DOCKER_COMPOSE_FILE=docker-compose.yml
```

Telegram notification variables expected in CI:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

## Current Limitations

- Not-found API cases currently return message payloads instead of HTTP `404`.
- CORS is fully open.
- There is no authentication or multi-user ownership model.
- Database migrations are not configured.
- Tests cover only model serialization and schema validation, not full API flows.

## Roadmap

Short-term:

- Return proper HTTP errors for missing tasks.
- Add API integration tests with a temporary SQLite database.
- Add a project-specific screenshot to this README.
- Replace alert-free frontend statuses with richer toast or inline error states.

Medium-term:

- Split backend code into `database`, `models`, `schemas`, and `routes` modules.
- Add Alembic migrations if the task schema grows.
- Add due dates or priority levels.
- Add frontend tests for filtering, search, and editing behavior.

Long-term:

- Add authentication and user-specific task lists.
- Add health checks for deployment.
- Add structured logging.
- Add production ASGI server configuration.

## Repository Name Recommendation

Use:

```text
focus-list
```

Why this name works:

- It matches the current product idea: a focused task list, not a generic todo demo.
- It is short and readable in URLs.
- It has a clean English repo slug while the UI can still use the Russian title `Фокус-лист`.
- It leaves room for the app to grow beyond basic todo CRUD.
