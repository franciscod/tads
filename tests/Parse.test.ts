import { parseSource } from "../parser/Parser";

import { TADS } from "./Common";

it(`parse source`, () => {
    const [tads] = parseSource(TADS.join("\n"));

    expect(tads).toHaveLength(TADS.length);
    // TODO: testear más cosas?
});

// TODO: testear mejor al parser
