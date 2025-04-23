import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: [
      'libs/nest-modules/panel/**/*.ts',
      'libs/nest-modules/panel/**/*.tsx',
      'libs/nest-modules/panel/**/*.js',
      'libs/nest-modules/panel/**/*.jsx',
    ],
    rules: {},
  },
];
