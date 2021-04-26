import { Report } from "./Reporting";
import {
    AST,
    Axioma,
    Expr,
    Genero,
    GeneroParametrizado,
    Grammar,
    Operacion,
    Operandos,
    Parametros,
    TAD,
    VariablesLibres,
} from "./Types";

type CustomBackendData = {
    tads: TAD[];
    tokens: string[];
    generosValidos: string[];
};

function genAxiomas(data: CustomBackendData): Axioma[] {
    const axiomas: Axioma[] = [];

    for (const tad of data.tads) {
        for (const rawAxioma of tad.rawAxiomas) {
            const astL = stringToAST(rawAxioma.left, tad.variablesLibres, data);
            const astR = stringToAST(rawAxioma.right, tad.variablesLibres, data);

            // if (astL === null) console.log("Axioma L falló al parsearse", rawAxioma.left /*, tad.variablesLibres*/);
            // if (astR === null) console.log("Axioma R falló al parsearse", rawAxioma.right /*, tad.variablesLibres*/);

            if (astL && astR) {
                const exprL = astToExpr(astL, tad.variablesLibres, data);
                const exprR = astToExpr(astR, tad.variablesLibres, data);

                // if (exprL === null) console.log("Axioma L falló al tiparse", rawAxioma.left /*, tad.variablesLibres*/);
                // if (exprR === null) console.log("Axioma R falló al tiparse", rawAxioma.right /*, tad.variablesLibres*/);

                if (exprL && exprR) axiomas.push([exprL, exprR]);
            }
        }
    }

    return axiomas;
}

export function genGrammar(tads: TAD[]): Grammar {
    const tokensSet = new Set<string>();
    for (const tad of tads) {
        for (const op of tad.operaciones) {
            for (const token of op.tokens) {
                if (token.type === "literal") {
                    tokensSet.add(token.symbol);
                }
            }
        }
    }

    // TODO: orden por length es lo que queremos, o algo distinto?
    const tokens = Array.from(tokensSet).sort((a, b) => b.length - a.length);

    const generosValidos = tads.reduce((p: string[], c) => p.concat(c.generos), []);

    const data: CustomBackendData = {
        tads,
        tokens,
        generosValidos,
    };

    return {
        axiomas: genAxiomas(data),
        backendGrammar: data,
    };
}

// transforma un string en un AST sin tipado
// IMPORTANTE(TODO): genera un warning si la entrada es ambigua
export function stringToAST(
    input: string,
    vars: VariablesLibres,
    data: CustomBackendData,
    report?: Report
): AST | null {
    let stack: (string | AST)[] = [];
    let index = 0;
    whileIdx: while (index < input.length || stack.length > 1 || (stack.length === 1 && typeof stack[0] === "string")) {
        // me fijo si matchea alguna operación la cola del stack
        for (const tad of data.tads) {
            forOp: for (const op of tad.operaciones) {
                if (stack.length < op.tokens.length) continue;

                const ast: AST = { type: "fijo", nombre: op.nombre, entreParens: false };

                for (let i = 0; i < op.tokens.length; i++) {
                    const token = op.tokens[i];
                    const stackElem = stack[stack.length - op.tokens.length + i];

                    if (token.type === "literal") {
                        // tiene que matchear exacto el chirimbolo
                        if (stackElem !== token.symbol) {
                            continue forOp;
                        }
                    } else {
                        // el token es un slot
                        // stackElem tiene que ser un AST
                        if (typeof stackElem === "string") {
                            continue forOp;
                        }

                        // aceptamos cualquier AST, los tipos no nos importan en el AST
                        if (!ast.operandos) ast.operandos = {};
                        ast.operandos[i] = stackElem as AST;
                    }
                }

                stack = stack.slice(0, -op.tokens.length);
                stack.push(ast);
                continue whileIdx;
            }
        }

        // consumo parentesis (ya sé que no matcheo ninguna op)
        // si en el stack hay "(", AST, ")"
        // entonces borro los literales de los paréntesis
        if (
            stack.length >= 3 &&
            stack[stack.length - 1] === ")" &&
            stack[stack.length - 3] === "(" &&
            typeof stack[stack.length - 2] !== "string" // AST
        ) {
            stack.pop();
            const ast = stack.pop() as AST;
            ast.entreParens = true;
            stack.pop();
            stack.push(ast!);
            continue whileIdx;
        }

        // variables si ninguna op parseó el último token
        if (stack.length > 0) {
            for (const varName in vars) {
                if (varName === stack[stack.length - 1]) {
                    stack.pop();
                    stack.push({
                        type: "variable",
                        nombre: varName,
                        entreParens: false
                    });
                    continue whileIdx;
                }
            }
        }

        // consumir whitespace
        while (index < input.length && (input[index] === " " || input[index] === "\t" || input[index] === "\n"))
            index++;
        // parar si el resto es whitespace
        if (index >= input.length) break;

        // consumo el proximo token
        for (const token of data.tokens) {
            if (input.startsWith(token, index)) {
                stack.push(token);
                index += token.length;
                continue whileIdx;
            }
        }

        // token de variables
        for (const varName in vars) {
            if (input.startsWith(varName, index)) {
                stack.push(varName);
                index += varName.length;
                continue whileIdx;
            }
        }

        // si llego acá no pude consumir ningún token
        report?.addMark("error", `No se esperaba el caracter ${input[index]}`, index, 1);
        return null;
    }

    if (stack.length === 1 && typeof stack[0] !== "string") {
        // TODO: tirar warning si hay ambiguedad
        //       recorrer el AST y utilizar entreParens
        //       para ver si fue desambiguado

        return stack[0];
    } else {
        if (report) {
            // generamos un mensaje de error util
            let buffer = "";
            for (const stackElem of stack) {
                if (typeof stackElem === "string") {
                    buffer += `${stackElem}`;
                } else {
                    buffer += `•`;
                }
            }

            report.addMark("error", `La expresión '${buffer}' no coincide con ningúna operación`, 0, input.length);
        }
        return null;
    }
}

