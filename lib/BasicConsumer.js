var std = require('std'),
	events = require('events'),
	Client = require('./Client'),
	requestTypes = require('./requestTypes'),
	error = require('./error')

	
module.exports = std.Class(Client, function(supr) {

	var states = {
		RESPONSE_LEN_0: 0, RESPONSE_LEN_1: 1, RESPONSE_LEN_2: 2, RESPONSE_LEN_3: 3,
		RESPONSE_EC_0: 4, RESPONSE_EC_1: 5,
		RESPONSE_MSG_0: 6, RESPONSE_MSG_1: 7, RESPONSE_MSG_2: 8, RESPONSE_MSG_3: 9,
		RESPONSE_MAGIC: 10,
		RESPONSE_CHKSUM_0: 11, RESPONSE_CHKSUM_1: 12, RESPONSE_CHKSUM_2: 13, RESPONSE_CHKSUM_3: 14,
		RESPONSE_MSG: 15
	}
	
	var defaults = {
		maxSize: 1048576 //1MB
	}
	
	var request_defaults = {
		offset: 0,
		partition: 0
	}

	this._init = function(opts) {
		supr(this, '_init', arguments)
		opts = std.extend(opts, defaults)
		this._buffer = new Buffer(opts.maxSize)		
		this._toRead = 0
		this._requests = []
		this._state = states.RESPONSE_LEN_0
	}

	this.connect = function() {
		supr(this, 'connect', arguments)
		this._connection.on('connect', std.bind(this, '_onConnect'))
		return this
	}
		
	this.fetchTopic = function(args) {
		var request = std.extend(args.name == undefined ? { name: args } : args, request_defaults)
		this._requests.push(request)
		this._connection.write(this._encodeFetchRequest(request))
	}

	this._onConnect = function(callback) {
		if (callback) { callback() }
		this._connection.on('data', std.bind(this, '_onData'))
	}
	
	this._encodeFetchRequest = function(t) {
		var request = std.pack('n', requestTypes.FETCH)
			+ std.pack('n', t.name.length) + t.name
			+ std.pack('N', t.partition)
			// TODO: need to store a 64bit integer (bigendian). For now, set first 32 bits to 0
			+ std.pack('N2', 0, t.offset)
			+ std.pack('N', this._buffer.length)

		var requestSize = 2 + 2 + t.name.length + 4 + 8 + 4

		return this._bufferPacket(std.pack('N', requestSize) + request)
	}
	
	this._onData = function(buf) {
		var buffer = new Buffer(buf.length - 2)
		buf.copy(buffer, 0, 0, buf.length - 2)
		this._processData(buffer)
				
		buffer = new Buffer(2)
		buf.copy(buffer, 0, buf.length - 2, buf.length)
		this._processData(buffer)
	}
	
	this._processData = function (buf) {
		var index = 0		
		while (index != buf.length) {
			var bytes = 1
			var next = this._state + 1
			switch (this._state) {
				case states.RESPONSE_LEN_0:
					this._totalLen = buf[index] << 24
				    break
				
				case states.RESPONSE_LEN_1:				
				    this._totalLen += buf[index] << 16
				    break
					
				case states.RESPONSE_LEN_2:				
				    this._totalLen += buf[index] << 8
				    break

				case states.RESPONSE_LEN_3:		
				    this._totalLen += buf[index]
				    break
				
				case states.RESPONSE_EC_0:
					this._totalLen--
				    break
				    
				case states.RESPONSE_EC_1:
					this._toRead = this._totalLen
					this._totalLen--
				    break
				
				case states.RESPONSE_MSG_0:
				    this._payloadLen = 0
				    this._msgLen = buf[index] << 24
				    break

				case states.RESPONSE_MSG_1:				
 				    this._msgLen += buf[index] << 16
				    break

				case states.RESPONSE_MSG_2:				
				    this._msgLen += buf[index] << 8
				    break

				case states.RESPONSE_MSG_3:				
				    this._msgLen += buf[index]
				    break
				
				case states.RESPONSE_MAGIC:	
			        this._msgLen--
				    this._magic = buf[index]
				    break

				case states.RESPONSE_CHKSUM_0:
		        	this._msgLen--
				    this._chksum = buf[index] << 24
				    break

				case states.RESPONSE_CHKSUM_1:				
					this._msgLen--
				    this._chksum += buf[index] << 16
				    break

				case states.RESPONSE_CHKSUM_2:				
				    this._msgLen--
			        this._chksum += buf[index] << 8
				    break

				case states.RESPONSE_CHKSUM_3:				
				    this._msgLen--
			        this._chksum += buf[index]
				    break
				
				case states.RESPONSE_MSG:
					next = states.RESPONSE_MSG
					
					// try to avoid a memcpy if possible
					var payload = null
					if (this._payloadLen == 0 && buf.length - index >= this._msgLen) {
						payload = buf.toString('utf8', index, index + this._msgLen)
						bytes = this._msgLen
					} else {
						var end = index + this._msgLen - this._payloadLen
						if (end > buf.length) end = buf.length
						buf.copy(this._buffer, this._payloadLen, index, end)
						this._payloadLen += end - index
						bytes = end - index
						if (this._payloadLen == this._msgLen) {														
							payload = this._buffer.toString('utf8', 0, this._payloadLen)
						}
					}
					if (payload != null) try {
						next = states.RESPONSE_MSG_0
						this.emit('message', this._requests[0].name, payload)
					} catch(e) { console.log("Message handler threw", e) }						
					break
			}
			index += bytes
			this._toRead -= bytes
			this._state = next
			if (this._toRead == 0) this._last()
		}
	}	
	
	this._last = function() {
		this.emit('last', this._requests[0].name, this._requests[0].offset + this._totalLen)
		this._requests.shift()
		this._state = states.RESPONSE_LEN_0
	}
})