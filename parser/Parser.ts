import { Aplicacion, Axioma, ExpresionLogica, Genero, Literal, Nodo,
         Operacion, Slot, TAD, Token, Variable } from "./Types.ts";
import { TADDatabase } from "./Database.ts";

export type Range = {
    startLine: number;
    endLine: number;
    columnStart: number;
    columnEnd: number;
};

type MarkerSeverity = 'error' | 'warning' | 'info' | 'hint';

export type Marker = {
    severity: MarkerSeverity;
    message: string;
    range: Range;
};

type Section = 'none' | 'generos' | 'igualdad' | 'observadores' | 'generadores' | 'otras operaciones' | 'axiomas';

export class Parser {

    public markers: Marker[] = [];
    public database: TADDatabase;

    public activeTad: TAD | null = null;
    private lines: string[] = [];
    private currentLine: number = 0;

    constructor(database: TADDatabase) {
        this.database = database;
    }

    parse(source: string) {
        this.activeTad = null;
        this.markers = [];
        this.lines = source.split('\n');
        this.currentLine = 0;

        if(this.line()?.trim().length === 0) this.nextNonEmptyLine();

        let line;
        while((line = this.line()) != null) {
            if(this.activeTad != null) {
                if(line.toUpperCase().startsWith("TAD")) {
                    this.markerLine("error", "No se esperaba una definición de TAD");
                } else if(line.toUpperCase().startsWith("FIN TAD")) {
                    this.activeTad = null;
                } else {
                    // seguir parseando TAD
                    let section: Section = Parser.checkSectionHeader(line);
                    if(section === 'none') {
                        this.markerLine('error', "Se esperaba el inicio de una sección.");
                    } else if(section === 'generos') {
                        let generos = line.slice('generos'.length).split(",").map(g => g.trim()).filter(g => g.length);

                        if(generos.length === 0) {
                            this.markerLine('error', "Especificá al menos un género o eliminá toda la sección géneros.");
                        } else {
                            for(let i = 0; i < generos.length; i++) {
                                if(this.activeTad!.generos.length > 0) {
                                    // no es elegante pero funciona ¯\_(ツ)_/¯
                                    let start_warning = this.line()!.split(generos[i])[0].length;

                                    this.markers.push({
                                        severity: 'warning',
                                        message: `Especificar más de un género tendrá ningún efecto (no implementado).\nLos géneros ya especificados para este TAD son: ${this.activeTad!.generos.join(', ')}`,
                                        range: {
                                            startLine: this.currentLine + 1,
                                            endLine: this.currentLine + 1,
                                            columnStart: 1 + start_warning,
                                            columnEnd: 1 + start_warning + generos[i].length
                                        }
                                    });
                                }
                                this.activeTad!.generos.push(generos[i]);
                            }
                        }
                    } else if(section != 'igualdad') {
                        // operaciones y axiomas
                        this.nextNonEmptyLine();
                        this.readSection(section);
                        continue;
                    }
                }
            } else {
                if(line.toUpperCase().startsWith("TAD")) {
                    // parsear nuevo TAD
                    this.parseTad();
                } else {
                    this.markerLine("error", "Se esperaba la definición de un TAD.\n📎  Quizás querías poner un comentario con --?");
                }
            }
            this.nextNonEmptyLine();
        }
    }

    private readSection(section: Section) {
        let splitter: RegExp;
        let subParser;
        switch (section) {
            case 'observadores':
            case 'generadores':
            case 'otras operaciones':
                splitter = /:/;
                subParser = this.parseOperacion;
                break;
            default:
            case 'axiomas':
                splitter = /≡|={3}/;
                subParser = this.parseAxioma;
                break;
        }

        let line;
        let left = "";
        let rightBuffer = "";
        while((line = this.line()) != null &&
               Parser.checkSectionHeader(line) === 'none' &&
               !line.toUpperCase().startsWith("FIN TAD")) {

            let split = line.split(splitter);
            if(split.length === 2) {
                // anterior
                if(left.length > 0)
                    subParser(left, rightBuffer);
                left = split[0];
                rightBuffer = split[1];
            } else {
                rightBuffer += line;
            }
            this.nextNonEmptyLine();
        }
        if(left.length > 0)
            subParser(left, rightBuffer);
    }

