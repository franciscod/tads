import * as monaco from "monaco-editor";

import { Editor } from "./Editor";

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

    save() {
        this.source = this.model.getValue().replace(/\r\n/g, "\n");
        if(this.options.saveInStorage)
            localStorage.setItem("tab-content-" + this.options.title, this.source);
        this.viewState = this.editor.monacoEditor.saveViewState();
        // TODO: deberíamos guardar el view state de cada tab en el local storage
        //       cuando lo intenté no se aplicaba el view state :/
    }

    open() {
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
}



