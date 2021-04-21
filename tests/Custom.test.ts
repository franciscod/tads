import fs from "fs";
import { parseSource } from "../parser/Parser";

import { Grammar } from "../parser/Types";
import { genGrammar, toExpr } from "../parser/CustomBackend";
import { genGrammar as genGrammar_ref, toExpr as toExpr_ref } from "../parser/OhmBackend";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
const NAT_TAD = fs.readFileSync("tads/nat.tad", "utf-8");
const INT_TAD = fs.readFileSync("tads/int.tad", "utf-8");
const CONJ_TAD = fs.readFileSync("tads/conj.tad", "utf-8");

const [tads] = parseSource([BOOL_TAD, NAT_TAD, INT_TAD, CONJ_TAD].join('\n'));

const grammar: Grammar = genGrammar(tads);;
const refGrammar = genGrammar_ref(tads);

fs.readFileSync("tests/evals.txt", "utf-8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line, n) => {
        line = line.split("--")[0];
        if (!line) return;
        const parts = line.split(" = ");

        it("matchea ref evals" + (n + 1).toString().padStart(3,'0') + ":  " + parts[0].padEnd(40) + " = " + parts[1].padStart(15), () => {
            parts.forEach(p => expect(toExpr(p, grammar)).toStrictEqual(toExpr_ref(p, refGrammar)));
        });
    });

/*
const examples = [
    'true',
    'false',
    'if true ∧ false then true else false fi',
    'if if true then false else true fi then false else true fi',
    'true ∧ false',
    'true ∧ true ∧ true',
    '0',
    'suc(0)',
    'suc(suc(0))',
    '¬true',
    '¬¬true',
    'if true then false else true fi',
    'if true then false else true fi ∧ if true then false else true fi',
];
for(const sample of examples) {
    it("matchea con ref " + sample, () => {
        expect(toExpr(sample, grammar)).toStrictEqual(toExpr_ref(sample, refGrammar));
    });
}
*/