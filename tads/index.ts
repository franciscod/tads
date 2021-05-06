import BOOL_TAD from "./bool.tad";
import NAT_TAD from "./nat.tad";
import INT_TAD from "./int.tad";
import PAR_TAD from "./par.tad";
import CONJ_TAD from "./conj.tad";
import SECU_TAD from "./secu.tad";
import ARBOL_BINARIO_TAD from "./arbolbinario.tad";
import ARREGLO_TAD from "./arreglo.tad";
import COLA_TAD from "./cola.tad";
import COLA_PRIORIDAD_TAD from "./colaprioridad.tad";
import DICCIONARIO_TAD from "./diccionario.tad";
import PILA_TAD from "./pila.tad";

import DEMO_TAD from "./demo.tad";

const basicos = [
    BOOL_TAD,
    NAT_TAD,
    INT_TAD,
    PAR_TAD,
    CONJ_TAD,
    SECU_TAD,
    ARBOL_BINARIO_TAD,
    ARREGLO_TAD,
    COLA_TAD,
    COLA_PRIORIDAD_TAD,
    DICCIONARIO_TAD,
    PILA_TAD
];

const demo = DEMO_TAD;

export {
    basicos,
    demo
};