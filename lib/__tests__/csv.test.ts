import { describe, expect, it } from "vitest";

import { toCsv } from "../csv";

describe("toCsv", () => {
  it("SHOULD join cells with commas and rows with CRLF WHEN given plain values", () => {
    expect(
      toCsv([
        ["a", "b"],
        [1, true],
      ]),
    ).toBe("a,b\r\n1,true");
  });

  it("SHOULD quote and double quotes WHEN a cell contains a comma, quote or newline", () => {
    expect(toCsv([["a,b", 'say "hi"', "x\ny"]])).toBe('"a,b","say ""hi""","x\ny"');
  });

  it("SHOULD render null and undefined as empty cells", () => {
    expect(toCsv([[null, undefined, "x"]])).toBe(",,x");
  });

  it("SHOULD neutralise formulas WHEN a text cell starts with a trigger character", () => {
    expect(toCsv([["=SUM(A1)", "+1", "-1", "@x"]])).toBe("'=SUM(A1),'+1,'-1,'@x");
  });

  it("SHOULD leave negative numbers untouched", () => {
    expect(toCsv([[-12.5]])).toBe("-12.5");
  });
});
