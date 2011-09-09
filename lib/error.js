['NoError', 'OffsetOutOfRange', 'InvalidMessage', 'WrongPartition', 'InvalidRetchSize'].forEach(function(name, codeNum) {
	module.exports[name] = codeNum;
	module.exports[codeNum] = name;
});