import { evalGrammar } from "../parser/Eval";
import { parseSource } from "../parser/Parser";
import { genGrammar, toExpr } from "../parser/Grammar";

import { TADS, EVALS } from "./Common";

const [tads] = parseSource(TADS.join("\n"));
const grammar = genGrammar(tads);

for (const _eval of EVALS) {
    it(`eval ${_eval.line.toString().padStart(3)}:  ${_eval.left.padEnd(40)} -> ${_eval.right.padStart(15)}`, () => {
        const exprL = toExpr(_eval.left, grammar);
        const exprR = toExpr(_eval.right, grammar);

        expect(exprL).not.toBeNull();
        expect(exprR).not.toBeNull();

        // console.log(exprL);
        expect(evalGrammar(exprL!, grammar)).toStrictEqual(exprR!);
    });
}
