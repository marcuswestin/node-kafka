var kafka = require('../kafka')

var consumer = new kafka.Consumer({
	host:'localhost',
	port:9092,
	topic:'test'
})

consumer.connect().on('message', function(message) {
	console.log('Consumed message:', message)
})

