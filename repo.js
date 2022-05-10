class Repo {
	constructor(redisClient, mysqlClient) {
		this.redisClient = redisClient
		this.mysqlClient = mysqlClient
	}

	async getShortenBySerial(serial) {
		const cacheData = await this.redisClient.get(`shorten:${serial}`)
		if (cacheData) {
			const cacheDataParse = JSON.parse(cacheData)
			return cacheDataParse
		}

		const shortens = await this.mysqlClient.query(
			'SELECT * FROM shorten WHERE serial = ? LIMIT 1',
			[serial]
		)
		if (shortens.length === 0) {
			return null
		}
		return shortens[0]
	}

	async getShortenByChatIdAndSerial(chatId, serial) {
		const shortens = await this.mysqlClient.query(
			'SELECT * FROM shorten WHERE user_chat_id = ? AND serial = ? LIMIT 1',
			[chatId, serial]
		)
		if (shortens.length === 0) {
			return null
		}
		return shortens[0]
	}

	async getShortensByUserChatId(chatId) {
		const shortens = await this.mysqlClient.query('SELECT * FROM shorten WHERE user_chat_id = ?', [
			chatId,
		])
		return shortens
	}

	async deleteShortedByChatIdAndSerial(chatId, serial) {
		await this.mysqlClient.query('DELETE FROM shorten WHERE user_chat_id = ? and serial = ?', [
			chatId,
			serial,
		])
	}

	async updateVisitorCounter(serial, visitorCounter) {
		const cacheData = await this.redisClient.get(`shorten:${serial}`)
		if (cacheData) {
			const cacheDataParse = JSON.parse(cacheData)
			cacheDataParse.visitor_counter += 1
			this.redisClient.set(`shorten:${serial}`, JSON.stringify(cacheDataParse))
		}

		this.mysqlClient.query('UPDATE shorten SET visitor_counter = ? WHERE serial = ?', [
			visitorCounter,
			serial,
		])
	}

	async createShorten(serial, userChatId, originalUrl, isCustomSerial) {
		const data = {
			serial: serial,
			user_chat_id: userChatId,
			original_url: originalUrl,
			visitor_counter: 0,
			is_custom_serial: isCustomSerial,
		}

		await this.redisClient.set(`shorten:${serial}`, JSON.stringify(data))
		await this.mysqlClient.query(
			'INSERT INTO shorten (serial, original_url, visitor_counter, is_custom_serial, user_chat_id) VALUES (?, ?, ?, ?, ?)',
			[serial, originalUrl, 0, isCustomSerial, userChatId]
		)
	}

	async setState(key, value) {
		key = key.toString()
		await this.redisClient.set(key, JSON.stringify(value))
	}

	async getState(key) {
		key = key.toString()
		const data = await this.redisClient.get(key)
		if (!data) {
			return null
		}
		return JSON.parse(data)
	}

	async deleteState(key) {
		key = key.toString()
		await this.redisClient.del(key)
	}
}

module.exports = Repo
