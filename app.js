const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const proxyMiddleware = require('http-proxy-middleware')
const cors = require('cors')
const uuid = require('uuid')
const config = require('./config')

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
    let requestId = 0
    options.onProxyReq = (proxyReq, req, res) => {
        startTime = +new Date()
        requestId = uuid.v1()
        console.log('  ')
        console.log(`************* request start *************`)
        console.log(`[${req.method}] ${req.url}`)
        console.log(`requestId: ${requestId}`)
        console.log(`httpVersion: ${req.httpVersion}`)
        if (req.method === 'GET') {
            console.log(`query: ${JSON.stringify(req.query, null, 2)}`)
        }
        Object.keys(req.headers).forEach((key) => {
            console.log(`header.${key}: ${req.headers[key]}`)
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
            console.log(`[${req.method}] ${req.url}`)
            console.log(`requestId: ${requestId}`)
            console.log(`httpVersion: ${proxyRes.httpVersion}`)
            console.log(`consume time: ${usedTime}ms`)
            Object.keys(proxyRes.headers).forEach((key) => {
                console.log(`header.${key}: ${proxyRes.headers[key]}`)
            })
            try {
                console.log(`responseText: ${JSON.stringify(JSON.parse(buffer.toString()), null, 2)}`)
            } catch (err) {
                console.log(`responseText: ${buffer.toString()}`)
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
