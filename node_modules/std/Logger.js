var std = require('std')

// TODO Send email on error
module.exports = std.Class(function() {

	var defaults = {
		name: 'Logger'
	}

	this._init = function(opts) {
		opts = std.extend(opts, defaults)
		this._name = opts.name
		this._emailQueue = []
	}

	this.log = function() {
		this._consoleLog(std.slice(arguments))
	}

	this.error = function(err, message) {
		var messageParts = [this._name, new Date().getTime(), message, err.message, err.stack]
		this._consoleLog(messageParts)
		this._queueEmail(messageParts)
	}

	this._queueEmail = function(messageParts) {
		this._emailQueue.push(messageParts)
		this._scheduleEmailDispatch()
	}

	var joinParts = function(arr) { return arr.join(' | ') }

	this._consoleLog = function(messageParts) {
		console.log(joinParts(messageParts))
	}

	this._scheduleEmailDispatch = std.delay(function() {
		var message = std.map(this._emailQueue, joinParts).join('\n')
		// TODO send message to error reporting email address
	}, 10000) // Send at most one email per 10 seconds
})
