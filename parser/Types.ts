export type Range = {
    startLine: number;
    endLine: number;
    columnStart: number;
    columnEnd: number;
};

export type SourceReference = {
    range?: Range;
};

export type ExpresionLogica = any; // TODO
export type VariablesLibres = { [nombreVar: string]: Genero };

export type Genero = string; // o es una variable (alpha, beta, etc) o es un tad especifico

// tokens para sintaxis: corchetes, simbolos, etc
export type Literal = {
    type: "literal";
    symbol: string;
};

// puntito • que despues puede usarse como variable (para restricciones)
export type Slot = {
    type: "slot";
    nombre?: string; // los slots pueden tener nombres ej. nat _n_
    genero: Genero;
};

export type Token = Literal | Slot;

export type RawAxioma = {
    left: string & SourceReference;
    right: string & SourceReference;
};

export type Operacion = {
    type: "observador" | "generador" | "otra";
    nombre: string;
    tokens: Token[]; // como lo parseo a un nodo
    retorno: Genero;
    restriccion?: ExpresionLogica;
    tad: TAD;
} & SourceReference;

// TODO: falta exporta, usa
//       para esto podemos mostrar warnings cuando se
//       usa un tipo y no estan listados acá
//       hay que ver que significa "usa" bien,
//       si es transitiva o no, etc
export type TAD = {
    nombre: string;
    parametros: string[];
    generos: Genero[];
    operaciones: Operacion[];
    rawAxiomas: RawAxioma[];
    variablesLibres: VariablesLibres;
} & SourceReference;

export type Eval = { expr: string } & SourceReference;

export type Operandos = {
    [key: number]: Expr;
};

export type Expr = {
    type: "fijo" | "variable";
    nombre: string;
    genero: Genero;
    operandos: Operandos
};

export type Axioma = [Expr, Expr];

export type Grammar = {
    axiomas: Axioma[];
    backendGrammar: any;
};
