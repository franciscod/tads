import { Axioma, Expr, Grammar } from "../parser/Types";


export function evalGrammar(expr: Expr, grammar: Grammar): Expr {
    let run = true;
    let ret: Expr = expr;
    for (let i = 0; i < 50 && run; i++) {
        [run, ret] = evalStep(ret, grammar);
    }

    return ret;
}

export function evalStep(expr: Expr, grammar: Grammar): [boolean, Expr] {
    const axiomasEnRaiz = grammar.axiomas.filter(a => a[0].type === expr.type);

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
        const bindings: Map<string, Expr> = conseguirBindings(left, expr, new Map());

        // console.log("MAMA ENCONTRE MAS BINDINGS AHORA", bindings)

        // reemplazamos en right con los bindings

        const [okReemplazo, ret] = reemplazar(right, bindings);

        // console.log("LUEGO DE BINDEAR ", JSON.stringify(ret, null, 4));

        if (!contieneVariables(ret)) return [true, ret];
        if (okReemplazo) return [true, ret];
    }

    // no se pudo aplicar un axioma en la raiz
    // va a evaluar cada uno de los hijos recursivamente

    const ret: any = {};

    for (const child in expr) {
        ret[child] = expr[child];
    }

    for (const child in expr) {
        if (child === "type") continue;
        const [evaluoAlgo, sub] = evalStep(expr[child], grammar);
        if (evaluoAlgo) {
            ret[child] = sub;
            return [true, ret];
        }
    }

    // iokce no soi 100tifiko
    return [false, expr];
}

function reemplazar(expr: Expr, bindings: Map<string, Expr>): [boolean, Expr] {
    if (bindings.has(expr.type)) {
        return [true, bindings.get(expr.type)!];
    }

    const ret: Expr = { type: expr.type };
    let hizoAlgo = false;

    for (const child in expr) {
        if (child === "type") continue;
        const [seReemplazo, sub] = reemplazar(expr[child], bindings);
        ret[child] = sub;
        hizoAlgo = hizoAlgo || seReemplazo;
    }

    return [hizoAlgo, ret];
}

function tienenLaMismaFormaSalvoVariables(template: Expr, expr: Expr): boolean {
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

function conseguirBindings(template: Expr, expr: Expr, bindings: Map<string, Expr>): Map<string, Expr> {
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

function contieneVariables(expr: Expr): boolean {
    if (expr.type.startsWith("Var")) return true;

    for (const child in expr) {
        if (child === "type") continue;
        if (contieneVariables(expr[child])) return true;
    }

    return false;
}
