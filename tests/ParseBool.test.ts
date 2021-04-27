import { parseTad } from "../parser/Parser";
import { Slot, TAD, Token } from "../parser/Types";

import { BOOL_TAD } from "./Common";

function generosDeSlots(tokens: Token[]): string[] {
    return tokens
        .filter(token => token.type === "slot")
        .map((token: Token) => {
            const slot = token as Slot;
            return slot.genero.base;
        });
}

it("parsea bool", () => {
    const tad: TAD = parseTad(BOOL_TAD)!;

    expect(tad.nombre).toStrictEqual("Bool");
    expect(tad.genero).toStrictEqual("bool");

    const generadores = tad.operaciones.filter(op => op.type == "generador");
    const otrasOperaciones = tad.operaciones.filter(op => op.type == "otra");

    const [genTrue, genFalse] = generadores;

    expect(genTrue.nombre).toStrictEqual("true");
    expect(genTrue.tokens).toStrictEqual([{ type: "literal", symbol: "true" }]);
    expect(genTrue.retorno.base).toStrictEqual("bool");

    expect(genFalse.nombre).toStrictEqual("false");
    expect(genFalse.tokens).toStrictEqual([{ type: "literal", symbol: "false" }]);
    expect(genFalse.retorno.base).toStrictEqual("bool");

    const [ooItef, ooNot, ooOr, ooAnd, ooImp, ooOrL, ooAndL, ooImpL] = otrasOperaciones;

    expect(ooItef.nombre).toStrictEqual("if•then•else•fi");
    expect(generosDeSlots(ooItef.tokens)).toStrictEqual(["bool", "α", "α"]);
    expect(ooItef.retorno.base).toStrictEqual("α");

    expect(ooNot.nombre).toStrictEqual("¬•");
    expect(generosDeSlots(ooNot.tokens)).toStrictEqual(["bool"]);
    expect(ooNot.retorno.base).toStrictEqual("bool");

    expect(ooOr.nombre).toStrictEqual("•∨•");
    expect(generosDeSlots(ooOr.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooOr.retorno.base).toStrictEqual("bool");

    expect(ooAnd.nombre).toStrictEqual("•∧•");
    expect(generosDeSlots(ooAnd.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooAnd.retorno.base).toStrictEqual("bool");

    expect(ooImp.nombre).toStrictEqual("•⇒•");
    expect(generosDeSlots(ooImp.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooImp.retorno.base).toStrictEqual("bool");

    expect(ooOrL.nombre).toStrictEqual("•∨L•");
    expect(generosDeSlots(ooOrL.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooOrL.retorno.base).toStrictEqual("bool");

    expect(ooAndL.nombre).toStrictEqual("•∧L•");
    expect(generosDeSlots(ooAndL.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooAndL.retorno.base).toStrictEqual("bool");

    expect(ooImpL.nombre).toStrictEqual("•⇒L•");
    expect(generosDeSlots(ooImpL.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooImpL.retorno.base).toStrictEqual("bool");

    // TODO: chequear axiomas
});
