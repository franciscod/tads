import { TADS } from "./Common";
import { parseSource } from "../parser/Parser";
import { GeneroParametrizado, parseGenero, tokenizeGenero } from "../parser/Genero";

const [tads] = parseSource(TADS.join("\n"));

const GENEROS_TOKENIZAR: [string, string[], string[]][] = [
    ["nat", [], ["nat"]],
    ["conj(α)", ["α"], ["conj(", "α", ")"]],
    ["par(α1,α2)", ["α1", "α2"], ["par(", "α1", ",", "α2", ")"]],
];

test.each(GENEROS_TOKENIZAR)("tokenize %s %s", (input, params, expected) =>
    expect(tokenizeGenero(input, params)).toStrictEqual(expected)
);

const GENEROS_INVALIDOS = [
    "conj(",
    "conj()",
    "conj(conj()",
    "conj(α))",
    "pepe()",
    "pepe(α)",
    "par(α1,)",
    "par(,α2)",
];

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
    "par(nat, nat)",
];

const GENEROS_COMPARAR: [string, GeneroParametrizado][] = [
    ["nat", { base: "nat", parametros: {} }],
    ["conj(α)", { base: "conj(α)", parametros: { α: { base: "α", parametros: {} } } }],
    [
        "par(conj(bool), conj(nat))",
        {
            base: "par(α1,α2)",
            parametros: {
                α1: { base: "conj(α)", parametros: { α: { base: "bool", parametros: { }}} },
                α2: { base: "conj(α)", parametros: { α: { base: "nat", parametros: { }}} },
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
                                α2: { base: "α", parametros: {} },
                            },
                        },
                    },
                },
            },
        },
    ],
];

test.each(GENEROS_VALIDOS)("valido %s", input => expect(parseGenero(input, tads)).not.toBeNull());
test.each(GENEROS_INVALIDOS)("invalido %s", input => expect(parseGenero(input, tads)).toBeNull());
test.each(GENEROS_COMPARAR)("arbol %s", (input, expected) => expect(parseGenero(input, tads)).toStrictEqual(expected));
