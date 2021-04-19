import fs from "fs";
import { parseSource } from "../parser/Parser";

const BOOL_TAD = fs.readFileSync("tads/bool.tad", 'utf-8');
const NAT_TAD = fs.readFileSync("tads/nat.tad", 'utf-8');

const SOURCE = [BOOL_TAD, NAT_TAD].join("\n");

it("parsea source", () => {
    const tads = parseSource(SOURCE);
    // console.log(tads);
});
