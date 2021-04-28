import * as monaco from "monaco-editor";

// TODO: ver que onda, implementar

/*
monaco.languages.registerHoverProvider('tad', {
	provideHover: function (model, position) {
        console.log("Hover", model.getWordAtPosition(position));

        return {
            range: new monaco.Range(1, 1, model.getLineCount(), model.getLineMaxColumn(model.getLineCount())),
            contents: [
                { value: '**SOURCE**' },
                { value: '**SOURCE**' },
                { value: '**SOURCE**' },
                { value: '```html HOLA```' }
            ]
        }
	}
});

monaco.languages.registerDefinitionProvider('tad', {
    provideDefinition: (model, position, token) => {
        console.log("Def", model.getWordAtPosition(position));

        return {
            uri: monaco.Uri.parse('http://a/different/file.txt'),
            range: {
                startLineNumber: 3,
                startColumn: 9,
                endLineNumber: 3,
                endColumn: 20
            }
        }
    }
});
*/
