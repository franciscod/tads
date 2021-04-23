import fs from "fs";

export const EVALS_TXT = fs.readFileSync("tests/evals.txt", "utf-8");
export const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
export const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");
export const INT_TAD = fs.readFileSync("tads/int.tad", "utf-8");
export const PAR_TAD = fs.readFileSync("tads/par.tad", "utf-8");
export const CONJ_TAD = fs.readFileSync("tads/conj.tad", "utf-8");

export const TADS = [BOOL_TAD, NAT_TAD, INT_TAD, PAR_TAD, CONJ_TAD];

export const EVALS: { left: string; right: string; line: number }[] = EVALS_TXT.replace(/\r\n/g, "\n")
    .split("\n")
    .map((l, i) => {
        l = l.split("--")[0];
        if (!l) return { left: "", right: "", line: -1 };

        const s = l.split(" = ");
        return {
            left: s[0],
            right: s[1],
            line: i,
        };
    })
    .filter(e => e.line > 0);

// los statements son todas expresiones validas
// sacadas de ambos lados de los evals
// sirven para checkear parsing y otras cosas
export const STATEMENTS: string[] = Array.from(
    new Set(EVALS.reduce((p: string[], c) => p.concat(c.left, c.right), []))
);
