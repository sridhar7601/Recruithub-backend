.PHONY: run-core-api

run-core-api-dev:
	yarn nx run hub-core-api:serve --configuration=development
