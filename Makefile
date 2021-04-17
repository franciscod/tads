test:
	NO_COLOR=1 deno test --unstable --fail-fast --allow-read tests/

testloop:
	NO_COLOR=1 ls parser/* tests/* | entr -c make test


todo:
	rg "TODO" tests parser

dev:
	npm run dev

lint:
	npx eslint . --ext .js,.jsx,.ts,.tsx --fix

format:
	npx prettier --write .

.PHONY: test testloop todo dev lint format
