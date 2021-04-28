import { parseSource } from "../parser/Parser";
import { genGrammar } from "../parser/Grammar";

import { INVALID_STATEMENTS, VALID_STATEMENTS, TADS } from "./Common";
import { exprToString, parseToExpr } from "../parser/Expr";

const [tads] = parseSource(TADS.join("\n"));

const grammar = genGrammar(tads);
const padSize = 60;

it("vacio tiene que fallar", () => expect(parseToExpr("", {}, grammar)).toBeNull());

for (const stmt of VALID_STATEMENTS) {
    it("parsea --- " + stmt.padEnd(padSize), () => expect(parseToExpr(stmt, {}, grammar)).not.toBeNull());
}

for (const stmt of VALID_STATEMENTS) {
    it("stmt -> Expr -> stmt -> Expr --- " + stmt.padEnd(padSize), () => {
        const expr1 = parseToExpr(stmt, {}, grammar);
        expect(expr1).not.toBeNull();
        const stmt2 = exprToString(expr1!, grammar);
        expect(stmt2.length).toBeGreaterThan(0);
        const expr2 = parseToExpr(stmt2, {}, grammar);
        expect(expr2).not.toBeNull();

        expect(expr1).toStrictEqual(expr2);
    });
}

for (const stmt of INVALID_STATEMENTS) {
    it("no debería parsear --- " + stmt.padEnd(padSize), () => {
        const expr = parseToExpr(stmt, {}, grammar);
        expect(expr).toBeNull();
    });
}
