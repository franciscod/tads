test:
	NO_COLOR=1 deno test --allow-read tests/

testloop:
	ls parser/* tests/* | entr -c make test

todo:
	rg "TODO" tests parser

dev:
	npm run dev

.PHONY: test testloop todo dev
