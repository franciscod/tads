import * as monaco from "monaco-editor";
import { Marker } from "../../parser/Reporting";

import { Editor } from "./Editor";
import { LineInfo } from "./Worker";

export interface ITabOptions {
    title: string;
    content: string;
    readOnly: boolean;
    saveInStorage: boolean;
};

export interface ITextModelData {
    tab?: Tab;
}

export class Tab {
    public tabElement: HTMLElement;
    public model: monaco.editor.ITextModel & ITextModelData;
    public viewState: monaco.editor.ICodeEditorViewState | null;
    public source: string;
    public lenses: monaco.languages.CodeLens[] = [];
    public linesInfo: { [line: number]: LineInfo } = { };
    public markers: Marker[] = [];
    private oldDecorations: string[] = [];

    constructor(private editor: Editor, public readonly options: ITabOptions) {
        this.source = options.content;
        this.model = monaco.editor.createModel(this.source, "tad");
        this.model.onDidChangeContent(() => { this.save(); this.editor.revalidate(); });
        this.model.tab = this;
        this.viewState = null;

        this.tabElement = document.createElement("div");
        this.tabElement.innerText = options.title;
        this.tabElement.classList.add("tab");
        this.tabElement.onclick = this.open.bind(this);
        document.querySelector(".tabs")?.append(this.tabElement);

        // ver local storage
        if(options.saveInStorage) {
            const content = localStorage.getItem("tab-content-" + options.title);
            if(content !== null)
                this.model.setValue(content);
        }
        if(options.title === localStorage.getItem("tab-open")) {
            this.open();
        }
    }

    save(): void {
        this.source = this.model.getValue().replace(/\r\n/g, "\n");
        if(this.options.saveInStorage)
            localStorage.setItem("tab-content-" + this.options.title, this.source);
        this.viewState = this.editor.monacoEditor.saveViewState();
        // TODO: deberíamos guardar el view state de cada tab en el local storage
        //       cuando lo intenté no se aplicaba el view state :/
    }

    open(): void {
        if(this.editor.activeTab)
            this.editor.activeTab.save();
        
        document.querySelectorAll(".tab").forEach(e => e.classList.remove("open"));
        this.tabElement.classList.add("open");
        
        localStorage.setItem("tab-open", this.options.title);

        this.editor.monacoEditor.setModel(this.model);
        this.editor.monacoEditor.focus();
        if (this.viewState)
            this.editor.monacoEditor.restoreViewState(this.viewState);
        this.editor.monacoEditor.updateOptions({ readOnly: this.options.readOnly });
        
        this.editor.activeTab = this;
    }

    updateInfo(): void {
        const decos: monaco.editor.IModelDeltaDecoration[] = [];
        this.lenses = [];
        for(const line in this.linesInfo) {
            const lineInfo = this.linesInfo[line];

            let className = "";
            let hoverMsg = "";

            switch(lineInfo.glyphDecoration) {
                case 'loading':
                    className = "glyph-margin-loading";
                    hoverMsg = "Esperando a ser evaluado";
                    break;
                case 'parse-fail':
                    className = "glyph-margin-parse-fail";
                    hoverMsg = "La expresión no se pudo parsear";
                    break;
                case 'eval-success':
                    className = "glyph-margin-eval-success";
                    hoverMsg = "La expresión evaluó correctamente";
                    break;
                case 'eval-fail':
                    className = "glyph-margin-eval-fail";
                    hoverMsg = "La expresión no se pudo evaluar";
                    break;
                case 'assert-success':
                    className = "glyph-margin-assert-check";
                    hoverMsg = "La expresión evaluó a **true**";
                    break;
                case 'assert-fail':
                    className = "glyph-margin-assert-times";
                    hoverMsg = "Se esperaba que la expresión evaluara a **true**";
                    break;
            }

            const lineRange = {
                startLineNumber: +line,
                endLineNumber: +line,
                startColumn: 1,
                endColumn: 1
            };

            decos.push({
                range: lineRange,
                options: {
                    stickiness: 3,
                    isWholeLine: true,
                    glyphMarginClassName: className,
                    glyphMarginHoverMessage: { value: hoverMsg },
                },
            });
            
            for(const lens of lineInfo.lens) {
                this.lenses.push({
                    range: lineRange,
                    command: {
                        id: "TODO",
                        title: lens.title,
                        arguments: [lens.meta]
                    }
                });
            }
        }
        
        this.oldDecorations = this.model.deltaDecorations(this.oldDecorations, decos);
    }

    updateMarkers(): void {
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
        
        monaco.editor.setModelMarkers(this.model, "tad", this.markers.map(m => ({
            severity: toMonacoSeverity(m),
            startLineNumber: m.range.startLine,
            startColumn: m.range.columnStart,
            endLineNumber: m.range.endLine,
            endColumn: m.range.columnEnd,
            message: m.message
        })));
    }
}



