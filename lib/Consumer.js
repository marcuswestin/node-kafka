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
		this._partition = opts.partition
		this._buffer = new Buffer(opts.maxSize)
		this._topics = []
		this._pendingTopicAdds = [];
		this._pendingTopicDeletes = {};
		this._topicsIndex = 0
		this._remainingTopics = 0
		this._shouldPoll = false
		
		this.on('pollForMessages', std.bind(this, '_pollForMessages'))
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

	// TODO allow for optional offset to be specified
	this.subscribeTopic = function(name) {
		var topic = {name:name, offset:0, partition: 0}
		this._pendingTopicAdds.push(topic)
		if (this._topics.length == 0) {
			this._schedulePoll()
			this.emit('pollForMessages')
		}
	}

	this.unsubscribeTopic = function(name) {
		this._pendingTopicDeletes[name] = true
	}
	
	this._onConnect = function(callback) {
		if (callback) { callback() }
		this._connection.on('data', std.bind(this, '_onData'))
	}

	this._pollForMessages = function() {
		if (this._topicsIndex < this._topics.length || !this._shouldPoll) return
		this._shouldPoll = false

		// add any pending additions
		for (i in this._pendingTopicAdds) this._topics.push(this._pendingTopicAdds[i])
		this._pendingTopicAdds = [];

		// remove any pending deletions
		var deletes = this._pendingTopicDeletes;
		this._topics = this._topics.filter(function(x) { return deletes[x.name] == undefined})
		this._pendingTopicDeletes = {}
		if (this._topics.length == 0) {
			this._unschedulePoll()
			return
		}

		this._topicsIndex = 0;
		for (i in this._topics) this._writeFetchRequest(this._topics[i])
	}
	
	this._writeFetchRequest = function(t) {
		this._connection.write(this._encodeFetchRequest(t))
	}

	this._encodeFetchRequest = function(t) {
		var request = std.pack('n', this._requestType)
			+ std.pack('n', t.name.length) + t.name
			+ std.pack('N', t.partition)
			// TODO: need to store a 64bit integer (bigendian). For now, set first 32 bits to 0
			+ std.pack('N2', 0, t.offset)
			+ std.pack('N', this._buffer.length)

		var requestSize = 2 + 2 + t.name.length + 4 + 8 + 4

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

		// check for 0 messages
		if (this.remainingBytes == 0) {
			this._topicsIndex++
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
				this.emit('message', this._topics[this._topicsIndex].name, payload)
			} catch(e) { console.log("Message handler threw", e) }
		}
		this._topics[this._topicsIndex].offset += this._readBytes

		if (++this._topicsIndex == this._topicsIndex.length) {
			this.emit('pollForMessages')
		}
	}
	
	this._schedulePoll = function() {
		this._timeoutID = setTimeout(std.bind(this, '_schedulePoll'), this._pollInterval)
		this._shouldPoll = true
		this.emit('pollForMessages')
	}
	
	this._unschedulePoll = function() {
		clearTimeout(this._timeoutID)
		this._shouldPoll = false
	}
})
