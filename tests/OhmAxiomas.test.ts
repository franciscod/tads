import fs from "fs";
import { genGrammar, getAST } from "../parser/Ohmification";
import { parseTad } from "../parser/Parser";
import { TAD } from "../parser/Types";

import ohm from "ohm-js";

const BOOL_RANDOM_EXPRS = [
    "¬true",
    "¬¬true",
    "¬(false ∨ true)",
    "if true then true else true fi",
    "if (if true then true else true fi) then true else true fi",
    "true ∨ (if true then true else true fi)",
];

// escrito a mano
const BOOL_CUSTOM_GRAMMAR = `
TADBoolAMano {
  Input = Axioma | Expr
  Axioma = Expr "===" Expr
  ParenExpr = "(" Expr ")"

  Expr = OtraIfthenelsefi | OtraNeg | OtraOr | OtraAnd
              | OtraImp   | OtraOrl | OtraAndl | OtraImpl | OtraIfthenelsefi
              | GeneradorTrue | GeneradorFalse | Var | ParenExpr

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

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");
const tadBool: TAD = parseTad(BOOL_TAD)!;

it("ohm con grammar armada a mano parsea axiomas de bool", () => {
    const boolGrammar = ohm.grammar(BOOL_CUSTOM_GRAMMAR);

    tadBool.axiomas.forEach((axioma: [string, string]) => {
        axioma.forEach((expr: string) => {
            const match = boolGrammar.match(expr);
            expect(match.succeeded()).toStrictEqual(true);
        });
    });
});

it("ohm con grammar armada a mano parsea expresiones random con bools", () => {
    const boolGrammar = ohm.grammar(BOOL_CUSTOM_GRAMMAR);

    BOOL_RANDOM_EXPRS.forEach(expr => {
        const match = boolGrammar.match(expr);
        expect(match.succeeded()).toStrictEqual(true);
    });
});

it("ohm parsea axiomas de bool con grammar autogenerada", () => {
    const vars = new Map([
        ["alpha", ["a", "b"]],
        ["bool", ["x", "y"]],
    ]);
    const [generated, _unused] = genGrammar("bool", tadBool.operaciones, vars);
    const boolGrammar = ohm.grammar(generated);

    tadBool.axiomas.forEach((axioma: [string, string]) => {
        axioma.forEach((expr: string) => {
            const match = boolGrammar.match(expr);
            expect(match.succeeded()).toStrictEqual(true);
        });
    });
});

it("ohm parsea expresiones random de bool con grammar autogenerada", () => {
    const vars = new Map([
        ["alpha", ["a", "b"]],
        ["bool", ["x", "y"]],
    ]);
    const [generated, _unused] = genGrammar("bool", tadBool.operaciones, vars);
    const boolGrammar = ohm.grammar(generated);

    BOOL_RANDOM_EXPRS.forEach(expr => {
        expect(boolGrammar.match(expr).succeeded()).toStrictEqual(true);
    });
});

it("obtiene el ast de ciertas expresiones con bool", () => {
    let casos: [string, any][] = [];

    casos.push([
        "¬(false ∨ true)",
        {
            "1": {
                "0": { type: "GeneradorFalse" },
                "2": { type: "GeneradorTrue" },
                type: "OtraOr",
            },
            type: "OtraNeg",
        },
    ]);

    casos.push([
        "if true then true else true fi",
        {
            "1": { type: "GeneradorTrue" },
            "3": { type: "GeneradorTrue" },
            "5": { type: "GeneradorTrue" },
            type: "OtraIfthenelsefi",
        },
    ]);

    casos.forEach(([expr, ast]) => {
        const [generated, unaryRules] = genGrammar("bool", tadBool.operaciones, new Map());
        const g = ohm.grammar(generated);
        const match = g.match(expr);

        expect(getAST(match, unaryRules)).toStrictEqual(ast);
    });
});
