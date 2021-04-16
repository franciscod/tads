import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
import { assert } from "https://deno.land/std@0.93.0/testing/asserts.ts";

const require = createRequire(import.meta.url);
const ohm = require('ohm-js');

// TODO: extraer de bool.tad
const BOOL_AXIOMS = [
    "if true then a else b fi  === a",
    "if false then a else b fi === b",
    "¬x                        === if x then false else true fi",
    "x or y                    === if x then (if y then true else true fi) else y fi",
    "x and y                   === if x then y else (if y then false else false fi) fi",
    "x imp y                   === ¬x and y",
    "x orL y                   === if x then true else y fi",
    "x andL y                  === if x then y else false fi",
    "x impL y                  === ¬x andL y",
];

Deno.test("ohm parsea axiomas de bool", () => {

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
            Or = Bool "or" Bool
            And = Bool "and" Bool
            Imp = Bool "imp" Bool
            OrL = Bool "orL" Bool
            AndL = Bool "andL" Bool
            ImpL = Bool "impL" Bool

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
