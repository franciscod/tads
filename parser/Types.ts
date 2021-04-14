export type ExpresionLogica = any;  // TODO

export type Genero = string | TAD;  // o es una variable (alpha, beta, etc) o es un tad especifico

export type Literal = { // tokens para sintaxis: corchetes, simbolos, etc
    type: "literal";
    symbol: string;
}

export type Slot = { // puntito • que despues puede usarse como variable (para restricciones)
    type: "slot";
    nombre?: string;
    genero: Genero;
};

export type Token = Literal | Slot;

export type Aplicacion = {
    type: "operacion";
    operacion: Operacion;
    args: Nodo[];
}

export type Variable = { // letra (hoja del arbol)
    type: "variable";
    nombre: string;
    genero: Genero;
};

export type Nodo = Aplicacion | Variable;

export type Axioma = {
    bindings: Nodo[];  // a la izquierda, uno por slot de la operacion
    reemplazo: Nodo;
}

export type Operacion = {
    nombre: string;
    tokens: Token[];  // como lo parseo a un nodo
    retorno: Genero;
    axiomas: Axioma[];
    restriccion?: ExpresionLogica;
};

export type TAD = {
    nombre: string;
    generos: string[];
    // exporta por ahora no
    // ig obs por ahora no
    generadores: Operacion[];
    otrasOperaciones: Operacion[];
    variablesLibres: Variable[];
};