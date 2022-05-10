const httpErrors = require('http-errors')
class HttpHandler {
	constructor(service, server) {
		this.service = service

		server.get('/:serial', this.redirectShorten.bind(this))
		server.get('/', (_, rep) => {
			rep.redirect(301, config.homeRedirectUrl)
		})
	}
	async redirectShorten(req, rep) {
		const serial = req.params.serial
		const originalUrl = this.service.getOriginalUrlBySerialAndVisit(serial)
		if (!originalUrl) {
			throw new httpErrors.NotFound()
		}
		rep.redirect(301, originalUrl)
	}
}

module.exports = HttpHandler
