import { tokenizeGenero } from "./Genero";
import { Report } from "./Reporting";
import { RawAxioma, Eval, ExpresionLogica, Operacion, Slot, TAD, Token, VariablesLibres } from "./Types";

type Section =
    | "none"
    | "parametros"
    | "generos"
    | "igualdad"
    | "observadores"
    | "generadores"
    | "otras operaciones"
    | "axiomas";

function checkSectionHeader(line: string): Section {
    line = line.trimRight();
    if (line.match(/\s+g[ée]neros/i)) return "parametros";
    if (line.match(/^g[ée]neros/i)) return "generos";
    if (line.match(/^ig(ualdad)? ?obs(ervacional)?$/i)) return "igualdad";
    if (line.match(/^obs(ervadores b[áa]sicos)?$/i)) return "observadores";
    if (line.match(/^gen(eradores)?$/i)) return "generadores";
    if (line.match(/^otras ?op(eraciones)?$/i)) return "otras operaciones";
    if (line.match(/^axiomas/i)) return "axiomas";
    return "none";
}

export function parseExpresionLogica(input: string, report?: Report): ExpresionLogica | null {
    // TODO: =)
    return null;
}

export function parseVarLibres(input: string, report?: Report): VariablesLibres {
    //context?.hints?.addMark('info', 'variables libres', context.range);
    const result: VariablesLibres = {};

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

            for (const _var of vars) result[_var] = { base: gen, parametros: {} }; // TODO: parametros
        });

    return result;
}

export function parseAxioma(left: string, right: string, report?: Report): RawAxioma {
    const axioma: RawAxioma = { left, right };
    return axioma;
}

