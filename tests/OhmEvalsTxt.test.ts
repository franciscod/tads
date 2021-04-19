import fs from "fs";
import { genGrammar, getAST } from "../parser/Ohmification";
import { Axioma, evalAxiomas, auxAxiomasAST } from "../parser/Eval";
import { parseTad } from "../parser/Parser";

import ohm from "ohm-js";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");
const CONJ_TAD = fs.readFileSync("tads/conj.tad", "utf-8");

const boolTad = parseTad(BOOL_TAD)!;
const natTad = parseTad(NAT_TAD)!;
const conjTad = parseTad(CONJ_TAD)!;

// TODO: hacer algo un poco mas prolijo que juntar todas las operaciones?
const ops = boolTad.operaciones.concat(natTad.operaciones).concat(conjTad.operaciones);
const [generated, unaries] = genGrammar("bool", ops, new Map());
const g = ohm.grammar(generated);

let enBool = true;
let enNat = false;
let enConj = false;

// console.log(generated);

let axiomas: Axioma[];

it("parsea los axiomas", () => {
    axiomas = auxAxiomasAST([boolTad, natTad, conjTad]);
});

fs.readFileSync("tests/evals.txt", "utf-8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line, n) => {
        if (line.includes("nat")) {
            enBool = false;
            enNat = true;
        }

        if (line.includes("conj")) {
            enNat = false;
            enConj = true;
        }

        if (!enBool && !enNat && !enConj) return;

        line = line.split("--")[0];
        if (!line) return;
        const parts = line.split(" = ");
        const matches = parts.map(s => g.match(s));

        it("parsea evals.txt:" + (n + 1) + ":^" + line + "$", () => {
            matches.forEach(match => {
                expect(match.succeeded()).toStrictEqual(true);
            });
        });

        it("  eval evals.txt:" + (n + 1) + ":^" + line + "$", () => {
            const exprL = getAST(matches[0], unaries);
            const exprR = getAST(matches[1], unaries);

            expect(evalAxiomas(exprL, axiomas)).toStrictEqual(exprR);
        });
    });
