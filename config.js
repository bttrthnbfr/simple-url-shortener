const config = {
	baseUrl: process.env.BASE_URL,
	httpListenPort: parseInt(process.env.HTTP_LISTEN_PORT || 3000),
	homeRedirectUrl: process.env.HOME_REDIRECT_URL,
	telegramToken: process.env.TELEGRAM_TOKEN,
	redis: {
		url: process.env.REDIS_URL,
	},
	mysql: {
		connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || 10),
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DATABASE,
	},
}

module.exports = config
