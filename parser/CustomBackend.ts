import { Axioma, Expr, Genero, Grammar, Operacion, TAD, VariablesLibres } from "./Types";

type CustomBackendData = {
    tads: TAD[];
    tokens: string[];
    operaciones: Operacion[];
};

function genAxiomas(data: CustomBackendData): Axioma[] {
    const axiomas: Axioma[] = [];

    for (const tad of data.tads) {
        for (const [left, right] of tad.axiomas) {
            const exprL = process(left, data, tad.variablesLibres);
            const exprR = process(right, data, tad.variablesLibres);

            if (exprL === null) console.log("Axioma L falló al parsearse", left/*, tad.variablesLibres*/);
            if (exprR === null) console.log("Axioma R falló al parsearse", right/*, tad.variablesLibres*/);

            if (exprL && exprR) axiomas.push([exprL, exprR]);
        }
    }

    return axiomas;
}

export function genGrammar(tads: TAD[]): Grammar {
    let operaciones = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);

    operaciones = operaciones.sort((a, b) => {
        const slotsA = a.tokens.filter(t => t.type === "slot").length;
        const slotsB = b.tokens.filter(t => t.type === "slot").length;
        if (slotsA === slotsB) {
            return b.tokens.length - a.tokens.length;
        } else {
            return slotsB - slotsA;
        }
    });

    const tokensSet = new Set<string>();
    for (const op of operaciones) {
        for (const token of op.tokens) {
            if (token.type === "literal") {
                tokensSet.add(token.symbol);
            }
        }
    }

    // TODO: orden por length es lo que queremos, o algo distinto?
    const tokens = Array.from(tokensSet).sort((a, b) => b.length - a.length);

    const data: CustomBackendData = {
        tads,
        tokens,
        operaciones,
    };

    return {
        axiomas: genAxiomas(data),
        backendGrammar: data,
    };
}

function process(input: string, data: CustomBackendData, vars: VariablesLibres = {}): Expr | null {
    // console.log("===============================", input, "===============================");
    input = input.trimEnd();

    let stack: (string | Expr)[] = [];
    let index = 0;
    whileIdx: while (index < input.length || stack.length > 1 || (stack.length === 1 && typeof stack[0] === "string")) {
        // me fijo si matchea alguna operación la cola del stack
        forOp: for (const op of data.operaciones) {
            if (stack.length < op.tokens.length) continue;

            // armo expr por si termina siendo exitoso
            const expr: Expr = { type: op.nombre, genero: op.retorno };
            // track para los templates (α)
            let template: Genero | undefined = undefined;

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

                    // tiene que tener el mismo genero
                    if (token.genero === "α") {
                        // el token es un género
                        // entonces tengo que ver si matchea con el α
                        // anterior o guardarlo si es nuevo
                        if (template) {
                            // ya había un α, me fijo que tengan el mismo género
                            if (template !== stack_elem.genero) {
                                // no matchea con el alpha anterior!
                                continue forOp;
                            }
                        } else {
                            // no hay α anterior, podemos setearlo
                            template = stack_elem.genero;
                        }
                    } else {
                        // son tipos definidos, hay que asegurarse que tengan el mismo genero
                        if (token.genero !== stack_elem.genero) {
                            continue forOp;
                        }
                    }

                    // ta ok
                    expr[i] = stack_elem;
                }
            }

            // si el retorno es alpha y esta op retorna el alpha
            // el género pasa a ser el asignado por alpha
            if (op.retorno === "α" && template) {
                expr.genero = template;
            }

            stack = stack.slice(0, -op.tokens.length);
            stack.push(expr);
            continue whileIdx;
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
                        type: "Var_" + varName,
                        genero: vars[varName],
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
        // console.log("SE ESPERABA TOKEN!");
        return null;
    }

    return stack.length === 1 && typeof stack[0] !== "string" ? stack[0] : null;
}

export function toExpr(input: string, grammar: Grammar, vars?: VariablesLibres): Expr | null {
    return process(input, grammar.backendGrammar as CustomBackendData, vars);
}

function recFromExpr(expr: Expr, data: CustomBackendData): string {
    const op = data.operaciones.find(op => op.nombre === expr.type);
    if (!op) return "<ERROR>";

    let buffer = "";
    for (let i = 0; i < op.tokens.length; i++) {
        const token = op.tokens[i];
        if (token.type === "literal") {
            buffer += token.symbol;
        } else {
            buffer += ` ${recFromExpr(expr[i], data)} `;
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
