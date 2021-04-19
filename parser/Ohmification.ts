import { Genero, Operacion } from "./Types";

import ohm from "ohm-js";
import { toAST as ohm_toAST } from "ohm-js/extras";

export type AST = any;

function titleSlug(s: string): string {
    s = s.replace(/•/g, "");
    s = s.replace(/α/g, "alpha");
    s = s.replace(/¬/g, "neg");
    s = s.replace(/∨/g, "or");
    s = s.replace(/∧/g, "and");
    s = s.replace(/⇒/g, "imp");
    s = s.replace(/=/g, "eq");
    s = s.replace(/\?/g, "q");
    s = s.replace(/\+/g, "plus");
    s = s.replace(/\-/g, "minus");
    s = s.replace(/×/g, "times");
    s = s.replace(/</g, "lt");
    s = s.replace(/≤/g, "le");

    s = s.replace(/#/g, "hash");
    s = s.replace(/\|/g, "pipe");
    s = s.replace(/{/g, "lbrace");
    s = s.replace(/}/g, "rbrace");
    s = s.replace(/∅/g, "empty");
    s = s.replace(/−/g, "bigminus");
    s = s.replace(/∩/g, "cap");
    s = s.replace(/∪/g, "cup");
    s = s.replace(/⊆/g, "contains");
    s = s.replace(/∈/g, "in");

    return s[0].toUpperCase() + s.substr(1).toLowerCase();
}

export function genGrammar(
    tadName: string,
    ops: Operacion[],
    variables: Map<Genero, string[]>
): [string, string[], (ast: AST) => string] {
    const reglasParaExpr: string[] = [];
    const printMapping: { [key: string]: (ast: AST) => string } = {};
    const fromAST = (ast: AST): string => {
        return printMapping[ast.type](ast).replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
    };

    const unaryRuleNames: string[] = [];
    let rules = "";

    const varTerms: string[] = [];
    for (const g of variables.keys()) {
        (variables.get(g) || []).forEach(n => {
            const genVar = "Var" + titleSlug(g) + titleSlug(n);
            rules += `${genVar} = "${n}"\n`;
            varTerms.push(genVar);
        });
    }
    if (varTerms.length > 0) {
        rules += "Var = " + varTerms.join(" | ") + "\n";
    }

    rules += ops
        .map((op, i) => {
            const ret: string = titleSlug(op.retorno);
            const caseName = [op.tipo, op.nombre, `__${i}`].reduce((p, e) => {
                return p + titleSlug(e);
            }, "");

            // TODO: hay que poner los infijos antes que los generadores
            reglasParaExpr.unshift(caseName);

            const tokensRule = op.tokens
                .map(tok => {
                    if (tok.type == "literal") return `"${tok.symbol}"`;
                    if (tok.type == "slot") return "Expr";
                })
                .join(" ");

            if (op.tokens.filter(t => t.type == "slot").length == 1) {
                unaryRuleNames.push(caseName);
            }

            printMapping[caseName] = (ast: AST): string => {
                return op.tokens
                    .map((tok, i) => {
                        if (tok.type == "literal") return tok.symbol;
                        if (tok.type == "slot") return ` ${printMapping[ast[i].type](ast[i])} `;
                    })
                    .join("");
            };

            return `${caseName} = ${tokensRule}\n`;
        })
        .join("");

    if (varTerms.length > 0) {
        reglasParaExpr.push("Var");
    }

    let rulesHead = "";
    rulesHead += "Expr = " + reglasParaExpr.join(" | ") + " | ParenExpr\n";
    rulesHead += `ParenExpr = "(" Expr ")"\n`;

    const grammarSource = `TAD${tadName} {
${rulesHead}
${rules}
}`;

    return [grammarSource, unaryRuleNames, fromAST];
}

export function toAST(match: ohm.MatchResult, unaries: string[]): AST {
    const baseMapping: Record<string, any> = {};
    unaries.forEach(r => {
        baseMapping[r] = undefined;
    });
    return ohm_toAST(match, baseMapping);
}
