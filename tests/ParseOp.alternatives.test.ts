import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { parseTad, parseOperacion } from "../parser/Parser.ts";
import { Genero, Slot, Token } from "../parser/Types.ts";

Deno.test("varias flechas andan igual", () => {
    const orig = parseOperacion("• ∨ • : bool × bool → bool");
    const ascii = parseOperacion("• ∨ • : bool × bool -> bool");

    assertEquals(orig, ascii)
})

Deno.test("varias cruces andan igual", () => {
    const orig = parseOperacion("• ∨ • : bool × bool → bool");
    const alt = parseOperacion("• ∨ • : bool ✕ bool → bool");

    assertEquals(orig, alt)
})
