test:
	NO_COLOR=1 npm run test

testloop:
	NO_COLOR=1 ls parser/* tests/* | entr -c npm run test

todo:
	rg "TODO" tests parser

dev run:
	npm run dev

format:
	npm run format

lint:
	npm run lint

.PHONY: test testloop todo dev run format lint
