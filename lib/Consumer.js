var std = require('std'),
	events = require('events'),
	Client = require('./Client'),
	requestTypes = require('./requestTypes'),
	error = require('./error')

module.exports = std.Class(Client, function(supr) {

	this._requestType = requestTypes.FETCH

	var defaults = {
		topic: 'test',
		partition: 0,
		pollInterval: 2000,
		offset: 0,
		maxSize: 1048576 //1MB
	}

	this._init = function(opts) {
		supr(this, '_init', arguments)
		opts = std.extend(opts, defaults)
		this._pollInterval = opts.pollInterval
		this._topic = opts.topic
		this._partition = opts.partition
		this._offset = opts.offset
		this._buffer = new Buffer(opts.maxSize)
	}

	this.connect = function() {
		supr(this, 'connect', arguments)
		this._connection.on('connect', std.bind(this, '_onConnect'))
		return this
	}

	this.close = function() {
		supr(this, 'close')
		clearTimeout(this._timeoutID)
		delete this._timeoutID
	}

	this._onConnect = function(callback) {
		if (callback) { callback() }
		this._connection.on('data', std.bind(this, '_onData'))
		this._pollForMessages()
	}

	this._pollForMessages = function() {
		delete this._timeoutID
		var encodedRequest = this._encodeFetchRequest()
		this._connection.write(encodedRequest)
	}

	this._encodeFetchRequest = function() {
		var request = std.pack('n', this._requestType)
			+ std.pack('n', this._topic.length) + this._topic
			+ std.pack('N', this._partition)
			// TODO: need to store a 64bit integer (bigendian). For now, set first 32 bits to 0
			+ std.pack('N2', 0, this._offset)
			+ std.pack('N', this._buffer.length)

		var requestSize = 2 + 2 + this._topic.length + 4 + 8 + 4

		return this._bufferPacket(std.pack('N', requestSize) + request)
	}

	this._onData = function(buf) {
		var index = 0
		if (!this._remainingBytes) {
			var boundedBufferInfo = std.unpack('Nsize/nerror', buf.toString('utf8', 0, 6))
			if (boundedBufferInfo.error) {
				throw new Error("Consumer error. " + error[boundedBufferInfo.error])
			}
			this._remainingBytes = boundedBufferInfo.size - 2 // 2 for the error code
			this._readBytes = 0
			index += 6
		}

		if (index == buf.length) {
			this._schedulePoll()
			return
		}

		var dataSize = buf.length - index
		buf.copy(this._buffer, this._readBytes, index, index + dataSize)
		this._remainingBytes -= dataSize
		this._readBytes += dataSize

		if (this._remainingBytes == 0) { this._parseBuffer() }
	}

	this._parseBuffer = function() {
		var index = 0
		while (index < this._readBytes) {
			var messageInfo = std.unpack('Nsize/Cmagic/Nchecksum', this._buffer.toString('utf8', index, index + 9))
			index += 9
			var payloadLength = messageInfo.size - 5 // 1 magic + 4 checksum
			var payload = this._buffer.toString('utf8', index, index + payloadLength)
			index += payloadLength
			try {
				this.emit('message', payload)
			} catch(e) { console.log("Message handler threw", e) }
		}
		this._offset += this._readBytes
		this._schedulePoll()
	}

	this._schedulePoll = function() {
		if (this._timeoutID) { return }
		this._timeoutID = setTimeout(std.bind(this, '_pollForMessages'), this._pollInterval)
	}

	this._debufferPacket = function(buf) {
		var len = buf.length,
			result = ''
		for (var i=0; i<len; i++) {
			result += String.fromCharCode(buf[i])
		}
		return result
	}
})
