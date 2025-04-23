import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: [
      'libs/nest-modules/student/**/*.ts',
      'libs/nest-modules/student/**/*.tsx',
      'libs/nest-modules/student/**/*.js',
      'libs/nest-modules/student/**/*.jsx',
    ],
    rules: {},
  },
];
