import fs from "fs";

export const EVALS_TXT = fs.readFileSync("tests/casos_eval.txt", "utf-8");
export const INVALIDS_TXT = fs.readFileSync("tests/casos_noparse.txt", "utf-8");
export const VALIDS_TXT = fs.readFileSync("tests/casos_parse.txt", "utf-8");
export const IGOBS_TXT = fs.readFileSync("tests/casos_igobs.txt", "utf-8");
export const NOIGOBS_TXT = fs.readFileSync("tests/casos_noigobs.txt", "utf-8");

export const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
export const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");
export const INT_TAD = fs.readFileSync("tads/int.tad", "utf-8");
export const PAR_TAD = fs.readFileSync("tads/par.tad", "utf-8");
export const CONJ_TAD = fs.readFileSync("tads/conj.tad", "utf-8");
export const SECU_TAD = fs.readFileSync("tads/secu.tad", "utf-8");
export const ARBOL_BINARIO_TAD = fs.readFileSync("tads/arbolbinario.tad", "utf-8");
export const ARREGLO_TAD = fs.readFileSync("tads/arreglo.tad", "utf-8");
export const COLA_TAD = fs.readFileSync("tads/cola.tad", "utf-8");
export const COLA_PRIORIDAD_TAD = fs.readFileSync("tads/colaprioridad.tad", "utf-8");
export const DICCIONARIO_TAD = fs.readFileSync("tads/diccionario.tad", "utf-8");
export const PILA_TAD = fs.readFileSync("tads/pila.tad", "utf-8");
export const TESTS_TAD = fs.readFileSync("tads/tests.tad", "utf-8");

export const TADS = [
    BOOL_TAD,
    NAT_TAD,
    INT_TAD,
    PAR_TAD,
    CONJ_TAD,
    SECU_TAD,
    ARBOL_BINARIO_TAD,
    ARREGLO_TAD,
    COLA_TAD,
    COLA_PRIORIDAD_TAD,
    DICCIONARIO_TAD,
    PILA_TAD,
    
    TESTS_TAD
];

function parsePares(input: string, sep: string): { left: string; right: string; line: number }[] {
    return input
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((l, i) => {
            l = l.split("--")[0];
            if (!l) return { left: "", right: "", line: -1 };

            const s = l.split(sep);
            return {
                left: s[0],
                right: s[1],
                line: i
            };
        })
        .filter(e => e.line >= 0);
}

export const EVALS = parsePares(EVALS_TXT + IGOBS_TXT + NOIGOBS_TXT, " -> ");

// los statements son todas expresiones validas
// sacadas de ambos lados de los evals
// sirven para checkear parsing y otras cosas
const EVAL_STATEMENTS: string[] = Array.from(new Set(EVALS.reduce((p: string[], c) => p.concat(c.left, c.right), [])));

// estos son statements que deberían fallar al parsear
export const INVALID_STATEMENTS: string[] = INVALIDS_TXT.replace(/\r\n/g, "\n")
    .split("\n")
    .map(l => l.split("--")[0])
    .filter(l => l.length > 0);

// estos son statements que no deberían fallar al parsear
export const VALID_STATEMENTS: string[] = VALIDS_TXT.replace(/\r\n/g, "\n")
    .split("\n")
    .map(l => l.split("--")[0])
    .filter(l => l.length > 0)
    .concat(EVAL_STATEMENTS);
