import fs from "fs";
import { parseTad } from "../parser/Parser";
import { Slot, TAD, Token } from "../parser/Types";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", 'utf-8');

function generosDeSlots(tokens: Token[]) : string[] {
    return tokens
        .filter((token) => token.type === "slot" )
        .map((token: Token) => {
            const slot = token as Slot;
            return slot.genero;
        });
}

it("parsea bool", () => {
    const tad: TAD = parseTad(BOOL_TAD)!;

    expect(tad.nombre).toBe("Bool")
    expect(tad.generos).toBe(["bool"])

    const generadores = tad.operaciones.filter((op) => op.tipo == 'generador');
    const otrasOperaciones = tad.operaciones.filter((op) => op.tipo == 'otra');

    const [genTrue, genFalse] = generadores;

    expect(genTrue.nombre).toBe("true");
    expect(genTrue.tokens).toBe([{type: "literal", symbol: "true"}]);
    expect(genTrue.retorno).toBe("bool");

    expect(genFalse.nombre).toBe("false");
    expect(genFalse.tokens).toBe([{type: "literal", symbol: "false"}]);
    expect(genFalse.retorno).toBe("bool");


    const [ooItef, ooNot, ooOr, ooAnd, ooImp, ooOrL, ooAndL, ooImpL] = otrasOperaciones;

    expect(ooItef.nombre).toBe("if•then•else•fi");
    expect(generosDeSlots(ooItef.tokens)).toBe(["bool", "α", "α"]);
    expect(ooItef.retorno).toBe("α");

    expect(ooNot.nombre).toBe("¬•");
    expect(generosDeSlots(ooNot.tokens)).toBe(["bool"]);
    expect(ooNot.retorno).toBe("bool");

    expect(ooOr.nombre).toBe("•∨•");
    expect(generosDeSlots(ooOr.tokens)).toBe(["bool", "bool"]);
    expect(ooOr.retorno).toBe("bool");

    expect(ooAnd.nombre).toBe("•∧•");
    expect(generosDeSlots(ooAnd.tokens)).toBe(["bool", "bool"]);
    expect(ooAnd.retorno).toBe("bool");

    expect(ooImp.nombre).toBe("•⇒•");
    expect(generosDeSlots(ooImp.tokens)).toBe(["bool", "bool"]);
    expect(ooImp.retorno).toBe("bool");

    expect(ooOrL.nombre).toBe("•∨L•");
    expect(generosDeSlots(ooOrL.tokens)).toBe(["bool", "bool"]);
    expect(ooOrL.retorno).toBe("bool");

    expect(ooAndL.nombre).toBe("•∧L•");
    expect(generosDeSlots(ooAndL.tokens)).toBe(["bool", "bool"]);
    expect(ooAndL.retorno).toBe("bool");

    expect(ooImpL.nombre).toBe("•⇒L•");
    expect(generosDeSlots(ooImpL.tokens)).toBe(["bool", "bool"]);
    expect(ooImpL.retorno).toBe("bool");

    // TODO: chequear axiomas
})
