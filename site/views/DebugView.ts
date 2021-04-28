import { Operacion, TAD, Token } from "../../parser/Types";
import { genGrammar } from "../../parser/Grammar";
import { Genero } from "../../parser/Genero";

const generateGeneroTag = (genero: Genero): string => {
    return `<span class="keyword genero">${genero}</span>`;
};

const generateToken = (token: Token): string => {
    return token.type === "literal"
        ? `<span class="keyword ${token.type}">${token.symbol}</span>`
        : generateGeneroTag(token.genero.base);
};

const generateTokens = (tokens: Token[]): string => {
    return tokens.map(generateToken).join(" ");
};

const generateOperatorRow = (op: Operacion): string => {
    return `
        <tr>
            <td>${generateTokens(op.tokens)}</td>
            <td>➔</td>
            <td>${generateGeneroTag(op.retorno.base)}</td>
        </tr>
    `;
};

const generateOperatorTable = (ops: Operacion[]): string => {
    return `
        <table>
            <thead></thead>
            <tbody>
                ${ops.map(generateOperatorRow).join("\n")}
            </tbody>
        </table>
    `;
};

const generateDebugView = (tad: TAD): string => {
    const grammar = genGrammar([tad]);
    return `
        <div class="debug-title">${tad.nombre} (${tad.genero})</div>
        <br>
        <div class="debug-section">operaciones</div>
        ${generateOperatorTable(tad.operaciones)}
        <br>
        <br>
        <br>
        <div class="debug-section">Grammar meta</div>
        <pre>TODO: tokens, etc...</pre>
    `;

    return "report\n".repeat(500);
};

export default generateDebugView;
