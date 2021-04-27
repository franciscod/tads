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

export type MarkerSeverity = "error" | "warning" | "info" | "hint";

export type Marker = {
    severity: MarkerSeverity;
    message: string;
    range: SourceRange;
};

/**
 * Permite ir agregando Markers a un string usando un stack de offsets
 */
export class Report {
    private document = 0;
    private source = "";
    private lines: string[] = [];
    private currentOffset = 0;
    private offsets: number[] = [];

    markers: Marker[] = [];

    setSource(source: string, document: number = 0) {
        this.source = source;
        this.lines = source.replace(/\r\n/g, "\n").split("\n");
        this.document = document;
    }

    push(offset: number) {
        if (this.currentOffset + offset > this.source.length) throw new Error("Offset out of bounds");
        this.currentOffset += offset;
        this.offsets.push(offset);
    }

    pop() {
        if (this.offsets.length === 0) throw new Error("No offset to pop");
        this.currentOffset -= this.offsets.pop()!;
    }

    getRange(offset: number, length: number): SourceRange {
        const startOffset = this.currentOffset + offset;
        const endOffset = startOffset + length;

        const locate = (off: number): [number, number] => {
            let line = 0;
            let pos = 0;
            while (off >= pos + this.lines[line].length + 1) {
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

    addMark(severity: MarkerSeverity, message: string, offset: number, length: number) {
        if (this.currentOffset + offset + length > this.source.length) throw new Error("Section out of bounds");
        this.markers.push({
            severity,
            message,
            range: this.getRange(offset, length),
        });
    }
}