export function parseOperacion(left: string, right: string, section: Section, report?: Report): Operacion | null {
    // left:   • ∨L •
    // right   bool × bool  → bool {restriccion}

    //context?.hints?.addMark('info', `${section}: ${left.length} / ${right.length}`, context.range);
    // TODO: =)

    left = left.trim();
    right = right.split("{")[0];

    const sectionToOpType = (section: Section) => {
        if (section === "observadores") return "observador";
        if (section === "generadores") return "generador";
        return "otra";
    };

    const op: Operacion = {
        nombre: left.replace(/ /g, "").trim(),
        type: sectionToOpType(section),
        tokens: [],
        retorno: { base: "<bad>", parametros: {} },
        // restriccion: []
    };

    const [_args, retorno] = right.split(/->|→/);
    const args = _args
        .split(/×|✕/)
        .map(arg => arg.trim())
        .map(arg => arg.split(" ")[0]) // TODO: esto saca los nombres de las variables! ej: "nat n"
        .filter(arg => arg !== "");
    let ithSlot = 0;

    let hasSlots = false;
    while (left !== "") {
        const i = left.indexOf("•");
        if (i == 0) {
            const genName: string = args[ithSlot++];
            const slot: Slot = { type: "slot", genero: { base: genName, parametros: {} } }; // TODO: PARAMETROS
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
            genero: { base: gen, parametros: {} }, // TODO: PARAMETROS
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

    op.retorno = { base: retorno.trim(), parametros: {} }; // TODO: parametros

    return op;
}

export function parseTad(source: string, report?: Report): TAD | null {
    const lines = source
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(l => l.split("--")[0].trimRight());
    const tad: TAD = {
        nombre: "",
        parametros: [],
        genero: "",
        generoTokenizado: [],
        operaciones: [],
        variablesLibres: {},
        rawAxiomas: [],
    };

    let closedProperly = false;
    let line;
    let pos = 0;
    for (let i = 0; i < lines.length; i++, pos += line.length + 1) {
        line = lines[i];

        if (line.trim().length === 0) continue; // skip empty lines

        if (tad.nombre === "") {
            if (line.toUpperCase().startsWith("TAD")) {
                tad.nombre = line.slice("TAD".length).trim();
                if (tad.nombre.length === 0) {
                    i--;
                    pos -= line.length + 1;
                    report?.addMark("error", "Nombre del TAD incompleto", pos, 3);
                    return null;
                }
            } else {
                report?.addMark("error", "Se esperaba la definición de un TAD", pos, 5);
                return null;
            }
            continue;
        }

        if (line.toUpperCase().startsWith("FIN TAD")) {
            if (closedProperly) {
                report?.addMark("error", "El TAD ya estaba cerrado", pos, line.length);
            }
            closedProperly = true;
            continue;
        }

        if (line.trim() === "parametros formales") continue; // no es elegante pero funciona saludos

        // inicio de sección
        const section: Section = checkSectionHeader(line);

        if (section === "none") {
            /*context?.hints?.addMark(
                "error",
                "Se esperaba el inicio de una sección.",
                offsetRange({
                    startLine: 1 + i,
                    endLine: 1 + i,
                    columnStart: 1,
                    columnEnd: 1 + line.length,
                })
            );*/
        } else if (section === "generos") {
            if (tad.genero.length > 0) {
                // TODO: warning
            }
            tad.genero = line.slice("generos".length).trim();
        } else if (section == "parametros") {
            const parametros = line
                .trim()
                .slice("generos".length)
                .split(",")
                .map(g => g.trim())
                .filter(g => g.length);

            tad.parametros = tad.parametros.concat(parametros);
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
                    tad.variablesLibres = parseVarLibres(varLibres, report);
                }
            } else {
                splitter = /:/;
            }

            i++;
            pos += line.length + 1;

            const axStep = (left: string, rightBuffer: string) => {
                if (left.length > 0) {
                    if (section === "axiomas") tad.rawAxiomas.push(parseAxioma(left, rightBuffer));
                    else {
                        const op: Operacion | null = parseOperacion(left, rightBuffer, section);
                        if (op) tad.operaciones.push(op);
                    }
                }
            };

            let startLine = i;
            let left = "";
            let rightBuffer = "";
            for (; i < lines.length; i++, pos += line.length + 1) {
                line = lines[i];

                if (line.toLowerCase().startsWith("eval")) {
                    /*context?.hints?.addMark(
                        "error",
                        "Los evals no pueden estar adentro de los TADs",
                        offsetRange({
                            startLine: 1 + i - 1,
                            endLine: 1 + i - 1,
                            columnStart: 1,
                            columnEnd: 1 + line.length,
                        })
                    );*/
                    continue;
                }

                if (checkSectionHeader(line) !== "none" || line.toUpperCase().startsWith("FIN TAD")) {
                    i--;
                    pos -= line.length + 1;
                    break;
                }

                const split = line.split(splitter);
                if (split.length === 2) {
                    // anterior
                    axStep(left, rightBuffer);
                    startLine = i;
                    left = split[0];
                    rightBuffer = split[1];
                } else {
                    rightBuffer += line;
                }
            }
            axStep(left, rightBuffer);
        }
    }

    if (!closedProperly) {
        report?.addMark("error", `Se esperaba "FIN TAD" para ${tad.nombre}`, pos, 1);
    }

    tad.generoTokenizado = tokenizeGenero(tad.genero, tad.parametros);

    return tad;
}

export function parseSource(source: string, report?: Report): [TAD[], Eval[]] {
    source = source.replace(/\r\n/g, "\n");

    const tads: TAD[] = [];
    const evals: Eval[] = [];
    const lines = source.split("\n");

    let pos = 0;
    let line;
    for (let i = 0; i < lines.length; i++, pos += line.length + 1) {
        line = lines[i];

        if (line.trim().length === 0) continue; // skip empty lines

        // empieza TAD
        if (line.toLowerCase().startsWith("eval")) {
            // ok
            evals.push({
                expr: line.slice("eval".length),
            });
        } else if (line.toUpperCase().startsWith("TAD")) {
            const startLine = i;

            report?.push(pos);
            // copiamos todo el TAD hasta FIN TAD
            let buffer = line + "\n";
            i++;
            pos += line.length;
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
                pos += line.length;
            }

            const tad: TAD | null = parseTad(buffer, report);
            report?.pop();

            if (tad != null) tads.push(tad);
        } else {
            report?.addMark("error", "Se esperaba la definición de un TAD", pos, line.length);
        }
    }

    return [tads, evals];
}
