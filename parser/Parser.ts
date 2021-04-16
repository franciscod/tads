import { Aplicacion, Axioma, ExpresionLogica, Genero, Literal, Nodo,
         Operacion, Range, Slot, TAD, Token, Variable } from "./Types.ts";

type MarkerSeverity = 'error' | 'warning' | 'info' | 'hint';

export type Marker = {
    severity: MarkerSeverity;
    message: string;
    range: Range;
};

export class EditorHints {
    markers: Marker[] = [];

    addMark(severity: MarkerSeverity, message: string, range: Range) {
        this.markers.push({ severity, message, range });
    }
}

export type ParseContext = {
    range: Range;
    hints?: EditorHints;
}

type Section = 'none' | 'generos' | 'igualdad' | 'observadores' | 'generadores' | 'otras operaciones' | 'axiomas';

function checkSectionHeader(line: string): Section {
    line = line.trimRight();
    if(line.match(/^g[ée]neros/i)) return 'generos';
    if(line.match(/^(igualdad observacional|igobs|ig obs)$/i)) return 'igualdad';
    if(line.match(/^(observadores b[áa]sicos|obs)$/i)) return 'observadores';
    if(line.match(/^(generadores|gen)$/i)) return 'generadores';
    if(line.match(/^(otras operaciones|otras op|otrasop)$/i)) return 'otras operaciones';
    if(line.match(/^(axiomas)/i)) return 'axiomas';
    return 'none';
}

export function parseExpresionLogica(input: string, context?: ParseContext): ExpresionLogica | null {
    // TODO: =)
    return null;
}

export function parseVarLibres(input: string, context?: ParseContext): Variable[] {
    //context?.hints?.addMark('info', 'variables libres', context.range);
    // TODO: =)
    return [];
}

export function parseAxioma(left: string, right: string, context?: ParseContext): Operacion | null {
    // TODO: =)
    //context?.hints?.addMark('info', `${JSON.stringify(context.range)} ${left}\n\n\n\n-------------\n\n\n\n\n${right}`, context.range);
    return null;
}

export function parseOperacion(left: string, right: string, section: Section, context?: ParseContext): Operacion | null {
    // left:   • ∨L • 
    // right   bool × bool  → bool {restriccion}
    
    //context?.hints?.addMark('info', `${section}: ${left.length} / ${right.length}`, context.range);
    // TODO: =)

    right = right.split('{')[0];

    const sectionToOpType = (section: Section) => {
        if(section === 'observadores') return 'basico';
        if(section === 'generadores') return 'generador';
        return 'otra';
    };

    const op: Operacion = {
        nombre: left.replace(/ /g, '').trim(),
        tipo: sectionToOpType(section),
        tokens: [],
        retorno: "",
        axiomas: [],
        // restriccion: []
    };

    const [_args, retorno] = right.split(/->|→/);
    const args = _args.split(/×|✕/).map((arg) => arg.trim()).filter((arg) => arg !== "");
    let ithSlot = 0;

    while (left !== "") {
        const i = left.indexOf("•");
        if (i == 0) {
            const genName: string = args[ithSlot++];
            const slot: Slot = {"type": "slot", "genero": genName};
            op.tokens.push(slot);

            left = left.substr(1);
        } else if (i == -1) {
            op.tokens.push({"type": "literal", "symbol": left.trim()});
            left = "";
        } else {
            op.tokens.push({"type": "literal", "symbol": left.substr(0, i).trim()});
            left = left.substr(i);
        }
    }
    

    op.retorno = retorno.trim();
    
    return op;
}

