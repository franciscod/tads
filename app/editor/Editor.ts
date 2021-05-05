import * as monaco from "monaco-editor";

monaco.languages.register({ id: "tad" });

import "./Colorization";
import "./Suggestions";
import "./Hover";

import { Tab, ITabOptions, ITextModelData } from "./Tab";
import Worker, { AssertsUpdateMessage, Message, ProgressMessage, StartMessage } from "./Worker";

export class Editor {
    public monacoEditor: monaco.editor.IStandaloneCodeEditor;
    public activeTab: Tab | null = null;
    private worker: Worker;
    private tabs: Tab[] = [];
    private anyCommandId: string;

    constructor(editorElement: HTMLElement, tabs: ITabOptions[]) {
        this.worker = new Worker();
        this.worker.onerror = ev => alert(`No se pudo cargar el WebWorker:\n\n${ev.message}`);
        this.worker.onmessage = ev => this.onMessages(ev.data as Message[]);

        this.monacoEditor = monaco.editor.create(editorElement, {
            theme: "tad-dark",
            automaticLayout: true,
            fontFamily: "Fira Code",
            fontLigatures: true,
            fontSize: 20,
            tabSize: 4,
            glyphMargin: true,
            model: null,
            renderValidationDecorations: "on"
        });
        this.monacoEditor.onDidChangeCursorPosition((ev) => {
            // solo actualizar si la linea cambió efectivamente
            if(this.activeTab && this.activeTab.lastPositionLine !== ev.position.lineNumber) {
                this.activeTab.updateDetails(ev.position.lineNumber);
            }
        });
        this.anyCommandId = this.monacoEditor.addCommand(
            0,
            (_, data: any) => {
                this.worker.postMessage(
                    {
                        type: "command",
                        data
                    },
                    undefined!
                );
            },
            ""
        )!;

        this.tabs = tabs.map(opts => new Tab(this, opts));

        // abrimos el último tab si inició sin tabs abiertos
        if (this.monacoEditor.getModel() === null) this.tabs[this.tabs.length - 1].open();

        // forzamos revalidación inicial
        this.revalidate();
    }

    revalidate() {
        const startMessage: StartMessage = {
            type: "start",
            inputs: []
        };
        for (const i in this.tabs) {
            startMessage.inputs.push({
                source: this.tabs[i].source,
                document: parseInt(i)
            });
        }

        this.worker.postMessage(startMessage, undefined!);
    }

    onMessages(messages: Message[]) {
        let updateInfo = false;
        let updateMarkers = false;
        let forceRender = false;
        let updateDetails = false;

        // actualizamos los datos necesarios
        for (const msg of messages) {
            if (msg.type === "progress") {
                this.renderProgress(msg);
            } else if(msg.type === "asserts") {
                this.renderAsserts(msg);
            } else if (msg.type === "clear-lines") {
                for (const tab of this.tabs) {
                    tab.linesInfo = {};
                }
                updateInfo = true;
                forceRender = true;
            } else if (msg.type === "line") {
                const tab = this.tabs[msg.document];
                // forzamos un render si había o hay un lens
                forceRender = forceRender ||
                    (msg.line in tab.linesInfo && tab.linesInfo[msg.line].lens.length > 0) || msg.info.lens.length > 0;
                // forzamos que se actualice el detalle
                updateDetails = updateDetails || msg.line === tab.lastPositionLine;
                updateInfo = true;
                tab.linesInfo[msg.line] = msg.info;
            } else if (msg.type === "clear-markers") {
                for (const tab of this.tabs) {
                    tab.markers = [];
                }
                updateMarkers = true;
            } else if (msg.type === "markers") {
                for (const i in this.tabs) {
                    const tab = this.tabs[i];
                    tab.markers = tab.markers.concat(msg.markers.filter(m => m.range.document === +i));
                }
                updateMarkers = true;
            }
        }

        // notificamos a todos (luego de cambiar todos los datos, que es mas eficiente)
        for (const tab of this.tabs) {
            if (updateInfo) tab.updateInfo();
            if (updateMarkers) tab.updateMarkers();
        }
        if(updateDetails) {
            this.activeTab!.updateDetails(this.activeTab!.lastPositionLine);
        }
        if (forceRender) {
            this.monacoEditor.render(false);
        }
    }

    renderProgress(progress: ProgressMessage) {
        const elem = document.getElementById(`progress-${progress.step.toLowerCase()}`);
        if (elem) {
            elem.title = `${progress.current}/${progress.total}`;
            elem.classList.remove("processing");
            elem.classList.remove("success");
            if (progress.current === 0) {
                // en espera
                elem.innerText = progress.step;
            } else if (progress.current === progress.total) {
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
    
    renderAsserts(asserts: AssertsUpdateMessage) {
        const elem = document.querySelector(".asserts")!;
        elem.innerHTML = asserts.total === 0 ? `-` : `ASSERTS ✅${asserts.success}/${asserts.total} ❌${asserts.fail}/${asserts.total}`;
    }
}

// si la fuente se carga después de iniciar el editor, se rompe
// estamos un poco y le decimos a monaco que la recalcule (y con suerte ya está cargada)
setTimeout(monaco.editor.remeasureFonts, 1000);

monaco.languages.registerCodeLensProvider("tad", {
    provideCodeLenses: (model: monaco.editor.ITextModel & ITextModelData) => ({
        lenses: model.tab?.lenses || [],
        dispose: () => undefined
    }),
    resolveCodeLens: (_, codeLens) => codeLens
});
