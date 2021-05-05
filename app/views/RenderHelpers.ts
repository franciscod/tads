import { GeneroParametrizado } from "../../parser/Genero";
import { Grammar } from "../../parser/Grammar";

const renderGenero = (genero: GeneroParametrizado, grammar: Grammar): string => {
    const tad = grammar.tads.find(t => t.genero === genero.base);
    if(tad) {
        let str = "";
        for(const token of tad.generoTokenizado) {
            if(token in genero.parametros) {
                str += renderGenero(genero.parametros[token], grammar);
            } else {
                str += token;
            }
        }
        return str;
    } else {
        return genero.base;
    }
};

export const renderGeneroTag = (genero: GeneroParametrizado, grammar: Grammar): string => {
    return `<span class="genero">${renderGenero(genero, grammar)}</span>`;
};