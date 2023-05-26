const cookieParser = require('cookie-parser')
const express = require('express')
const app = express()
const path = require('path')
const apiRouter = require('./routes/apiRoutes')
const cors = require('cors')
const socketServer = require('./socketServer')
app.use(express.static(path.join(__dirname, 'public')))
app.use(
  express.json({
    limit: '10kb',
  })
)
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors())

const http = require('http').createServer(app)

const io = require('socket.io')(http, {
  cors: {
    origin: 'http://127.0.0.1:5173',
    methods: ['GET', 'POST'],
  },
})
global.io = io
socketServer(io)

app.use('/api/v1', apiRouter)

app.all('*', (req, res, next) => {
  return res.status(404).json({
    msg: `Can't find ${req.originalUrl} on this server`,
  })
})

module.exports = http
