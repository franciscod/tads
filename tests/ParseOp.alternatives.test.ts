import { parseOperacion } from "../parser/Parser";

it("varias flechas andan igual", () => {
    const orig = parseOperacion("• ∨ •", "bool × bool → bool", 'otras operaciones');
    const ascii = parseOperacion("• ∨ •", "bool × bool -> bool", 'otras operaciones');

    expect(orig).toStrictEqual(ascii);
})

it("varias cruces andan igual", () => {
    const orig = parseOperacion("• ∨ •", "bool × bool → bool", 'otras operaciones');
    const alt = parseOperacion("• ∨ •", "bool ✕ bool → bool", 'otras operaciones');

    expect(orig).toStrictEqual(alt)
})


it("no matchea literales vacios", () => {
    const op = parseOperacion("  • + •  ", "nat   × nat   → nat", 'otras operaciones');
    expect(op?.tokens.length).toBe(3);
})
