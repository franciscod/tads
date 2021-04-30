import { Report, ReportDoc, SourceRange } from "../parser/Reporting";

describe("offsets correctos", () => {
    type OffsetTest = {
        input: string;
        offsets: number[];
        offset: number;
        length: number;
        expected: SourceRange;
    };
    const OFFSETS_TESTS: OffsetTest[] = [
        {
            input: "abcd",
            offsets: [],
            offset: 0,
            length: 4,
            expected: { document: 0, startLine: 1, endLine: 1, columnStart: 1, columnEnd: 5 },
        },
        {
            input: "ab\ncd",
            offsets: [],
            offset: 3,
            length: 2,
            expected: { document: 0, startLine: 2, endLine: 2, columnStart: 1, columnEnd: 3 },
        },
        {
            input: "ab\ncd",
            offsets: [],
            offset: 0,
            length: 5,
            expected: { document: 0, startLine: 1, endLine: 2, columnStart: 1, columnEnd: 3 },
        },
        {
            input: "ab\ncd",
            offsets: [],
            offset: 1,
            length: 3,
            expected: { document: 0, startLine: 1, endLine: 2, columnStart: 2, columnEnd: 2 },
        },
        {
            input: "abcd\nabcd",
            offsets: [2],
            offset: 1,
            length: 3,
            expected: { document: 0, startLine: 1, endLine: 2, columnStart: 4, columnEnd: 2 },
        },
    ];

    for (const off of OFFSETS_TESTS) {
        it(`${off.input.padEnd(10).replace(/\n/g, "\\n")} offs=[${off.offsets.join("")}] off=${off.offset} l=${
            off.length
        } - ${off.expected.startLine} ${off.expected.endLine} ${off.expected.columnStart} ${
            off.expected.columnEnd
        }`, () => {
            const report = new Report([new ReportDoc(0, off.input)]);
            for (const offset of off.offsets) report.docs[0].push(offset);
            report.addMark("hint", "Test", off.offset, off.length);
            for (const _ of off.offsets) report.docs[0].pop();
            expect(report.markers[0].range).toStrictEqual(off.expected);
        });
    }
});
