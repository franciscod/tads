import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { parseTad, parseOperacion } from "../parser/Parser.ts";
import { Genero, Slot, TAD, Token } from "../parser/Types.ts";

const DUMMY: TAD = {
    nombre: "Dummy",
    generos: [],
    generadores: [],
    otrasOperaciones: [],
    variablesLibres: []
};

Deno.test("varias flechas andan igual", () => {
    const orig = parseOperacion("• ∨ • : bool × bool → bool", DUMMY);
    const ascii = parseOperacion("• ∨ • : bool × bool -> bool", DUMMY);

    assertEquals(orig, ascii)
})

Deno.test("varias cruces andan igual", () => {
    const orig = parseOperacion("• ∨ • : bool × bool → bool", DUMMY);
    const alt = parseOperacion("• ∨ • : bool ✕ bool → bool", DUMMY);

    assertEquals(orig, alt)
})
