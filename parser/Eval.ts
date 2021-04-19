import { genGrammar, getAST } from "../parser/Ohmification";
import { TAD } from "../parser/Types";
import ohm from "ohm-js";

type AST = any;
// TODO: los axiomas deberian tener info de tipos attacheada
export type Axioma = [AST, AST];

export function auxAxiomasAST(tads: TAD[]): Axioma[] {
    let ret: Axioma[] = [];

    let opsTodos = tads.map(tad => tad.operaciones).reduce((ret, ops) => ret.concat(ops), []);

    tads.forEach(tad => {
        const [generated, unaries] = genGrammar(tad.nombre, opsTodos, tad.variablesLibres);
        const g = ohm.grammar(generated);

        const axiomasEsteTad: Axioma[] = tad.axiomas.map((rawPair: [string, string]) => {
            const left = rawPair[0];
            const right = rawPair[1];

            const matchLeft = g.match(left);
            const matchRight = g.match(right);
            if (!matchLeft.succeeded()) {
                console.log(left);
            }

            if (!matchRight.succeeded()) {
                console.log(right);
            }

            return [getAST(matchLeft, unaries), getAST(matchRight, unaries)];
        });

        ret = ret.concat(axiomasEsteTad);
    });

    return ret;
}

export function evalAxiomas(expr: AST, axiomas: Axioma[]): AST {
    let run = true;
    let ret: AST = expr;
    for (let i = 0; i < 50 && run; i++) {
        [run, ret] = evalStep(ret, axiomas);
    }

    return ret;
}

function evalStep(expr: AST, axiomas: Axioma[]): [boolean, AST] {
    const axiomasEnRaiz = axiomas.filter(a => a[0].type === expr.type);

    forAxiomaEnRaiz: for (const [left, right] of axiomasEnRaiz) {
        // console.log("expr", expr)
        // console.log("left", left)
        // console.log("right", right)

        // TODO: deberian chequearse los tipos

        if (JSON.stringify(expr) === JSON.stringify(left)) {
            return [true, right];
        }

        // si expr no entra en la izq del axioma, skip
        if (!tienenLaMismaFormaSalvoVariables(left, expr)) {
            // console.log("tienen otra forma")
            continue forAxiomaEnRaiz;
        }

        // si en el axioma no hay variables, no entra
        if (!contieneVariables(left)) {
            // console.log("son distintos y no hay variables");
            continue forAxiomaEnRaiz;
        }

        // bindeamos las variables de left a los valores que tienen en expr
        let bindings: Map<string, AST> = conseguirBindings(left, expr, new Map());

        // console.log("MAMA ENCONTRE MAS BINDINGS AHORA", bindings)

        // reemplazamos en right con los bindings

        let [okReemplazo, ret] = reemplazar(right, bindings);

        // console.log("LUEGO DE BINDEAR ", JSON.stringify(ret, null, 4));

        if (!contieneVariables(ret)) return [true, ret];
        if (okReemplazo) return [true, ret];
    }

    // no se pudo aplicar un axioma en la raiz
    // va a evaluar cada uno de los hijos recursivamente

    let ret: any = {};

    for (const child in expr) {
        ret[child] = expr[child];
    }

    for (const child in expr) {
        if (child === "type") continue;
        let [evaluoAlgo, sub] = evalStep(expr[child], axiomas);
        if (evaluoAlgo) {
            ret[child] = sub;
            return [true, ret];
        }
    }

    // iokce no soi 100tifiko
    return [false, expr];
}

function reemplazar(expr: AST, bindings: Map<string, AST>): [boolean, AST] {
    if (bindings.has(expr.type)) {
        return [true, bindings.get(expr.type)];
    }

    let ret: AST = { type: expr.type };
    let hizoAlgo: boolean = false;

    for (const child in expr) {
        if (child === "type") continue;
        let [seReemplazo, sub] = reemplazar(expr[child], bindings);
        ret[child] = sub;
        hizoAlgo = hizoAlgo || seReemplazo;
    }

    return [hizoAlgo, ret];
}

function tienenLaMismaFormaSalvoVariables(template: AST, expr: AST): boolean {
    if (template.type.startsWith("Var")) {
        return true;
    }

    if (template.type !== expr.type) return false;

    // son el mismo tipo, tienen la misma forma en la raiz
    // tienen los mismos hijos

    for (const child in template) {
        if (child === "type") continue;
        if (!tienenLaMismaFormaSalvoVariables(template[child], expr[child])) return false;
    }

    return true;
}

function conseguirBindings(template: AST, expr: AST, bindings: Map<string, AST>): Map<string, AST> {
    if (template.type.startsWith("Var")) {
        bindings.set(template.type, expr);
        return bindings;
    }

    for (const child in expr) {
        if (child === "type") continue;
        bindings = conseguirBindings(template[child], expr[child], bindings);
    }

    return bindings;
}

function contieneVariables(expr: AST): boolean {
    if (expr.type.startsWith("Var")) return true;

    for (const child in expr) {
        if (child === "type") continue;
        if (contieneVariables(expr[child])) return true;
    }

    return false;
}
