import path from 'node:path';
import { LoaderDefinition } from 'webpack';

const svgLoader: LoaderDefinition = function svgLoader(source) {
  const ext = path.extname(this.resourcePath)
  const isInline = ext === '.svga';
  const iconName = path.basename(this.resourcePath, ext);
  const viewBoxMatch = /viewBox="(.*?)"/i.exec(source);

  if (!viewBoxMatch || viewBoxMatch.length < 2) {
    throw new Error(`viewport not set for icon file ${this.resourcePath}!`);
  }

  const [, viewBox] = viewBoxMatch;
  const [, , rawWidth, rawHeight] = viewBox.split(' ');
  const width = Number.parseFloat(rawWidth)
  const height = Number.parseFloat(rawHeight)

  const widthRatio = Math.round(width / height * 1000) / 1000;
  const heightRatio = Math.round(height / width * 1000) / 1000;

  if (!isInline) {
    this.emitFile(`assets/svg/${iconName}.svg`, source);
  }

  const spriteFile = isInline ? source : `assets/svg/${iconName}.svg`;

  return [
    // __sprite_name__ will be replaced by the plugin
    `const icon = [${isInline?1:0}, \`${spriteFile}\`, "${iconName}", ${widthRatio}, ${heightRatio}];`,
    `export default icon;`,
  ].join('\n');
};

export default svgLoader;
