import { Parser } from "../parser/Parser.ts";
import { TADDatabase } from "../parser/Database.ts";

const BOOL_TAD = Deno.readTextFileSync("tads/bool.tad");
const NAT_TAD = Deno.readTextFileSync("tads/nat.tad");

const SOURCE = [BOOL_TAD, NAT_TAD].join("\n");

Deno.test("parsea source", () => {
    let db: TADDatabase = new TADDatabase();
    let r = new Parser(db).parse(SOURCE);
    console.log(r);
});
