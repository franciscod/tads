import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
import { assert } from "https://deno.land/std@0.93.0/testing/asserts.ts";

const require = createRequire(import.meta.url);
const ohm = require("ohm-js");

Deno.test("ohm esta vivo", () => {
  const contents = 'MyGrammar { greeting = "Hello" | "Hola" }';
  const myGrammar = ohm.grammar(contents);
  assert(myGrammar.match("Hello").succeeded());
  assert(myGrammar.match("Hola").succeeded());
  assert(!myGrammar.match("foobar").succeeded());
});
