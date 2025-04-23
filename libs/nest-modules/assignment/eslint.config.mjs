import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: [
      'libs/nest-modules/assignment/**/*.ts',
      'libs/nest-modules/assignment/**/*.tsx',
      'libs/nest-modules/assignment/**/*.js',
      'libs/nest-modules/assignment/**/*.jsx',
    ],
    rules: {},
  },
];
