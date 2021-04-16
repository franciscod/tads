import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
import { assert } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { Operacion } from "../parser/Types.ts";
import { genGrammar } from "../parser/Ohmification.ts";

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

{

    // TODO: reemplazar con el resultado de parsear bool.tad
    const operacionesBool: Operacion[] = [
      {
        nombre: "true",
        tipo: "generador",
        tokens: [ { type: "literal", symbol: "true" } ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "false",
        tipo: "generador",
        tokens: [ { type: "literal", symbol: "false" } ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "if•then•else•fi",
        tipo: "otra",
        tokens: [
          { type: "literal", symbol: "if" },
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "then" },
          { type: "slot", genero: "α" },
          { type: "literal", symbol: "else" },
          { type: "slot", genero: "α" },
          { type: "literal", symbol: "fi" }
        ],
        retorno: "α",
        axiomas: []
      },
      {
        nombre: "¬•",
        tipo: "otra",
        tokens: [ { type: "literal", symbol: "¬" }, { type: "slot", genero: "bool" } ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "•∨•",
        tipo: "otra",
        tokens: [
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "∨" },
          { type: "slot", genero: "bool" }
        ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "•∧•",
        tipo: "otra",
        tokens: [
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "∧" },
          { type: "slot", genero: "bool" }
        ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "•⇒•",
        tipo: "otra",
        tokens: [
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "⇒" },
          { type: "slot", genero: "bool" }
        ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "•∨L•",
        tipo: "otra",
        tokens: [
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "∨L" },
          { type: "slot", genero: "bool" }
        ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "•∧L•",
        tipo: "otra",
        tokens: [
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "∧L" },
          { type: "slot", genero: "bool" }
        ],
        retorno: "bool",
        axiomas: []
      },
      {
        nombre: "•⇒L•",
        tipo: "otra",
        tokens: [
          { type: "slot", genero: "bool" },
          { type: "literal", symbol: "⇒L" },
          { type: "slot", genero: "bool" }
        ],
        retorno: "bool",
        axiomas: []
      }
    ];

    const vars = new Map([ ["alpha", ["a", "b"]], ["bool", ["x", "y"]] ]);
    const generated = genGrammar("bool", operacionesBool, vars);
    const boolGrammar = ohm.grammar(generated);

    BOOL_AXIOMS.forEach((axioma) => {
        Deno.test("se parsea bien el axioma " + axioma, () => {
            assert(boolGrammar.match(axioma).succeeded());
        });
    });

}
