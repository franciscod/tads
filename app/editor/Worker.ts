import { evalStepGrammar } from "../../parser/Eval";
import { exprToString, parseToExpr } from "../../parser/Expr";
import { genGrammar, Grammar } from "../../parser/Grammar";
import { parseTADs } from "../../parser/Parser";
import { Marker, Report, ReportDoc } from "../../parser/Reporting";
import { RawEval, TAD } from "../../parser/Types";
import { renderGeneroTag } from "../views/RenderHelpers";

export default null as any;

export type CommandMessage = {
    type: "command";
    data: any;
};

/**
 * Se emite para iniciar el procesamiento nuevamente
 */
export type StartMessage = {
    type: "start";
    inputs: {
        source: string;
        document: number;
    }[];
};

/**
 * Se emite cada vez que se progresa en algún step del procesamiento
 */
export type ProgressMessage = {
    type: "progress";
    step: "Parse" | "Grammar" | "Eval";
    current: number;
    total: number;
    elapsed: number;
};

export type Lens = {
    title: string;
    meta: any;
};

/**
 * GlyphDecoration disponibles
 */
export type GlyphDecoration =
    | "none"
    | "loading"
    | "parse-fail"
    | "eval-timeout"
    | "eval-fail"
    | "eval-success"
    | "assert-fail"
    | "assert-success";

/**
 * Representa la información presentada en una línea (decorations, lens)
 */
export type LineInfo = {
    lens: Lens[];
    glyphDecoration: GlyphDecoration;
    details?: string;
};

/**
 * Mensaje emitido cuando se debe eliminar la información de todas las líneas
 */
export type LinesClearMessage = { type: "clear-lines" };

/**
 * Mensaje emitido cuando se debe cambiar la información presentada de una línea (decorations, lens)
 */
export type LineUpdateMessage = {
    type: "line";
    document: number;
    line: number;
    info: LineInfo;
};

/**
 * Mensaje emitido cuando se deben eliminar todos los markers
 */
export type MarkersClearMessage = { type: "clear-markers" };

/**
 * Mensaje emitido cuando hay nuevos markers para agregar
 */
export type MarkersMessage = {
    type: "markers";
    markers: Marker[];
};

/**
 * Mensaje emitido para actualizar el conteo de asserts
 */
export type AssertsUpdateMessage = {
    type: "asserts";
    success: number;
    fail: number;
    total: number;
}

/**
 * Mensaje emitido entre la UI y el WebWorker
 */
export type Message =
    | StartMessage
    | ProgressMessage
    | LinesClearMessage
    | LineUpdateMessage
    | MarkersClearMessage
    | MarkersMessage
    | AssertsUpdateMessage
    | CommandMessage;

const post = (messages: Message[]) => self.postMessage(messages, undefined!);

/**
 * Esta función se ejecuta cada vez que cambia el contenido en editor
 */
