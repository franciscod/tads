import { evalStep } from "../../parser/Eval";
import { fromExpr } from "../../parser/OhmBackend";
import { Expr, Grammar } from "../../parser/Types";

const generateEvalDebug = (expr: Expr, grammar: Grammar): string => {
    let steps = "";
    let run = true;
    let ret: Expr = expr;
    for (let i = 0; i < 50 && run; i++) {
        steps += `
            <div class="debug-section">STEP #${i}</div>
            <pre>${fromExpr(ret, grammar)}</pre>
            <br>
        `;
        [run, ret] = evalStep(ret, grammar);
    }

    return `
        <div class="debug-title">Eval</div>
        <br>
        ${steps}
    `;
};

export default generateEvalDebug;
