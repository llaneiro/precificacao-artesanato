// JSON.stringify may contain Unicode; count UTF-8 bytes without a platform polyfill.
export function utf8Size(text: string): number {
  let size = 0;
  for (const c of text) {
    const code = c.codePointAt(0)!;
    size += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return size;
}
