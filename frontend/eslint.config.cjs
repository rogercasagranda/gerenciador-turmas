module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react', '@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  settings: { react: { version: 'detect' } },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/\\.theme-[a-z]+/i]",
        message: 'Uso de class .theme-* proibido'
      },
      {
        selector: "Literal[value=/data-theme\\s*=\\s*['\"][a-z]+['\"]/i]",
        message: 'data-theme com literal proibido'
      },
      {
        selector: "Literal[value=/['\"](roxo|azul|verde|laranja|cinza|teal|ciano|rosa|violeta|ambar)['\"]\\s*(tema|theme)/i]",
        message: 'Cor literal de tema proibida'
      }
    ]
  },
  overrides: [
    {
      files: ['src/theme/**', 'src/styles/**'],
      rules: { 'no-restricted-syntax': 'off' }
    }
  ]
};
