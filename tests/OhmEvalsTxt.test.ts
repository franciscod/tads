import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
import { assert } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { Operacion } from "../parser/Types.ts";
import { genGrammar } from "../parser/Ohmification.ts";
import { parseTad } from "../parser/Parser.ts";

const require = createRequire(import.meta.url);
const ohm = require('ohm-js');

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");
const boolTad = parseTad(BOOL_TAD)!;
const generated = genGrammar("bool", boolTad.operaciones, new Map());
const g = ohm.grammar(generated);

let antesDeNat = true;
Deno.readTextFileSync("tests/evals.txt").split('\n').forEach((line, n) => {

  if (line.includes("nat")) {
    antesDeNat = false;
  }
  if (antesDeNat) {
    Deno.test("parsea hasta nat evals.txt:" + (n + 1) + ":^" + line + "$", () => {
        line = line.split('--')[0];
        if (!line) return;
        assert(g.match(line).succeeded());
    });
  }
})

