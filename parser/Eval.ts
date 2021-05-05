import { Expr } from "./Expr";
import { calzarGeneros, GeneroParametrizado, Parametros } from "./Genero";
import { Grammar } from "./Grammar";

function log(x: any) {
    return console.log(JSON.stringify(x, null, 4));
}

function debuglog(x: any) {
    return null;
    // return log(x);
}

export function evalGrammar(expr: Expr, grammar: Grammar): Expr {
    let run = true;
    let ret: Expr = expr;
    for (let i = 0; i < 400 && run; i++) {
        [run, ret] = evalStepGrammar(ret, grammar);
    }

    return ret;
}

export function evalStepGrammar(expr: Expr, grammar: Grammar): [boolean, Expr] {
    if (expr.nombre === "•=•") {
        // IGUALDAD OBSERVACIONAL

        // TODO: mejorar, usando la def de igobs del tad

        // en ningun lado dice que dos cosas con la misma syntax son igobs,
        // pero si no vale estamos fritos

        const igobs = JSON.stringify(expr.operandos[0]) === JSON.stringify(expr.operandos[2]);

        const ret: Expr = {
            type: "fijo",
            nombre: "" + igobs,
            genero: { base: "bool", parametros: {} },
            operandos: []
        };

        return [true, ret];
    }

    const axiomasEnRaiz = grammar.axiomasPorNombre.get(expr.nombre) || [];

    forAxiomaEnRaiz: for (const [left, right] of axiomasEnRaiz) {
        // console.log("expr", expr)
        // console.log("left", left)
        // console.log("right", right)

        // TODO: deberian chequearse los tipos

        if (sonExactamenteLoMismo(left, expr)) {
            return [true, right];
        }

        // si expr no entra en la izq del axioma, skip
        if (!tienenLaMismaFormaSalvoVariables(left, expr, grammar)) {
            debuglog("tienen otra forma");
            debuglog(left);
            debuglog(expr);
            continue forAxiomaEnRaiz;
        }

        // si en el axioma no hay variables, no entra
        if (!contieneVariables(left)) {
            debuglog("son distintos y no hay variables");
            continue forAxiomaEnRaiz;
        }

        // bindeamos las variables de left a los valores que tienen en expr
        const bindings: Map<string, Expr> = conseguirBindings(left, expr, new Map());

        debuglog("MAMA ENCONTRE MAS BINDINGS AHORA");
        debuglog(bindings);

        // reemplazamos en right con los bindings

        const [okReemplazo, ret] = reemplazar(right, bindings);

        debuglog("LUEGO DE BINDEAR ");
        debuglog(ret);

        if (!contieneVariables(ret)) return [true, ret];
        if (okReemplazo) return [true, ret];
    }

    // no se pudo aplicar un axioma en la raiz
    // va a evaluar cada uno de los hijos recursivamente

    const ret: Expr = {
        type: expr.type,
        nombre: expr.nombre,
        genero: expr.genero,
        operandos: [ ...expr.operandos ]
    };
 
    for(let i = 0; i < expr.operandos.length; i++) {
        if(expr.operandos[i] === null) continue;
        const [evaluoAlgo, sub] = evalStepGrammar(expr.operandos[i]!, grammar);
        if (evaluoAlgo) {
            ret.operandos[i] = sub;
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
        operandos: []
    };
    let hizoAlgo = false;

    for(let i = 0; i < expr.operandos.length; i++) {
        if(expr.operandos[i] === null) continue;
        const [seReemplazo, sub] = reemplazar(expr.operandos[i]!, bindings);
        while(ret.operandos.length < +i)
            ret.operandos.push(null);
        ret.operandos[i] = sub;
        hizoAlgo = hizoAlgo || seReemplazo;
    }

    return [hizoAlgo, ret];
}

function tienenLaMismaFormaSalvoVariables(template: Expr, expr: Expr, grammar: Grammar): boolean {
    if (template.type === "variable") {
        return calzarGeneros(template.genero, expr.genero, { }, grammar.tads);
    }

    // TODO: ver también el genero
    if (template.nombre !== expr.nombre) return false;

    // son el mismo tipo, tienen la misma forma en la raiz
    // tienen los mismos hijos

    for(let i = 0; i < template.operandos.length; i++) {
        if(template.operandos[i] === null) continue;
        if (!tienenLaMismaFormaSalvoVariables(template.operandos[i]!, expr.operandos[i]!, grammar)) return false;
    }

    return true;
}

function conseguirBindings(template: Expr, expr: Expr, bindings: Map<string, Expr>): Map<string, Expr> {
    if (template.type === "variable") {
        bindings.set(template.nombre, expr);
        return bindings;
    }

    for(let i = 0; i < expr.operandos.length; i++) {
        if(expr.operandos[i] === null) continue;
        bindings = conseguirBindings(template.operandos[i]!, expr.operandos[i]!, bindings);
    }

    return bindings;
}

function contieneVariables(expr: Expr): boolean {
    if (expr.type === "variable") return true;

    for(let i = 0; i < expr.operandos.length; i++) {
        if(expr.operandos[i] === null) continue;
        if (contieneVariables(expr.operandos[i]!)) return true;
    }

    return false;
}


function sonExactamenteLoMismo(a: Expr, b: Expr): boolean {

    if (a.type != b.type) return false;
    if (a.nombre != b.nombre) return false;
    if (a.genero.base != b.genero.base) return false;

    // TODO: genero?

    for(let i = 0; i < a.operandos.length; i++) {
        if(a.operandos[i] === null) continue;
        if (!sonExactamenteLoMismo(a.operandos[i]!, b.operandos[i]!)) return false;
    }

    return true;
}
