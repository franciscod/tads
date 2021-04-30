import * as monaco from "monaco-editor";

monaco.languages.register({ id: "tad" });

import "./Colorization";
import "./Suggestions";
import "./Hover";
import { Tab, ITabOptions } from "./Tab";
import { Marker } from "../../parser/Reporting";
import Worker, { Message, ProgressMessage, ReportMessage, StartMessage } from "./Worker";

setTimeout(monaco.editor.remeasureFonts, 1000);

export class Editor {
    public monacoEditor: monaco.editor.IStandaloneCodeEditor;
    public activeTab: Tab | null = null;
    private worker: Worker;
    private tabs: Tab[] = [];

    constructor(editorElement: HTMLElement, tabs: ITabOptions[]) {
        this.worker = new Worker('/worker.js');
        // this.worker.onerror = (ev) => alert(`No se pudo cargar el WebWorker:\n\n${ev.message}`);
        this.worker.onmessage = (ev) => this.onMessage(ev.data as Message);
        
        this.monacoEditor = monaco.editor.create(editorElement, {
            theme: "tad-dark",
            automaticLayout: true,
            fontFamily: "Fira Code",
            fontLigatures: true,
            fontSize: 20,
            tabSize: 4,
            glyphMargin: true,
            model: null,
            renderValidationDecorations: 'on'
        });
        
        this.tabs = tabs.map(opts => new Tab(this, opts));

        // si ningún tab se abrió
        if(this.monacoEditor.getModel() === null)
            this.tabs[this.tabs.length - 1].open();
        
        this.revalidate();
    }

    revalidate() {
        let startMessage: StartMessage = {
            type: 'start',
            inputs: []
        };
        for(const i in this.tabs) {
            startMessage.inputs.push({
                source: this.tabs[i].source,
                document: parseInt(i)
            });
        }
        
        this.worker.postMessage(startMessage, undefined!);
    }
    
    onMessage(data: Message) {
        if(data.type === 'progress') {
            this.renderProgress(data);
        } else if(data.type === 'report') {
            this.updateReport(data);
        }
    }

    renderProgress(progress: ProgressMessage) {
        const elem = document.getElementById(`progress-${progress.step.toLowerCase()}`);
        if(elem) {
            elem.title = `${progress.current}/${progress.total}`;
            elem.classList.remove("processing");
            elem.classList.remove("success");
            if(progress.current === 0) {
                // en espera
                elem.innerText = progress.step;
            } else if(progress.current === progress.total) {
                // finalizado
                elem.innerText = `${progress.step} (${progress.elapsed.toFixed(2)}ms)`;
                elem.classList.add("success");
            } else {
                // actualmente procesando
                elem.classList.add("processing");
                elem.innerText = `${progress.step} (${progress.current}/${progress.total})`;
            }
        }
    }

    updateReport(report: ReportMessage) {
        const toMonacoSeverity = (marker: Marker): monaco.MarkerSeverity => {
            switch (marker.severity) {
                case "error":
                    return monaco.MarkerSeverity.Error;
                case "warning":
                    return monaco.MarkerSeverity.Warning;
                case "hint":
                    return monaco.MarkerSeverity.Hint;
                case "info":
                    return monaco.MarkerSeverity.Info;
            }
        };
        
        for(const i in this.tabs) {
            monaco.editor.setModelMarkers(
                this.tabs[i].model,
                "tad",
                report.markers
                    .filter(m => (m.range.document as unknown as string) == i)
                    .map(m => ({
                    severity: toMonacoSeverity(m),
                    startLineNumber: m.range.startLine,
                    startColumn: m.range.columnStart,
                    endLineNumber: m.range.endLine,
                    endColumn: m.range.columnEnd,
                    message: m.message,
                }))
            );
        }

    }
}

/*
interface ITextModelData {
    tab?: Tab;
}


const debugCommandId = editor.addCommand(
    0,
    (_, tad: TAD) => {
        openModal(generateDebugView(tad), 750);
    },
    ""
);
const evalCommandId = editor.addCommand(
    0,
    (_, expr: Expr, grammar: Grammar) => {
        openModal(generateEvalDebug(expr, grammar), 750);
    },
    ""
);

monaco.languages.registerCodeLensProvider("tad", {
    provideCodeLenses: (model: monaco.editor.ITextModel & ITextModelData) => {
        return {
            lenses: model.tab?.activeLenses || [],
            dispose: () => {},
        };
    },
    resolveCodeLens: (_, codeLens) => codeLens,
});

const tabs: Tab[] = ;

*/

    /*
    private decorations: string[];
    private lenses: monaco.languages.CodeLens[];
    private tads: TAD[];
    private evals: Eval[];

    validate() {

        const deltaDecorations: monaco.editor.IModelDeltaDecoration[] = [];
        this.lenses = [];

        for (const tad of this.tads) {
            for (const rawAxioma of tad.rawAxiomas) {
                /*
                if (!axioma.range || axioma.range.startLine > numLines) continue;

                deltaDecorations.push({
                    range: {
                        startLineNumber: axioma.range.startLine,
                        startColumn: 1,
                        endLineNumber: axioma.range.startLine,
                        endColumn: 1,
                    },
                    options: {
                        minimap: { position: monaco.editor.MinimapPosition.Gutter, color: "rgba(255, 255, 0, 1.0)" },
                        glyphMarginClassName: "glyph-margin-warning",
                        glyphMarginHoverMessage: { value: "El axioma no tipa." },
                    },
                });
                * /
            }

            /*
            if (!tad.range) continue;

            const tadRange = {
                startLineNumber: tad.range.startLine,
                startColumn: 1,
                endLineNumber: tad.range.endLine,
                endColumn: 1,
            };
            this.lenses.push({
                range: tadRange,
                id: "debug-" + tad.nombre,
                command: {
                    id: debugCommandId!,
                    title: "🐞 Debug " + tad.nombre,
                    arguments: [tad],
                },
            });
            * /
        }

        for (const _eval of this.evals) {
            /*
            if (!_eval.range) continue;

            const evalRange = {
                startLineNumber: _eval.range.startLine,
                startColumn: _eval.range.columnStart,
                endLineNumber: _eval.range.endLine,
                endColumn: _eval.range.columnEnd,
            };
            * /

            let ok = false;
            const expr = parseToExpr(_eval.expr, {}, grammar);
            if (expr) {
                const evaluado = evalGrammar(expr, grammar);
                ok = true;

                // console.log(expr, evaluado);

                /*
                this.lenses.push(
                    {
                        range: evalRange,
                        id: "eval-" + evalRange.startLineNumber,
                        command: {
                            id: evalCommandId!,
                            title: "👀 Ver eval",
                            arguments: [expr, grammar],
                        },
                    },
                    {
                        range: evalRange,
                        id: "eval-result-" + evalRange.startLineNumber,
                        command: {
                            id: "",
                            title: fromExpr(evaluado, grammar),
                        },
                    }
                );
                * /
            }

            /*
            deltaDecorations.push({
                range: evalRange,
                options: {
                    isWholeLine: true,
                    className: ok ? "ok-line" : "error-line",
                },
            });
            * /
        }

        this.decorations = this.model.deltaDecorations(this.decorations, deltaDecorations);
    }

}
*/