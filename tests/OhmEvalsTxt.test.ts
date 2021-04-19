import fs from "fs";
import { genGrammar } from "../parser/Ohmification";
import { parseTad } from "../parser/Parser";

import ohm from "ohm-js";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");

const boolTad = parseTad(BOOL_TAD)!;
const natTad = parseTad(NAT_TAD)!;

// TODO: hacer algo un poco mas prolijo que juntar todas las operaciones?
const ops = boolTad.operaciones.concat(natTad.operaciones);
const generated = genGrammar("bool", ops, new Map());
const g = ohm.grammar(generated);

let enBool = true;
let enNat = false;
let enConj = false;

// console.log(generated);

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

        if (enBool) {
            it(
                "parsea casos bool evals.txt:" + (n + 1) + ":^" + line + "$",
                () => {
                    line = line.split("--")[0];
                    if (!line) return;
                    expect(g.match(line).succeeded());
                }
            );
        }
        if (enNat) {
            it(
                "parsea casos bool+nat evals.txt:" +
                    (n + 1) +
                    ":^" +
                    line +
                    "$",
                () => {
                    line = line.split("--")[0];
                    if (!line) return;
                    expect(g.match(line).succeeded());
                }
            );
        }
    });
