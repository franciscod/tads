import { ParseContext, parseSource } from "../parser/Parser.ts";

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");
const NAT_TAD = Deno.readTextFileSync("tads/nat.tad");

const SOURCE = [BOOL_TAD, NAT_TAD].join("\n");

Deno.test("parsea source", () => {
  const tads = parseSource(SOURCE);
  // console.log(tads);
});
