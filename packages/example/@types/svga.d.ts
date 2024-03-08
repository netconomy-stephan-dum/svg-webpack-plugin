declare module '*.svga' {
  type RawGlyph = [0 | 1, string, string, number, number];
  const svgGlyph: RawGlyph;
  export = svgGlyph;
}