// TODO: esto debería hacerlo el parseTad o parseSource, o el genGrammar, no sé
// esta función tiene que normalizar los generos
// ej: par(α,conj(par(α, α))) →
// {
//     base: 'par(α1, α2)',
//     parametros: {
//         'α1': { base: 'α' },
//         'α2': {
//             base: 'conj(α)',
//             parametros: {
//                 'α': {
//                     base: 'par(α1, α2)',
//                     parametros: {
//                         'α1': { base: 'α' },
//                         'α2': { base: 'α' }
//                     }
//                 }
//             }
//         }
//     }
// }
function generoCompleto(genero: Genero, data: CustomBackendData): GeneroParametrizado {
    let parametros: Parametros = {};
    if (genero === "par(α1,α2)") {
        parametros = {
            α1: generoCompleto("α1", data),
            α2: generoCompleto("α2", data),
        };
    }
    if (genero === "conj(α)") {
        parametros = {
            α: generoCompleto("α", data),
        };
    }

    return {
        base: genero,
        parametros,
    };
}

// devuelve true si se puede calzar bien
// parametros se va modificando para reflejar los bindings de parametros
function calzarGeneros(template: GeneroParametrizado, target: GeneroParametrizado, parametros: Parametros): boolean {
    // DEF: que un genero tenga tipo concreto significa que
    //      el genero base NO es un parámetro, por ej. nat, conj(α), par(α1, α2)

    // caso especial: esto ocurre cuando al genero no le importa el tipo yet
    //                por ejemplo, a ∅ no le importa el alpha
    if (target.base in parametros) {
        // TODO: ver si nos estamos comiendo algo acá que no vi?
        return true;
    }

    // vemos si el genero no es concreto
    if (template.base in parametros) {
        // vemos si es la primera vez que lo vemos
        // (es decir, el parametro tiene de género a sí mismo)
        // ej: { base: 'conj(α)', parametros: { 'α': { base: 'α' } } }
        if (parametros[template.base].base === template.base) {
            // este parámetro pasa a tener un tipo concreto
            parametros[template.base] = target;
            return true;
        } else {
            // ya estaba, así que tiene que calzar
            return calzarGeneros(parametros[template.base], target, parametros);
        }
    }

    // sabemos que es un tipo concreto
    // vemos si coincide en ambos lados
    if (template.base !== target.base) return false;

    // como son el mismo tipo concreto
    // sabemos que tienen los mismos parámetros
    // recursivamente calzamos los géneros
    for (const paramName in template.parametros) {
        if (!calzarGeneros(template.parametros[paramName], target.parametros[paramName], parametros)) return false;
    }

    return true;
}

