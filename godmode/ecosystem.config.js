module.exports = {
  apps: [{
    name: "PrimeNode_Autonomous_OS",
    script: "./dist/server.cjs",
    instances: "max",
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "4G",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
      PRIME_UID: process.env.MASTER_UID
    },
    error_file: "./vault/logs/entropy_crashes.log",
    out_file: "./vault/logs/kinetic_execution.log",
    format: "json",
    log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
    autorestart: true
  }]
}
