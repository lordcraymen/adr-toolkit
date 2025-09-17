module.exports = {
  plugins: ['boundaries'],
  settings: {
    'boundaries/include': ['src/**/*.ts'],
    'boundaries/elements': [
      { type: 'domain', pattern: 'src/domain/**' },
      { type: 'application', pattern: 'src/application/**' },
      { type: 'ui', pattern: 'src/ui/**' }
    ]
  },
  rules: {
    'boundaries/no-unknown': 'error',
    'boundaries/element-types': [
      'warn',
      {
        default: 'allow',
        rules: [
          {
            from: 'domain',
            allow: ['domain']
          },
          {
            from: 'application',
            allow: ['domain', 'application']
          },
          {
            from: 'ui',
            allow: ['application', 'ui']
          }
        ]
      }
    ]
  }
};
