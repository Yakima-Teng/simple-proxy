const config = require('./config')

module.exports = {
    apps: [
        {
            name: `simple-proxy-${config.port}`,
            script: './app.js',

            // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
            args: 'by Yakima',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: { // pm2 start ecosystem.config.js
                NODE_ENV: 'production',
            },
            error_file: 'logs/err.log',
            out_file: 'logs/out.log',
            log_file: 'logs/combined.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
        },
    ],
}
