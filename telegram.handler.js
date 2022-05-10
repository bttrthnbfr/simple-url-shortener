const validUrl = require('valid-url')
const config = require('./config')
const { Keyboard, Key } = require('telegram-keyboard')
const { randCharacter } = require('./utils')

class TelegramHandler {
	constructor(service, telegramBot) {
		this.service = service
		this.telegramBot = telegramBot

		telegramBot.on('message', async (msg) => {
			const chatId = msg.chat.id
			const text = msg.text
			await this.main(chatId, text)
		})
		telegramBot.on('callback_query', async (msg) => {
			const chatId = msg.message.chat.id
			const text = msg.data
			await this.main(chatId, text)
		})
	}

	async shorten_1(chatId) {
		await this.telegramBot.sendMessage(
			chatId,
			'Paste the url in the chat, example: https://google.com'
		)
		await this._setStateDataSuccess(chatId)
	}

	async shorten_2(chatId, text) {
		const originalUrl = text
		if (!validUrl.isUri(originalUrl)) {
			await this.telegramBot.sendMessage(chatId, 'URL is not valid, example: https://google.com')
			return
		}

		await this._setStateDataValues(chatId, {
			original_url: originalUrl,
			is_custom_serial: false,
		})

		const keyboard = Keyboard.make([[Key.callback('Yes', '/yes'), Key.callback('No', '/no')]])
		await this.telegramBot.sendMessage(
			chatId,
			'Do you want to set a custom serial? \nexample: serial-abcd -> https://shoo.lol/serial-abcd',
			keyboard.inline()
		)
		await this._setStateDataSuccess(chatId)
	}

	async _generateShorten(chatId, originalUrl, serial, isCustomSerial) {
		const shorten = await this.service.getShortenBySerial(serial)
		if (shorten) {
			if (isCustomSerial) {
				await this.telegramBot.sendMessage(
					chatId,
					'Custom serial is already exist, please try another one'
				)
				return false
			}
			serial = randCharacter(7)
		}

		await this.service.createShorten(serial, chatId, originalUrl, false)
		this.telegramBot.sendMessage(chatId, `Shortened \n${config.baseUrl}/${serial}`)
		return true
	}

	async shorten_3(chatId, text, state) {
		const originalUrl = state.values.original_url
		if (text === '/yes') {
			await this._setStateDataValues(chatId, {
				is_custom_serial: true,
			})
			await this.telegramBot.sendMessage(chatId, 'Send me the custom serial')
			await this._setStateDataSuccess(chatId)
			return
		}

		const serial = randCharacter(7)
		const result = await this._generateShorten(chatId, originalUrl, serial, false)
		await this._setStateDataSuccess(chatId)
		if (!result) {
			return
		}

		await this._setStateDataEnd(chatId)
		await this._setStateDataSuccess(chatId)
	}

	async shorten_4(chatId, text, state) {
		const isCustomSerial = state.values.is_custom_serial
		if (!isCustomSerial) {
			return
		}

		const serial = text
		const originalUrl = state.values.original_url
		const result = await this._generateShorten(chatId, originalUrl, serial, true)
		if (!result) {
			return
		}
		await this._setStateDataSuccess(chatId)
	}

	async list(chatId) {
		const shortens = await this.service.getShortensByUserChatId(chatId)
		if (!shortens) {
			await this.telegramBot.sendMessage(chatId, 'List is empty')
		}
		let message = ''
		for (let value of shortens) {
			message += `${config.baseUrl}/${value.serial} > ${value.original_url} \n`
		}
		await this.telegramBot.sendMessage(chatId, message, {})

		await this._setStateDataSuccess(chatId)
	}

	async delete_1(chatId) {
		await this.telegramBot.sendMessage(chatId, `Input the shorten URL or serial`)
		await this._setStateDataSuccess(chatId)
	}

	async delete_2(chatId, text) {
		await this.service.deleteShortanByChatIdAndSerial(chatId, text)
		await this.telegramBot.sendMessage(chatId, 'Deleted..')
		await this._setStateDataSuccess(chatId)
	}

	async info_1(chatId) {
		await this.telegramBot.sendMessage(chatId, `Input the shorten URL or serial`)
		await this._setStateDataSuccess(chatId)
	}

