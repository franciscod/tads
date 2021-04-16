import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { parseTad } from "../parser/Parser.ts";
import { Slot, TAD, Token } from "../parser/Types.ts";

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");

function generosDeSlots(tokens: Token[]) : string[] {
    return tokens
        .filter((token) => token.type === "slot" )
        .map((token: Token) => {
            const slot = token as Slot;
            return slot.genero;
        });
}

Deno.test("parsea bool", () => {
    const tad: TAD = parseTad(BOOL_TAD)!;

    assertEquals(tad.nombre, "Bool")
    assertEquals(tad.generos, ["bool"])

    const generadores = tad.operaciones.filter((op) => op.tipo == 'generador');
    const otrasOperaciones = tad.operaciones.filter((op) => op.tipo == 'otra');

    const [genTrue, genFalse] = generadores;

    assertEquals(genTrue.nombre, "true");
    assertEquals(genTrue.tokens, [{type: "literal", symbol: "true"}]);
    assertEquals(genTrue.retorno, "bool");

    assertEquals(genFalse.nombre, "false");
    assertEquals(genFalse.tokens, [{type: "literal", symbol: "false"}]);
    assertEquals(genFalse.retorno, "bool");


    const [ooItef, ooNot, ooOr, ooAnd, ooImp, ooOrL, ooAndL, ooImpL] = otrasOperaciones;

    assertEquals(ooItef.nombre, "if•then•else•fi");
    assertEquals(generosDeSlots(ooItef.tokens), ["bool", "α", "α"]);
    assertEquals(ooItef.retorno, "α");

    assertEquals(ooNot.nombre, "¬•");
    assertEquals(generosDeSlots(ooNot.tokens), ["bool"]);
    assertEquals(ooNot.retorno, "bool");

    assertEquals(ooOr.nombre, "•∨•");
    assertEquals(generosDeSlots(ooOr.tokens), ["bool", "bool"]);
    assertEquals(ooOr.retorno, "bool");

    assertEquals(ooAnd.nombre, "•∧•");
    assertEquals(generosDeSlots(ooAnd.tokens), ["bool", "bool"]);
    assertEquals(ooAnd.retorno, "bool");

    assertEquals(ooImp.nombre, "•⇒•");
    assertEquals(generosDeSlots(ooImp.tokens), ["bool", "bool"]);
    assertEquals(ooImp.retorno, "bool");

    assertEquals(ooOrL.nombre, "•∨L•");
    assertEquals(generosDeSlots(ooOrL.tokens), ["bool", "bool"]);
    assertEquals(ooOrL.retorno, "bool");

    assertEquals(ooAndL.nombre, "•∧L•");
    assertEquals(generosDeSlots(ooAndL.tokens), ["bool", "bool"]);
    assertEquals(ooAndL.retorno, "bool");

    assertEquals(ooImpL.nombre, "•⇒L•");
    assertEquals(generosDeSlots(ooImpL.tokens), ["bool", "bool"]);
    assertEquals(ooImpL.retorno, "bool");

    // TODO: chequear axiomas
})
