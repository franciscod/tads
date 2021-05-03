import "./styles.less";

import { Editor } from "./editor/Editor";
import { basicos, demo } from "../tads";

import { register, render } from "timeago.js";
import timeago_es from "timeago.js/lib/lang/es";

const _editor = new Editor(document.getElementById("editor")!, [
    {
        title: "⚛️ TADs básicos 🔒",
        content: basicos.join(`\n\n${("-".repeat(100) + "\n").repeat(5)}\n\n`),
        readOnly: true,
        saveInStorage: false
    },
    {
        title: "🧪 Playground",
        content: demo,
        readOnly: false,
        saveInStorage: true
    }
]);

// header con el tiempo del commit
register("es", timeago_es);
render(document.querySelectorAll(".moment"), "es");

// sacar el loader
const loaderContainer = document.getElementsByClassName("loader-container")[0];
loaderContainer.classList.add("closed");
setTimeout(() => loaderContainer.remove(), 2000);
