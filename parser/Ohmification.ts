import { Genero, Operacion } from "./Types.ts";

function titleSlug(s: string) : string {
    s = s.replace(/•/g, "")
    s = s.replace(/α/g, "alpha");
    s = s.replace(/¬/g, "neg");
    s = s.replace(/∨/g, "or");
    s = s.replace(/∧/g, "and");
    s = s.replace(/⇒/g, "imp");

    return s[0].toUpperCase() + s.substr(1).toLowerCase();
}

export function genGrammar(tadName: string, ops: Operacion[], variables: Map<Genero, string[]>) : string {
    let reglasParaGenero: Map<string, string[]> = new Map();

        let generosConocidos: string[] = [titleSlug(tadName)];

    let variablesGenericas: string[] = Array.from(variables.keys())
        .filter((g) => !generosConocidos.includes(titleSlug(g)))
        .map(titleSlug);

    let rules = ops.map((op) => {
        const ret: string = titleSlug(op.retorno);
        let caseName = [op.tipo, op.nombre].reduce((p, e) => {
            return p + titleSlug(e);
        }, "");


        let reglas = reglasParaGenero.get(ret) || [];

        reglas.push(caseName);
        reglasParaGenero.set(ret, reglas);

        const tokensRule = op.tokens.map((tok) => {
            if (tok.type == "literal") return `"${tok.symbol}"`;
            if (tok.type == "slot") return titleSlug(tok.genero);
        }).join(" ");

        return `${caseName} = ${tokensRule}\n`;
    }).join('');

    for (const g of variables.keys()) {
        let varRule: string[] = Array.from(variables.get(g) || [])
            .map((v) => `"${v}"`);

        const tg = titleSlug(g)
        reglasParaGenero.set("Var" + tg, varRule);

        let reglas = reglasParaGenero.get(tg) || [];

        reglas.push("Var" + tg);
        if (variablesGenericas.includes(tg)) {
            reglas.push("Genero");
        }
        reglasParaGenero.set(tg, reglas);
    }

    for (const g of reglasParaGenero.keys()) {
        rules += g + " = " + (reglasParaGenero.get(g) || []).join(' | ') + "\n";
    }


    rules = "Genero = ParenGenero | " + (variablesGenericas.concat(generosConocidos)).join(' | ') + "\n" + rules;


    return `TAD${tadName} {

Axioma = Genero "===" Genero
ParenGenero = "(" Genero ")"

// autogenerado
${rules}
// fin autogenerado
}`;

}
