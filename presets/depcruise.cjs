/**
 * Example dependency-cruiser preset layering rules.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  options: {
    doNotFollow: {
      path: 'node_modules'
    }
  },
  forbidden: [
    {
      name: 'no-cross-domain',
      comment: 'Domain code should not depend on UI.',
      severity: 'warn',
      from: {
        path: '^src/domain'
      },
      to: {
        path: '^src/ui'
      }
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true
      }
    }
  ],
  allowed: []
};
