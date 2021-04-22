import fs from "fs";
import { parseSource } from "../parser/Parser";

import { Expr, Grammar, Operacion } from "../parser/Types";
import { fromExpr, genGrammar, toExpr } from "../parser/CustomBackend";
import { genGrammar as genGrammar_ref, toExpr as toExpr_ref } from "../parser/OhmBackend";
import { titleSlug } from "../parser/Util";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");
const INT_TAD = fs.readFileSync("tads/int.tad", "utf-8");
const CONJ_TAD = fs.readFileSync("tads/conj.tad", "utf-8");

const [tads] = parseSource([BOOL_TAD, NAT_TAD, INT_TAD, CONJ_TAD].join("\n"));

const grammar: Grammar = genGrammar(tads);
const ohmGrammar = genGrammar_ref(tads);

console.log(grammar.axiomas);

const statements: string[] = [
    ...new Set(
        fs
            .readFileSync("tests/evals.txt", "utf-8")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map(l => l.split("--")[0])
            .reduce((p: string[], c) => p.concat(c.split(" = ")), [])
            .filter(p => p.length) // saco los vacíos
    ),
];

const padSize = statements.reduce((p, c) => Math.max(p, c.length), 0);

it("vacio tiene que fallar", () => expect(toExpr("", grammar)).toBeNull());

for (const stmt of statements) {
    it("parsea --- " + stmt.padEnd(padSize), () => expect(toExpr(stmt, grammar)).not.toBeNull());
}

for (const stmt of statements) {
    it("stmt -> Expr -> stmt -> Expr --- " + stmt.padEnd(padSize), () => {
        const expr1 = toExpr(stmt, grammar);
        expect(expr1).not.toBeNull();
        const stmt2 = fromExpr(expr1!, grammar);
        expect(stmt2.length).toBeGreaterThan(0);
        const expr2 = toExpr(stmt2, grammar);
        expect(expr2).not.toBeNull();

        expect(expr1).toStrictEqual(expr2);
    });
}

const operaciones = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);
// estos son casos en que ohm retorna el arbol incorrecto
// y el custom el correcto
const excepciones_ohm = ["¬false ∨ ¬false", "+suc(0) + +suc(0)"];

for (const stmt of statements) {
    if (excepciones_ohm.includes(stmt)) continue;

    it("matchea ast ohm --- " + stmt.padEnd(padSize), () => {
        const expr = toExpr(stmt, grammar);
        const expr_ref = toExpr_ref(stmt, ohmGrammar);

        expect(expr).not.toBeNull();
        expect(expr_ref).not.toBeNull();

        // genera un nuevo arbol de ohm sin los __${i}
        function cleanOhmExpr(ohmExpr: Expr): Expr {
            const result: Expr = { type: ohmExpr.type.split("__")[0] };
            for (const i in ohmExpr) {
                if (i === "type") continue;
                result[i] = cleanOhmExpr(ohmExpr[i]);
            }
            return result;
        }

        function typeToOhmType(type: string): string {
            const op = operaciones.find(op => op.nombre === type);
            if (!op) return "NULL";
            return [op.tipo, op.nombre].reduce((p, e) => p + titleSlug(e), "");
        }

        // genera un nuevo arbol sin el genero y con los tipos
        // escritos en "formato de ohm"
        function cleanCustomExpr(expr: Expr): Expr {
            const result: Expr = { type: typeToOhmType(expr.type) };
            for (const i in expr) {
                if (i === "type" || i === "genero") continue;
                result[i] = cleanCustomExpr(expr[i]);
            }
            return result;
        }

        expect(cleanCustomExpr(expr!)).toStrictEqual(cleanOhmExpr(expr_ref!));
    });
}