function* fullLoop(start: StartMessage): Generator {
    // reiniciamos
    post([
        { type: "progress", step: "Parse", current: 0, total: 0, elapsed: 0 },
        { type: "progress", step: "Grammar", current: 0, total: 0, elapsed: 0 },
        { type: "progress", step: "Eval", current: 0, total: 0, elapsed: 0 }
    ]);

    let tads: TAD[] = [];
    let evals: RawEval[] = [];

    // --------------- PARSING ---------------
    const parseStart = performance.now();
    const report = new Report(start.inputs.map(input => new ReportDoc(input.document, input.source)));
    let c = 0;
    for (const input of start.inputs) {
        // parseamos cada input (documento/tab) y los agregamos a los tads y evals generales
        report.activeDocument = input.document;
        const [docTads, docEvals] = parseTADs(input.source, report);
        tads = tads.concat(docTads);
        evals = evals.concat(docEvals);

        // notificamos que un doc ya fue parseado
        post([
            {
                type: "progress",
                step: "Parse",
                current: ++c,
                total: start.inputs.length,
                elapsed: performance.now() - parseStart
            }
        ]);
        yield;
    }
    // ---------------------------------------

    // ya podemos generar algo de información para el editor
    const totalAsserts = evals.filter(e => e.kind === 'assert').length;
    {
        const msgs: Message[] = [
            { type: "clear-lines" },
            { type: "asserts", success: 0, fail: 0, total: totalAsserts }
        ];

        // mostamos un lens en cada definición de TAD
        for (const tad of tads) {
            msgs.push({
                type: "line",
                document: tad.range!.document,
                line: tad.range!.startLine,
                info: {
                    lens: [
                        {
                            title: "🐞 Debug " + tad.nombre,
                            meta: { a: "123" }
                        }
                    ],
                    glyphDecoration: "none"
                }
            });
        }

        // marcamos todas las líneas con evals como 'loading'
        for (const eval_ of evals) {
            msgs.push({
                type: "line",
                document: eval_.expr.range!.document,
                line: eval_.expr.range!.startLine,
                info: { lens: [], glyphDecoration: "loading" }
            });
        }

        // enviamos todo junto
        post(msgs);
    }

    // --------------- GRAMMAR ---------------
    const grammarStart = performance.now();
    const grammar: Grammar = genGrammar(tads, report);
    // TODO: grammar generator
    post([
        {
            type: "progress",
            step: "Grammar",
            current: 1,
            total: 1,
            elapsed: performance.now() - grammarStart
        }
    ]);
    yield;
    // ---------------------------------------

    // enviamos los markers hasta ahora (parse + grammar)
    post([
        {
            type: "clear-markers"
        },
        {
            type: "markers",
            markers: report.markers
        }
    ]);
    // limpiamos los markers para no volver a enviarlos
    report.markers = [];

    // --------------- EVAL ---------------
    const MAX_STEPS_PER_EVAL = 50000;
    const MAX_STEPS_PER_CYCLE = 100;

    let totalSteps = 0;
    let succeededEvals = 0, failedEvals = 0;

    const evalsStart = performance.now();
    for (let i = 0; i < evals.length; i++) {
        const eval_ = evals[i];
        report.activeDocument = eval_.expr.location.document;
        report.push(eval_.expr.location.offset);
        const expr = parseToExpr(evals[i].expr.source, {}, grammar, report);
        report.pop();

        const lineInfo: LineInfo = {
            glyphDecoration: "none",
            lens: []
        };

        if (expr) {
            let shouldContinue = true;
            let stepExpr = expr;
            let steps = 0;
            for (let i = 0; i < MAX_STEPS_PER_EVAL && shouldContinue; i++) {
                // TODO: evalStepGrammar as generator
                [shouldContinue, stepExpr] = evalStepGrammar(stepExpr, grammar);
                if(shouldContinue) {
                    steps++;
                    totalSteps++;
                    if(totalSteps > MAX_STEPS_PER_CYCLE) {
                        totalSteps = 0;
                        yield;
                    }
                }
            }
            
            const pasos = `${steps} paso${steps === 1 ? '' : 's'}`;

            if (stepExpr) {
                const lastExprAsString = exprToString(stepExpr, grammar);
                const exprRender = `
                ${renderGeneroTag(stepExpr.genero, grammar)}
                <code>${lastExprAsString}</code>
                `;

                if(shouldContinue) {
                    // no terminó de computar
                    lineInfo.glyphDecoration = "eval-timeout";
                    lineInfo.details = `La expresión no llegó a resolverse en menos de ${MAX_STEPS_PER_EVAL} pasos. La última expresión fue:<br>${exprRender}`;
                } else {
                    if (eval_.kind === "assert") {
                        if (stepExpr.nombre === "true") {
                            lineInfo.glyphDecoration = "assert-success";
                            lineInfo.details = `La expresión resuelve a <b>true</b> en ${pasos} ✅`;
                            succeededEvals++;
                        } else {
                            lineInfo.glyphDecoration = "assert-fail";
                            lineInfo.details = `La expresión debería resolver a <code>true</code>, pero resuelve a (${pasos}):<br>${exprRender}`;
                            failedEvals++;
                        }
                    } else {
                        lineInfo.details = `La expresión resuelve en ${pasos} a:<br>${exprRender}`;
                        lineInfo.glyphDecoration = "eval-success";
                    }
                }
            } else {
                lineInfo.details = `La expresión no pudo resolverse en ${pasos}`;
                lineInfo.glyphDecoration = "eval-fail";
                if(eval_.kind === "assert")
                    failedEvals++;
            }
        } else {
            lineInfo.details = `La expresión no parsea.`;
            lineInfo.glyphDecoration = "parse-fail";
            if(eval_.kind === "assert")
                failedEvals++;
        }

        post([
            {
                type: "progress",
                step: "Eval",
                current: i + 1,
                total: evals.length,
                elapsed: performance.now() - evalsStart
            },
            {
                type: "line",
                document: eval_.expr.range!.document,
                line: eval_.expr.range!.startLine,
                info: lineInfo
            },
            {
                type: "markers",
                markers: report.markers
            },
            {
                type: "asserts",
                success: succeededEvals,
                fail: failedEvals,
                total: totalAsserts
            }
        ]);
        report.markers = [];
    }
    // ---------------------------------------
}

function processNext() {
    const r = workGenerator?.next();
    if (!r || r.done) {
        clearInterval(workInterval);
        workInterval = 0;
    }
}

let workGenerator: Generator | null = null;
let workInterval = 0;

if (typeof window === "undefined" && typeof self !== "undefined") {
    console.log("Web Worker started");

    // This should only run inside the Web Worker
    self.onmessage = (ev: MessageEvent<Message>) => {
        const msg = ev.data;

        if (msg.type === "start") {
            workGenerator = fullLoop(msg);
            if (workInterval === 0) {
                workInterval = (setInterval(processNext, 0) as unknown) as number;
            }
        }
    };
}