    private parseTad() { // se llama al estar posicionado en una línea de "TAD ..."
        let name = this.line()!.slice('TAD'.length).trim();
        if(name.length === 0) {
            this.markerLine("error", "Se esperaba el nombre de un TAD");
            return;
        }

        this.activeTad = this.database.getTADByName(name);
        if(this.activeTad) {
            // el TAD se extiende
            this.markerLine("hint", `Esto es una extensión del TAD ${this.activeTad.nombre}`);
        } else {
            // el TAD es nuevo
            this.activeTad = this.database.registerNewTAD(name);
        }
    }

    public parseLineaOperacion(line: string, fallbackActiveTad: TAD) {
        if (this.activeTad === null) {
            this.activeTad = fallbackActiveTad;
        }
        let [left, right] = line.split(":");
        return this.parseOperacion(left, right);
    }

    private parseOperacion(left: string, right: string) {
        // console.log(left, "++++++++", right);

        const tad: TAD = this.activeTad!;

        let arrow = "→";
        let cross = "×";

        // alternative syntax
        if (!right.includes(arrow)) {
            arrow = "->";
        }
        if (!right.includes(cross)) {
            cross = "✕";
        }

        let [_args, line3] = right.split(arrow)
        let [_ret, ...rest] = line3.trim().split(" ")
        let restr = null  // TODO

        let nombre = left.trim()

        let tokens: Token[] = [];
        let slots = [];

        let args = _args.split(cross).map((arg) => arg.trim()).filter((arg) => arg !== "")

        let tokenSource = nombre;
        while (tokenSource !== "") {
            const i = tokenSource.indexOf("•");
            if (i == 0) {
                const genName: string = args[slots.length];
                let gen: Genero = genName;
                if (tad.generos.includes(genName)) {
                    if (genName === tad.generos[0]) {
                        gen = tad;
                    }
                }
                const slot: Slot = {"type": "slot", "genero": gen};
                tokens.push(slot);
                slots.push(slot);

                tokenSource = tokenSource.substr(1);
            } else if (i == -1) {
                tokens.push({"type": "literal", "symbol": tokenSource.trim()});
                tokenSource = "";
            } else {
                tokens.push({"type": "literal", "symbol": tokenSource.substr(0, i).trim()});
                tokenSource = tokenSource.substr(i);
            }
        }

        if (nombre.includes("•")) {
            nombre = nombre.split("•").map((part) => part.trim()).join("•")
        }

        const retorno = _ret.trim()

        return {
            nombre,
            tokens,
            retorno,
            axiomas: [],  // TODO
        }
    }

    private parseAxioma(left: string, right: string) {
        console.log(left, "-----------", right);
    }

    private line(): string | null {
        if(this.currentLine < this.lines.length) {
            let line = this.lines[this.currentLine];
            return line.split('--')[0]/*.trimRight()*/; // remove comments
        }
        return null;
    }

    private backLine() { this.currentLine = Math.max(0, this.currentLine); }
    private nextLine() { this.currentLine = Math.min(this.currentLine+1, this.lines.length); }
    private nextNonEmptyLine() {
        this.nextLine();

        let line = this.line();
        while(line !== null && line.trim().length === 0) {
            // skip empty lines
            this.nextLine();
            line = this.line();
        }
    }

    private getCurrentLineRange(): Range {
        return { startLine: this.currentLine + 1, endLine: this.currentLine + 1,  columnStart: 1, columnEnd: 1 + this.line()!.length };
    }

    private markerLine(severity: MarkerSeverity, message: string) {
        this.markers.push({ severity,  message, range: this.getCurrentLineRange() });
    }

    static checkSectionHeader(line: string): Section {
        line = line.trimRight();
        if(line.match(/^g[ée]neros/i)) return 'generos';
        if(line.match(/^(igualdad observacional|igobs|ig obs)$/i)) return 'igualdad';
        if(line.match(/^(observadores b[áa]sicos|obs)$/i)) return 'observadores';
        if(line.match(/^(generadores|gen)$/i)) return 'generadores';
        if(line.match(/^(otras operaciones|otras op|otrasop)$/i)) return 'otras operaciones';
        if(line.match(/^(axiomas)/i)) return 'axiomas';
        return 'none';
    }

}
