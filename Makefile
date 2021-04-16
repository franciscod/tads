test:
	NO_COLOR=1 npm run test

testloop:
	NO_COLOR=1 ls parser/* tests/* | entr -c make test


todo:
	rg "TODO" tests parser

dev:
	npm run dev

.PHONY: test testloop todo dev
