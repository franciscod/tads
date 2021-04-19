import { AST } from "../../parser/Ohmification";
import { Axioma, evalStep } from "../../parser/Eval";

const generateEvalDebug = (expr: AST, axiomas: Axioma[], fromAST: (ast: AST) => string): string => {
    let steps = "";
    let run = true;
    let ret: AST = expr;
    for (let i = 0; i < 50 && run; i++) {
        steps += `
            <div class="debug-section">STEP #${i}</div>
            <pre>${fromAST(ret)}</pre>
            <br>
        `;
        [run, ret] = evalStep(ret, axiomas);
    }

    return `
        <div class="debug-title">Eval</div>
        <br>
        ${steps}
    `;
};

export default generateEvalDebug;
