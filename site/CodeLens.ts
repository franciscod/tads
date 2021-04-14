import * as monaco from "monaco-editor";

var i = 0;

export default (editor: monaco.editor.IStandaloneCodeEditor) => {

    var astCommandId = editor.addCommand(0, function () {
        alert('TODO: show tree');
    }, '');

    monaco.languages.registerCodeLensProvider('tad', {
        provideCodeLenses: function (model, token) {
            let value = model.getValue();
            let tads = value.split('\n')
                            .map((s, i): [string, number] => [s.trim(), i])
                            .filter(s => s[0].toUpperCase().startsWith("TAD "))
                            .map(([n, l]): [string, number] => [n.slice(4).trim(), l + 1]);

            return {
                lenses: tads.map(([name, line]) => {
                    return {
                        range: {
                            startLineNumber: line,
                            startColumn: 1,
                            endLineNumber: line,
                            endColumn: 1
                        },
                        id: "ast-" + name,
                        command: {
                            id: astCommandId!,
                            title: "🌲 Ver AST de " + name
                        }
                    }
                }),
                dispose: () => {}
            };
        },
        resolveCodeLens: function (model, codeLens, token) {
            return codeLens;
        }
    });
    
};
