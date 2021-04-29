import { evalGrammar } from "../../parser/Eval";
import { parseToExpr } from "../../parser/Expr";
import { genGrammar, Grammar } from "../../parser/Grammar";
import { parseSource } from "../../parser/Parser";
import { Report } from "../../parser/Reporting";
import { Eval, TAD } from "../../parser/Types";

if(typeof window !== 'undefined') {
    throw new Error("This code should only run insde a WebWorker");
}

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

export type Message = StartMessage | ProgressMessage;

function* fullLoop(start: StartMessage): Generator<Message | null> {
    const report = new Report();

    self.postMessage({ type: "progress", step: "Parse", current: 0, total: 0, elapsed: 0 }, undefined!);
    self.postMessage({ type: "progress", step: "Grammar", current: 0, total: 0, elapsed: 0 }, undefined!);
    self.postMessage({ type: "progress", step: "Eval", current: 0, total: 0, elapsed: 0 }, undefined!);

    let tads: TAD[] = [];
    let evals: Eval[] = [];

    const parseStart = performance.now();
    for(let i = 0; i < start.inputs.length; i++) {
        report.setSource(start.inputs[i].source, start.inputs[i].document);
        const [newTads, newEvals] = parseSource(start.inputs[i].source, report);
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
        const expr = parseToExpr(evals[i].expr, { }, grammar, report);
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
}

let workGenerator: Generator<Message | null> | null = null;

self.onmessage = (ev: MessageEvent<Message>) => {
    const msg = ev.data;

    if(msg.type === 'start') {
        workGenerator = fullLoop(msg);
    }
};

setInterval(() => {
    const r = workGenerator?.next();
    if(r?.value)
        self.postMessage(r.value, undefined!);
}, 0);
