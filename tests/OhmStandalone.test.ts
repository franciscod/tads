import ohm from "ohm-js";

it("ohm esta vivo", () => {
    const contents = 'MyGrammar { greeting = "Hello" | "Hola" }';
    const myGrammar = ohm.grammar(contents);
    expect(myGrammar.match("Hello").succeeded()).toStrictEqual(true);
    expect(myGrammar.match("Hola").succeeded()).toStrictEqual(true);
    expect(!myGrammar.match("foobar").succeeded()).toStrictEqual(true);
});
