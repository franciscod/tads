import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
import { assert } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { Operacion } from "../parser/Types.ts";
import { genGrammar } from "../parser/Ohmification.ts";
import { parseTad } from "../parser/Parser.ts";

const require = createRequire(import.meta.url);
const ohm = require("ohm-js");

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");
const NAT_TAD = Deno.readTextFileSync("tads/nat.tad");

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

Deno.readTextFileSync("tests/evals.txt").split("\n").forEach((line, n) => {
  if (line.includes("nat")) {
    enBool = false;
    enNat = true;
  }

  if (line.includes("conj")) {
    enNat = false;
    enConj = true;
  }

  if (enBool) {
    Deno.test(
      "parsea casos bool evals.txt:" + (n + 1) + ":^" + line + "$",
      () => {
        assert(g.match(line).succeeded());
      },
    );
  }
  if (enNat) {
    Deno.test(
      "parsea casos bool+nat evals.txt:" + (n + 1) + ":^" + line + "$",
      () => {
        assert(g.match(line).succeeded());
      },
    );
  }
});
