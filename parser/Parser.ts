import { Aplicacion, Axioma, ExpresionLogica, Genero, Literal, Nodo,
         Operacion, Slot, TAD, Token, Variable } from "./Types.ts";

export function parseTad(source: string) : TAD {
    let tad: TAD = {
        nombre: "",
        generos: [],
        generadores: [],
        otrasOperaciones: [],
        variablesLibres: []
    };

    let mode = "base";
    let target = undefined;

    source.split('\n').forEach((line) => {
        line = line.split('--')[0].trim()

        if (mode === "base") {
            if (line.startsWith("TAD ")) {
                tad.nombre = line.split("TAD ")[1];
            }

            if (line.startsWith("géneros ")) {
                let gens = line.split(' ');
                gens.shift();

                tad.generos = gens;
            }

            if (line.startsWith("generadores")) {
                mode = "operacion";
                target = tad.generadores;
            }

            if (line.startsWith("otras operaciones")) {
                mode = "operacion";
                target = tad.otrasOperaciones;
            }
        } else if (mode === "operacion") {
            if (line.trim() === "") {
                mode = "base";
            } else {
                target.push(parseOperacion(line, tad));
            }
        }
    })

    return tad;
}

export function parseOperacion(line: string, tad: TAD) : Operacion {
    let [_nombre, line2] = line.split(":")
    let [_args, line3] = line2.split("→")
    let [_ret, ...rest] = line3.trim().split(" ")
    let restr = null  // TODO

    let nombre = _nombre.trim()

    let tokens: Token[] = [];
    let slots = [];

    let args = _args.split("×").map((arg) => arg.trim()).filter((arg) => arg !== "")

    let tokenSource = nombre;
    while (tokenSource !== "") {
        const i = tokenSource.indexOf("•");
        if (i == 0) {
            const genName: string = args[slots.length];
            let gen: Genero = genName;
            if (tad.generos.includes(genName)) {
                if (genName === tad.generos[0]) {
                    gen = tad;
                }
            }
            const slot: Slot = {"type": "slot", "genero": gen};
            tokens.push(slot);
            slots.push(slot);

            tokenSource = tokenSource.substr(1);
        } else if (i == -1) {
            tokens.push({"type": "literal", "symbol": tokenSource.trim()});
            tokenSource = "";
        } else {
            tokens.push({"type": "literal", "symbol": tokenSource.substr(0, i).trim()});
            tokenSource = tokenSource.substr(i);
        }
    }

    if (nombre.includes("•")) {
        nombre = nombre.split("•").map((part) => part.trim()).join("•")
    }

    const retorno = _ret.trim()

    return {
        nombre,
        tokens,
        retorno,
        axiomas: [],  // TODO
    }
}
