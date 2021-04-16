test:
	NO_COLOR=1 deno test --unstable --fail-fast --allow-read tests/

testloop:
	NO_COLOR=1 ls parser/* tests/* | entr -c make test


todo:
	rg "TODO" tests parser

dev:
	npm run dev

.PHONY: test testloop todo dev
