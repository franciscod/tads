import { TADS } from "./Common";
import { parseSource } from "../parser/Parser";
import { GeneroParametrizado, parseGenero } from "../parser/Genero";

const [tads] = parseSource(TADS.join("\n"));

const GENEROS_INVALIDOS = [
    'conj(',
    'conj()',
    'conj()',
    'pepe',
    'n a t'
];

const GENEROS_VALIDOS = [
    'nat',
    'conj(α)',
    'conj(nat)',
    'par(α1, α2)',
    'par(α1, nat)',
    'par(nat, nat)',
];

const GENEROS_COMPARAR: [string, GeneroParametrizado][] = [
    ["nat", { base: 'nat', parametros: { } }],
    ["conj(α)", { base: 'α', parametros: { 'α': { base: 'α', parametros: { } } } }],
    ["par(α1,conj(par(bool, α)))", {
        base: 'par(α1, α2)',
        parametros: {
            'α1': { base: 'α1', parametros: { } },
            'α2': {
                base: 'conj(α)',
                parametros: {
                    'α': {
                        base: 'par(α1, α2)',
                        parametros: {
                            'α1': { base: 'bool', parametros: { } },
                            'α2': { base: 'α', parametros: { } }
                        }
                    }
                }
            }
        }
    }]
];

test.each(GENEROS_VALIDOS)("valido %s", input => expect(parseGenero(input, tads)).not.toBeNull());
test.each(GENEROS_INVALIDOS)("invalido %s", input => expect(parseGenero(input, tads)).toBeNull());
test.each(GENEROS_COMPARAR)("arbol %s", (input, expected) => expect(parseGenero(input, tads)).toStrictEqual(expected));
