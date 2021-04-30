import { parseTADs } from "../parser/Parser";

import { TADS } from "./Common";

it(`parse source`, () => {
    const [tads] = parseTADs(TADS.join("\n"));

    expect(tads).toHaveLength(TADS.length);
    // TODO: testear más cosas?
});

// TODO: testear mejor al parser
