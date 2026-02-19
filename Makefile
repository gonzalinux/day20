.PHONY: dev dev-db dev-api dev-ui prod prod-down

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

prod-down:
	docker compose down
