import fs from "fs";
import path from "path";
import { parseTad } from "../parser/Parser";

const BOOL_TAD = fs.readFileSync(path.resolve(__dirname, "../tads/bool.tad"), 'utf-8');

test("parsea bool", () => {
    const tad = parseTad(BOOL_TAD);

    expect(tad.nombre).toBe("Bool")
    expect(tad.generos).toBe(["bool"]);

    // TODO: usar algo mejor tipado que una lista de 4 cosas?

    expect(tad.generadores).toContain(["true", [], "bool", null]);
    expect(tad.generadores).toContain(["false", [], "bool", null])

    expect(tad.otrasOperaciones).toContain(["if_then_else_fi", ["bool", "α", "α"], "α", null])

    expect(tad.otrasOperaciones).toContain(["¬", ["bool"], "bool", null])

    expect(tad.otrasOperaciones).toContain(["∨", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContain(["∧", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContain(["⇒", ["bool", "bool"], "bool", null])

    expect(tad.otrasOperaciones).toContain(["∨L", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContain(["∧L", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContain(["⇒L", ["bool", "bool"], "bool", null])
})
