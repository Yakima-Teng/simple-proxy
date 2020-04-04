const config = {
    port: '3456',
    // 代理请求，将请求转发至其他服务器，然后返回相应的内容
    proxyTable: {
        '/apis/proxy': {
            target: 'http://123.45.67.89',
            changeOrigin: true,
        },
    },
}

module.exports = config
