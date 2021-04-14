import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { parseTad } from "../parser/Parser.ts";

Deno.test("parsea bool", () => {
    const source = Deno.readTextFileSync("tads/bool.tad")
    const tad = parseTad(source)

    assertEquals(tad.nombre, "Bool")
    assertEquals(tad.generos, ["bool"])

    // TODO: usar algo mejor tipado que una lista de 4 cosas?

    assertArrayIncludes(tad.generadores, ["true", [], "bool", null])
    assertArrayIncludes(tad.generadores, ["false", [], "bool", null])

    assertArrayIncludes(tad.otrasOperaciones, ["if_then_else_fi", ["bool", "α", "α"], "α", null])

    assertArrayIncludes(tad.otrasOperaciones, ["¬", ["bool"], "bool", null])

    assertArrayIncludes(tad.otrasOperaciones, ["∨", ["bool", "bool"], "bool", null])
    assertArrayIncludes(tad.otrasOperaciones, ["∧", ["bool", "bool"], "bool", null])
    assertArrayIncludes(tad.otrasOperaciones, ["⇒", ["bool", "bool"], "bool", null])

    assertArrayIncludes(tad.otrasOperaciones, ["∨L", ["bool", "bool"], "bool", null])
    assertArrayIncludes(tad.otrasOperaciones, ["∧L", ["bool", "bool"], "bool", null])
    assertArrayIncludes(tad.otrasOperaciones, ["⇒L", ["bool", "bool"], "bool", null])
})
