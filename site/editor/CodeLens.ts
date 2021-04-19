import * as monaco from "monaco-editor";
import generateDebugView from "../views/DebugView";
import { openModal } from "../views/Modal";
import { TAD } from "../../parser/Types";
import { parseSource } from "../../parser/Parser";
import { ITextModelData } from "./Editor";


export default (editor: monaco.editor.IStandaloneCodeEditor) => {
    const debugCommandId = editor.addCommand(0, (_, tad: TAD) => {
        openModal(generateDebugView(tad), 750);
    }, "");
    const testCommandId = editor.addCommand(
        0,
        function () {
            alert("TODO: show test");
        },
        ""
    );

    monaco.languages.registerCodeLensProvider("tad", {
        provideCodeLenses: function (model: monaco.editor.ITextModel & ITextModelData) {
            const lenses: monaco.languages.CodeLens[] = [];

            if(model.tab) {
                for(const tad of model.tab.activeTADs) {
                    if(!tad.range) continue;

                    const tadRange = {
                        startLineNumber: tad.range.startLine,
                        startColumn: 1,
                        endLineNumber: tad.range.endLine,
                        endColumn: 1,
                    };
                    lenses.push({
                        range: tadRange,
                        id: "debug-" + tad.nombre,
                        command: {
                            id: debugCommandId!,
                            title: "🐞 Debug " + tad.nombre,
                            arguments: [tad],
                        },
                    });
                }
            }

            return {
                lenses: lenses,
                dispose: () => {},
            };
        },
        resolveCodeLens: (_, codeLens) => codeLens,
    });
};
