import { RawAxioma, Eval, ExpresionLogica, Genero, Operacion, Range, Slot, TAD, Token } from "./Types";

type MarkerSeverity = "error" | "warning" | "info" | "hint";

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
};

type Section = "none" | "generos" | "igualdad" | "observadores" | "generadores" | "otras operaciones" | "axiomas";

function checkSectionHeader(line: string): Section {
    line = line.trimRight();
    if (line.match(/^g[ée]neros/i)) return "generos";
    if (line.match(/^ig(ualdad)? ?obs(ervacional)?$/i)) return "igualdad";
    if (line.match(/^obs(ervadores b[áa]sicos)?$/i)) return "observadores";
    if (line.match(/^gen(eradores)?$/i)) return "generadores";
    if (line.match(/^otras ?op(eraciones)?$/i)) return "otras operaciones";
    if (line.match(/^axiomas/i)) return "axiomas";
    return "none";
}

export function parseExpresionLogica(input: string, context?: ParseContext): ExpresionLogica | null {
    // TODO: =)
    return null;
}

export function parseVarLibres(input: string, context?: ParseContext): Map<Genero, string[]> {
    //context?.hints?.addMark('info', 'variables libres', context.range);
    const result = new Map<Genero, string[]>();

    input
        .split("∀")
        .map(l => l.trim().split(":"))
        .filter(a => a.length === 2)
        .forEach(([_vars, gen]) => {
            const vars = _vars
                .split(",")
                .map(v => v.trim())
                .filter(v => v.length);
            gen = gen.replace(/,/g, "").trim();

            result.set(gen, vars);
        });

    return result;
}

export function parseAxioma(left: string, right: string, context?: ParseContext): RawAxioma {
    const axioma: RawAxioma = [left, right];
    axioma.range = context?.range;
    return axioma;
}

export function parseOperacion(
    left: string,
    right: string,
    section: Section,
    context?: ParseContext
): Operacion | null {
    // left:   • ∨L •
    // right   bool × bool  → bool {restriccion}

    //context?.hints?.addMark('info', `${section}: ${left.length} / ${right.length}`, context.range);
    // TODO: =)

    left = left.trim();
    right = right.split("{")[0];

    const sectionToOpType = (section: Section) => {
        if (section === "observadores") return "basico";
        if (section === "generadores") return "generador";
        return "otra";
    };

    const op: Operacion = {
        nombre: left.replace(/ /g, "").trim(),
        tipo: sectionToOpType(section),
        tokens: [],
        retorno: "",
        // restriccion: []
    };

    const [_args, retorno] = right.split(/->|→/);
    const args = _args
        .split(/×|✕/)
        .map(arg => arg.trim())
        .map(arg => arg.split(' ')[0]) // TODO: esto saca los nombres de las variables! ej: "nat n"
        .filter(arg => arg !== "");
    let ithSlot = 0;

    let hasSlots = false;
    while (left !== "") {
        const i = left.indexOf("•");
        if (i == 0) {
            const genName: string = args[ithSlot++];
            const slot: Slot = { type: "slot", genero: genName };
            op.tokens.push(slot);
            hasSlots = true;

            left = left.substr(1);
        } else if (i == -1) {
            op.tokens.push({ type: "literal", symbol: left.trim() });
            left = "";
        } else {
            op.tokens.push({
                type: "literal",
                symbol: left.substr(0, i).trim(),
            });
            left = left.substr(i);
        }
    }

    if (!hasSlots && args.length > 0) {
        const functionStyleArgs: Token[] = args.map(gen => ({
            type: "slot",
            genero: gen,
        }));

        const parenLeft: Token = { type: "literal", symbol: "(" };
        const comma: Token = { type: "literal", symbol: "," };
        const parenRight: Token = { type: "literal", symbol: ")" };

        op.tokens.push(parenLeft);

        functionStyleArgs.forEach((t, i) => {
            if (i > 0) op.tokens.push(comma);
            op.tokens.push(t);
        });

        op.tokens.push(parenRight);
    }

    op.retorno = retorno.trim();

    return op;
}

