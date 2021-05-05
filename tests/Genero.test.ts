import { TADS } from "./Common";
import { parseTADs } from "../parser/Parser";
import {
    bindearParametros,
    calzarGeneros,
    Genero,
    GeneroParametrizado,
    Parametros,
    parseGenero,
    tokenizeGenero
} from "../parser/Genero";

const [tads] = parseTADs(TADS.join("\n"));

const GENEROS_TOKENIZAR: [string, string[], string[]][] = [
    ["nat", [], ["nat"]],
    ["conj(α)", ["α"], ["conj(", "α", ")"]],
    ["par(α1,α2)", ["α1", "α2"], ["par(", "α1", ",", "α2", ")"]]
];

test.each(GENEROS_TOKENIZAR)("tokenize %s %s", (input, params, expected) =>
    expect(tokenizeGenero(input, params)).toStrictEqual(expected)
);

const GENEROS_INVALIDOS = ["conj(", "conj()", "conj(conj()", "conj(α))", "pepe()", "pepe(α)", "par(α1,)", "par(,α2)"];

const GENEROS_VALIDOS = [
    "α",
    "α1",
    "nat",
    "conj(α)",
    "conj(nat)",
    "conj(conj(α))",
    "conj(conj(bool))",
    "par(conj(bool), conj(nat))",
    "par(α1, α2)",
    "par(α1, nat)",
    "par(nat, α2)",
    "par(nat, nat)"
];

const GENEROS_COMPARAR: [string, GeneroParametrizado][] = [
    ["nat", { base: "nat", parametros: {} }],
    ["conj(α)", { base: "conj(α)", parametros: { α: { base: "α", parametros: {} } } }],
    [
        "par(conj(bool), conj(nat))",
        {
            base: "par(α1,α2)",
            parametros: {
                α1: { base: "conj(α)", parametros: { α: { base: "bool", parametros: {} } } },
                α2: { base: "conj(α)", parametros: { α: { base: "nat", parametros: {} } } }
            }
        }
    ],
    [
        "par(α1,conj(par(bool, α)))",
        {
            base: "par(α1,α2)",
            parametros: {
                α1: { base: "α1", parametros: {} },
                α2: {
                    base: "conj(α)",
                    parametros: {
                        α: {
                            base: "par(α1,α2)",
                            parametros: {
                                α1: { base: "bool", parametros: {} },
                                α2: { base: "α", parametros: {} }
                            }
                        }
                    }
                }
            }
        }
    ]
];

test.each(GENEROS_VALIDOS)("valido %s", input => expect(parseGenero(input, tads)).not.toBeNull());
test.each(GENEROS_INVALIDOS)("invalido %s", input => expect(parseGenero(input, tads)).toBeNull());
test.each(GENEROS_COMPARAR)("arbol %s", (input, expected) => expect(parseGenero(input, tads)).toStrictEqual(expected));

const GENEROS_COMPATIBLES: [Genero, Genero, { [key: string]: Genero }, boolean][] = [
    ["α", "α", {}, true],
    ["α", "α", { α: "α" }, true],
    ["α", "α", { α: "nat" }, true],
    ["α", "nat", { α: "nat" }, true],
    ["α", "bool", { α: "nat" }, false],
    ["α1", "α1", { α1: "α1", α2: "α2" }, true],
    ["par(α1,α2)", "par(α1,α2)", { α1: "α1", α2: "α2" }, true],
    ["nat", "conj(α)", {}, false],
    ["conj(α)", "conj(α)", { α: "α" }, true],
    ["conj(α)", "conj(nat)", { α: "α" }, true],
    ["conj(α)", "conj(nat)", { α: "nat" }, true],
    ["conj(α)", "conj(nat)", { α: "bool" }, false],
    ["conj(α)", "conj(nat)", { }, true]
];

test.each(GENEROS_COMPATIBLES)("compatibles %s con %s %s -> %s", (template, target, parametros, expected) => {
    const generoTemplate = parseGenero(template, tads);
    const generoTarget = parseGenero(target, tads);
    const generoParams: Parametros = {};
    for (const paramName in parametros) {
        const subGen = parseGenero(parametros[paramName], tads);
        expect(subGen).not.toBeNull();
        generoParams[paramName] = subGen!;
    }

    expect(generoTemplate).not.toBeNull();
    expect(generoTarget).not.toBeNull();
    expect(calzarGeneros(generoTemplate!, generoTarget!, generoParams, tads)).toStrictEqual(expected);
});

const BINDEAR_PARAMETROS: [Genero, { [key: string]: Genero }, Genero][] = [
    ["bool", {}, "bool"],
    ["α", { α: "bool" }, "bool"],
    ["par(α1,conj(par(bool, α)))", { α: "bool" }, "par(α1,conj(par(bool, bool)))"],
    ["par(α1,conj(par(bool, α)))", { α1: "nat" }, "par(nat,conj(par(bool, α)))"],
    ["par(α1,conj(par(bool, α)))", { α: "bool", α1: "nat" }, "par(nat,conj(par(bool, bool)))"],
    ["par(α,α)", { α: "bool" }, "par(bool, bool)"],
    ["conj(α)", { α: "conj(α1)" }, "conj(conj(α1))"]
];

test.each(BINDEAR_PARAMETROS)("bindear %s + %s -> %s", (template, parametros, expected) => {
    const generoTemplate = parseGenero(template, tads);
    const generoTarget = parseGenero(expected, tads);
    const generoParams: Parametros = {};
    for (const paramName in parametros) {
        const subGen = parseGenero(parametros[paramName], tads);
        expect(subGen).not.toBeNull();
        generoParams[paramName] = subGen!;
    }

    expect(generoTemplate).not.toBeNull();
    expect(generoTarget).not.toBeNull();
    expect(bindearParametros(generoTemplate!, generoParams)).toStrictEqual(generoTarget!);
});
