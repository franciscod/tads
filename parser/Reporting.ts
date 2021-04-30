/**
 * Representa una posicion absoluta en un documento (o tab)
 */
export type SourceLocation = {
    document: number;
    offset: number;
}

/**
 * Representa un rango de texto en un documento (o tab)
 */
export type SourceRange = {
    document: number;

    startLine: number;
    endLine: number;
    columnStart: number;
    columnEnd: number;
};

export type Lens = {
    title: string;
    range: SourceRange;
    meta: any;
}

export type MarkerSeverity = "error" | "warning" | "info" | "hint";

export type Marker = {
    severity: MarkerSeverity;
    message: string;
    range: SourceRange;
};

/**
 * Representa un documento particular en el reporte
 */
export class ReportDoc {
    private lines: string[] = [];
    private currentOffset = 0;
    private offsets: number[] = [];

    constructor(private document: number, private source: string) {
        this.lines = source.replace(/\r\n/g, "\n").split("\n");
    }
    
    push(offset: number): void {
        if (this.currentOffset + offset > this.source.length + 1) throw new Error("Offset out of bounds");
        this.currentOffset += offset;
        this.offsets.push(offset);
    }

    pop(): void {
        if (this.offsets.length === 0) throw new Error("No offset to pop");
        this.currentOffset -= this.offsets.pop()!;
    }

    getRange(offset: number, length: number): SourceRange {
        if (this.currentOffset + offset + length > this.source.length + 1) throw new Error("Section out of bounds");

        const startOffset = this.currentOffset + offset;
        const endOffset = startOffset + length;

        const locate = (off: number): [number, number] => {
            let line = 0;
            let pos = 0;
            while (line < this.lines.length && off >= pos + this.lines[line].length + 1) {
                pos += this.lines[line].length + 1;
                line++;
            }
            return [line, off - pos];
        };

        // TODO: esto se puede optimizar haciendo 2 fors
        //       evitando recorrer toda la primera parte 2 veces
        //       e incluso precomputar cosas
        const [startLine, columnStart] = locate(startOffset);
        const [endLine, columnEnd] = locate(endOffset);

        return {
            document: this.document,

            startLine: startLine + 1,
            endLine: endLine + 1,
            columnStart: columnStart + 1,
            columnEnd: columnEnd + 1,
        };
    }
}

/**
 * Permite ir agregando Markers sobre documentos usando un stack de offsets
 */
export class Report {

    activeDocument = 0;
    markers: Marker[] = [];

    constructor(public docs: ReportDoc[]) {
    }

    push(offset: number): void {
        this.docs[this.activeDocument].push(offset);
    }

    pop(): void {
        this.docs[this.activeDocument].pop();
    }

    addMark(severity: MarkerSeverity, message: string, offset: number, length: number): void {
        this.markers.push({
            severity,
            message,
            range: this.docs[this.activeDocument].getRange(offset, length),
        });
    }

    getActiveDoc(): ReportDoc | undefined {
        return this.docs[this.activeDocument];
    }
}
