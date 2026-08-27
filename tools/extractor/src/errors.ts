/** 解析失敗の統一エラー。upstreamが新構文を採用した場合の第一検知点(03-extraction-codegen §8)。 */
export class ParseError extends Error {
  constructor(
    message: string,
    readonly item: string,
    readonly file: string,
    readonly loc?: { line: number, column: number },
  ) {
    const at = loc ? ` (line ${loc.line}, column ${loc.column})` : ""
    super(`${item}/${file}: ${message}${at}`)
    this.name = "ParseError"
  }
}
