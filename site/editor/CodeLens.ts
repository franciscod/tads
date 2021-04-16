import * as monaco from "monaco-editor";
import { Parser } from "../../parser/Parser";
import { openModal } from "../views/Modal";
import generateDebugView from "../views/DebugView";

export default (editor: monaco.editor.IStandaloneCodeEditor) => {

    var debugCommandId = editor.addCommand(0, () => {
        // TODO: ver que tad hay que mostrar y usar una version ya parseada, esto es solo para testing
        // openModal(generateDebugView(new Parser().parse(editor.getValue())).database, 750);
    }, '');
    var testCommandId = editor.addCommand(0, function () {
        alert('TODO: show test');
    }, '');
    
    /*var decorations = editor.deltaDecorations([], [
        {
            range: new monaco.Range(6,1,5,1),
            options: {
                isWholeLine: true,
                className: 'myContentClass',
                glyphMarginClassName: 'myGlyphMarginClass',
                glyphMarginHoverMessage: { value: 'pepe' }
            }
        }
    ]);*/
    
    monaco.languages.registerCodeLensProvider('tad', {
        provideCodeLenses: function (model, token) {
            let value = model.getValue();
            let tads = value.split('\n')
                            .map((s, i): [string, number] => [s.trim(), i])
                            .filter(s => s[0].toUpperCase().startsWith("TAD "))
                            .map(([n, l]): [string, number] => [n.slice(4).trim(), l + 1]);

            return {
                lenses: [
                    ...tads.map(([name, line]) => {
                        return {
                            range: {
                                startLineNumber: line,
                                startColumn: 1,
                                endLineNumber: line,
                                endColumn: 1
                            },
                            id: "debug-" + name,
                            command: {
                                id: debugCommandId!,
                                title: "🐞 Debug " + name
                            }
                        }
                    }),
                    ...tads.map(([name, line]) => {
                        return {
                            range: {
                                startLineNumber: line,
                                startColumn: 1,
                                endLineNumber: line,
                                endColumn: 1
                            },
                            id: "test-" + name,
                            command: {
                                id: testCommandId!,
                                title: "Test " + name
                            }
                        }
                    })
                ],
                dispose: () => {}
            };
        },
        resolveCodeLens: function (model, codeLens, token) {
            return codeLens;
        }
    });
    
};
