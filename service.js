const config = require('./config')
const validUrl = require('valid-url')

class Service {
	constructor(repo) {
		this.repo = repo
	}

	async getOriginalUrlBySerialAndVisit(serial) {
		const shorten = await this.repo.getShortenBySerial(serial)
		if (!shorten) {
			return null
		}

		const newVisitorCounter = shorten.visitor_counter + 1
		this.repo.updateVisitorCounter(serial, newVisitorCounter)

		const originalUrl = shorten.original_url
		return originalUrl
	}

	async getShortensByUserChatId(chatId) {
		const shortens = await this.repo.getShortensByUserChatId(chatId)
		if (shortens.length === 0) {
			return null
		}
		return shortens
	}

	async deleteShortanByChatIdAndSerial(chatId, serial) {
		if (validUrl.isUri(serial)) {
			serial = serial.replace(`${config.baseUrl}/`, '')
		}
		await this.repo.deleteShortedByChatIdAndSerial(chatId, serial)
	}

	async getShortenByUserChatIdAndSerial(chatId, serial) {
		if (validUrl.isUri(serial)) {
			serial = serial.replace(`${config.baseUrl}/`, '')
		}
		const shorten = await this.repo.getShortenByChatIdAndSerial(chatId, serial)
		if (!shorten) {
			return null
		}
		return shorten
	}

	async getShortenBySerial(serial) {
		return await this.repo.getShortenBySerial(serial)
	}
	async createShorten(serial, userChatId, originalUrl, isCustomSerial) {
		return await this.repo.createShorten(serial, userChatId, originalUrl, isCustomSerial)
	}

	async setState(key, value) {
		await this.repo.setState(key, value)
	}
	async getState(key) {
		return await this.repo.getState(key)
	}
	async deleteState(key) {
		await this.repo.deleteState(key)
	}
}

module.exports = Service
