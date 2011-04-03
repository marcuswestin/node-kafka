var std = require('std'),
	events = require('events'),
	Client = require('./Client'),
	pack = require('./lib/pack'),
	unpack = require('./lib/unpack'),
	requestTypes = require('./requestTypes')

module.exports = std.Class(Client, function(supr) {

	this._requestType = requestTypes.FETCH

	var defaults = {
		pollInterval: 2000,
		topic: 'test',
		partition: 0,
		offset: 0,
		maxSize: 1000000
	}

	this._init = function(opts) {
		supr(this, '_init', arguments)
		std.extend(opts, defaults)
		this._pollInterval = opts.pollInterval
		this._topic = opts.topic
		this._partition = opts.partition
		this._offset = opts.offset
		this._maxSize = opts.maxSize
		this._encodedFetchRequest = this._encodeFetchRequest()
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
		this._connection.on('data', std.bind(this, '_onData'))
		this._intervalID = setInterval(std.bind(this, '_pollForMessages'), this._pollInterval)
		this._pollForMessages()
	}

	this._pollForMessages = function() {
		this._connection.write(this._encodedFetchRequest)
	}

	this._encodeFetchRequest = function() {
		var request = pack('n', this._requestType)
			+ pack('n', this._topic.length) + this._topic
			+ pack('N', this._partition)
			// TODO: need to store a 64bit integer (bigendian). For now, set first 32 bits to 0
			+ pack('N2', 0, this._offset)
			+ pack('N', this._maxSize)

		var requestSize = 2 + 2 + this._topic.length + 4 + 8 + 4

		return this._bufferPacket(pack('N', requestSize) + request)
	}

	this._onData = function(data) {
		var messages = [],
			processed = 0,
			length = data.length - 4
		console.log('onData', length, data)
		this.emit('Message', 'TODO: Actually decode messageBytes')
	}
})
