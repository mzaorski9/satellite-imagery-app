## Satellite App ##

How to start:

1. Copy env example:
`cp backend/.env.example backend/.env`
    -> set ENV variables

2. Start DB and Redis:
`docker compose up -d db redis`

3. Build and start the rest:
`docker compose up --build web worker frontend`

4. Apply Django migrations:
`docker compose exec web python manage.py makemigrations accounts`
`docker compose exec web python manage.py migrate`

5. (Optional) Create admin:
`docker compose exec web python manage.py createsuperuser`

6. Open app:
    - Frontend: `http://localhost:3000`
    - API: `http://localhost:8000`

7. Stop all containers:
`docker compose down`

