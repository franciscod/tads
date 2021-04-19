import "./Colorization";
import "./Suggestions";
import attachCodeLens from "./CodeLens";

import * as monaco from "monaco-editor";

import { basicos, demo } from "../../tads";
import { Marker, EditorHints, parseSource } from "../../parser/Parser";
import { Range, TAD } from "../../parser/Types";

export interface ITextModelData {
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

attachCodeLens(editor);

let activeTab: Tab | null = null;

type TabOptions = {
    title: string;
    content: string;
    readOnly: boolean;
};

class Tab {
    private readOnly: boolean;
    private model: monaco.editor.ITextModel & ITextModelData;
    private viewState: monaco.editor.ICodeEditorViewState | null;
    private decorations: string[];
    private tads: TAD[];

    private tabElement: HTMLElement;

    constructor(options: TabOptions) {
        this.readOnly = options.readOnly;
        this.model = monaco.editor.createModel(options.content, "tad");
        this.model.onDidChangeContent(this.onValueChange.bind(this));
        this.model.tab = this;
        this.viewState = null;
        this.decorations = [];
        this.tads = [];
        this.validate();

        this.tabElement = document.createElement("div");
        this.tabElement.innerText = options.title;
        this.tabElement.classList.add("tab");
        this.tabElement.onclick = this.switchTo.bind(this);
        document.querySelector(".tabs")?.append(this.tabElement);
    }

    save() {
        this.viewState = editor.saveViewState();
    }

    switchTo() {
        document.querySelectorAll(".tab").forEach(e => e.classList.remove("open"));
        this.tabElement.classList.add("open");

        if (activeTab) activeTab.save();
        editor.setModel(this.model);
        if (this.viewState) editor.restoreViewState(this.viewState);
        editor.updateOptions({ readOnly: this.readOnly });
        editor.focus();

        activeTab = this;
    }

    onValueChange() {
        localStorage.setItem("store", this.model.getValue());
        this.validate();
    }

    validate() {
        const hints = new EditorHints();
        this.tads = parseSource(this.model.getValue(), hints);

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
        }

        this.decorations = this.model.deltaDecorations(this.decorations, deltaDecorations);
    }

    public get activeTADs(): TAD[] {
        return this.tads;
    }
}

const tabs: Tab[] = [
    new Tab({
        title: "⚛️ TADs básicos 🔒",
        content: basicos.join(`\n\n${("-".repeat(100) + "\n").repeat(5)}\n\n`),
        readOnly: true,
    }),
    new Tab({
        title: "🧪 Ejercicio",
        content: localStorage.getItem("store") || demo,
        readOnly: false,
    }),
];

tabs[1].switchTo();
