import fs from "fs";
import { evalGrammar } from "../parser/Eval";
import { parseSource } from "../parser/Parser";

import { Grammar } from "../parser/Types";
import { genGrammar, toExpr } from "../parser/ChevrotainBackend";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");
const INT_TAD = fs.readFileSync("tads/int.tad", "utf-8");
const CONJ_TAD = fs.readFileSync("tads/conj.tad", "utf-8");

const [tads] = parseSource([BOOL_TAD,
// NAT_TAD, INT_TAD, CONJ_TAD
].join("\n"));

let grammar: Grammar;

it("parsea los axiomas", () => {
    grammar = genGrammar(tads);
});

fs.readFileSync("tests/evals.txt", "utf-8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line, n) => {
        line = line.split("--")[0];
        if (!line) return;
        const parts = line.split(" = ");

        it(("parsea evals:" + (n + 1) + ":  " + parts[0]).padEnd(60) + " = " + parts[1].padStart(15), () => {
            const matches = parts.map(s => toExpr(s, grammar));

            matches.forEach(match => expect(match).not.toBeNull());
        });
    });

/*
fs.readFileSync("tests/evals.txt", "utf-8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line, n) => {
        line = line.split("--")[0];
        if (!line) return;
        const parts = line.split(" = ");

        it(("eval evals:" + (n + 1) + ":  " + parts[0]).padEnd(60) + " = " + parts[1].padStart(15), () => {
            const [exprL, exprR] = parts.map(s => toExpr(s, grammar));

            if (exprL && exprR) expect(evalGrammar(exprL, grammar)).toStrictEqual(exprR);
        });
    });
*/
