import { evalGrammar } from "../../parser/Eval";
import { exprToString, parseToExpr } from "../../parser/Expr";
import { genGrammar, Grammar } from "../../parser/Grammar";
import { parseTADs } from "../../parser/Parser";
import { Marker, Report, ReportDoc, SourceRange } from "../../parser/Reporting";
import { RawEval, TAD } from "../../parser/Types";

export default null as any;

export type Lens = {
    title: string;
    range: SourceRange;
    meta: any;
}

export type Decoration = {
    range: SourceRange;
    options: any;
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

export type MarkersMessage = {
    type: "markers",
    markers: Marker[]
}

export type LensesMessage = {
    type: "lenses",
    lenses: Lens[]
}

export type DecorationsMessage = {
    type: "decorations",
    decorations: Decoration[]
}

export type CommandMessage = {
    type: "command",
    data: any
}

export type Message = StartMessage | ProgressMessage | MarkersMessage | LensesMessage | DecorationsMessage | CommandMessage;

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

    // generamos todos los code lens iniciales
    let tadLenses: Lens[] = [];
    for(const tad of tads) {
        if(!tad.range) continue;

        const lens: Lens = {
            title: "🐞 Debug " + tad.nombre,
            range: tad.range,
            meta: { a: '123' }
        }
        tadLenses.push(lens);
    }
    let evalLenses: Lens[] = [];
    for(let i = 0; i < evals.length; i++) {
        /*const lens: Lens = {
            title: "Evaluando...",
            range: evals[i].expr.range!,
            meta: { a: '123' }
        }
        evalLenses.push(lens);*/
    }
    yield {
        type: "lenses",
        lenses: tadLenses.concat(evalLenses)
    };

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

    const evalDecors: Decoration[] = [];
    const evalsStart = performance.now();
    for(let i = 0; i < evals.length; i++) {
        const eval_ = evals[i];
        report.activeDocument = eval_.expr.location.document;
        report.push(eval_.expr.location.offset);
        const expr = parseToExpr(evals[i].expr.source, { }, grammar, report);
        report.pop();

        if(expr) {
            const finalExpr = evalGrammar(expr, grammar);
            /*const lens: Lens = {
                title: exprToString(finalExpr, grammar),
                range: evals[i].expr.range!,
                meta: { a: '123' }
            }
            evalLenses.push(lens);*/
            evalDecors.push({
                range: evals[i].expr.range!,
                options: {

                }
            })
        }
        yield {
            type: "progress",
            step: "Eval",
            current: i + 1,
            total: evals.length,
            elapsed: performance.now() - evalsStart
        };
        /*evalLenses[i].title = "👀 Ver eval";
        yield {
            type: "lenses",
            lenses: tadLenses.concat(evalLenses)
        };*/
    }

    const reportMessage: MarkersMessage = {
        type: 'markers',
        markers: report.markers
    };
    self.postMessage(reportMessage, undefined!);
    yield {
        type: "decorations",
        decorations: evalDecors
    };
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
