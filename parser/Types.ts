export type Range = {
    startLine: number;
    endLine: number;
    columnStart: number;
    columnEnd: number;
};

export type ParseReference = {
    range?: Range;
};

export type ExpresionLogica = any; // TODO

export type Genero = string; // o es una variable (alpha, beta, etc) o es un tad especifico

export type Literal = {
    // tokens para sintaxis: corchetes, simbolos, etc
    type: "literal";
    symbol: string;
};

export type Slot = {
    // puntito • que despues puede usarse como variable (para restricciones)
    type: "slot";
    nombre?: string;
    genero: Genero;
};

export type Token = (Literal | Slot) & ParseReference;
export type Axioma = [string, string] & ParseReference;

export type Operacion = {
    nombre: string;
    tipo: "basico" | "generador" | "otra"; // TODO: observador
    tokens: Token[]; // como lo parseo a un nodo
    retorno: string;
    restriccion?: ExpresionLogica;
} & ParseReference;

export type TAD = {
    nombre: string;
    generos: string[];
    // exporta por ahora no
    operaciones: Operacion[];
    variablesLibres: Map<Genero, string[]>;
    axiomas: Axioma[];
} & ParseReference;

export type Eval = { expr: string; } & ParseReference;