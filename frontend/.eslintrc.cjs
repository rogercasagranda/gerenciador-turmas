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
        selector: "Literal[value=/theme-(roxo|azul|verde|laranja|amarelo|cinza|rosa|violeta|ciano|teal)/]",
        message: 'Uso de theme-<cor> proibido'
      },
      {
        selector: "Literal[value=/data-theme=['\"](?:roxo|azul|verde|laranja|amarelo|cinza|rosa|violeta|ciano|teal)['\"]/]",
        message: 'data-theme com literal proibido'
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
