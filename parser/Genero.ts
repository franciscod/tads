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
 * Tokeniza el género de un TAD con sus parámetros
 *
 * nat → ["nat"]
 * conj(α) → ["conj(", "α", ")"]
 * par(α1, α2) → ["par(", "α1", ",", "α2", ")"]
 */
export function tokenizeGenero(genero: Genero, parametros: string[]): string[] {
    const tokens: string[] = [];
    let buffer = "";
    for (let i = 0; i < genero.length; i++) {
        if (genero[i] === " ") continue;
        for (const paramName of parametros) {
            if (genero.startsWith(paramName, i)) {
                if (buffer.length) tokens.push(buffer);
                tokens.push(paramName);
                buffer = "";
                i += paramName.length;
            }
        }
        buffer += genero[i];
    }
    if (buffer.length) tokens.push(buffer);
    return tokens;
}

/**
 * Esta función toma un género crudo y genera el árbol de géneros
 * Nota: se asume que todos los géneros tiene el formato `nombre(paramA, paramB, ...)`
 *
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
    if (rawGenero.length === 0) {
        report?.addMark("error", "Se esperaba un género", 0, 1);
        return null;
    }

    const tad = tads.find(t => t.generoTokenizado.length > 0 && rawGenero.startsWith(t.generoTokenizado[0]));

    if (!tad) {
        // si no se encuentra un género pero el string tiene
        // paréntesis entonces esperabamos un tipo
        if (rawGenero.includes("(")) {
            report?.addMark("error", `No se reconoce el género \`${rawGenero}\``, 0, rawGenero.length);
            return null;
        }

        return {
            base: rawGenero.trim(),
            parametros: {},
        };
    }

    const parametros: Parametros = {};
    let offset = 0;
    for (let i = 0; i < tad.generoTokenizado.length; i++) {
        const token = tad.generoTokenizado[i];
        if (tad.parametros.includes(token)) {
            // lo que está acá adentro es otro género,
            // avanzamos hasta que se llegue al otro token
            report?.push(offset);
            let buffer = "";
            let bracketBalance = 0;
            while (
                offset < rawGenero.length &&
                (bracketBalance != 0 ||
                    (bracketBalance == 0 && !rawGenero.startsWith(tad.generoTokenizado[i + 1], offset)))
            ) {
                if (rawGenero[offset] === "(") bracketBalance++;
                else if (rawGenero[offset] === ")") {
                    if (bracketBalance === 0) {
                        report?.addMark("error", "No hay paréntesis abierto que matchee", offset, 1);
                        return null;
                    }
                    bracketBalance--;
                }
                buffer += rawGenero[offset];
                offset++;
            }
            const subGenero = parseGenero(buffer, tads, report);
            if (subGenero === null) return null;
            parametros[token] = subGenero;
            report?.pop();
        } else {
            // tiene que coincidir el literal
            if (!rawGenero.startsWith(token, offset)) {
                report?.addMark("error", `Se esperaba \`${token}\``, offset, 1);
                return null;
            }
            offset += token.length;
        }
    }

    if (offset < rawGenero.length) {
        report?.addMark("error", `No se esperaba \`${rawGenero.slice(offset)}\``, offset, rawGenero.length - offset);
        return null;
    }

    return {
        base: tad.genero,
        parametros,
    };
}

/**
 * Devuelve true si se puede calzar el target en el template
 * `parametros` se va modificando para reflejar los bindings
 */
export function calzarGeneros(
    template: GeneroParametrizado,
    target: GeneroParametrizado,
    parametros: Parametros
): boolean {
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
