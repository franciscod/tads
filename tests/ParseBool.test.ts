import fs from "fs";
import path from "path";
import { parseTad } from "../parser/Parser";

const BOOL_TAD = fs.readFileSync(path.resolve(__dirname, "../tads/bool.tad"), 'utf-8');

test("parsea bool", () => {
    const tad = parseTad(BOOL_TAD);

    expect(tad.nombre).toStrictEqual("Bool")
    expect(tad.generos).toStrictEqual(["bool"]);

    expect(tad.generadores).toContainEqual(["true", [], "bool", null]);
    expect(tad.generadores).toContainEqual(["false", [], "bool", null])

    expect(tad.otrasOperaciones).toContainEqual(["if•then•else•fi", ["bool", "α", "α"], "α", null])

    expect(tad.otrasOperaciones).toContainEqual(["¬•", ["bool"], "bool", null])

    expect(tad.otrasOperaciones).toContainEqual(["•∨•", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContainEqual(["•∧•", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContainEqual(["•⇒•", ["bool", "bool"], "bool", null])

    expect(tad.otrasOperaciones).toContainEqual(["•∨L•", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContainEqual(["•∧L•", ["bool", "bool"], "bool", null])
    expect(tad.otrasOperaciones).toContainEqual(["•⇒L•", ["bool", "bool"], "bool", null])
})
