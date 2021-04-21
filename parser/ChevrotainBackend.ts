import { Axioma, Expr, Genero, Grammar, Operacion, TAD } from "./Types";
import { titleSlug } from "./Util";

import { createToken, Lexer, CstParser } from "chevrotain";

export function genGrammar(tads: TAD[]): Grammar {
    const ops = tads.reduce((p: Operacion[], c) => p.concat(c.operaciones), []);
    const ctx = gen(ops, new Map());
    const axiomas = auxAxiomasAST(tads);

    return {
        axiomas: axiomas,
        backendGrammar: ctx,
    };
}

export function toExpr(inputText: string, grammar: Grammar): Expr | null {
    const ctx: ChevroContext = grammar.backendGrammar;
    return toExprInternal(inputText, ctx);
}


export function fromExpr(expr: Expr, grammar: Grammar): string {
    return "lol"; //(grammar.backendGrammar as OhmSourceResult).fromAST(expr);
}

type ChevroContext = {
    lexer : any,
//     parser : any,
};

function gen(ops: Operacion[], variables: Map<Genero, string[]>): ChevroContext {
    const whitespace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED
    })

    const lparen = createToken({ name: "LParen", pattern: /\(/})
    const rparen = createToken({ name: "RParen", pattern: /\)/})

    let allTokens = [whitespace, lparen, rparen];

    let tokensDict : any = {
        "WhiteSpace": whitespace,
        "LParen": lparen,
        "RParen": rparen,
    };

    for (const op of ops) {
        const opSlug = titleSlug(op.tipo) + titleSlug(op.nombre);
        for (const tok of op.tokens) {
            if (tok.type == "literal") {
                const literalToken = createToken({name: titleSlug(tok.symbol), pattern: tok.symbol});
                allTokens.unshift(literalToken)
                tokensDict[titleSlug(tok.symbol)] = literalToken;
            }
        }
    }

    for (const g of variables.keys()) {
        (variables.get(g) || []).forEach(n => {
            const varName = "Var" + titleSlug(g) + titleSlug(n);
            const varToken = createToken({name: varName, pattern: n});
            allTokens.push(varToken)
            tokensDict[varName] = varToken;
        });
    }

    // si hay vars:
    // TODO: una var es cualquier varToken
    // TODO: expr se da con var

    // TODO: cada op es (literal -> su literalToken, slot -> Expr)
    // TODO: expr se da con cualquier op, paren expr, var

    /*
            printMapping[caseName] = (ast: Expr): string => {
                return op.tokens
                    .map((tok, i) => {
                        if (tok.type == "literal") return tok.symbol;
                        if (tok.type == "slot") return ` ${printMapping[ast[i].type](ast[i])} `;
                    })
                    .join("");
            };
    */

    // TODO: parser

    let lexer = new Lexer(allTokens)


    let exprOr: any[] = [];

    class BespokeParser extends CstParser {
      constructor() {
        super(allTokens)

        const $: any = this

    ops.forEach((op) => {
            const opSlug = titleSlug(op.tipo) + titleSlug(op.nombre);
            $.RULE(opSlug, () => {
                op.tokens.forEach((tok, i) => {
                    let s = i + '';
                    if (i === 0) s = '';

                    if (tok.type == "literal") {
                        $['CONSUME' + s](tokensDict[titleSlug(tok.symbol)])
                    } else if (tok.type == "slot") {
                        $['SUBRULE' + s]($.expr);
                    }
                })
            })
            exprOr.unshift({nombrecin: opSlug, ALT : () => $.SUBRULE($[opSlug])})
        })
        console.log(exprOr);

    $.RULE("expr", () => {
        console.log($.input);
    $.OR(exprOr);
    })

        this.performSelfAnalysis()
      }
    }

    // const parser = new BespokeParser();


    return {
        lexer,
    // parser,
    //   semanticFromAst:
    //   semanticPrint:
    };
}


function auxAxiomasAST(tads: TAD[]): Axioma[] {
    let ret: Axioma[] = [];

    const opsTodos = tads.map(tad => tad.operaciones).reduce((ret, ops) => ret.concat(ops), []);

    for (const tad of tads) {
        const ctx = gen(opsTodos, tad.variablesLibres);

        for (const [left, right] of tad.axiomas) {
            const exprL = toExprInternal(left, ctx);
            const exprR = toExprInternal(right, ctx);
            continue;
    //
    //             if (exprL === null || exprR === null) {
    //                 console.log("Axioma falló al parsearse", left);
    //                 continue;
    //             }

    // ret.push([exprL, exprR]);
        }
    }

    return ret;
}

function toExprInternal(inputText: string, ctx: ChevroContext): Expr | null {
    const lexingResult = ctx.lexer.tokenize(inputText);
    const tokens = lexingResult.tokens.map((t: any) => t.tokenType.name);
    console.log("input", inputText);
    console.log("tokens", tokens);
    // ctx.parser.input = lexingResult.tokens;
    // console.log(ctx.parser.input)
    // ctx.parser.expr()

    // if (ctx.parser.errors.length > 0) {
    //    return null;
    // }

    return tokens;
    //{"type": "algo hizo"};
}
