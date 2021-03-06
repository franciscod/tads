import { Report } from "./Reporting";
import { TAD } from "./Types";

/**
 * O es un parámetro (`α`, `β`, etc) o un género base (sin parámetros reemplazados)
 */
export type Genero = string;

/**
 * Mapean un parámetro (`α`, `α1`, `α2`, `clave`, `significado`)
 * a un género parametrizado
 */
export type Parametros = {
    [paramName: string]: GeneroParametrizado;
};

/**
 * El género parametrizado.
 * La base siempre es el género del TAD **sin reemplazar los parámetros**, es decir
 * la base de `conj(nat)` es `conj(α)`
 */
export type GeneroParametrizado = {
    base: Genero;
    parametros: Parametros;
};

/**
 * Tokeniza el género de un TAD con sus parámetros
 * No sirve para parsear géneros crudos (ie. `conj(nat)`)
 *
 * `nat` → ["nat"]
 * `conj(α)` → ["conj(", "α", ")"]
 * `par(α1, α2)` → ["par(", "α1", ",", "α2", ")"]
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
    rawGenero = rawGenero.trim();

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
            parametros: {}
        };
    }

    const parametros: Parametros = {};
    let offset = 0;
    for (let i = 0; i < tad.generoTokenizado.length; i++) {
        const token = tad.generoTokenizado[i];
        if (tad.parametros.includes(token)) {
            // lo que está acá adentro es otro género,
            // avanzamos hasta que se llegue al otro token
            const startOffset = offset;
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
            report?.push(startOffset);
            const subGenero = parseGenero(buffer, tads, report);
            report?.pop();
            if (subGenero === null) return null;
            parametros[token] = subGenero;
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
        parametros
    };
}

/**
 * Devuelve true si se puede calzar el target en el template
 * `parametros` se va modificando para reflejar los bindings de los parámetros en template
 */
export function calzarGeneros(
    template: GeneroParametrizado,
    target: GeneroParametrizado,
    parametros: Parametros,
    tads: TAD[]
): boolean {
    // DEF: que un genero sea concreto significa que el genero base NO es un parámetro,
    //      por ej. es nat, conj(α), par(α1, α2) y NO α, α1, clave

    if(!template || !target) {
        return false;
    }

    // NOTA: los parámetros en `parametros` hacen referencia a los del TEMPLATE
    //       los del target no afectan a `parametros` !!!!

    if(template.base === target.base) {
        // los géneros base coinciden
        // nat === nat
        // α === α
        // conj(α) === conj(α)

        // como el género base coincide, lo único que puede hacer que el género no calce es
        // que alguno de los parámetros de del template no sea compatible
        // lo hacemos recursivamente

        // sabemos que template y target tienen los mismos parámetros, podemos iterar uno solo
        for(const paramName in template.parametros) {
            const genA = template.parametros[paramName];
            const genB = target.parametros[paramName];

            if(!calzarGeneros(genA, genB, parametros, tads)) {
                return false;
            }
        }

        // todos los parámetros son compatibles, los géneros son compatibles
        return true;
    } else {
        // los géneros base no coinciden
        // nat !== int
        // bool !== α

        const tadA = tads.find(t => t.genero === template.base);
        const tadB = tads.find(t => t.genero === target.base);
    
        if(tadA && tadB) {
            // ambos son géneros concretos y su base no coincidía
            // nat !== int
            // bool !== conj(α)
            // no calzan
            return false;
        }

        if(!tadA && !tadB) {
            // ninguno es concreto
            // α === α
            // NO SE
            console.log("idk");
            return false;
        }

        // uno es concreto y el otro no

        if(tadA && !tadB) {
            // el target es menos explicito que el template, calza
            // nat === α
            // conj(α) === α
            return true;
        }

        // !tadA && tadB
        // el target está pidiendo que un parámetro del template tenga un tipo,
        // hay que ver que sea compatible con el anterior o agregarlo si es nuevo

        if(template.base in parametros) {
            // estaba, hay que ver que calce con el parámetro que ya estaba
            if(calzarGeneros(target, parametros[template.base], parametros, tads)) {
                // TODO: quizás hay que elegir dejar el que está o poner el target
                //       "combinarlos" para tener el más genérico posible?
                parametros[template.base] = target;
            } else {
                return false;
            }
        } else {
            // no estaba, lo puedo agregar directamente
            parametros[template.base] = target;
        }

        return true;
    }
}

/**
 * Bindea parámetros en un género parametrizado
 * (devuelve una copia, pero los parámetros reemplazados no son copiados)
 */
export function bindearParametros(genero: GeneroParametrizado, parametros: Parametros): GeneroParametrizado {
    // si el genero es un parámetro, retornamos el parámetro
    if (genero.base in parametros) return parametros[genero.base];

    const ret: GeneroParametrizado = {
        base: genero.base,
        parametros: {}
    };

    // bindeamos los parametros recursivamente
    for (const paramName in genero.parametros) {
        ret.parametros[paramName] = bindearParametros(genero.parametros[paramName], parametros);
    }

    return ret;
}
