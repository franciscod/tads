import { Genero, GeneroParametrizado } from "./Genero";

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

export type RawExpression = {
    source: string;
    offset: number;
}

export type RawAxioma = {
    left: RawExpression;
    right: RawExpression;
};

export type RawEval = {
    kind: "eval" | "assert";
    expr: RawExpression;
};

export type Operacion = {
    type: "observador" | "generador" | "otra";
    nombre: string;
    tokens: Token[]; // como lo parseo a un nodo
    retorno: GeneroParametrizado;
    // restriccion?: ExpresionLogica;
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
