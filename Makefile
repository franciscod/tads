test:
	NO_COLOR=1 deno test --allow-read tests/

testloop:
	ls parser/* tests/* | entr -c make test

todo:
	rg "TODO" tests parser

.PHONY: test testloop todo