export function parseTad(source: string, context?: ParseContext): TAD | null {
    const lines = source
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(l => l.split("--")[0].trimRight());
    const tad: TAD = {
        nombre: "",
        generos: [],
        operaciones: [],
        variablesLibres: new Map<Genero, string[]>(),
        axiomas: [],
        range: context?.range,
    };

    function offsetRange(range: Range) {
        return {
            startLine: (context?.range.startLine || 1) + range.startLine,
            endLine: (context?.range.startLine || 1) + range.endLine,
            columnStart: range.columnStart,
            columnEnd: range.columnEnd,
        };
    }

    let closedProperly = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.trim().length === 0) continue; // skip empty lines

        if (tad.nombre === "") {
            if (line.toUpperCase().startsWith("TAD")) {
                tad.nombre = line.slice("TAD".length).trim();
                if (tad.nombre.length === 0) {
                    i--;
                    context?.hints?.addMark(
                        "error",
                        "Nombre del TAD incompleto",
                        offsetRange({
                            startLine: 1 + i,
                            endLine: 1 + i,
                            columnStart: 4,
                            columnEnd: 5,
                        })
                    );
                    return null;
                }
            } else {
                context?.hints?.addMark(
                    "error",
                    "Se esperaba la definición de un TAD",
                    offsetRange({
                        startLine: 1 + i,
                        endLine: 1 + i,
                        columnStart: 1,
                        columnEnd: 1 + line.length,
                    })
                );
                return null;
            }
            continue;
        }

        if (line.toUpperCase().startsWith("FIN TAD")) {
            if (closedProperly) {
                context?.hints?.addMark(
                    "error",
                    "El TAD ya estaba cerrado",
                    offsetRange({
                        startLine: 1 + i,
                        endLine: 1 + i,
                        columnStart: 1,
                        columnEnd: 1 + line.length,
                    })
                );
            }
            closedProperly = true;
            continue;
        }

        // inicio de sección
        const section: Section = checkSectionHeader(line);

        if (section === "none") {
            context?.hints?.addMark(
                "error",
                "Se esperaba el inicio de una sección.",
                offsetRange({
                    startLine: 1 + i,
                    endLine: 1 + i,
                    columnStart: 1,
                    columnEnd: 1 + line.length,
                })
            );
        } else if (section === "generos") {
            const generos = line
                .slice("generos".length)
                .split(",")
                .map(g => g.trim())
                .filter(g => g.length);

            for (let j = 0; j < generos.length; j++) {
                if (tad.generos.length > 0) {
                    // no es elegante pero funciona ¯\_(ツ)_/¯
                    const startWarning = line!.split(generos[j])[0].length;

                    context?.hints?.addMark(
                        "warning",
                        `Especificar más de un género tendrá ningún efecto (no implementado).\nLos géneros ya especificados para este TAD son: ${tad.generos.join(
                            ", "
                        )}`,
                        offsetRange({
                            startLine: i,
                            endLine: i,
                            columnStart: 1 + startWarning,
                            columnEnd: 1 + startWarning + generos[j].length,
                        })
                    );
                }
                tad.generos.push(generos[j]);
            }
        } else if (section == "igualdad") {
            // jaja saludos
        } else {
            // operaciones y axiomas

            let splitter: RegExp;
            if (section === "axiomas") {
                splitter = /≡|={3}/;

                // variables libres de los axiomas
                const varLibres = line.slice("axiomas".length);
                if (varLibres.trim().length > 0) {
                    tad.variablesLibres = parseVarLibres(varLibres, {
                        hints: context?.hints,
                        range: offsetRange({
                            startLine: i,
                            endLine: i,
                            columnStart: 1 + "axiomas".length + 1,
                            columnEnd: 1 + line.length,
                        }),
                    });
                }
            } else {
                splitter = /:/;
            }

            i++;

            let startLine = i;
            let left = "";
            let rightBuffer = "";
            for (; i < lines.length; ) {
                line = lines[i];

                if (line.toLowerCase().startsWith("eval")) {
                    context?.hints?.addMark(
                        "error",
                        "Los evals no pueden estar adentro de los TADs",
                        offsetRange({
                            startLine: 1 + i - 1,
                            endLine: 1 + i - 1,
                            columnStart: 1,
                            columnEnd: 1 + line.length,
                        })
                    );
                    i++;
                    continue;
                }

                if (checkSectionHeader(line) !== "none" || line.toUpperCase().startsWith("FIN TAD")) {
                    i--;
                    break;
                }

                const split = line.split(splitter);
                if (split.length === 2) {
                    // anterior
                    if (left.length > 0) {
                        const ctx: ParseContext = {
                            hints: context?.hints,
                            range: offsetRange({
                                startLine: 1 + startLine - 1,
                                endLine: 1 + i - 1,
                                columnStart: 1,
                                columnEnd: 1 + line.length,
                            }),
                        };
                        if (section === "axiomas") tad.axiomas.push(parseAxioma(left, rightBuffer, ctx));
                        else {
                            const op: Operacion | null = parseOperacion(left, rightBuffer, section, ctx);
                            if (op) tad.operaciones.push(op);
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
            if (left.length > 0) {
                const ctx: ParseContext = {
                    hints: context?.hints,
                    range: offsetRange({
                        startLine: 1 + startLine - 1,
                        endLine: 1 + i - 1,
                        columnStart: 1,
                        columnEnd: 1 + line.length,
                    }),
                };
                if (section === "axiomas") tad.axiomas.push(parseAxioma(left, rightBuffer, ctx));
                else {
                    const op: Operacion | null = parseOperacion(left, rightBuffer, section, ctx);
                    if (op) tad.operaciones.push(op);
                }
            }
        }
    }

    if (!closedProperly) {
        context?.hints?.addMark(
            "error",
            `Se esperaba "FIN TAD" para ${tad.nombre}`,
            offsetRange({
                startLine: lines.length,
                endLine: lines.length,
                columnStart: 1,
                columnEnd: 100,
            })
        );
    }

    return tad;
}

export function parseSource(source: string, hints?: EditorHints): [TAD[], Eval[]] {
    const tads: TAD[] = [];
    const evals: Eval[] = [];
    const lines = source.replace(/\r\n/g, "\n").split("\n");

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim().length === 0) continue; // skip empty lines

        // empieza TAD
        if (line.toLowerCase().startsWith("eval")) {
            // ok
            evals.push({
                expr: line.slice("eval".length),
                range: {
                    startLine: 1 + i,
                    endLine: 1 + i,
                    columnStart: 1,
                    columnEnd: 1 + line.length,
                },
            });
        } else if (line.toUpperCase().startsWith("TAD")) {
            const startLine = i;

            // copiamos todo el TAD hasta FIN TAD
            let buffer = line + "\n";
            i++;
            while (i < lines.length) {
                line = lines[i];

                if (line.toUpperCase().startsWith("TAD")) {
                    i--;
                    break;
                } else {
                    buffer += line + "\n";
                    if (line.toUpperCase().startsWith("FIN TAD")) break; // fin del tad
                }

                i++;
            }

            const tad: TAD | null = parseTad(buffer, {
                hints,
                range: {
                    startLine: 1 + startLine,
                    endLine: 1 + i,
                    columnStart: 1,
                    columnEnd: 1 + line.length,
                },
            });

            if (tad != null) tads.push(tad);
        } else {
            hints?.addMark("error", "Se esperaba la definición de un TAD", {
                startLine: 1 + i,
                endLine: 1 + i,
                columnStart: 1,
                columnEnd: 1 + line.length,
            });
        }
    }

    return [tads, evals];
}
