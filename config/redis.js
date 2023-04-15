const Redis = require('ioredis')
const redis = new Redis({
  // host: 'localhost',
  // port: 6379,
  host: 'redis-14517.c295.ap-southeast-1-1.ec2.cloud.redislabs.com',
  port: 14517,
  password: 'BTsJEbd8r5y6B6UKpUM6nLhskafoIObC',
  // tls: {
  //   servername: 'redis-14517.c295.ap-southeast-1-1.ec2.cloud.redislabs.com',
  // },
})
redis.on('connect', () => {
  console.log('Connected to Redis')
})

redis.on('error', (error) => {
  console.error(error)
})
module.exports = redis
