import { evalStepGrammar } from "../../parser/Eval";
import { Expr, exprToString } from "../../parser/Expr";
import { Grammar } from "../../parser/Grammar";

const generateEvalDebug = (expr: Expr, grammar: Grammar): string => {
    let steps = "";
    let run = true;
    let ret: Expr = expr;
    for (let i = 0; i < 50 && run; i++) {
        steps += `
            <div class="debug-section">STEP #${i}</div>
            <pre>${exprToString(ret, grammar)}</pre>
            <br>
        `;
        [run, ret] = evalStepGrammar(ret, grammar);
    }

    return `
        <div class="debug-title">Eval</div>
        <br>
        ${steps}
    `;
};

export default generateEvalDebug;
