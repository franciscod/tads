import * as monaco from "monaco-editor";

monaco.languages.setMonarchTokensProvider("tad", {
    ignoreCase: true,
    tokenizer: {
        root: [
            [/^(TAD|FIN TAD)/, "tad-definicion"],
            [
                /^(\s*)(?:g[ée]neros|usa|importa|exporta|par[aá]metros formales|igualdad observacional|igobs|ig obs|observadores b[áa]sicos|obs|generadores|gen|otras operaciones|otras op|otrasop|axiomas)/,
                "tad-keyword",
            ],
            [/--.*/, "tad-comment"],
            [/(•|×)/, "tad-dot"],
            [/(≡|:|→)/, "tad-separators"],
            [/(∀|∃)/, "tad-quantifiers"],
            [/(if|then|else|fi)/, "tad-if"],
        ],
    },
});

monaco.editor.defineTheme("tad-dark", {
    base: "vs-dark",
    inherit: true,
    colors: {},
    rules: [
        { token: "tad-definicion", fontStyle: "bold" },
        { token: "tad-keyword", foreground: "9e86ff" },
        { token: "tad-comment", foreground: "4bb05c" },
        { token: "tad-dot", foreground: "00a1ff" },
        { token: "tad-separators", foreground: "add4ff" },
        { token: "tad-quantifiers", foreground: "e5ff28" },
        { token: "tad-if", fontStyle: "bold" },
    ],
});
