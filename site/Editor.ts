import "./Colorization";
import attachCodeLens from "./CodeLens";

import * as monaco from "monaco-editor";

import { basicos, demo } from "../tads";

let editor = monaco.editor.create(document.getElementById('editor')!, {
    theme: 'tad-dark',
    automaticLayout: true,
    fontFamily: 'Fira Code',
    fontLigatures: true,    
    fontSize: 20,
    tabSize: 4,
    glyphMargin: true,
    model: null
});

attachCodeLens(editor);

let activeTab: Tab | null = null;

type TabOptions = {
    title: string;
    content: string;
    readOnly: boolean;
}

class Tab {
    private readOnly: boolean;
    private model: monaco.editor.ITextModel;
    private viewState: monaco.editor.ICodeEditorViewState | null;

    private tabElement: HTMLElement;

    constructor(options: TabOptions) {
        this.readOnly = options.readOnly;
        this.model = monaco.editor.createModel(options.content, 'tad');
        this.viewState = null;

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

        if(activeTab)
            activeTab.save();
        if(this.viewState)
            editor.restoreViewState(this.viewState);
        editor.setModel(this.model);
        editor.updateOptions({ readOnly: this.readOnly });
    
        activeTab = this;
    }

};

let tabs: Tab[] = [
    new Tab({
        title: '⚛️ TADs básicos 🔒',
        content: basicos.join(`\n\n${('-'.repeat(100)+'\n').repeat(5)}\n\n`),
        readOnly: true
    }),
    new Tab({
        title: '🧪 Ejercicio',
        content: demo,
        readOnly: false
    })
];

tabs[1].switchTo();