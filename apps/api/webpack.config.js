// const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
// const { join } = require('path');

// module.exports = {
//   externals: ['bcrypt'],
//   output: {
//     path: join(__dirname, 'dist'),
//     clean: true,
//     ...(process.env.NODE_ENV !== 'production' && {
//       devtoolModuleFilenameTemplate: '[absolute-resource-path]',
//     }),
//   },
//   plugins: [
//     new NxAppWebpackPlugin({
//       target: 'node',
//       compiler: 'tsc',
//       main: './src/main.ts',
//       tsConfig: './tsconfig.app.json',
//       assets: ['./src/assets'],
//       optimization: false,
//       outputHashing: 'none',
//       generatePackageJson: false,
//       sourceMap: true,
//     }),
//   ],
// };

const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { dirname, join } = require('path');

const swaggerUiDistRoot = dirname(
  require.resolve('swagger-ui-dist/package.json', { paths: [__dirname] }),
);

module.exports = {
  externals: ['bcrypt', /^prettier(\/.*)?$/],
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    alias: {
      express: require.resolve('express', { paths: [__dirname] }),
      'swagger-ui-dist': swaggerUiDistRoot,
      'class-transformer/storage':
        require.resolve('class-transformer/cjs/storage'),
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      additionalEntryPoints: [   // ← add this
        {
          entryName: 'api/index',
          entryPath: './api/index.ts',
        },
      ],
    }),
    
  ],
};
