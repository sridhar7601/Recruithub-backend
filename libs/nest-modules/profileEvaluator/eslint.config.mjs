import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: [
      'libs/nest-modules/drive/**/*.ts',
      'libs/nest-modules/drive/**/*.tsx',
      'libs/nest-modules/drive/**/*.js',
      'libs/nest-modules/drive/**/*.jsx',
    ],
    rules: {},
  },
];
