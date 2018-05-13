.PHONY: all test clean

build:
	npm run build

publish:
	./publish.sh

clean:
	rm -rf dist

test:
	npm run lint
	npm run test

release: clean test build publish
