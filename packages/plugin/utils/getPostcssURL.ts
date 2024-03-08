import path from 'node:path';
import postcssURL from 'postcss-url';
import { readFile } from 'node:fs/promises';
import { LoaderContext } from 'webpack';

const getPostcssURL = (context: LoaderContext<{}>) => {
  return postcssURL({
    url: async (asset) => {
      const { url, absolutePath } = asset;
      return new Promise((resolve, reject) => {
        context.addBuildDependency(absolutePath);

        if (absolutePath.split('.').pop() === 'svg') {
          readFile(absolutePath, 'utf-8').then((source) => {
            const iconName = path.basename(url, '.svg');
            const publicPath = `assets/svg/${iconName}.svg`;
            context.emitFile(publicPath, source);
            resolve(`"${publicPath}#${iconName}"`);
          }, reject);
        } else {
          context.loadModule(url, (error, source) => {
            if (error) {
              return reject(error);
            }

            return resolve(source.toString());
          });
        }
      });
    }
  });
};

export default getPostcssURL;
