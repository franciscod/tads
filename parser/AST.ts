import { Grammar } from "./Grammar";
import { Report } from "./Reporting";
import { TAD, VariablesLibres } from "./Types";

/**
 * Nodo de un árbol de sintaxis, no tiene tipos
 */
export type AST = {
    /** Tipo del nodo, puede ser fijo (generador o operación) o una variable */
    type: "fijo" | "variable";
    /** Nombre de la operación (•<•) o la variable (a) */
    nombre: string;
    operandos?: { [key: number]: AST };
    /** Si la expresión se encontraba entre paréntesis al ser parseada */
    entreParens: boolean;
};

/**
 * Extrae todos los tokens para parsear ASTs de los TADs recibidos.
 * Los tokens están ordenados alfabeticamente y luego de mayor a menor longitud
 */
export function extractTokens(tads: TAD[]): string[] {
    const tokensSet = new Set<string>(["(", ")"]);
    for (const tad of tads) {
        for (const op of tad.operaciones) {
            for (const token of op.tokens) {
                if (token.type === "literal") {
                    tokensSet.add(token.symbol);
                }
            }
        }
    }

    return Array.from(tokensSet).sort((a, b) => (a.length === b.length ? a.localeCompare(b) : b.length - a.length));
}

/**
 * Parsea un string a un AST (sin tipado)
 *
 * Importante: las operaciones se matchean de izquierda a derecha
 * Importante: genera un warning si la entrada es ambigua (pero retorna el AST igual)
 *
 * @param input entrada
 * @param vars variables disponibles
 * @param grammar grammar a utilizar
 * @param report reporte opcional
 * @returns un AST o null si no se pudo parsear
 */
export function parseAST(input: string, vars: VariablesLibres, grammar: Grammar, report?: Report): AST | null {
    // en el stack se guardan nodos ya parseados del AST y literales
    // ejs:
    // [ "(", AST, ")" ]
    // [ AST, "+", AST ]
    // [ "Ag(", AST, "," ]
    let stack: (string | AST)[] = [];

    // indice del caracter en input
    let index = 0;

    // no me detengo hasta que queda un sólo elemento en el stack y es un nodo parseado
    whileIdx: while (index < input.length || stack.length > 1 || (stack.length === 1 && typeof stack[0] === "string")) {
        // me fijo si la cola del stack matchea alguna operación
        // ej.
        // "Ag(" AST "," "Ag(" AST "," AST ")"
        //                 ↑    ↑   ↑   ↑   ↑
        //                 matchea Ag(•, •)
        forOp: for (const op of grammar.operaciones) {
            // si no me alcanza lo que tengo en el stack para
            // matchear la operación ni la pruebo
            if (stack.length < op.tokens.length) continue;

            // preparo el AST en caso de que matchee
            const ast: AST = {
                type: "fijo",
                nombre: op.nombre,
                entreParens: false,
            };

            // itero todos los tokens de la operación y me fijo si matchean
            for (let i = 0; i < op.tokens.length; i++) {
                const token = op.tokens[i];
                const stackElem = stack[stack.length - op.tokens.length + i];

                if (token.type === "literal") {
                    // si es un literal, tiene que matchear exacto el chirimbolo
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

            // sacamos del stack los elementos que usamos para matchear esta operación
            // y los reemplazamos por el AST de esta operación
            stack = stack.slice(0, -op.tokens.length);
            stack.push(ast);
            continue whileIdx;
        }

        // en este punto ya sé que no matcheó ninguna operación
        // intento consumir paréntesis si en el stack hay "(", AST, ")"
        if (
            stack.length >= 3 &&
            stack[stack.length - 1] === ")" &&
            stack[stack.length - 3] === "(" &&
            typeof stack[stack.length - 2] !== "string" // AST
        ) {
            // matchean paréntesis, así que sacamos los paréntesis del stack
            // y solo dejamos el AST del medio
            stack.pop();
            const ast = stack.pop() as AST;
            ast.entreParens = true;
            stack.pop();
            stack.push(ast!);
            continue whileIdx;
        }

        // veo si el último token en el stack es una variable
        if (stack.length > 0) {
            for (const varName in vars) {
                if (varName === stack[stack.length - 1]) {
                    // si coincide con alguna variable, la reemplazo por el nodo de la variable
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

        // intento consumir el siguiente token
        for (const token of grammar.tokens) {
            if (input.startsWith(token, index)) {
                // matchea, lo agrego al stack como un literal
                stack.push(token);
                index += token.length;
                continue whileIdx;
            }
        }

        // si no pude consumir un token general, veo si puedo consumir una variable
        for (const varName in vars) {
            if (input.startsWith(varName, index)) {
                stack.push(varName);
                index += varName.length;
                continue whileIdx;
            }
        }

        // si llego acá no se pudo matchear ninguna operación ni consumir tokens
        // TODO: avanzar caracter por caracter hasta encontrar un token válido y subrayar todo lo que no se reconoció
        report?.addMark("error", `No se esperaba el caracter \`${input[index]}\``, index, 1);
        return null;
    }

    if (stack.length === 1 && typeof stack[0] !== "string") {
        // pude reducir el input a un AST

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
