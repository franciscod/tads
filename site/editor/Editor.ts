import "./Colorization";
import "./Suggestions";

import * as monaco from "monaco-editor";

import { basicos, demo } from "../../tads";
import { Marker, EditorHints, parseSource } from "../../parser/Parser";
import { Eval, Operacion, TAD } from "../../parser/Types";
import { auxAxiomasAST, evalAxiomas } from "../../parser/Eval";
import { genGrammar, getAST } from "../../parser/Ohmification";
import ohm from "ohm-js";
import generateDebugView from "../views/DebugView";
import { openModal } from "../views/Modal";

interface ITextModelData {
    tab?: Tab;
}

const editor = monaco.editor.create(document.getElementById("editor")!, {
    theme: "tad-dark",
    automaticLayout: true,
    fontFamily: "Fira Code",
    fontLigatures: true,
    fontSize: 20,
    tabSize: 4,
    glyphMargin: true,
    model: null,
});

const debugCommandId = editor.addCommand(0, (_, tad: TAD) => {
    openModal(generateDebugView(tad), 750);
}, "");

monaco.languages.registerCodeLensProvider("tad", {
    provideCodeLenses: (model: monaco.editor.ITextModel & ITextModelData) => {
        return {
            lenses: model.tab?.activeLenses || [],
            dispose: () => {},
        };
    },
    resolveCodeLens: (_, codeLens) => codeLens,
});

let activeTab: Tab | null = null;

type TabOptions = {
    title: string;
    content: string;
    readOnly: boolean;
    usarBasicos: boolean;
};

class Tab {
    private _options: TabOptions;
    private model: monaco.editor.ITextModel & ITextModelData;
    private viewState: monaco.editor.ICodeEditorViewState | null;
    private decorations: string[];
    private lenses: monaco.languages.CodeLens[];
    private tads: TAD[];
    private evals: Eval[];

    private tabElement: HTMLElement;

    constructor(options: TabOptions) {
        this._options = options;
        this.model = monaco.editor.createModel(options.content, "tad");
        this.model.onDidChangeContent(this.onValueChange.bind(this));
        this.model.tab = this;
        this.viewState = null;
        this.decorations = [];
        this.lenses = [];
        this.tads = [];
        this.evals = [];
        this.validate();

        this.tabElement = document.createElement("div");
        this.tabElement.innerText = options.title;
        this.tabElement.classList.add("tab");
        this.tabElement.onclick = this.switchTo.bind(this);
        document.querySelector(".tabs")?.append(this.tabElement);
    }

    switchTo() {
        document.querySelectorAll(".tab").forEach(e => e.classList.remove("open"));
        this.tabElement.classList.add("open");

        if (activeTab) this.viewState = editor.saveViewState();
        editor.setModel(this.model);
        if (this.viewState) editor.restoreViewState(this.viewState);
        editor.updateOptions({ readOnly: this._options.readOnly });
        editor.focus();
        localStorage.setItem("tab", this._options.title);

        activeTab = this;
    }

    onValueChange() {
        localStorage.setItem("store", this.model.getValue());
        this.validate();
    }

    validate() {
        const hints = new EditorHints();
        [this.tads, this.evals] = parseSource(this.model.getValue() + '\n\n\n' + (this._options.usarBasicos ? basicos.join('\n') : ''), hints);

        const ops = this.tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);
        const [generated, unaries] = genGrammar("Universe", ops, new Map());
        const grammar = ohm.grammar(generated);
        const axiomas = auxAxiomasAST(this.tads);

        console.log(this.tads, this.evals);
        
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

        monaco.editor.setModelMarkers(
            this.model,
            "tad",
            hints.markers.map(m => ({
                severity: toMonacoSeverity(m),
                startLineNumber: m.range.startLine,
                startColumn: m.range.columnStart,
                endLineNumber: m.range.endLine,
                endColumn: m.range.columnEnd,
                message: m.message,
            }))
        );

        const deltaDecorations: monaco.editor.IModelDeltaDecoration[] = [];
        this.lenses = [];

        for(const tad of this.tads) {
            for(const axioma of tad.axiomas) {
                if(!axioma.range) continue;

                deltaDecorations.push({
                    range: {
                        startLineNumber: axioma.range.startLine,
                        startColumn: 1,
                        endLineNumber: axioma.range.startLine,
                        endColumn: 1
                    },
                    options: {
                        minimap: { position: monaco.editor.MinimapPosition.Gutter, color: 'rgba(255, 255, 0, 1.0)' },
                        glyphMarginClassName: 'glyph-margin-warning',
                        glyphMarginHoverMessage: { value: 'El axioma no tipa.' }
                    }
                });
            }
            
            if(!tad.range) continue;

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
        }

        for(const _eval of this.evals) {
            if(!_eval.range) continue;

            const evalRange = {
                startLineNumber: _eval.range.startLine,
                startColumn: _eval.range.columnStart,
                endLineNumber: _eval.range.endLine,
                endColumn: _eval.range.columnEnd
            };

            let ok = false;
            const match = grammar.match(_eval.expr);
            if(match.succeeded()) {
                const exprAST = getAST(match, unaries);
                const evaluado = evalAxiomas(exprAST, axiomas);
                ok = true;
                
                this.lenses.push({
                    range: evalRange,
                    id: "eval-" + evalRange.startLineNumber,
                    command: {
                        id: debugCommandId!,
                        title: "👀 Ver eval",
                        arguments: [],
                    },
                }, {
                    range: evalRange,
                    id: "eval-result-" + evalRange.startLineNumber,
                    command: {
                        id: "",
                        title: JSON.stringify(evaluado)
                    },
                });
            }

            deltaDecorations.push({
                range: evalRange,
                options: {
                    isWholeLine: true,
                    className: ok ? 'ok-line' : 'error-line'
                }
            });
        }

        this.decorations = this.model.deltaDecorations(this.decorations, deltaDecorations);
    }

    public get activeTADs(): TAD[] {
        return this.tads;
    }

    public get activeLenses() {
        return this.lenses;
    }

    public get options() {
        return this._options;
    }
}

const tabs: Tab[] = [
    new Tab({
        title: "⚛️ TADs básicos 🔒",
        content: basicos.join(`\n\n${("-".repeat(100) + "\n").repeat(5)}\n\n`),
        readOnly: true,
        usarBasicos: false
    }),
    new Tab({
        title: "🧪 Ejercicio",
        content: localStorage.getItem("store") || demo,
        readOnly: false,
        usarBasicos: true
    }),
];

(tabs.find(t => t.options.title === localStorage.getItem("tab")) || tabs[1]).switchTo();


function updateViewState() {
    console.log("SAVED");
    localStorage.setItem("view_state", JSON.stringify(editor.saveViewState()));
}

// no se cuales hookear
editor.onDidScrollChange(updateViewState);
editor.onDidLayoutChange(updateViewState);


setTimeout(() => {
    const viewState = localStorage.getItem("view_state") as monaco.editor.ICodeEditorViewState | null;
    console.log("viewState", viewState);

    if(viewState) editor.restoreViewState(viewState);
}, 1000);

