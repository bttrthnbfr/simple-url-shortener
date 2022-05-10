require('dotenv').config()
const { createClient } = require('redis')
const mysql = require('promise-mysql')
const fastify = require('fastify')({ logger: true })
const TelegramBot = require('node-telegram-bot-api')
const config = require('./config')
const Repo = require('./repo')
const Service = require('./service')
const HttpHandler = require('./http.handler')
const TelegramHandler = require('./telegram.handler')

const main = async () => {
	let redisClient
	let mysqlClient
	let teleBot

	try {
		mysqlClient = await mysql.createPool(config.mysql)
		redisClient = createClient(config.redis)
		await redisClient.connect()
		teleBot = new TelegramBot(config.telegramToken, { polling: true })
		// await fastify.listen(config.httpListenPort)
	} catch (error) {
		console.log('init.errors')
		console.log(error)
		process.exit(1)
	}
	const repo = new Repo(redisClient, mysqlClient)
	const service = new Service(repo)
	// new HttpHandler(service, fastify)
	new TelegramHandler(service, teleBot)
}

main()
