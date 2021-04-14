type ExpresionLogica = any;  // TODO

type Operacion = [string, string[], string, ExpresionLogica?];

type TAD = {
    nombre: string;
    generos: string[];
    generadores: Operacion[];
    otrasOperaciones: Operacion[];
};

export function parseTad(source: string) : TAD {
    let tad: TAD = {
        nombre: "",
        generos: [],
        generadores: [],
        otrasOperaciones: [],
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
                target.push(parseOperacion(line));
            }
        }

    })

    return tad;
}

function parseOperacion(line: string) : Operacion {
    let [_name, line2] = line.split(":")
    let [_args, line3] = line2.split("→")
    let [_ret, ...rest] = line3.trim().split(" ")
    let restr = null  // TODO

    let name = _name.trim()

    if (name.includes("•")) {
        name = name.split("•").map((name) => name.trim()).join("•")
    }

    let args = _args.split("×").map((name) => name.trim()).filter((name) => name !== "")
    const ret = _ret.trim()

    return [name, args, ret, restr]
}
