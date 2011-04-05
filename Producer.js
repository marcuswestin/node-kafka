var std = require('std'),
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
			encodedMessages += std.pack('N', encodedMessage.length) + encodedMessage
		}

		var request = std.pack('n', this._requestType)
			+ std.pack('n', topic.length) + topic
			+ std.pack('N', partition)
			+ std.pack('N', encodedMessages.length) + encodedMessages
		
		return this._bufferPacket(std.pack('N', request.length) + request)
	}

	this._encodeMessage = function(message) {
		return std.pack('CN', this._magicValue, std.crc32(message)) + message
	}
})
