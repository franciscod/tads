import { evalGrammar } from "../../parser/Eval";
import { parseToExpr } from "../../parser/Expr";
import { genGrammar, Grammar } from "../../parser/Grammar";
import { parseTADs } from "../../parser/Parser";
import { Marker, Report, ReportDoc } from "../../parser/Reporting";
import { RawEval, TAD } from "../../parser/Types";

export default null as any;

export type WorkStep = "Parse" | "Grammar" | "Eval";

export type StartMessage = {
    type: "start";
    inputs: {
        source: string;
        document: number;
    }[]
}

export type ProgressMessage = {
    type: "progress",
    step: WorkStep,
    current: number;
    total: number;
    elapsed: number;
}

export type ReportMessage = {
    type: "report",
    markers: Marker[]
}

export type Message = StartMessage | ProgressMessage | ReportMessage;

function* fullLoop(start: StartMessage): Generator<Message | null> {

    self.postMessage({ type: "progress", step: "Parse", current: 0, total: 0, elapsed: 0 }, undefined!);
    self.postMessage({ type: "progress", step: "Grammar", current: 0, total: 0, elapsed: 0 }, undefined!);
    self.postMessage({ type: "progress", step: "Eval", current: 0, total: 0, elapsed: 0 }, undefined!);

    let tads: TAD[] = [];
    let evals: RawEval[] = [];

    const parseStart = performance.now();
    
    const docs: ReportDoc[] = [];
    for(let i = 0; i < start.inputs.length; i++) {
        docs.push(new ReportDoc(start.inputs[i].document, start.inputs[i].source));
    }
    const report = new Report(docs);

    for(let i = 0; i < start.inputs.length; i++) {
        report.activeDocument = i;
        const [newTads, newEvals] = parseTADs(start.inputs[i].source, report);
        tads = tads.concat(newTads);
        evals = evals.concat(newEvals);
        yield {
            type: "progress",
            step: "Parse",
            current: i + 1,
            total: start.inputs.length,
            elapsed: performance.now() - parseStart
        };
    }
    
    const grammarStart = performance.now();
    const grammar: Grammar = genGrammar(tads, report);
    // TODO: grammar generator
    yield {
        type: "progress",
        step: "Grammar",
        current: 1,
        total: 1,
        elapsed: performance.now() - grammarStart
    };

    // TODO: cuota de evals step

    const evalsStart = performance.now();
    for(let i = 0; i < evals.length; i++) {
        const expr = parseToExpr(evals[i].expr.source, { }, grammar, report);
        if(expr) {
            evalGrammar(expr, grammar);
        }
        yield {
            type: "progress",
            step: "Eval",
            current: i + 1,
            total: evals.length,
            elapsed: performance.now() - evalsStart
        };
    }

    const reportMessage: ReportMessage = {
        type: 'report',
        markers: report.markers
    };
    self.postMessage(reportMessage, undefined!);
}

function processNext() {
    const r = workGenerator?.next();
    if(!r || r.done) {
        clearInterval(workInterval);
        workInterval = 0;
    } else {
        if(r.value)
            self.postMessage(r.value, undefined!);
    }
}

let workGenerator: Generator<Message | null> | null = null;
let workInterval: number = 0;

if(typeof window === 'undefined' && typeof self !== 'undefined') {
    console.log("Web Worker started");
    
    // This should only run inside the Web Worker
    self.onmessage = (ev: MessageEvent<Message>) => {
        const msg = ev.data;

        if(msg.type === 'start') {
            workGenerator = fullLoop(msg);
            if(workInterval === 0) {
                workInterval = setInterval(processNext, 0) as unknown as number;
            }
        }
    };
}
