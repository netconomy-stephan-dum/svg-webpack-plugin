import { Compiler, Compilation } from 'webpack';
import { RawSource, Source } from 'webpack-sources';
import {createHash} from "node:crypto";
import createSVGChunk from "./utils/createSVGChunk";
import loader from './loader';
import path from "node:path";

const pluginName = 'SVGWebpackPlugin';
const hookOptions = {
  name: pluginName,
  stage: Compilation.PROCESS_ASSETS_STAGE_DERIVED,
};

const svgRegExp = /\.svg(?:\?.*)?$/u;

interface SVGFile {
  size: number;
  filePath: string;
  chunks: string[];
}
interface SVGChunk {
  size: number;
  chunks: string[];
  files: SVGFile[];

  spriteName?: string;
}
type SVGChunks = Record<string, SVGChunk>;
type SVGChunkUsage = Record<string, Set<string>>;
const MAX_SIZE = 250 * 1024;
const MIN_SIZE = 10 * 1024;
const handleSpriteGeneration = (svgChunks: SVGChunks, svgChunkUsage: SVGChunkUsage) => {
  // duplicate too small chunks
  Object.entries(svgChunks).forEach(([key, value]) => {
    if (value.size < MIN_SIZE) {
      const otherUsages = new Set(value.chunks.map((chunk) => Array.from(svgChunkUsage[chunk])).flat());
      // delete self reference
      otherUsages.delete(key);
      // clean up
      if (otherUsages.size) {
        delete svgChunks[key];
        // duplicate to other chunks
        otherUsages.forEach((chunkKey) => {
          svgChunks[chunkKey].size += value.size;
          svgChunks[chunkKey].files.push(...value.files);
        });
      }
    }
  });
  // split too big chunks into multiple chunks
  Object.entries(svgChunks).forEach(([key, value]) => {
    if (value.size > MAX_SIZE) {
      delete svgChunks[key];
      const neededChunks = Math.floor(value.size / MAX_SIZE);
      const toRemoveSize = MAX_SIZE - (value.size % MAX_SIZE / neededChunks);
      for (let index = 0; index < neededChunks ; index += 1) {
        let removedSize = 0;
        let spliceIndex = 0;
        while (removedSize < toRemoveSize) {
          removedSize += value.files[spliceIndex].size
          spliceIndex += 1;
        }

        svgChunks[key+'-'+index] ||= {
          size: removedSize,
          files: value.files.splice(0, spliceIndex),
          chunks: value.chunks,
        };
      }
    }
  });

}
class SVGWebpackPlugin {
  static loader = loader;
  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(hookOptions, () => {
        const { chunks, assets } = compilation;
        const svgChunks: SVGChunks = {};
        const svgChunkUsage: SVGChunkUsage = {}
        const svgFiles: Record<string, SVGFile> = {};

        chunks.forEach(({ name, auxiliaryFiles }) => {
          auxiliaryFiles.forEach((filePath) => {
            if (svgRegExp.test(filePath)) {
              if (!(filePath in svgFiles)) {
                svgFiles[filePath] = {
                  filePath,
                  size: assets[filePath].size(),
                  chunks: [],
                };
              }
              const svgFile = svgFiles[filePath];
              svgFile.chunks.push(name as string);
            }
          });
        });

        Object.values(svgFiles).forEach((value) => {
          const chunkKey = value.chunks.join('-');
          svgChunks[chunkKey] ||= {
            size: 0,
            files: [],
            chunks: value.chunks,
          };
          value.chunks.forEach((chunk) => {
            svgChunkUsage[chunk] ||= new Set();
            svgChunkUsage[chunk].add(chunkKey);
          });
          const chunk = svgChunks[chunkKey];
          chunk.files.push(value);
          chunk.size += value.size;
        });

        handleSpriteGeneration(svgChunks, svgChunkUsage);

        Object.entries(svgChunks).forEach(([key, svgChunk]) => {
          const svgSprite = createSVGChunk(compilation, svgChunk.files.map(({ filePath }) => filePath));
          const contentHash = createHash('sha256').update(svgSprite).digest('hex').slice(0, 8);
          const filePath = `/assets/svg/${key}_${contentHash}.svg`;
          svgChunk.spriteName = filePath;
          (compilation.assets[filePath] as RawSource) = new RawSource(svgSprite);
        });
        chunks.forEach(({ name, files, auxiliaryFiles }) => {
          [...auxiliaryFiles, ...files].forEach((chunkFile) => {
            const ext = path.extname(chunkFile);
            if (['.css', '.js'].includes(ext)) {
              let source = assets[chunkFile].source().toString();
              Object.values(svgChunks).forEach((svgChunk) => {
                if (svgChunk.chunks.includes(name as string)) {
                  svgChunk.files.forEach(({filePath}) => {
                    source = source.replace(new RegExp(filePath, 'g'), svgChunk.spriteName as string);
                  })
                }
              });

              (assets[chunkFile] as Source) = new RawSource(source);
            }
          });
        });

      });
    });
  }
}

export default SVGWebpackPlugin;
