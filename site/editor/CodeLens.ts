import * as monaco from "monaco-editor";
import { openModal } from "../views/Modal";
import generateDebugView from "../views/DebugView";
import { parseSource } from "../../parser/Parser";

export default (editor: monaco.editor.IStandaloneCodeEditor) => {
    const debugCommandId = editor.addCommand(
        0,
        (_, tadName: string) => {
            openModal(
                generateDebugView(
                    parseSource(editor.getValue()).find(
                        (tad) => tad.nombre === tadName
                    )!
                ),
                750
            );
        },
        ""
    );
    const testCommandId = editor.addCommand(
        0,
        function () {
            alert("TODO: show test");
        },
        ""
    );

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

    monaco.languages.registerCodeLensProvider("tad", {
        provideCodeLenses: function (model, token) {
            const value = model.getValue();
            const tads = value
                .split("\n")
                .map((s, i): [string, number] => [s.trim(), i])
                .filter((s) => s[0].toUpperCase().startsWith("TAD "))
                .map(([n, l]): [string, number] => [n.slice(4).trim(), l + 1]);

            return {
                lenses: [
                    ...tads.map(([name, line]) => {
                        return {
                            range: {
                                startLineNumber: line,
                                startColumn: 1,
                                endLineNumber: line,
                                endColumn: 1,
                            },
                            id: "debug-" + name,
                            command: {
                                id: debugCommandId!,
                                title: "🐞 Debug " + name,
                                arguments: [name],
                            },
                        };
                    }),
                    ...tads.map(([name, line]) => {
                        return {
                            range: {
                                startLineNumber: line,
                                startColumn: 1,
                                endLineNumber: line,
                                endColumn: 1,
                            },
                            id: "test-" + name,
                            command: {
                                id: testCommandId!,
                                title: "Test " + name,
                            },
                        };
                    }),
                ],
                dispose: () => {},
            };
        },
        resolveCodeLens: function (model, codeLens, token) {
            return codeLens;
        },
    });
};
