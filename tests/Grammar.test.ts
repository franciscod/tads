import { parseSource } from "../parser/Parser";

import { Expr, Operacion } from "../parser/Types";
import { fromExpr, genGrammar, toExpr } from "../parser/CustomBackend";
import ohmB from "../parser/OhmBackend";

import { INVALID_STATEMENTS, VALID_STATEMENTS, TADS } from "./Common";

const [tads] = parseSource(TADS.join("\n"));

const grammar = genGrammar(tads);
const ohmGrammar = ohmB.genGrammar(tads);

const padSize = 60;

it("vacio tiene que fallar", () => expect(toExpr("", grammar)).toBeNull());

for (const stmt of VALID_STATEMENTS) {
    it("parsea --- " + stmt.padEnd(padSize), () => expect(toExpr(stmt, grammar)).not.toBeNull());
}

for (const stmt of VALID_STATEMENTS) {
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
const excepciones_ohm = [
    "¬false ∨ ¬false",
    "+suc(0) + +suc(0)",
    "π1(π1(⟨⟨0,0⟩,⟨0,0⟩⟩)) + 0",
    "π1(π2(⟨ ⟨ true, 0 ⟩, ⟨ +0, ⟨ suc(0), ∅ ⟩ ⟩ ⟩)) + +0",
    "π2(⟨ false, suc(0) ⟩) + suc(0)",
];

for (const stmt of VALID_STATEMENTS) {
    if (excepciones_ohm.includes(stmt)) continue;

    // este test volará algún día? yes
    0 &&
        it("matchea ast ohm --- " + stmt.padEnd(padSize), () => {
            const expr = toExpr(stmt, grammar);
            const expr_ref = ohmB.toExpr(stmt, ohmGrammar);

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
                return [op.type, op.nombre].reduce((p, e) => p + ohmB.titleSlug(e), "");
            }

            // genera un nuevo arbol sin el genero y con los tipos
            // escritos en "formato de ohm"
            function cleanCustomExpr(expr: Expr): ArbolAComparar {
                const result: ArbolAComparar = { nombre: typeToOhmType(expr.nombre) };
                for (const i in expr.operandos) {
                    result[i] = cleanCustomExpr(expr.operandos[i]);
                }
                return result;
            }

            expect(cleanCustomExpr(expr!)).toStrictEqual(cleanOhmExpr(expr_ref!));
        });
}

for (const stmt of INVALID_STATEMENTS) {
    it("no debería parsear --- " + stmt.padEnd(padSize), () => {
        const expr = toExpr(stmt, grammar);
        expect(expr).toBeNull();
    });
}
