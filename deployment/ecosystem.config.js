module.exports = {
  apps: [
    {
      name: 'food-backend',
      script: './src/index.js',
      cwd: '/mnt/c/Users/ADMIN/Desktop/test-bandoan/backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
