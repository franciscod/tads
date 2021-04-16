test:
	NO_COLOR=1 npm run test

testloop:
	NO_COLOR=1 npm run test:watch

todo:
	rg "TODO" tests parser

dev:
	npm run dev

.PHONY: test testloop todo dev
