import { AST, Axioma, Expr, Grammar, Operacion, Operandos, TAD, VariablesLibres } from "./Types";
import { bindearParametros, calzarGeneros, Parametros, parseGenero } from "./Genero";
import { Report } from "./Reporting";

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

    const generosValidos = tads.reduce((p: string[], c) => p.concat([c.genero]), []);

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
                        entreParens: false,
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
        report?.addMark("error", `No se esperaba el caracter \`${input[index]}\``, index, 1);
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

// transforma un AST sin tipos a una Expr tipada
// la idea es que el tipado de Expr sea correcto
function astToExpr(input: AST, vars: VariablesLibres, data: CustomBackendData, report?: Report): Expr | null {
    if (input.type === "variable") {
        // no se necesita hacer nada más
        return {
            type: "variable",
            nombre: input.nombre,
            genero: parseGenero(vars[input.nombre].base, data.tads)!,
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
                    parametros[paramName] = parseGenero(paramName, data.tads)!;
                }

                for (let i = 0; i < op.tokens.length; i++) {
                    const token = op.tokens[i];
                    if (token.type === "slot") {
                        const generoSlot = parseGenero(token.genero.base, data.tads)!;
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
                            parametros[generoSlot.base] = parseGenero(generoSlot.base, data.tads)!;
                            // seguimos como si nada
                        }

                        
                        let r = calzarGeneros(generoSlot, generoOperando, parametros);
                        //console.log(token.genero.base, generoOperando, JSON.stringify(parametros), r);

                        if (!r) {
                            continue forOp;
                        }
                    }
                }

                const expr: Expr = {
                    type: "fijo",
                    nombre: input.nombre,
                    genero: bindearParametros(parseGenero(op.retorno.base, data.tads)!, parametros),
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
