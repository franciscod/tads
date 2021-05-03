import { Report } from "./Reporting";
import { Operacion, VariablesLibres } from "./Types";
import { AST, parseAST } from "./AST";
import { bindearParametros, calzarGeneros, GeneroParametrizado, Parametros, parseGenero } from "./Genero";
import { Grammar } from "./Grammar";

/**
 * Operandos de una expresión
 * `key` coincide con el índice del slot en la operación
 */
export type Operandos = {
    [key: number]: Expr;
};

/**
 * Nodo en un árbol de expresiones tipadas y con sentido
 */
export type Expr = {
    type: "fijo" | "variable";
    /** Nombre de la operación (•<•) o la variable (a) */
    nombre: string;
    genero: GeneroParametrizado;
    operandos: Operandos;
};

/**
 * Transforma un AST sin tipos a una Expr tipada.
 * Se espera que el tipado del Expr retornado sea correcto
 *
 * @param input el AST a convertir
 * @param vars las variables disponibles con sus respectivos géneros
 * @param grammar grammar correspondiente al AST
 * @param report reporte opcional
 * @returns
 */
export function astToExpr(input: AST, vars: VariablesLibres, grammar: Grammar, report?: Report): Expr | null {
    if (input.type === "variable") {
        // no se necesita hacer nada más
        const genero = parseGenero(vars[input.nombre].base, grammar.tads, report);
        if (genero === null) return null;
        return {
            type: "variable",
            nombre: input.nombre,
            genero,
            operandos: {}
        };
    }

    // primero genero todos los Expr
    // de los operandos
    const operandos: Operandos = {};
    if (input.operandos) {
        for (const idx in input.operandos) {
            const subExpr = astToExpr(input.operandos[idx], vars, grammar, report);
            if (!subExpr) return null;
            operandos[idx] = subExpr;
        }
    }

    // ahora intento matchear el nombre de la operación
    // y los géneros de los operandos con una op. concreta
    // que calce
    for (const tad of grammar.tads) {
        forOp: for (const op of tad.operaciones) {
            if (op.nombre === input.nombre) {
                const parametros: Parametros = {};
                for (const paramName of tad.parametros) {
                    parametros[paramName] = parseGenero(paramName, grammar.tads)!;
                }

                for (let i = 0; i < op.tokens.length; i++) {
                    const token = op.tokens[i];
                    if (token.type === "slot") {
                        const generoSlot = parseGenero(token.genero.base, grammar.tads)!;
                        const generoOperando = operandos[i].genero;

                        // si no es un parámetro y el género no existe
                        // entonces puede ser un "bindeo local"
                        // ejemplos:
                        // if • then • else • fi : bool × α × α → α
                        //                                ↑   ↑
                        // • = •                : α × α → bool
                        //                        ↑   ↑
                        if (!(generoSlot.base in parametros) && !grammar.generosValidos.includes(generoSlot.base)) {
                            // ok, no es un género válido, asumimos que es un "bindeo local"
                            // agregamos a parámetros este param fantasma
                            parametros[generoSlot.base] = parseGenero(generoSlot.base, grammar.tads)!;
                            // seguimos como si nada
                        }

                        if (!calzarGeneros(generoSlot, generoOperando, parametros)) {
                            continue forOp;
                        }
                    }
                }

                const expr: Expr = {
                    type: "fijo",
                    nombre: input.nombre,
                    genero: bindearParametros(parseGenero(op.retorno.base, grammar.tads)!, parametros),
                    operandos: operandos
                };

                return expr;
            }
        }
    }

    // NO MATCHEA NINGUNA
    // TODO: error
    return null;
}

/**
 * Parsea la entrada a un AST y la convierte a una Expr (una conveniencia)
 */
export function parseToExpr(input: string, vars: VariablesLibres, grammar: Grammar, report?: Report): Expr | null {
    const ast = parseAST(input, vars, grammar, report);
    if (!ast) return null;
    return astToExpr(ast, vars, grammar, report);
}

/**
 * Auxiliar de `exprToString` que se llama recursivamente
 * generando el string uniendo los literales de las operaciones
 */
function exprToStringRec(expr: Expr, grammar: Grammar): string {
    // TODO: deberíamos agarrar la que matchee los tipos también?
    //       o cualquiera que tenga el mismo nombre nos sirve?
    //       por ejemplo •+• de nat e int
    const opExpr: Operacion | undefined = grammar.operaciones.find(op => op.nombre === expr.nombre);
    if (!opExpr) return "<ERROR>";

    let buffer = "";
    let lastIsSlot = false;
    for (let i = 0; i < opExpr.tokens.length; i++) {
        const token = opExpr.tokens[i];

        if (token.type === "literal") {
            buffer += token.symbol;
            lastIsSlot = false;
        } else {
            buffer += ` ${exprToStringRec(expr.operandos[i], grammar)} `;
            lastIsSlot = true;
        }
    }

    // TODO: ver que onda los parentesis que desambiguan
    //       tratar de ponerlos solo cuando son necesarios
    //       lo de lastIsSlot es una heurística, no creo que funcione siempre
    //       (pero por ahora los tests los pasa)
    return lastIsSlot ? `(${buffer})` :  buffer;
}

/**
 * Transforma un árbol de Expr en un string
 * (probablemente parecido a la original si se generó con un AST)
 *
 * "0 + 0" → AST → Expr → "0+0"
 */
export function exprToString(expr: Expr, grammar: Grammar): string {
    return (
        exprToStringRec(expr, grammar)
            // borra whitespace innecesario
            .replace(/\s+/g, " ")
            .replace(/\( /g, "(")
            .replace(/ \)/g, ")")
    );
}
