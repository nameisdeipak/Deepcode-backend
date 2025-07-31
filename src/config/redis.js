const { createClient } = require("redis");

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASS,
  socket: {
    host: "redis-10165.crce182.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 10165,
  },
});

module.exports = redisClient;
