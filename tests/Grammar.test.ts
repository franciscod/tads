import { parseSource } from "../parser/Parser";

import { Expr, Operacion } from "../parser/Types";
import { fromExpr, genGrammar, toExpr } from "../parser/CustomBackend";
import { genGrammar as genGrammar_ohm, toExpr as toExpr_ohm } from "../parser/OhmBackend";
import { titleSlug } from "../parser/Util";

import { STATEMENTS, TADS } from "./Common";

const [tads] = parseSource(TADS.join("\n"));

const grammar = genGrammar(tads);
const ohmGrammar = genGrammar_ohm(tads);

const padSize = 60;

it("vacio tiene que fallar", () => expect(toExpr("", grammar)).toBeNull());

for (const stmt of STATEMENTS) {
    it("parsea --- " + stmt.padEnd(padSize), () => expect(toExpr(stmt, grammar)).not.toBeNull());
}

for (const stmt of STATEMENTS) {
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

for (const stmt of STATEMENTS) {
    if (excepciones_ohm.includes(stmt)) continue;

    // este test volará algún día?
    it("matchea ast ohm --- " + stmt.padEnd(padSize), () => {
        const expr = toExpr(stmt, grammar);
        const expr_ref = toExpr_ohm(stmt, ohmGrammar);

        expect(expr).not.toBeNull();
        expect(expr_ref).not.toBeNull();

        type ArbolAComparar = {
            nombre: string;
            [index: number]: ArbolAComparar;
        };

        // genera un nuevo arbol de ohm sin los __${i}
        function cleanOhmExpr(ohmExpr: any): ArbolAComparar {
            const result: ArbolAComparar = { nombre: ohmExpr.type.split("__")[0] };
            for (const i in ohmExpr) {
                if (i === "type") continue;
                result[(i as unknown) as number] = cleanOhmExpr(ohmExpr[i]);
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
        function cleanCustomExpr(expr: Expr): ArbolAComparar {
            const result: ArbolAComparar = { nombre: typeToOhmType(expr.nombre) };
            for (const i in expr) {
                if (i === "tipo" || i === "nombre" || i === "genero") continue;
                result[i] = cleanCustomExpr(expr[i]);
            }
            return result;
        }

        expect(cleanCustomExpr(expr!)).toStrictEqual(cleanOhmExpr(expr_ref!));
    });
}
