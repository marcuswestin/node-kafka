var net = require('net'),
	events = require('events'),
	std = require('std'),
	pack = require('./lib/pack'),
	crc32 = require('./lib/crc32'),
	requestTypes = require('./requestTypes')

module.exports = std.Class(function() {
	
	this._magicValue = 0
	this._requestType = requestTypes.PRODUCE

	this._init = function(host, port) {
		this._host = host
		this._port = port
		this._connected = false
	}

	this.connect = function(callback) {
		if (this._connected) {
			callback()
		} else if (this._connectCallbacks) {
			this._connectCallbacks.push(callback)
		} else {
			this._connectCallbacks = [callback]
			this._connection = net.createConnection(this._port, this._host)
			this._connection.on('connect', std.bind(this, function() {
				this._connected = true
				for (var i=0; i < this._connectCallbacks.length; i++) {
					this._connectCallbacks[i]()
				}
				delete this._connectCallbacks
			}))
		}
		return this
	}

	this.send = function(messages, topic, partition) {
		if (!partition) { partition = 0 }
		if (!(messages instanceof Array)) { messages = [messages] }
		this._connection.write(this._encodeRequest(topic, partition, messages))
		return this
	}

	this.close = function() {
		this._connection.end()
		this._connected = false
		return this
	}

	this._encodeRequest = function(topic, partition, messages) {
		var encodedMessages = ''
		for (var i=0; i<messages.length; i++) {
			var encodedMessage = this._encodeMessage(messages[i])
			encodedMessages += pack('N', encodedMessage.length) + encodedMessage
		}

		var request = pack('n', this._requestType)
			+ pack('n', topic.length) + topic
			+ pack('N', partition)
			+ pack('N', encodedMessages.length) + encodedMessages
		
		var packet = pack('N', request.length) + request,
			len = packet.length,
			buffer = new Buffer(len)
		
		for (var i=0; i<len; i++) {
			buffer[i] = packet.charCodeAt(i)
		}

		return buffer
	}

	this._encodeMessage = function(message) {
		return pack('CN', this._magicValue, crc32(message)) + message
	}
})
