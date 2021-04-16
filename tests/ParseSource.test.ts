import { Parser } from "../parser/Parser.ts";

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");
const NAT_TAD = Deno.readTextFileSync("tads/nat.tad");

const SOURCE = [BOOL_TAD, NAT_TAD].join("\n");

Deno.test("parsea source", () => {
    let r = new Parser().parse(SOURCE);
    console.log(r);
});