function bindearParametros(genero: GeneroParametrizado, parametros: Parametros): GeneroParametrizado {
    // si el genero es un parámetro, retornamos el parámetro
    if (genero.base in parametros) return parametros[genero.base];

    const ret: GeneroParametrizado = {
        base: genero.base,
        parametros: {},
    };

    // bindeamos los parametros recursivamente
    for (const paramName in genero.parametros) {
        ret.parametros[paramName] = bindearParametros(genero.parametros[paramName], parametros);
    }

    return ret;
}

// transforma un AST sin tipos a una Expr tipada
// la idea es que el tipado de Expr sea correcto
function astToExpr(input: AST, vars: VariablesLibres, data: CustomBackendData, report?: Report): Expr | null {
    if (input.type === "variable") {
        // no se necesita hacer nada más
        return {
            type: "variable",
            nombre: input.nombre,
            genero: generoCompleto(vars[input.nombre].base, data),
            operandos: {},
        };
    }

    // primero genero todos los Expr
    // de los operandos
    const operandos: Operandos = {};
    if (input.operandos) {
        for (const idx in input.operandos) {
            const subExpr = astToExpr(input.operandos[idx], vars, data, report);
            if (!subExpr) return null;
            operandos[idx] = subExpr;
        }
    }

    // ahora intento matchear el nombre de la operación
    // y los géneros de los operandos con una op. concreta
    // que calce
    for (const tad of data.tads) {
        forOp: for (const op of tad.operaciones) {
            if (op.nombre === input.nombre) {
                const parametros: Parametros = {};
                for (const paramName of tad.parametros) {
                    parametros[paramName] = generoCompleto(paramName, data);
                }

                for (let i = 0; i < op.tokens.length; i++) {
                    const token = op.tokens[i];
                    if (token.type === "slot") {
                        const generoSlot = generoCompleto(token.genero.base, data);
                        const generoOperando = operandos[i].genero;

                        // si no es un parámetro y el género no existe
                        // entonces puede ser un "bindeo local"
                        // ejemplos:
                        // if • then • else • fi : bool × α × α → α
                        //                                ↑   ↑
                        // • = •                : α × α → bool
                        //                        ↑   ↑
                        if (!(generoSlot.base in parametros) && !data.generosValidos.includes(generoSlot.base)) {
                            // ok, no es un género válido, asumimos que es un "bindeo local"
                            // agregamos a parámetros este param fantasma
                            parametros[generoSlot.base] = generoCompleto(generoSlot.base, data);
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
                    genero: bindearParametros(generoCompleto(op.retorno.base, data), parametros),
                    operandos: operandos,
                };

                return expr;
            }
        }
    }

    // NO MATCHEA NINGUNA
    return null;
}

export function toExpr(input: string, grammar: Grammar, vars?: VariablesLibres, report?: Report): Expr | null {
    vars = vars || {};
    const data = grammar.backendGrammar as CustomBackendData;
    const ast = stringToAST(input, vars, data, report);
    if (!ast) return null;
    const expr = astToExpr(ast, vars, data, report);
    return expr;
}

function recFromExpr(expr: Expr, data: CustomBackendData): string {
    let opExpr: Operacion | null = null;
    for (const tad of data.tads) {
        for (const op of tad.operaciones) {
            if (op.nombre === expr.nombre) {
                opExpr = op;
                break;
            }
        }
    }

    if (opExpr === null) return "<ERROR>";

    let buffer = "";
    for (let i = 0; i < opExpr.tokens.length; i++) {
        const token = opExpr.tokens[i];
        if (token.type === "literal") {
            buffer += token.symbol;
        } else {
            buffer += ` ${recFromExpr(expr.operandos[i], data)} `;
        }
    }

    // TODO: ver que onda los parentesis que desambiguan
    //       tratar de ponerlos solo cuando son necesarios
    return `(${buffer})`;
}

export function fromExpr(expr: Expr, grammar: Grammar): string {
    const data = grammar.backendGrammar as CustomBackendData;
    return recFromExpr(expr, data).replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");
}
