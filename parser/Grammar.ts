import { Report } from "./Reporting";
import { Operacion, TAD, VariablesLibres } from "./Types";
import { extractTokens } from "./AST";
import { Expr, parseToExpr } from "./Expr";
import { Genero, parseGenero } from "./Genero";

export type Axioma = [Expr, Expr];

export type Grammar = {
    tads: TAD[];
    tokens: string[];
    operaciones: Operacion[];
    generosValidos: Genero[];
    axiomas: Axioma[];
    axiomasPorNombre: Map<string, Axioma[]>;
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
        axiomasPorNombre: new Map(),
        operaciones,
        tokens,
        generosValidos
    };

    for (const tad of tads) {
        let vars: VariablesLibres = { };
        for(const varName in tad.variablesLibres) {
            vars[varName] = parseGenero(tad.variablesLibres[varName].base, tads)!;
        }

        for (const rawAxioma of tad.rawAxiomas) {
            if (report && rawAxioma.left.range) {
                report.activeDocument = rawAxioma.left.location.document;
            }

            report?.push(rawAxioma.left.location.offset);
            const exprL = parseToExpr(rawAxioma.left.source, vars, grammar, report);
            report?.pop();

            report?.push(rawAxioma.right.location.offset);
            const exprR = parseToExpr(rawAxioma.right.source, vars, grammar, report);
            report?.pop();

            if (exprL && exprR) {
                grammar.axiomas.push([exprL, exprR]);
                const key = exprL.nombre;
                let axs = grammar.axiomasPorNombre.get(key) || [];
                axs.push([exprL, exprR]);
                grammar.axiomasPorNombre.set(key, axs);
            }
        }
    }

    return grammar;
}
