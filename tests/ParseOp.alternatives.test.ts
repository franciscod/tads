import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { Parser } from "../parser/Parser.ts";
import { TADDatabase } from "../parser/Database.ts";
import { Genero, Slot, TAD, Token } from "../parser/Types.ts";

const DUMMY: TAD = {
    nombre: "Dummy",
    generos: [],
    operaciones: [],
    variablesLibres: []
};

const DUMMY_DB: TADDatabase = new TADDatabase();

const PARSER: Parser = new Parser(DUMMY_DB);

Deno.test("varias flechas andan igual", () => {
    const orig = PARSER.parseLineaOperacion("• ∨ • : bool × bool → bool", DUMMY);
    const ascii = PARSER.parseLineaOperacion("• ∨ • : bool × bool -> bool", DUMMY);

    assertEquals(orig, ascii)
})

Deno.test("varias cruces andan igual", () => {
    const orig = PARSER.parseLineaOperacion("• ∨ • : bool × bool → bool", DUMMY);
    const alt = PARSER.parseLineaOperacion("• ∨ • : bool ✕ bool → bool", DUMMY);

    assertEquals(orig, alt)
})
