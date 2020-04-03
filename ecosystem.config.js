module.exports = {
    apps : [{
        name: 'simple-proxy',
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
    }],
}
