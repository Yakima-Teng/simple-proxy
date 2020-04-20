const http = require('http')
const url = require('url')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const proxyMiddleware = require('http-proxy-middleware')
const cors = require('cors')
const uuid = require('uuid')
const config = require('./config')
const logLevel = config.logLevel
const shouldPrintMoreInfo = logLevel === 'normal'

const app = express()
// allow cross-origin ajax request
app.use(cors())
app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS')
    next()
})

// proxy api requests
Object.keys(config.proxyTable).forEach(function (context) {
    let options = config.proxyTable[context]
    if (typeof options === 'string') {
        options = { target: options }
    }
    options.proxyTimeout = 30000
    let startTime = 0
    options.onProxyReq = (proxyReq, req, res) => {
        startTime = +new Date()
        req.simpleProxy = { requestId: uuid.v1() }
        console.log('  ')
        console.log(`************* request start *************`)
        console.log(`[${req.method}] ${req.url.replace(/\?.*$/, '')}`)
        console.log(`requestId: ${req.simpleProxy.requestId}`)
        shouldPrintMoreInfo && console.log(`httpVersion: ${req.httpVersion}`)
        if (req.query && Object.keys(req.query).length > 0) {
            const queryObj = JSON.parse(JSON.stringify(req.query))
            for (let key in queryObj) {
                const tempVal = queryObj[key]
                if (typeof tempVal === 'string' && tempVal.length > 100) { // 如果值太长就去掉中间部分
                    queryObj[key] = tempVal.substring(0, 10) + '...' + tempVal.substring(tempVal.length - 10)
                }
            }
            console.log(`query: ${JSON.stringify(queryObj, null, 2)}`)
        }
        shouldPrintMoreInfo && Object.keys(req.headers).forEach((key) => {
            console.log(`header.${key}: ${req.headers[key]}`)
        })
        !shouldPrintMoreInfo && ['cookie', 'Cookie'].forEach((key) => {
            req.headers[key] && console.log(`header.${key}: ${req.headers[key]}`)
        })
        console.log(`************* request end *************`)
        console.log('  ')
    }
    options.onProxyRes = (proxyRes, req, res) => {
        const proxyHeaders = proxyRes.headers
        const chunks = []
        proxyRes.on('data', chunk => {
            chunks.push(chunk)
        })
        proxyRes.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const usedTime = +new Date() - startTime
            console.log('  ')
            console.log(`************* response start *************`)
            console.log(`[${req.method}] ${req.url.replace(/\?.*$/, '')}`)
            console.log(`requestId: ${req.simpleProxy.requestId}`)
            shouldPrintMoreInfo && console.log(`httpVersion: ${proxyRes.httpVersion}`)
            shouldPrintMoreInfo && console.log(`consume time: ${usedTime}ms`)
            shouldPrintMoreInfo && Object.keys(proxyRes.headers).forEach((key) => {
                console.log(`header.${key}: ${proxyRes.headers[key]}`)
            })
            !shouldPrintMoreInfo && ['set-cookie', 'Set-Cookie'].forEach((key) => {
                proxyRes.headers[key] && console.log(`header.${key}: ${proxyRes.headers[key]}`)
            })

            // 返回的是否是图片等文件/流，是的话不需要打印responseText，但是打印下content-type提示是媒体文件
            const isMedia = (
                proxyRes.headers['content-type'].indexOf('image') !== -1 ||
                proxyRes.headers['content-type'].indexOf('video') !== -1 ||
                proxyRes.headers['content-type'].indexOf('audio') !== -1 ||
                proxyRes.headers['content-type'].indexOf('audio') !== -1 ||
                proxyRes.headers['content-type'].indexOf('application') !== -1
            )
            if (isMedia && !shouldPrintMoreInfo) {
                const key = 'content-type'
                console.log(`header.${key}: ${proxyRes.headers[key]}`)
            }
            if (!isMedia) {
                try {
                    let bufferString = buffer.toString()
                    if (req.url.indexOf('callback=') !== -1) {
                        bufferString = bufferString.replace(/^.+\((.+)\)/, '$1') // 如果是JSONP请求，则日志里输出括号内的JSON文本即可
                        console.log(`responseText: ${JSON.stringify(JSON.parse(bufferString), null, 2)}`)
                    } else {
                        console.log(`responseText: ${JSON.stringify(JSON.parse(buffer.toString()), null, 2)}`)
                    }
                } catch (err) {
                    console.log(`responseText: ${buffer.toString()}`)
                }
            }
            console.log(`************* response end *************`)
            console.log('  ')
        })
    }
    app.use(proxyMiddleware(context, options))
})

// enable uploading large file
app.use(bodyParser.json({ limit: '100000kb' }))
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '100000kb'
}))
app.use(cookieParser())

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handlers (will print stacktrace)
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        message: err.message,
        error: err
    })
})

app.set('port', config.port)

const server = http.createServer(app)

server.listen(config.port)
server.on('error', onError)
server.on('listening', onListening)

// Event listener for HTTP server "error" event.
function onError (error) {
    if (error.syscall !== 'listen') {
        throw error
    }

    const bind = typeof config.port === 'string'
        ? 'Pipe ' + config.port
        : 'Port ' + config.port

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(bind + ' is already in use')
            process.exit(1)
            break
        default:
            throw error
    }
}

// Event listener for HTTP server "listening" event.
function onListening () {
    const addr = server.address()
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port

    console.log(`[MAIN] Listening on ${bind}`)
}

// 将1位数字转为2位数字（字符串）
function toDouble (val) {
    if (val > 9) { return `${val}` }
    return `0${val}`
}

function getDateStr () {
    const objDate = new Date()
    const year = objDate.getFullYear()
    const month = toDouble(objDate.getMonth() + 1)
    const date = toDouble(objDate.getDate())
    const hour = toDouble(objDate.getHours())
    const minute = toDouble(objDate.getMinutes())
    const second = toDouble(objDate.getSeconds())
    const millisecond = toDouble(objDate.getMilliseconds())
    return `${year}-${month}-${date} ${hour}:${minute}:${second}:${millisecond}`
}
