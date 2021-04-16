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

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");

Deno.test("ohm parsea axiomas de bool con grammar armada a mano", () => {
    // escrito a mano
    const contents = `
        TADGrammar {
            Expr = Axiom | Genero
            ParenGenero = "(" Genero ")"
            Axiom = Genero "===" Genero

            Genero = Bool | Alpha | ParenGenero
            Alpha = AlphaVar | Genero

            // cuantificadores
            BoolVar = "x" | "y"
            AlphaVar = "a" | "b"

            True = "true"
            False = "false"
            IfThenElseFi = "if" Bool "then" Alpha "else" Alpha "fi"
            Not = "¬" Bool
            Or = Bool "∨" Bool
            And = Bool "∧" Bool
            Imp = Bool "⇒" Bool
            OrL = Bool "∨L" Bool
            AndL = Bool "∧L" Bool
            ImpL = Bool "⇒L" Bool

            Bool = True
                    | False
                    | IfThenElseFi
                    | Not
                    | Or
                    | And
                    | Imp
                    | OrL
                    | AndL
                    | ImpL
                    | BoolVar
        }`;

    const boolGrammar = ohm.grammar(contents);
    BOOL_AXIOMS.forEach((axioma) => {
        assert(boolGrammar.match(axioma).succeeded());
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
