import ohm from "ohm-js";
import { toAST } from "ohm-js/extras";
import { Axioma, Expr, Grammar, Operacion, TAD, VariablesLibres } from "./Types";

type OhmSourceResult = {
    source: string;
    grammar: ohm.Grammar;
    unaries: string[];
    fromAST: (expr: OhmExpr) => string;
};

export type OhmExpr = {
    type: string;
    [key: number]: OhmExpr;
}

function ohmGenGrammarSource(ops: Operacion[], variables: VariablesLibres): OhmSourceResult {
    const reglasParaExpr: string[] = [];
    const printMapping: { [key: string]: (ast: OhmExpr) => string } = {};
    const fromAST = (ast: OhmExpr): string => {
        return printMapping[ast.type](ast).replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
    };

    const unaryRuleNames: string[] = [];
    let rules = "";

    const varTerms: string[] = [];
    for (const n in variables) {
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
            const caseName = [op.type, op.nombre, `__${i}`].reduce((p, e) => p + titleSlug(e), "");

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

            printMapping[caseName] = (ast: any): string => {
                return op.tokens
                    .map((tok, i) => {
                        if (tok.type == "literal") return tok.symbol;
                        if (tok.type == "slot") return ` ${printMapping[ast[i].nombre](ast[i])} `;
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

        for (const rawAxioma of tad.rawAxiomas) {
            const exprL = ohmToExpr(rawAxioma.left, r);
            const exprR = ohmToExpr(rawAxioma.right, r);

            if (exprL === null || exprR === null) {
                // console.log("Axioma falló al parsearse", left);
                continue;
            }

            // mmmmmmmmm
            // @ts-ignore
            axiomasEsteTad.push([exprL, exprR]);
        }

        ret = ret.concat(axiomasEsteTad);
    });

    return ret;
}

export function genGrammar(tads: TAD[]): Grammar {
    const ops = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);
    const result = ohmGenGrammarSource(ops, {});
    const axiomas = auxAxiomasAST(tads);

    return {
        axiomas: axiomas,
        backendGrammar: result,
    };
}

function ohmToExpr(input: string, backend: OhmSourceResult): OhmExpr | null {
    const baseMapping: Record<string, any> = {};
    backend.unaries.forEach(r => (baseMapping[r] = undefined));

    const match = backend.grammar.match(input);
    if (!match.succeeded()) {
        return null;
    }
    // @ts-ignore
    return toAST(match, baseMapping);
}

export function toExpr(input: string, grammar: Grammar): OhmExpr | null {
    return ohmToExpr(input, grammar.backendGrammar);
}

export function fromExpr(expr: OhmExpr, grammar: Grammar): string {
    return (grammar.backendGrammar as OhmSourceResult).fromAST(expr);
}

export function titleSlug(s: string): string {
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
