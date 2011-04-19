var each = require('std/each')

module.exports = {
	NoError: 0,
	OffsetOutOfRange: 1,
	InvalidMessage: 2,
	WrongPartition: 3,
	InvalidRetchSize:4
}

each(['NoError', 'OffsetOutOfRange', 'InvalidMessage', 'WrongPartition', 'InvalidRetchSize'], function(name, codeNum) {
	module.exports[name] = codeNum
	module.exports[codeNum] = name
})

