import { genGrammar, getAST } from "../parser/Ohmification";
import { TAD } from "../parser/Types";
import ohm from "ohm-js";

type AST = any;
// TODO: los axiomas deberian tener info de tipos attacheada
export type Axioma = [AST, AST];

export function auxAxiomasAST(tads: TAD[]): Axioma[] {
    let ret: Axioma[] = [];

    let opsTodos = tads.map((tad) => tad.operaciones)
                    .reduce((ret, ops) => ret.concat(ops), []);

    tads.forEach((tad) => {
        const [generated, unaries] = genGrammar(
            tad.nombre,
            opsTodos,
            tad.variablesLibres
        );
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

            return [
                getAST(matchLeft, unaries),
                getAST(matchRight, unaries),
            ];
        });

        ret = ret.concat(axiomasEsteTad);
    });

    return ret;
}

export function evalAxiomas(expr: AST, axiomas: Axioma[]): AST {
    let run = true;
    for (let i = 0; i < 10 && run; i++) {
        [run, expr] = evalStep(expr, axiomas);
    }

    return expr;
}

function evalStep(expr: AST, axiomas: Axioma[]): [boolean, AST] {
    forAxiomaEnRaiz: for (const [left, right] of axiomas) {
        // TODO: deberian chequearse los tipos

        // si expr no entra en la izq del axioma, skip
        if (left.type !== expr.type) continue;

        if (JSON.stringify(expr) === JSON.stringify(left)) {
            return [true, right];
        }

        for (const child in expr) {
            if (child === "type") continue;
            // si en el axioma no hay var y son distintos, no me sirve el axioma
            if (
                !left[child].type.startsWith("Var") &&
                left[child].type !== expr[child].type
            )
                continue forAxiomaEnRaiz;
        }

        // bindeamos las variables de left a los valores que tienen en expr

        let bindings: Map<string, AST> = new Map();
        for (const child in expr) {
            if (child === "type") continue;
            if (!left[child].type.startsWith("Var")) continue;

            // TODO: que onda si el binding ya existia? lo pisamos?
            bindings.set(left[child].type, expr[child]);
        }

        // reemplazamos en right con los bindings

        let [okReemplazo, ret] = reemplazar(right, bindings);
        if (!okReemplazo) {
            continue;
        }
        return [true, ret];
    }


    // no se pudo aplicar un axioma en la raiz

    for (const child in expr) {
        if (child === "type") continue;
        let [evaluoAlgo, sub] = evalStep(expr[child], axiomas);
        if (evaluoAlgo) {
            expr[child] = sub;
            return [true, expr];
        }
    }

    // iokce no soi 100tifiko
    return [false, expr];
}

function reemplazar(expr: AST, bindings: Map<string, AST>): [boolean, AST] {
    if (bindings.has(expr.type)) {
        return [true, bindings.get(expr.type)];
    }

    let ret: AST = {type: expr.type}
    let hizoAlgo : boolean = false;

    for (const child in expr) {
        if (child === "type") continue;
        let [seReemplazo, sub] = reemplazar(expr[child], bindings);
        ret[child] = sub;
        hizoAlgo = hizoAlgo || seReemplazo;
    }

    return [hizoAlgo, ret];
}
