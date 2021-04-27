import { Genero, GeneroParametrizado } from "./Genero";

export type ExpresionLogica = any; // TODO
export type VariablesLibres = { [nombreVar: string]: GeneroParametrizado };

// tokens para sintaxis: corchetes, simbolos, etc
export type Literal = {
    type: "literal";
    symbol: string;
};

// puntito • que despues puede usarse como variable (para restricciones)
export type Slot = {
    type: "slot";
    nombre?: string; // los slots pueden tener nombres ej. nat _n_
    genero: GeneroParametrizado;
};

export type Token = Literal | Slot;

export type RawAxioma = {
    left: string;
    right: string;
};

export type Operacion = {
    type: "observador" | "generador" | "otra";
    nombre: string;
    tokens: Token[]; // como lo parseo a un nodo
    retorno: GeneroParametrizado;
    restriccion?: ExpresionLogica;
};

// TODO: falta exporta, usa
//       para esto podemos mostrar warnings cuando se
//       usa un tipo y no estan listados acá
//       hay que ver que significa "usa" bien,
//       si es transitiva o no, etc
export type TAD = {
    nombre: string;
    parametros: string[];
    genero: Genero;
    generoTokenizado: string[];
    operaciones: Operacion[];
    rawAxiomas: RawAxioma[];
    variablesLibres: VariablesLibres;
};

export type Eval = { expr: string };

export type AST = {
    type: "fijo" | "variable";
    nombre: string; // de la operación o la variable
    operandos?: { [key: number]: AST };
    entreParens: boolean; // si la expresión se encuentra contenida entre paréntesis
};

export type Operandos = {
    [key: number]: Expr;
};

export type Expr = {
    type: "fijo" | "variable";
    nombre: string;
    genero: GeneroParametrizado;
    operandos: Operandos;
};

export type Axioma = [Expr, Expr];

export type Grammar = {
    axiomas: Axioma[];
    backendGrammar: any;
};
