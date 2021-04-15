import * as monaco from "monaco-editor";

const symbol_replacements = [
    ['lor', '∨'],
    ['land', '∧'],
    ['dot', '•'],
    ['rarrow', '→'],
    ['times', '×'],
    ['forall', '∀'],
    ['emptyset', '∅'],
    ['exists', '∃'],
    ['in', '∈'],
    ['notin', '∉'],
    ['langle', '⟨'],
    ['rangle', '⟩'],
    ['equiv', '≡'],
    ['alfa', 'α'],
    ['beta', 'β'],
    ['not', '¬']
];

monaco.languages.registerCompletionItemProvider('tad', {
	provideCompletionItems: (model, position, token) => {
        var word = model.getWordUntilPosition(position);
        var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
		var suggestions: monaco.languages.CompletionItem[] = [
            ...symbol_replacements.map(([from, to]) => ({
                label: from,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: to,
                range
            })),
            {
                label: 'ifthenelsefi',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                insertText: 'if ${1} then ${2} else ${3} fi',
                range
            }, {
                label: 'tad',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                insertText: [
                    'TAD ${1}',
                    '',
                    'géneros ${2}',
                    '',
                    'generadores',
                    '${3}',
                    '',
                    'otras operaciones',
                    '',
                    'axiomas',
                    '',
                    'FIN TAD'
                ].join('\n'),
                range
            }
        ];
		return { suggestions: suggestions };
	}
});
