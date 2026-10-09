// ecosystem.config.cjs — pm2 process config for bannon-daemon.
// restart-always equivalent of Railway's restartPolicyType: ALWAYS.
module.exports = {
  apps: [
    {
      name: "bannon-daemon",
      cwd: "/home/ubuntu/bannon/godmode",
      script: "dist/server.cjs",
      args: "",
      env_production: {
        NODE_ENV: "production",
        PORT: "8080",
      },
      autorestart: true,      // restart ALWAYS
      max_restarts: 10,       // matches railway.json restartPolicyMaxRetries
      min_uptime: "10s",      // don't count fast crashes as successful starts
      max_memory_restart: "1G",
    },
  ],
};
