var std = require('std'),
	pack = require('./lib/pack'),
	crc32 = require('./lib/crc32'),
	Client = require('./Client'),
	requestTypes = require('./requestTypes')

module.exports = std.Class(Client, function() {
	
	this._magicValue = 0
	this._requestType = requestTypes.PRODUCE

	this.send = function(messages, topic, partition) {
		if (!partition) { partition = 0 }
		if (!(messages instanceof Array)) { messages = [messages] }
		this._connection.write(this._encodeRequest(topic, partition, messages))
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
