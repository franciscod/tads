import ohm from 'ohm-js';

it("ohm esta vivo", () => {
    const contents = 'MyGrammar { greeting = "Hello" | "Hola" }';
    const myGrammar = ohm.grammar(contents);
    expect(myGrammar.match('Hello').succeeded());
    expect(myGrammar.match('Hola').succeeded());
    expect(!myGrammar.match('foobar').succeeded());
})
