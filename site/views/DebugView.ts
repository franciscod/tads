import { Genero, Operacion, TAD, Token } from "../../parser/Types.ts";
import { genGrammar } from "../../parser/Ohmification.ts";


const generateGeneroTag = (genero: Genero): string => {
    return `<span class="keyword genero">${genero}</span>`;
};

const generateToken = (token: Token): string => {
    return token.type === 'literal' ?
        `<span class="keyword ${token.type}">${token.symbol}</span>` :
        generateGeneroTag(token.genero);
};

const generateTokens = (tokens: Token[]): string => {
    return tokens.map(generateToken).join(' ');
};

const generateOperatorRow = (op: Operacion): string => {
    return `
        <tr>
            <td>${generateTokens(op.tokens)}</td>
            <td>➔</td>
            <td>${generateGeneroTag(op.retorno)}</td>
        </tr>
    `;
};

const generateOperatorTable = (ops: Operacion[]): string => {
    return `
        <table>
            <thead></thead>
            <tbody>
                ${ops.map(generateOperatorRow).join('\n')}
            </tbody>
        </table>
    `;
};

const generateDebugView = (tad: TAD): string => {

    console.log(tad);

    return `
        <div class="debug-title">${tad.nombre} (${tad.generos[0]})</div>
        <br>
        <div class="debug-section">operaciones</div>
        ${generateOperatorTable(tad.operaciones)}
        <br>
        <br>
        <br>
        <pre>
        ${genGrammar(tad.nombre, tad.operaciones, new Map())}
        </pre>
    `;

    return "report\n".repeat(500);
};
    
export default generateDebugView;
