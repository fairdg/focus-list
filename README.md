# FocusList

FocusList — компактная панель задач для ежедневной работы. Проект начался как простой ToDo List, а затем вырос в небольшой full-stack сервис: backend на FastAPI, хранение в SQLite, frontend на vanilla JavaScript, запуск через Docker и CI/CD через GitLab.

## Идея

Проект не пытается заменить тяжелые системы управления проектами. Его задача уже и понятнее: дать одному пользователю удобное место, где можно быстро записать задачи, видеть прогресс, фильтровать список и закрывать выполненную работу без переходов между страницами.

Текущий интерфейс построен как "фокус-панель":

- кольцо прогресса по выполненным задачам;
- счетчики всех, активных и выполненных задач;
- поиск с подсветкой совпадений;
- фильтры по статусу;
- inline-редактирование текста задачи;
- переключение выполнения в один клик;
- очистка выполненных задач.

## Возможности

- Создание задач.
- Редактирование текста задачи прямо в списке.
- Перевод задачи в выполненные и возврат в работу.
- Удаление отдельных задач.
- Очистка всех выполненных задач из интерфейса.
- Клиентский поиск по задачам.
- Фильтрация задач по статусу.
- Хранение данных в SQLite.
- Выдача frontend и API из одного FastAPI-приложения.
- Локальный запуск и запуск через Docker Compose.
- Lint, тесты, сборка, деплой и уведомления через GitLab CI.

## Архитектура

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

Архитектура намеренно оставлена простой:

- `Api/main.py` содержит FastAPI-приложение, API routes, SQLAlchemy-модель, Pydantic-схему, инициализацию базы данных и выдачу статических файлов.
- `Web/index.html` описывает структуру страницы.
- `Web/main.js` управляет состоянием на клиенте, рендерингом, фильтрами, поиском, редактированием и API-запросами.
- `Web/style.css` содержит адаптивные стили интерфейса.
- `tests/test_models.py` проверяет базовую сериализацию модели и валидацию схемы.
- `.gitlab-ci.yml` описывает lint, tests, build, deploy и notify jobs.
- `Dockerfile` и `docker-compose.yml` описывают контейнерный запуск.

## Стек технологий

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

Инфраструктура:

- Docker
- Docker Compose
- GitLab CI/CD
- Ruff
- Pytest
- Telegram-уведомления о деплое через shell script

## Требования

Для локальной разработки:

- Python 3.11 рекомендуется
- `pip`
- Docker и Docker Compose для контейнерного запуска

В CI используется образ `python:3.11-alpine`.

## Локальный запуск

Создать и активировать виртуальное окружение:

```sh
python3 -m venv .venv
source .venv/bin/activate
```

Установить runtime и dev-зависимости:

```sh
python3 -m pip install -r Api/requirements.txt pytest ruff
```

Запустить приложение:

```sh
uvicorn Api.main:app --reload --host 0.0.0.0 --port 8000
```

Открыть в браузере:

```text
http://localhost:8000
```

По умолчанию локальная SQLite-база создается здесь:

```text
Api/ToDoList.db
```

Путь к базе можно переопределить через `DB_PATH`:

```sh
DB_PATH=/tmp/focus-list.db uvicorn Api.main:app --reload --host 0.0.0.0 --port 8000
```

## Запуск через Docker

Собрать и запустить приложение:

```sh
docker-compose up --build
```

Открыть:

```text
http://localhost:8000
```

Docker Compose сохраняет SQLite-базу в локальной директории `data/`:

```text
./data/ToDoList.db
```

Остановить приложение:

```sh
docker-compose down
```

Endpoints:

| Method | Path | Описание |
| --- | --- | --- |
| `GET` | `/` | Возвращает HTML приложения. |
| `GET` | `/static/*` | Отдает frontend-файлы из `Web/`. |
| `GET` | `/api/tasks` | Возвращает все задачи, отсортированные по `id`. Пустой список — `[]`. |
| `POST` | `/api/tasks` | Создает задачу. |
| `PUT` | `/api/tasks/{id}` | Обновляет текст и статус задачи. |
| `PATCH` | `/api/tasks/{id}/toggle` | Переключает статус выполнения. |
| `DELETE` | `/api/tasks/{id}` | Удаляет задачу. |


## Тесты и качество

Запустить тесты:

```sh
python3 -m pytest -q
```

Запустить lint:

```sh
ruff check Api
```

Проверить компиляцию backend-файлов:

```sh
python3 -m compileall Api
```
## CI/CD

GitLab pipeline состоит из этапов:

- `lint`
- `test`
- `build`
- `deploy`
- `notify`

Что делает pipeline:

- `lint-job` устанавливает Ruff и проверяет `Api/`.
- `unit-tests` устанавливает runtime-зависимости, Pytest и запускает тесты.
- `build-job` устанавливает backend-зависимости, копирует `Api/` и `Web/` в `build/`, затем запускает compile-check Python-файлов.
- `deploy-job` запускается на `master`, подтягивает текущую ветку на сервере, пересобирает Docker Compose и поднимает приложение.
- `notify-success` и `notify-failure` отправляют Telegram-уведомления через `scripts/notify_telegram.sh`.

Переменные деплоя в CI:

```text
DEPLOY_PATH=/home/vboxuser/todolist
DOCKER_COMPOSE_FILE=docker-compose.yml
```

## Roadmap

Ближайшие улучшения:

- Возвращать корректные HTTP-ошибки для отсутствующих задач.
- Добавить API integration tests с временной SQLite-базой.
- Добавить screenshot интерфейса в README.
- Улучшить inline-статусы ошибок и успешных действий.

Среднесрочно:

- Разделить backend на модули `database`, `models`, `schemas` и `routes`.
- Добавить Alembic migrations, если схема задач будет расширяться.
- Добавить сроки выполнения или приоритеты.
- Добавить frontend-тесты для фильтров, поиска и редактирования.
