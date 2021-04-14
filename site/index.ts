import "./styles.less";
import "./Colorization";
import attachCodeLens from "./CodeLens";

import * as monaco from "monaco-editor";
import { parseTad } from "../parser/Parser";

import BOOL_TAD from "../tads/bool.tad";

let editor = monaco.editor.create(document.getElementById('editor')!, {
    value: BOOL_TAD,
    language: 'tad',
    theme: 'tad-dark',
    automaticLayout: true,
    fontFamily: 'Fira Code',
    fontSize: 20
});

editor.onDidChangeModelContent(e => {
    let value = editor.getValue();
    let tad = parseTad(value);
    console.log(tad);
});

attachCodeLens(editor);

console.log("Hello");
