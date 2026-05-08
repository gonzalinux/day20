.PHONY: dev dev-db dev-api dev-ui prod prod-db prod-down prod-db-down logs

dev: dev-db dev-api dev-ui

dev-db:
	MONGO_PORT=27017 docker compose up day20-db -d

dev-api:
	cd backend && bun --watch run index.ts

dev-ui:
	cd frontend &&  ENV="dev"  bun run dev --port 3500

prod:
	git pull
	docker compose up --build -d

prod-db:
	git pull
	docker compose -f docker-compose.yml -f docker-compose.db.yml up --build -d

prod-down:
	docker compose down

prod-db-down:
	docker compose -f docker-compose.yml -f docker-compose.db.yml down

logs:
	docker compose logs `docker compose config --services | grep -v day20-ui`
