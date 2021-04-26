import { Report } from "./Reporting";
import { TAD } from "./Types";

// mapean un parámetro (α, α1, α2, clave) a un género parametrizado
export type Parametros = {
    [paramName: string]: GeneroParametrizado;
};

// o es una parametro (α, β, etc) o es un tad especifico
export type Genero = string;

// género parametrizado,
// la base siempre es el género del TAD **sin reemplazar los parámetros en el nombre**
// es decir, la base de conj(nat) es conj(α)
export type GeneroParametrizado = {
    base: Genero;
    parametros: Parametros;
};

/**
 * Esta función toma un género crudo y genera el árbol de géneros
 * Ejemplo:
 * ```
 * par(α1,conj(par(bool, α))) →
 * {
 *     base: 'par(α1, α2)',
 *     parametros: {
 *         'α1': { base: 'α1' },
 *         'α2': {
 *             base: 'conj(α)',
 *             parametros: {
 *                 'α': {
 *                     base: 'par(α1, α2)',
 *                     parametros: {
 *                         'α1': { base: 'bool' },
 *                         'α2': { base: 'α' }
 *                     }
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 */
export function parseGenero(rawGenero: string, tads: TAD[], report?: Report): GeneroParametrizado | null {
    let parametros: Parametros = {};
    if (rawGenero === "par(α1,α2)") {
        parametros = {
            α1: parseGenero("α1", tads)!,
            α2: parseGenero("α2", tads)!,
        };
    }
    if (rawGenero === "conj(α)") {
        parametros = {
            α: parseGenero("α", tads)!,
        };
    }

    for(const tad of tads) {
        const genero = tad.generos[0];
        const rgx = new RegExp(`${tad.parametros.join("|")}`);
        const r = rawGenero.split(rgx);
        console.log(rgx, rawGenero, r);
    }

    return {
        base: rawGenero,
        parametros,
    };
}

/** 
 * Devuelve true si se puede calzar el target en el template  
 * `parametros` se va modificando para reflejar los bindings
 */
export function calzarGeneros(template: GeneroParametrizado, target: GeneroParametrizado, parametros: Parametros): boolean {
    // DEF: que un genero tenga tipo concreto significa que
    //      el genero base NO es un parámetro, por ej. nat, conj(α), par(α1, α2)

    // caso especial: esto ocurre cuando al genero no le importa el tipo yet
    //                por ejemplo, a ∅ no le importa el alpha
    if (target.base in parametros) {
        // TODO: ver si nos estamos comiendo algo acá que no vi?
        return true;
    }

    // vemos si el genero no es concreto
    if (template.base in parametros) {
        // vemos si es la primera vez que lo vemos
        // (es decir, el parametro tiene de género a sí mismo)
        // ej: { base: 'conj(α)', parametros: { 'α': { base: 'α' } } }
        if (parametros[template.base].base === template.base) {
            // este parámetro pasa a tener un tipo concreto
            parametros[template.base] = target;
            return true;
        } else {
            // ya estaba, así que tiene que calzar
            return calzarGeneros(parametros[template.base], target, parametros);
        }
    }

    // sabemos que es un tipo concreto
    // vemos si coincide en ambos lados
    if (template.base !== target.base) return false;

    // como son el mismo tipo concreto
    // sabemos que tienen los mismos parámetros
    // recursivamente calzamos los géneros
    for (const paramName in template.parametros) {
        if (!calzarGeneros(template.parametros[paramName], target.parametros[paramName], parametros)) return false;
    }

    return true;
}

/**
 * Bindea
 */
export function bindearParametros(genero: GeneroParametrizado, parametros: Parametros): GeneroParametrizado {
    // si el genero es un parámetro, retornamos el parámetro
    if (genero.base in parametros) return parametros[genero.base];

    const ret: GeneroParametrizado = {
        base: genero.base,
        parametros: {},
    };

    // bindeamos los parametros recursivamente
    for (const paramName in genero.parametros) {
        ret.parametros[paramName] = bindearParametros(genero.parametros[paramName], parametros);
    }

    return ret;
}