export function parseTad(source: string, context?: ParseContext): TAD | null {
    const lines = source.replaceAll(/\r\n/g, '\n').split('\n').map(l => l.split('--')[0].trimRight());
    const tad: TAD = {
        nombre: "",
        generos: [],
        operaciones: [],
        variablesLibres: [],
        range: context?.range
    };

    function offsetRange(range: Range) {
        return {
            startLine: (context?.range.startLine || 1) + range.startLine,
            endLine: (context?.range.startLine || 1) + range.endLine,
            columnStart: range.columnStart,
            columnEnd: range.columnEnd,
        }
    }

    let closedProperly = false;
    
    for(let i = 0; i < lines.length; i++){
        let line = lines[i];

        if(line.trim().length === 0)
            continue; // skip empty lines

        if(tad.nombre === "") {
            if(line.toUpperCase().startsWith("TAD")) {
                tad.nombre = line.slice('TAD'.length).trim();
                if(tad.nombre.length === 0) {
                    i--;
                    context?.hints?.addMark('error', 'Nombre del TAD incompleto', offsetRange({ startLine: 1+i, endLine: 1+i, columnStart: 4, columnEnd: 5 }));
                    return null;
                }
            } else {
                context?.hints?.addMark('error', 'Se esperaba la definición de un TAD', offsetRange({ startLine: 1+i, endLine: 1+i, columnStart: 1, columnEnd: 1+line.length }));
                return null;
            }
            continue;
        }
        
        if(line.toUpperCase().startsWith("FIN TAD")) {
            if(closedProperly) {
                context?.hints?.addMark('error', 'El TAD ya estaba cerrado', offsetRange({ startLine: 1+i, endLine: 1+i, columnStart: 1, columnEnd: 1+line.length }));
            }
            closedProperly = true;
            continue;
        }
        
        // inicio de sección
        const section: Section = checkSectionHeader(line);

        if(section === 'none') {
            context?.hints?.addMark('error', "Se esperaba el inicio de una sección.", offsetRange({ startLine: 1+i, endLine: 1+i, columnStart: 1, columnEnd: 1+line.length }));
        } else if(section === 'generos') {
            const generos = line.slice('generos'.length).split(",").map(g => g.trim()).filter(g => g.length);

            for(let j = 0; j < generos.length; j++) {
                if(tad.generos.length > 0) {
                    // no es elegante pero funciona ¯\_(ツ)_/¯
                    const startWarning = line!.split(generos[j])[0].length;

                    context?.hints?.addMark('warning', `Especificar más de un género tendrá ningún efecto (no implementado).\nLos géneros ya especificados para este TAD son: ${tad.generos.join(', ')}`,
                        offsetRange({
                            startLine: i,
                            endLine: i,
                            columnStart: 1 + startWarning,
                            columnEnd: 1 + startWarning + generos[j].length
                        })
                    );
                }
                tad.generos.push(generos[j]);
            }
        } else if(section == 'igualdad') {
            // jaja saludos
        } else {
             // operaciones y axiomas
             
            let splitter: RegExp;
            if(section === 'axiomas') {
                splitter = /≡|={3}/;

                // variables libres de los axiomas
                const varLibres = line.slice('axiomas'.length);
                if(varLibres.trim().length > 0) {
                    tad.variablesLibres = parseVarLibres(varLibres, {
                        hints: context?.hints,
                        range: offsetRange({
                            startLine: i,
                            endLine: i,
                            columnStart: 1+'axiomas'.length+1,
                            columnEnd: 1+line.length
                        })
                    });
                }
            } else {
                splitter = /:/;
            }

            i++;

            let startLine = i;
            let left = "";
            let rightBuffer = "";
            for(;i < lines.length;){
                line = lines[i];

                if(checkSectionHeader(line) !== 'none' || line.toUpperCase().startsWith("FIN TAD")) {
                    i--;
                    break;
                }

                const split = line.split(splitter);
                if(split.length === 2) {
                    // anterior
                    if(left.length > 0) {
                        const ctx: ParseContext = {
                            hints: context?.hints,
                            range: offsetRange({ startLine: 1+startLine-1, endLine: 1+i-1, columnStart: 1, columnEnd: 1+line.length })
                        };
                        if(section === 'axiomas')
                            parseAxioma(left, rightBuffer, ctx);
                        else {
                            const op: Operacion | null = parseOperacion(left, rightBuffer, section, ctx);
                            if(op) tad.operaciones.push(op);
                        }
                    }
                    startLine = i;
                    left = split[0];
                    rightBuffer = split[1];
                } else {
                    rightBuffer += line;
                }

                i++;
            }
            if(left.length > 0){
                const ctx: ParseContext = {
                    hints: context?.hints,
                    range: offsetRange({ startLine: 1+startLine, endLine: 1+i, columnStart: 1, columnEnd: 1+line.length })
                };
                if(section === 'axiomas')
                    parseAxioma(left, rightBuffer, ctx);
                else {
                    const op: Operacion | null = parseOperacion(left, rightBuffer, section, ctx);
                    if(op) tad.operaciones.push(op);
                }
            }
        }
    }

    if(!closedProperly) {
        context?.hints?.addMark('error', `Se esperaba "FIN TAD" para ${tad.nombre}`, offsetRange({ startLine: lines.length, endLine: lines.length, columnStart: 1, columnEnd: 100 }));
    }

    return tad;
}

export function parseSource(source: string, hints?: EditorHints): TAD[] {
    const tads: TAD[] = [];
    const lines = source.replaceAll(/\r\n/g, '\n').split('\n');
    
    for(let i = 0; i < lines.length; i++){
        let line = lines[i];
        if(line.trim().length === 0)
            continue; // skip empty lines

        // empieza TAD
        if(line.toUpperCase().startsWith("TAD")) {
            const startLine = i;

            // copiamos todo el TAD hasta FIN TAD
            let buffer = line + '\n'; i++;
            while(i < lines.length) {
                line = lines[i];
                
                if(line.toUpperCase().startsWith("TAD")) {
                    i--;
                    break;
                } else {
                    buffer += line + '\n';
                    if(line.toUpperCase().startsWith("FIN TAD"))
                        break; // fin del tad
                }

                i++;
            }
            
            const tad: TAD | null = parseTad(buffer, {
                hints,
                range: {
                    startLine: 1 + startLine,
                    endLine: 1 + i,
                    columnStart: 1,
                    columnEnd: 1+line.length
                }
            });

            if(tad != null)
                tads.push(tad);
        } else {
            hints?.addMark('error', 'Se esperaba la definición de un TAD', { startLine: 1+i, endLine: 1+i, columnStart: 1, columnEnd: 1+line.length });
        }
    }

    return tads;
}



















