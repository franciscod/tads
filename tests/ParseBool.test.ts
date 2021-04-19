import fs from "fs";
import { parseTad } from "../parser/Parser";
import { Slot, TAD, Token } from "../parser/Types";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", "utf-8");

function generosDeSlots(tokens: Token[]): string[] {
    return tokens
        .filter(token => token.type === "slot")
        .map((token: Token) => {
            const slot = token as Slot;
            return slot.genero;
        });
}

it("parsea bool", () => {
    const tad: TAD = parseTad(BOOL_TAD)!;

    expect(tad.nombre).toStrictEqual("Bool");
    expect(tad.generos).toStrictEqual(["bool"]);

    const generadores = tad.operaciones.filter(op => op.tipo == "generador");
    const otrasOperaciones = tad.operaciones.filter(op => op.tipo == "otra");

    const [genTrue, genFalse] = generadores;

    expect(genTrue.nombre).toStrictEqual("true");
    expect(genTrue.tokens).toStrictEqual([{ type: "literal", symbol: "true" }]);
    expect(genTrue.retorno).toStrictEqual("bool");

    expect(genFalse.nombre).toStrictEqual("false");
    expect(genFalse.tokens).toStrictEqual([{ type: "literal", symbol: "false" }]);
    expect(genFalse.retorno).toStrictEqual("bool");

    const [ooItef, ooNot, ooOr, ooAnd, ooImp, ooOrL, ooAndL, ooImpL] = otrasOperaciones;

    expect(ooItef.nombre).toStrictEqual("if•then•else•fi");
    expect(generosDeSlots(ooItef.tokens)).toStrictEqual(["bool", "α", "α"]);
    expect(ooItef.retorno).toStrictEqual("α");

    expect(ooNot.nombre).toStrictEqual("¬•");
    expect(generosDeSlots(ooNot.tokens)).toStrictEqual(["bool"]);
    expect(ooNot.retorno).toStrictEqual("bool");

    expect(ooOr.nombre).toStrictEqual("•∨•");
    expect(generosDeSlots(ooOr.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooOr.retorno).toStrictEqual("bool");

    expect(ooAnd.nombre).toStrictEqual("•∧•");
    expect(generosDeSlots(ooAnd.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooAnd.retorno).toStrictEqual("bool");

    expect(ooImp.nombre).toStrictEqual("•⇒•");
    expect(generosDeSlots(ooImp.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooImp.retorno).toStrictEqual("bool");

    expect(ooOrL.nombre).toStrictEqual("•∨L•");
    expect(generosDeSlots(ooOrL.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooOrL.retorno).toStrictEqual("bool");

    expect(ooAndL.nombre).toStrictEqual("•∧L•");
    expect(generosDeSlots(ooAndL.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooAndL.retorno).toStrictEqual("bool");

    expect(ooImpL.nombre).toStrictEqual("•⇒L•");
    expect(generosDeSlots(ooImpL.tokens)).toStrictEqual(["bool", "bool"]);
    expect(ooImpL.retorno).toStrictEqual("bool");

    // TODO: chequear axiomas
});
