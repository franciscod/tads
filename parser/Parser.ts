import { tokenizeGenero } from "./Genero";
import { Report } from "./Reporting";
import { Operacion, RawEval, Slot, TAD, Token, VariablesLibres } from "./Types";

type Section =
    | "none"
    | "generos"
    | "usa"
    | "exporta"
    | "igualdad"
    | "observadores"
    | "generadores"
    | "otras operaciones"
    | "axiomas";

function checkSectionHeader(line: string): Section {
    line = line.trimRight();
    if (line.match(/g[ée]neros/i)) return "generos";
    if (line.match(/^exporta/i)) return "exporta";
    if (line.match(/^usa/i)) return "usa";
    if (line.match(/^ig(ualdad)? ?obs(ervacional)?$/i)) return "igualdad";
    if (line.match(/^obs(ervadores b[áa]sicos)?$/i)) return "observadores";
    if (line.match(/^gen(eradores)?$/i)) return "generadores";
    if (line.match(/^otras ?op(eraciones)?$/i)) return "otras operaciones";
    if (line.match(/^axiomas/i)) return "axiomas";
    return "none";
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


/**
 * Parsea múltiples TADs en un mismo archivo fuente
 */
export function parseTADs(source: string, report?: Report): [TAD[], RawEval[]] {
    // reemplazamos \r\n por \n Y
    // reemplazamos los comments con espacios (slow?)
    source = source.split(/\r?\n/g).map(l => {
        let split = l.split("--");
        return split[0] + " ".repeat(l.length - split[0].length);
    }).join("\n");
    
    const lines = source.split("\n");

    const tads: TAD[] = [];
    const evals: RawEval[] = [];

    let offset = 0, index = 0, enTad = false, lastSection: Section = "none";
    while(index < lines.length) {
        const line = lines[index];
        const lineUpper = line.toUpperCase();

        if(line.trim().length === 0) {
            // salteamos las líneas vacías
            offset += line.length + 1;
            index++;
            continue;
        }

        if(lineUpper.startsWith("TAD")) {
            // empieza un nuevo TAD

            if(enTad) {
                // ya estaba en un TAD, asumo que se olvidaron un "FIN TAD"
                report?.addMark("warning", `No se esperaba el inicio de un TAD. Te olvidaste de un "FIN TAD"?`, offset, line.length);
                // igualmente abrimos el nuevo
            }

            const nombre = line.slice("TAD".length).trim();
            if (nombre.length === 0) {
                // el nombre está vacío, no abrimos un nuevo TAD
                report?.addMark("error", `Se esperaba el nombre de un TAD`, offset + line.length, 1);
            } else {
                tads.push({
                    nombre,
                    parametros: [],
                    genero: "",
                    generoTokenizado: [],
                    operaciones: [],
                    rawAxiomas: [],
                    variablesLibres: { }
                });
                enTad = true;
                lastSection = "none";
            }
        } else if(lineUpper.startsWith("FIN TAD")) {
            if(enTad) {
                // cerramos el TAD
                enTad = false;
            } else {
                // no había un TAD abierto
                report?.addMark("warning", `No se esperaba el fin de un TAD.`, offset, line.length);
            }
        } else if(lineUpper.startsWith("EVAL ") || lineUpper.startsWith("ASSERT ")) {
            const kind = lineUpper[0] === 'E' ? 'eval' : 'assert';
            const evalStartOffset = offset + kind.length;
            
            // esta línea la uso para el eval, avanzo
            offset += line.length + 1;
            index++;
            
            // veo si puedo consumir más líneas
            // los eval y assert se leen hasta la siguiente línea que NO empiece con whitespace (y no sea vacía)
            while(
                // tenga más líneas
                index < lines.length &&
                // no sea vacía
                lines[index].length !== 0 &&
                // y empiece con whitespace
                (lines[index][0] === ' ' || lines[index][0] === '\t')
            ) {
                // avanzamos a la línea siguiente
                offset += lines[index].length + 1;
                index++;
            }

            evals.push({
                expr: {
                    source: source.substring(evalStartOffset, offset).trim(),
                    offset: evalStartOffset
                },
                kind
            });

            // ya avancé las líneas, me salteo el avanzar
            continue;
        } else if(enTad) {
            const paramRegex = /^par[áa]metros( formales)?/i;
            const tad: TAD = tads[tads.length - 1];
            const section: Section = checkSectionHeader(line);

            if (line.match(paramRegex)) {
                // esta línea sólo me importa si abajo tiene una de género, por ahora la skipeo
                offset += line.length + 1;
                index++;
                lastSection = "none";
                continue;
            }

            if (section === "none") {
                if(lastSection === "none") {
                    report?.addMark("error", "Se esperaba el inicio de una sección.", offset, line.length);
                } else if(lastSection === "axiomas" || lastSection === "observadores" || lastSection === "generadores" || lastSection === "otras operaciones") {
                    // leemos el siguiente axioma/operacion
                    const splitter = /≡|={3}|:/;

                    const split = line.split(splitter);
                    if(split.length === 1) {
                        // si no se pudo splitear, significa que la línea no era un axioma / op
                        if(lastSection === "axiomas") {
                            report?.addMark("error", "Se esperaba un axioma.", offset, line.length);
                        } else {
                            report?.addMark("error", "Se esperaba la definición de una operación.", offset, line.length);
                        }
                    } else {
                        const leftOffset = offset;
                        const rightOffset = offset + line.length - split[1].length;
                        
                        // esta línea la uso para el axioma/operación, avanzo
                        offset += line.length + 1;
                        index++;
                        
                        // veo si puedo consumir más líneas
                        // los axiomas y ops se leen hasta la siguiente línea que contenga al splitter o el inicio de una nueva sección y no sea vacía
                        while(
                            // tenga más líneas
                            index < lines.length &&
                            // no sea vacía
                            lines[index].length !== 0 &&
                            // y no tenga al splitter
                            !lines[index].match(splitter) &&
                            // no sea el inicio de una sección
                            checkSectionHeader(lines[index]) === "none"
                        ) {
                            // avanzamos a la línea siguiente
                            offset += lines[index].length + 1;
                            index++;
                        }

                        const leftPart = split[0];
                        const rightPart = source.substring(rightOffset, offset);

                        if (lastSection === "axiomas") {
                            tad.rawAxiomas.push({
                                left: {
                                    source: leftPart,
                                    offset: leftOffset
                                },
                                right: {
                                    source: rightPart,
                                    offset: rightOffset
                                }
                            });
                        }
                        else {
                            // TODO: ver
                            report?.push(leftOffset);
                            const op: Operacion | null = parseOperacion(leftPart, rightPart, lastSection, report);
                            report?.pop();
                            if (op) tad.operaciones.push(op);
                        }

                        // ya avanzamos la línea
                        continue;
                    }
                }
            } else {
                // nueva sección, reiniciamos
                lastSection = "none";

                if (section === "generos") {

                    // si la línea anterior contenía "parametros formales" entonces se trata de parámetros y no del género del TAD
                    if(lines[index - 1].match(paramRegex)) {
                        // se trata de parámetros
                        const parametros = line
                            .trim()
                            .slice("generos".length)
                            .split(",")
                            .map(g => g.trim())
                            .filter(g => g.length);

                        tad.parametros = tad.parametros.concat(parametros);
                    } else {
                        // se trata del género del TAD
                        if (tad.genero.length > 0) {
                            report?.addMark("warning", "Este TAD ya tenía géneros. Esta línea será ignorada.", offset, line.length);
                        } else {
                            tad.genero = line.slice("generos".length).trim();
                        }
                    }
                } else if(section == "usa" || section == "exporta") {
                    // TODO: usa & exporta
                } else if (section == "igualdad") {
                    // jaja saludos
                    lastSection = "igualdad";
                } else {
                    // operaciones y axiomas
                    
                    // variables libres de los axiomas
                    if (section === "axiomas") {
                        const varLibres = line.slice("axiomas".length);
                        if (varLibres.trim().length > 0) {
                            report?.push(offset + "axiomas".length);
                            tad.variablesLibres = parseVarLibres(varLibres, report);
                            report?.pop();
                        }
                    }
                    
                    lastSection = section;
                }
            }
        } else {
            // estamos afuera de un TAD y no es la definición de un TAD ni un assert o eval, mostramos un error
            report?.addMark("warning", `Se esperaba la definición de un TAD`, offset, line.length);
        }

        // avanzamos a la línea siguiente
        offset += line.length + 1;
        index++;
    }

    if(enTad) {
        report?.addMark("warning", `Se esperaba "FIN TAD"`, offset - 1, 1);
    }

    for(const tad of tads) {
        tad.generoTokenizado = tokenizeGenero(tad.genero, tad.parametros);

        // check: ver si el TAD tiene un género
        if(tad.genero.length === 0) {
            // TODO: error
        }
    }

    return [tads, evals];
}
