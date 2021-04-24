import { Report } from "./Reporting";
import { Axioma, Expr, Grammar, Operacion, Operandos, Parametros, TAD, VariablesLibres } from "./Types";

type CustomBackendData = {
    tads: TAD[];
    tokens: string[];
};

function genAxiomas(data: CustomBackendData): Axioma[] {
    const axiomas: Axioma[] = [];

    for (const tad of data.tads) {
        for (const rawAxioma of tad.rawAxiomas) {
            const exprL = stringToExpr(rawAxioma.left, tad.variablesLibres, data);
            const exprR = stringToExpr(rawAxioma.right, tad.variablesLibres, data);

            if (exprL === null) console.log("Axioma L falló al parsearse", rawAxioma.left /*, tad.variablesLibres*/);
            if (exprR === null) console.log("Axioma R falló al parsearse", rawAxioma.right /*, tad.variablesLibres*/);

            if (exprL && exprR) axiomas.push([exprL, exprR]);
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

    const data: CustomBackendData = {
        tads,
        tokens,
    };

    return {
        axiomas: genAxiomas(data),
        backendGrammar: data,
    };
}


function stringToExpr(input: string, vars: VariablesLibres, data: CustomBackendData, report?: Report): Expr | null {
    input = input.trimEnd();

    let stack: (string | Expr)[] = [];
    let index = 0;
    whileIdx: while (index < input.length || stack.length > 1 || (stack.length === 1 && typeof stack[0] === "string")) {
        // me fijo si matchea alguna operación la cola del stack
        for (const tad of data.tads) {
            forOp: for (const op of tad.operaciones) {
                if (stack.length < op.tokens.length) continue;

                // armo los operandos por si termina siendo exitoso
                const operandos: Operandos = {};
                // track para los templates (α, β etc)
                const parametros: Parametros = {};

                for (let i = 0; i < op.tokens.length; i++) {
                    const token = op.tokens[i];
                    const stack_elem = stack[stack.length - op.tokens.length + i];

                    if (token.type === "literal") {
                        // tiene que matchear exacto el chirimbolo
                        if (stack_elem !== token.symbol) {
                            continue forOp;
                        }
                        // chirimobolo ok :)
                    } else {
                        // token.type === 'slot'
                        // tiene que ser un Expr
                        if (typeof stack_elem === "string") {
                            continue forOp;
                        }

                        // ver si el parametro es un parámetro
                        // TODO: creo que lo de token.genero.base === 'α' habría que hacerlo por separado...
                        if (tad.parametros.includes(token.genero.base) || token.genero.base === "α") {
                            // ahora veo que no haya conflictos
                            // con otro uso de este parametro antes
                            if (token.genero.base in parametros) {
                                // si estaba antes, tiene que matchear el genero exactamente
                                if (
                                    JSON.stringify(parametros[token.genero.base]) !== JSON.stringify(stack_elem.genero)
                                ) {
                                    continue forOp;
                                }
                                // matchea exacto, seguimos bien
                            } else {
                                // el parametro no se había visto antes, todo ok
                                parametros[token.genero.base] = stack_elem.genero;
                            }
                        } else {
                            // el género de stack_elem tiene que estar contenido en el de token.genero

                            // si la base no coincide ya perdí de una
                            if (token.genero.base !== stack_elem.genero.base) {
                                continue forOp;
                            }

                            // me fijo que todos los parámetros en stack_elem coincidan con los de token.genero
                            // si uno no estaba, lo agrego a parametros
                            for (const paramName in stack_elem.genero.parametros) {
                                if (paramName in parametros) {
                                    // si estaba antes, tiene que matchear el genero exactamente
                                    if (
                                        JSON.stringify(parametros[paramName]) !==
                                        JSON.stringify(stack_elem.genero.parametros[paramName])
                                    ) {
                                        continue forOp;
                                    }
                                    // matchea exacto, seguimos bien
                                } else {
                                    // el parametro no se había visto antes, todo ok
                                    parametros[paramName] = stack_elem.genero.parametros[paramName];
                                }
                            }

                            // todos los parametros matchea, todo ok
                        }

                        // ta ok
                        operandos[i] = stack_elem;
                    }
                }

                const expr: Expr = {
                    type: "fijo",
                    nombre: op.nombre,
                    genero:
                        op.retorno.base in parametros
                            ? parametros[op.retorno.base]
                            : {
                                  base: op.retorno.base,
                                  // TODO: verificar que op.retorno.parametros coinciden!!!!
                                  parametros,
                              },
                    operandos,
                };

                stack = stack.slice(0, -op.tokens.length);
                stack.push(expr);
                continue whileIdx;
            }
        }

        // consumo parentesis (ya sé que no matcheo ninguna op)
        // si en el stack hay "(", Expr, ")"
        // entonces borro los literales de los paréntesis
        if (
            stack.length >= 3 &&
            stack[stack.length - 1] === ")" &&
            stack[stack.length - 3] === "(" &&
            typeof stack[stack.length - 2] !== "string" // EXPR
        ) {
            stack.pop();
            const expr = stack.pop();
            stack.pop();
            stack.push(expr!);
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
                        genero: vars[varName],
                        operandos: {},
                    });
                    continue whileIdx;
                }
            }
        }

        // consumir whitespace
        while (index < input.length && (input[index] === " " || input[index] === "\t")) index++;

        // consumo el proximo token
        for (const token of data.tokens) {
            if (input.startsWith(token, index)) {
                // console.log("Matchea token", token);
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
        // TODO: mejorar el error reporting
        //       tendríamos que ver todos los offsets
        //       con el stack y ver cuál/es son los más
        //       cercanos y detallar qué falló
        // ej.   "suc" "(" ")", decir "Falta un nat" y subrayar sólo el ")"
        report?.addMark('error', "No se pudo parsear", 0, input.length);
        return null;
    }

    return stack.length === 1 && typeof stack[0] !== "string" ? stack[0] : null;
}

export function toExpr(input: string, grammar: Grammar, vars?: VariablesLibres, report?: Report): Expr | null {
    return stringToExpr(input, vars || { }, grammar.backendGrammar as CustomBackendData, report);
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
