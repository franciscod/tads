import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
import { assert } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { Operacion } from "../parser/Types.ts";
import { genGrammar } from "../parser/Ohmification.ts";
import { parseTad } from "../parser/Parser.ts";

const require = createRequire(import.meta.url);
const ohm = require('ohm-js');


// TODO: extraer de bool.tad
const BOOL_AXIOMS = [
    "if true then a else b fi  === a",
    "if false then a else b fi === b",
    "¬x                        === if x then false else true fi",
    "x ∨ y                     === if x then (if y then true else true fi) else y fi",
    "x ∧ y                     === if x then y else (if y then false else false fi) fi",
    "x ⇒ y                     === ¬x ∨ y",
    "x ∨L y                    === if x then true else y fi",
    "x ∧L y                    === if x then y else false fi",
    "x ⇒L y                    === ¬x ∨L y",
];

const BOOL_RANDOM_EXPRS = [
    "¬true", "¬¬true", "¬(false ∨ true)", "if true then true else true fi",
    "if (if true then true else true fi) then true else true fi",
    "true ∨ (if true then true else true fi)"
];

// escrito a mano
const BOOL_CUSTOM_GRAMMAR = `
TADBoolAMano {
  Input = Axioma | Expr
  Axioma = Expr "===" Expr
  ParenExpr = "(" Expr ")"

  Expr = ParenExpr | OtraIfthenelsefi | OtraNeg | OtraOr | OtraAnd
              | OtraImp   | OtraOrl | OtraAndl | OtraImpl | OtraIfthenelsefi
              | GeneradorTrue | GeneradorFalse | Var

  GeneradorTrue = "true"
  GeneradorFalse = "false"
  OtraIfthenelsefi = "if" Expr "then" Expr "else" Expr "fi"
  OtraNeg = "¬" Expr
  OtraOr = Expr "∨" Expr
  OtraAnd = Expr "∧" Expr
  OtraImp = Expr "⇒" Expr
  OtraOrl = Expr "∨L" Expr
  OtraAndl = Expr "∧L" Expr
  OtraImpl = Expr "⇒L" Expr

  Var = VarAlphaA | VarAlphaB | VarBoolX | VarBoolY

  VarAlphaA = "a"
  VarAlphaB = "b"
  VarBoolX = "x"
  VarBoolY = "y"
} `;


const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");

Deno.test("ohm con grammar armada a mano parsea axiomas de bool", () => {
    const boolGrammar = ohm.grammar(BOOL_CUSTOM_GRAMMAR);

    BOOL_AXIOMS.forEach((axioma) => {
        const match = boolGrammar.match(axioma);
    });
})

Deno.test("ohm con grammar armada a mano parsea expresiones random con bools", () => {
    const boolGrammar = ohm.grammar(BOOL_CUSTOM_GRAMMAR);

    BOOL_RANDOM_EXPRS.forEach((expr) => {
        const match = boolGrammar.match(expr);
    });
})



Deno.test("ohm parsea axiomas de bool con grammar autogenerada", () => {
    const boolTad = parseTad(BOOL_TAD)!;

    const vars = new Map([ ["alpha", ["a", "b"]], ["bool", ["x", "y"]] ]);
    const generated = genGrammar("bool", boolTad.operaciones, vars);
    const boolGrammar = ohm.grammar(generated);

    BOOL_AXIOMS.forEach((axioma) => {
        assert(boolGrammar.match(axioma).succeeded());
    });
});

Deno.test("ohm parsea expresiones random de bool con grammar autogenerada", () => {
    const boolTad = parseTad(BOOL_TAD)!;

    const vars = new Map([ ["alpha", ["a", "b"]], ["bool", ["x", "y"]] ]);
    const generated = genGrammar("bool", boolTad.operaciones, vars);
    const boolGrammar = ohm.grammar(generated);

    BOOL_RANDOM_EXPRS.forEach((expr) => {
        assert(boolGrammar.match(expr).succeeded());
    });
});
