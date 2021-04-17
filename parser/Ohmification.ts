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
    const reglasParaExpr: string[] = [];


    let rules: string = "";

    let varTerms: string[] = [];
    for (const g of variables.keys()) {
        (variables.get(g) || []).forEach((n) => {
            const genVar = "Var" + titleSlug(g) + titleSlug(n);
            rules += `${genVar} = "${n}"\n`;
            varTerms.push(genVar);
        });
    }
        rules += "Var = " + varTerms.join(" | ") + "\n";


    rules += ops.map((op) => {
        const ret: string = titleSlug(op.retorno);
        const caseName = [op.tipo, op.nombre].reduce((p, e) => {
            return p + titleSlug(e);
        }, "");

        // TODO: hay que poner los infijos antes que los generadores
        reglasParaExpr.unshift(caseName);

        const tokensRule = op.tokens.map((tok) => {
            if (tok.type == "literal") return `"${tok.symbol}"`;
            if (tok.type == "slot") return "Expr";
        }).join(" ");

        return `${caseName} = ${tokensRule}\n`;
    }).join('');

    rules += "Expr = " + reglasParaExpr.join(" | ") + " | Var | ParenExpr\n";

    return `TAD${tadName} {
  Input = Axioma | Expr
  Axioma = Expr "===" Expr
  ParenExpr = "(" Expr ")"

// autogenerado
${rules}
// fin autogenerado
}`;

}
