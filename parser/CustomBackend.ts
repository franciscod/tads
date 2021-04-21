import { Axioma, Expr, Genero, Grammar, Literal, Operacion, ParseReference, TAD } from "./Types";
import { titleSlug } from "./Util";

type CustomBackendData = {
    tads: TAD[]
}

export function genGrammar(tads: TAD[]): Grammar {
    return {
        axiomas: [],
        backendGrammar: {
            tads
        }
    };
}

// cosas:
// |+0|: como está primero la operación |•| que +•, intenta generar una nueva operación usando el 2do
//       "|" como apertura. Debería preferir cerrar una anteior? Filtrar ops? Veré
// (0): los parentesis no funcionan actualmente

function process(input: string, tads: TAD[]): Expr | null {
    let stack: (Literal | Expr)[] = [];
    let index = 0;
    let k = 0;
    forIndex: while(index < input.length || (stack.length > 1 || (stack.length === 1 && stack[0].type === 'literal'))) {
        if(k++ > 500) {
            console.log("F");
            break;
        }

        for(const tad of tads) {
            for(const op of tad.operaciones) {

                // pruebo todos los corrimientos para esta operacion
                // STACK (5): XXXXX
                // TOKENS(3):   YYY    (matchea exactamente los ultimos 3 tokens)
                //               YYY
                //                YYY
                //                 YYY (completamente nueva operacion) 
                //                 ↑ k=0

                const maxOff = Math.min(op.tokens.length, stack.length);
                forOffset: for(let k = maxOff; k >= 0; k--) {
                    // armo expr por si termina siendo exitoso
                    const expr: Expr = { type: op.nombre, genero: op.retorno };

                    // testear matches en el stack
                    // intento matchear los más posibles en el stack,
                    // si no matcheo uno acá (es obligatorio)
                    // cancelo la búsqueda para este offset, no sirve
                    let i = 0;
                    for(; stack.length - k + i < stack.length; i++) {
                        const token = op.tokens[i];
                        const stack_elem = stack[stack.length - k + i];

                        if(token.type === 'literal') {
                            // si es un literal, tiene que matchear con lo que esta en el stack
                            if(token === stack_elem) {
                                // todo ok :)
                                continue;
                            } else {
                                // :(
                                // cancelar la busqueda para este offset
                                continue forOffset;
                            }
                        }

                        // este literal no coincide, bai
                        if(stack_elem.type === 'literal') {
                            continue forOffset;
                        }

                        // el token es un slot
                        // checkear que el genero sea compatible
                        if(token.genero !== (stack_elem as Expr).genero!) {
                            // los generos no coinciden :(
                            continue forOffset;
                        }

                        expr[i] = stack_elem;
                    }

                    if(i < op.tokens.length) {
                        // si estoy aca le falta matchear algo

                        // si lo siguiente a matchear es un literal,
                        // me fijo si coincide
                        //   si coincide, lo agrego al stack y sigo
                        //   si no coincide este op+offset no funciona
                        if(op.tokens[i].type === 'literal') {
                            const symbol = (op.tokens[i] as Literal).symbol;
                            if(input.startsWith(symbol, index)) {
                                // agregamos el literal al stack
                                stack.push(op.tokens[i]);
                                index += symbol.length;
                                continue forIndex;
                            }
                        }
                        
                        // si estoy acá falta matchear un slot
                        // continúo...
                        
                    } else {
                        // logró matchear todo, add to stack
                        stack = stack.slice(0, -op.tokens.length);
                        stack.push(expr);
                        continue forIndex;
                    }
                }
            }
        }
    }

    return stack.length > 0 ? stack[0] : null;
}


export function toExpr(input: string, grammar: Grammar): Expr | null {
    console.log("===============================", input, "===============================");
    debugger;
    const expr = process(input.replace(/ /g, ''), (grammar.backendGrammar as CustomBackendData).tads);
    console.log("Result EXPR", expr);
    return expr;
}

export function fromExpr(expr: Expr, grammar: Grammar): string {
    return "pepe";
}
