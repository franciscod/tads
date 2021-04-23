import { Expr, Grammar } from "../parser/Types";

export function evalGrammar(expr: Expr, grammar: Grammar): Expr {
    let run = true;
    let ret: Expr = expr;
    for (let i = 0; i < 200 && run; i++) {
        [run, ret] = evalStep(ret, grammar);
    }

    return ret;
}

export function evalStep(expr: Expr, grammar: Grammar): [boolean, Expr] {
    const axiomasEnRaiz = grammar.axiomas.filter(a => a[0].nombre === expr.nombre);

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

    const ret: Expr = {
        type: expr.type,
        nombre: expr.nombre,
        genero: expr.genero,
        operandos: {},
    };

    for (const child in expr.operandos) {
        ret.operandos[child] = expr.operandos[child];
    }

    for (const child in expr.operandos) {
        const [evaluoAlgo, sub] = evalStep(expr.operandos[child], grammar);
        if (evaluoAlgo) {
            ret.operandos[child] = sub;
            return [true, ret];
        }
    }

    // iokce no soi 100tifiko
    return [false, expr];
}

function reemplazar(expr: Expr, bindings: Map<string, Expr>): [boolean, Expr] {
    if (bindings.has(expr.nombre)) {
        return [true, bindings.get(expr.nombre)!];
    }

    const ret: Expr = {
        type: expr.type,
        nombre: expr.nombre,
        genero: expr.genero,
        operandos: {},
    };
    let hizoAlgo = false;

    for (const child in expr.operandos) {
        const [seReemplazo, sub] = reemplazar(expr.operandos[child], bindings);
        ret.operandos[child] = sub;
        hizoAlgo = hizoAlgo || seReemplazo;
    }

    return [hizoAlgo, ret];
}

function tienenLaMismaFormaSalvoVariables(template: Expr, expr: Expr): boolean {
    if (template.type === "variable") {
        // TODO: el genero de la expresion puede depender de alpha
        return JSON.stringify(template.genero) === JSON.stringify(expr.genero) || template.genero.base === "α";
    }

    // TODO: ver también el genero
    if (template.nombre !== expr.nombre) return false;

    // son el mismo tipo, tienen la misma forma en la raiz
    // tienen los mismos hijos

    for (const child in template.operandos) {
        if (!tienenLaMismaFormaSalvoVariables(template.operandos[child], expr.operandos[child])) return false;
    }

    return true;
}

function conseguirBindings(template: Expr, expr: Expr, bindings: Map<string, Expr>): Map<string, Expr> {
    if (template.type === "variable") {
        bindings.set(template.nombre, expr);
        return bindings;
    }

    for (const child in expr.operandos) {
        bindings = conseguirBindings(template.operandos[child], expr.operandos[child], bindings);
    }

    return bindings;
}

function contieneVariables(expr: Expr): boolean {
    if (expr.type === "variable") return true;

    for (const child in expr.operandos) {
        if (contieneVariables(expr.operandos[child])) return true;
    }

    return false;
}