	async info_2(chatId, text, state) {
		const shorten = await this.service.getShortenByUserChatIdAndSerial(chatId, text)
		if (!shorten) {
			await this.telegramBot.sendMessage(chatId, `The shorten URL is not found`)
		}
		const message = `Serial: ${shorten.serial} \nShorten URL: ${config.baseUrl}/${shorten.serial} \nOriginal URL: ${shorten.original_url} \nVisitor Counter: ${shorten.visitor_counter}`
		await this.telegramBot.sendMessage(chatId, message)
		await this._setStateDataSuccess(chatId)
	}

	createState() {
		return {
			shorten_1: {
				name: 'shorten_1',
				handle: this.shorten_1.bind(this),
				next: 'shorten_2',
			},
			shorten_2: {
				name: 'shorten_2',
				handle: this.shorten_2.bind(this),
				next: 'shorten_3',
			},
			shorten_3: {
				name: 'shorten_3',
				handle: this.shorten_3.bind(this),
				next: 'shorten_4',
			},
			shorten_4: {
				name: 'shorten_4',
				handle: this.shorten_4.bind(this),
				next: '',
			},
			list: {
				name: 'list',
				handle: this.list.bind(this),
				next: '',
			},
			delete_1: {
				name: 'delete_1',
				handle: this.delete_1.bind(this),
				next: 'delete_2',
			},
			delete_2: {
				name: 'delete_2',
				handle: this.delete_2.bind(this),
				next: '',
			},
			info_1: {
				name: 'info_1',
				handle: this.info_1.bind(this),
				next: 'info_2',
			},
			info_2: {
				name: 'info_2',
				handle: this.info_2.bind(this),
				next: '',
			},
		}
	}

	async main(chatId, text) {
		let state
		const telegramState = this.createState()
		const telegramCommand = Object.freeze({
			shorten: '/shorten',
			list: '/list',
			delete: '/delete',
			info: '/info',
		})
		if (Object.values(telegramCommand).includes(text)) {
			await this.service.deleteState(chatId)
			switch (text) {
				case telegramCommand.shorten:
					state = await this._setStateData(chatId, telegramState.shorten_1.name)
					break
				case telegramCommand.list:
					state = await this._setStateData(chatId, telegramState.list.name)
					break
				case telegramCommand.delete:
					state = await this._setStateData(chatId, telegramState.delete_1.name)
					break
				case telegramCommand.info:
					state = await this._setStateData(chatId, telegramState.info_1.name)
					break
				default:
					state = await this._setStateData(chatId, telegramState.shorten_1.name)
					break
			}
		} else {
			state = await this.service.getState(chatId)
			if (!state) {
				// set default state name
				state = await this._setStateData(chatId, telegramState.shorten_2.name)
			}
		}

		await telegramState[state.name].handle(chatId, text, state)

		state = await this.service.getState(chatId)
		if (state.is_success) {
			if (telegramState[state.name].next === '' || state.is_end) {
				// delete or reset state
				await this.service.deleteState(chatId)
			} else {
				// change to next state
				await this._setStateData(chatId, telegramState[state.name].next)
			}
		}
	}

	_createStateData(chatId, name, values = {}) {
		return {
			chat_id: chatId,
			name: name,
			values: values,
			is_success: false,
			is_end: false,
		}
	}

	async _setStateData(chatId, name, values = {}) {
		const data = this._createStateData(chatId, name, values)
		const currentState = await this.service.getState(chatId)
		if (currentState) {
			data.values = {
				...data.values,
				...currentState.values,
			}
		}
		await this.service.setState(chatId, data)
		return data
	}

	async _setStateDataSuccess(chatId) {
		const data = await this.service.getState(chatId)
		if (!data) {
			return null
		}
		data.is_success = true
		await this.service.setState(chatId, data)
	}

	async _setStateDataEnd(chatId) {
		const data = await this.service.getState(chatId)
		if (!data) {
			return null
		}
		data.is_end = true
		await this.service.setState(chatId, data)
	}

	async _setStateDataValues(chatId, values = {}) {
		const data = await this.service.getState(chatId)
		if (!data) {
			return null
		}
		data.values = {
			...data.values,
			...values,
		}
		await this.service.setState(chatId, data)
	}
}

module.exports = TelegramHandler
