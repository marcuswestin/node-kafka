var std = require('std'),
	events = require('events'),
	Client = require('./Client')

module.exports = std.Class(Client, function(supr) {

	var defaults = {
		pollInterval: 2000
	}

	this._init = function(opts) {
		supr(this, '_init', arguments)
		std.extend(opts, defaults)
		this._pollInterval = opts.pollInterval
		events.EventEmitter.call(this)
	}

	this.connect = function(callback) {
		var onConnected = std.bind(this, '_onConnected', callback)
		return supr(this, 'connect', [onConnected])
	}

	this.close = function() {
		supr(this, 'close')
		clearInterval(this._intervalID)
		delete this._intervalID
	}

	this._onConnected = function(callback) {
		if (callback) { callback() }
		this._intervalID = setInterval(std.bind(this, '_pollForMessages'), this._pollInterval)
	}

	this._pollForMessages = function() {
		console.log("TODO: Send a consumer poll request")
	}

	this._onMessage = function(messageBytes) {
		this.emit('Message', 'TODO: Actually decode messageBytes')
	}
})
