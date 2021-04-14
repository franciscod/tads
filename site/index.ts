import "./styles.less";

import BOOL_TAD from "../tads/bool.tad";

import * as monaco from "monaco-editor";
import { parseTad } from "../parser/Parser";

let editor = monaco.editor.create(document.getElementById('editor')!, {
    value: BOOL_TAD,
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true
});

editor.onDidChangeModelContent(e => {
    let value = editor.getValue();
    let tad = parseTad(value);
    console.log(tad);
});

console.log("Hello");
