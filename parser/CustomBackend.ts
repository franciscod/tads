import { Expr, Grammar, Operacion, TAD } from "./Types";

type CustomBackendData = {
    tads: TAD[],
    tokens: string[],
    operaciones: Operacion[]
}

export function genGrammar(tads: TAD[]): Grammar {
    let operaciones = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);

    operaciones = operaciones.sort((a, b) => {
        let slotsA = a.tokens.filter(t => t.type === 'slot').length;
        let slotsB = b.tokens.filter(t => t.type === 'slot').length;
        if(slotsA === slotsB) {
            return b.tokens.length - a.tokens.length;
        } else {
            return slotsB - slotsA;
        }
    });

    const tokensSet = new Set<string>();
    for(const op of operaciones) {
        for(const token of op.tokens) {
            if(token.type === 'literal') {
                tokensSet.add(token.symbol);
            }
        }
    }

    // TODO: orden por length es lo que queremos, o algo distinto?
    const tokens = Array.from(tokensSet).sort((a, b) => b.length - a.length);
    
    return {
        axiomas: [],
        backendGrammar: {
            tads,
            tokens,
            operaciones
        }
    };
}


// falta:
// variables
// alphas (templates)

function process(input: string, data: CustomBackendData): Expr | null {
    // console.log("===============================", input, "===============================");
    input = input.replace(/ /g, ''); // chau espacios

    let stack: (string | Expr)[] = [];
    let index = 0;
    forIndex: while(index < input.length || (stack.length > 1 || (stack.length === 1 && typeof stack[0] === 'string'))) {

        // me fijo si matchea alguna operación la cola del stack
        forOp: for(const op of data.operaciones) {
            if(stack.length < op.tokens.length)
                continue;

            // armo expr por si termina siendo exitoso
            const expr: Expr = { type: op.nombre, genero: op.retorno };

            for(let i = 0; i < op.tokens.length; i++) {
                const token = op.tokens[i];
                const stack_elem = stack[stack.length - op.tokens.length + i];
                
                if(token.type === 'literal') {
                    // tiene que matchear exacto el chirimbolo
                    if(stack_elem !== token.symbol) {
                        continue forOp;
                    }
                    // chirimobolo ok :)
                } else { // token.type === 'slot'
                    // tiene que ser un Expr
                    if(typeof stack_elem === 'string') {
                        continue forOp;
                    }
                    
                    const slot_expr = stack_elem as Expr;
                    // tiene que tener el mismo genero
                    if(token.genero !== slot_expr.genero) {
                        continue forOp;
                    }

                    // ta ok
                    expr[i] = stack_elem as Expr;
                }
            }

            stack = stack.slice(0, -op.tokens.length);
            stack.push(expr);
            continue forIndex;
        }

        // como parentesis (ya sé que no matcheo ninguna op)
        // si en el stack hay "(" + expr + ")"
        // entonces borro los literales de los paréntesis
        if(stack.length >= 3 &&
            stack[stack.length - 1] === ')' &&
            stack[stack.length - 3] === '(' &&
            typeof stack[stack.length - 2] !== 'string' // EXPR
        ) {
            stack.pop();
            const expr = stack.pop();
            stack.pop();
            stack.push(expr!);
            continue forIndex;
        }

        // como el proximo token
        for(const token of data.tokens) {
            if(input.startsWith(token, index)) {
                // console.log("Matchea token", token);
                stack.push(token);
                index += token.length;
                continue forIndex;
            }
        }

        // si llego acá no pude consumir ningún token
        // console.log("SE ESPERABA TOKEN!");
        return null;
    }

    return stack.length === 1 && typeof stack[0] !== 'string' ? stack[0] : null;
}

export function toExpr(input: string, grammar: Grammar): Expr | null {
    return process(input, (grammar.backendGrammar as CustomBackendData));
}

// TODO: ver que onda los parentesis que desambiguan
export function fromExpr(expr: Expr, grammar: Grammar): string {
    const data = (grammar.backendGrammar as CustomBackendData);
    const op = data.operaciones.find(op => op.nombre === expr.type);
    if(!op) return "<ERROR>";

    let buffer = "";
    for(let i = 0; i < op.tokens.length; i++) {
        const token = op.tokens[i];
        if(token.type === 'literal') {
            buffer += token.symbol;
        } else {
            buffer += fromExpr(expr[i], grammar);
        }
    }

    return buffer;
}

