const config = {
    port: '3456',
    // 代理请求，将请求转发至其他服务器，然后返回相应的内容
    proxyTable: {
        '/apis/proxy-test': {
            target: 'http://test.api.com',
            changeOrigin: true,
            pathRewrite (path, req) {
                return path.replace('/apis/proxy-test', '/apis/proxy')
            },
        },
        '/apis/proxy-production': {
            target: 'http://production.api.com',
            changeOrigin: true,
            pathRewrite (path, req) {
                return path.replace('/apis/proxy-production', '/apis/proxy')
            },
        },
    },
}

module.exports = config
