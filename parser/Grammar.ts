import { Report } from "./Reporting";
import { Operacion, TAD } from "./Types";
import { extractTokens } from "./AST";
import { Expr, parseToExpr } from "./Expr";
import { Genero } from "./Genero";

export type Axioma = [Expr, Expr];

export type Grammar = {
    tads: TAD[];
    tokens: string[];
    operaciones: Operacion[];
    generosValidos: Genero[];
    axiomas: Axioma[];
};

/**
 * Genera la gramática utilizada para parsear ASTs, Exprs y luego evaluarlos
 */
export function genGrammar(tads: TAD[], report?: Report): Grammar {
    const tokens = extractTokens(tads);
    const operaciones = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);
    const generosValidos = tads.map(t => t.genero);

    const grammar: Grammar = {
        tads: [...tads],
        axiomas: [],
        operaciones,
        tokens,
        generosValidos,
    };

    for (const tad of tads) {
        for (const rawAxioma of tad.rawAxiomas) {
            const exprL = parseToExpr(rawAxioma.left, tad.variablesLibres, grammar, report);
            const exprR = parseToExpr(rawAxioma.right, tad.variablesLibres, grammar, report);

            if (exprL && exprR) grammar.axiomas.push([exprL, exprR]);
        }
    }

    return grammar;
}
