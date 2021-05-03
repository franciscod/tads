import { parseTADs } from "../parser/Parser";
import { genGrammar } from "../parser/Grammar";
import { parseToExpr } from "../parser/Expr";
import { evalGrammar } from "../parser/Eval";

import { TADS, EVALS } from "./Common";

const [tads] = parseTADs(TADS.join("\n"));
const grammar = genGrammar(tads);

for (const _eval of EVALS) {
    it(`eval ${_eval.line.toString().padStart(3)}:  ${_eval.left.padEnd(40)} -> ${_eval.right.padStart(15)}`, () => {
        const exprL = parseToExpr(_eval.left, {}, grammar);
        const exprR = parseToExpr(_eval.right, {}, grammar);

        expect(exprL).not.toBeNull();
        expect(exprR).not.toBeNull();
        expect(evalGrammar(exprL!, grammar)).toStrictEqual(exprR!);
    });
}
