import ohm from "ohm-js";
import { toAST } from "ohm-js/extras";
import { Axioma, Expr, Genero, Grammar, Operacion, TAD, VariablesLibres } from "./Types";
import { titleSlug } from "./Util";

type OhmSourceResult = {
    source: string;
    grammar: ohm.Grammar;
    unaries: string[];
    fromAST: (expr: Expr) => string;
};

function ohmGenGrammarSource(ops: Operacion[], variables: VariablesLibres): OhmSourceResult {
    const reglasParaExpr: string[] = [];
    const printMapping: { [key: string]: (ast: Expr) => string } = {};
    const fromAST = (ast: Expr): string => {
        return printMapping[ast.type](ast).replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
    };

    const unaryRuleNames: string[] = [];
    let rules = "";

    const varTerms: string[] = [];
    for(let n in variables) {
        const genVar = "Var" + titleSlug(variables[n]) + titleSlug(n);
        rules += `${genVar} = "${n}"\n`;
        varTerms.push(genVar);
    }
    if (varTerms.length > 0) {
        rules += "Var = " + varTerms.join(" | ") + "\n";
    }

    rules += ops
        .map((op, i) => {
            const ret: string = titleSlug(op.retorno);
            const caseName = [op.tipo, op.nombre, `__${i}`].reduce((p, e) => p + titleSlug(e), "");

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

            printMapping[caseName] = (ast: Expr): string => {
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

    const grammarSource = `TADCosa {
${rulesHead}
${rules}
}`;

    return {
        source: grammarSource,
        grammar: ohm.grammar(grammarSource),
        unaries: unaryRuleNames,
        fromAST,
    };
}

function auxAxiomasAST(tads: TAD[]): Axioma[] {
    let ret: Axioma[] = [];

    const opsTodos = tads.map(tad => tad.operaciones).reduce((ret, ops) => ret.concat(ops), []);

    tads.forEach(tad => {
        const r = ohmGenGrammarSource(opsTodos, tad.variablesLibres);
        const g = ohm.grammar(r.source);

        const axiomasEsteTad: Axioma[] = [];

        for (const [left, right] of tad.axiomas) {
            const exprL = ohmToExpr(left, r);
            const exprR = ohmToExpr(right, r);

            if (exprL === null || exprR === null) {
                console.log("Axioma falló al parsearse", left);
                continue;
            }

            axiomasEsteTad.push([exprL, exprR]);
        }

        ret = ret.concat(axiomasEsteTad);
    });

    return ret;
}

export function genGrammar(tads: TAD[]): Grammar {
    const ops = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);
    const result = ohmGenGrammarSource(ops, { });
    const axiomas = auxAxiomasAST(tads);

    return {
        axiomas: axiomas,
        backendGrammar: result,
    };
}

function ohmToExpr(input: string, backend: OhmSourceResult): Expr | null {
    const baseMapping: Record<string, any> = {};
    backend.unaries.forEach(r => (baseMapping[r] = undefined));

    const match = backend.grammar.match(input);
    if (!match.succeeded()) {
        return null;
    }
    // @ts-ignore
    return toAST(match, baseMapping);
}

export function toExpr(input: string, grammar: Grammar): Expr | null {
    return ohmToExpr(input, grammar.backendGrammar);
}

export function fromExpr(expr: Expr, grammar: Grammar): string {
    return (grammar.backendGrammar as OhmSourceResult).fromAST(expr);
}
