const http = require('./app')
const connectDatabase = require('./config/mongoDB')
const port = process.env.PORT || 8501

// connect database
connectDatabase()

http.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
