import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { parseOperacion } from "../parser/Parser.ts";

Deno.test("varias flechas andan igual", () => {
    const orig = parseOperacion("• ∨ •", "bool × bool → bool", 'otras operaciones');
    const ascii = parseOperacion("• ∨ •", "bool × bool -> bool", 'otras operaciones');

    assertEquals(orig, ascii);
})

Deno.test("varias cruces andan igual", () => {
    const orig = parseOperacion("• ∨ •", "bool × bool → bool", 'otras operaciones');
    const alt = parseOperacion("• ∨ •", "bool ✕ bool → bool", 'otras operaciones');

    assertEquals(orig, alt)
})
