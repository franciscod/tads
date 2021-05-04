import BOOL_TAD from "./bool.tad";
import NAT_TAD from "./nat.tad";
import INT_TAD from "./int.tad";
import PAR_TAD from "./par.tad";
import CONJ_TAD from "./conj.tad";
import SECU_TAD from "./secu.tad";

import DEMO_TAD from "./demo.tad";

const basicos = [
    BOOL_TAD,
    NAT_TAD,
    INT_TAD,
    PAR_TAD,
    CONJ_TAD,
    SECU_TAD
];

const demo = DEMO_TAD;

export {
    basicos,
    demo
};