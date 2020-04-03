const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const proxyMiddleware = require('http-proxy-middleware')
const cors = require('cors')
const config = require('./config')

const app = express()
// allow cross-origin ajax request
app.use(cors())
app.all('*', (req, res, next) => {
    console.log(`[${req.method}] ${req.url} ${new Date()}`)
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS')
    next()
})

// proxy api requests
Object.keys(config.proxyTable).forEach(function (context) {
    const options = config.proxyTable[context]
    if (typeof options === 'string') {
        options = { target: options }
    }
    options.proxyTimeout = 30000
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