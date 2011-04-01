var kafka = require('../kafka-node')

var consumer = new kafka.Consumer({ host:'localhost', port:9092 })

consumer.connect()
consumer.on('Message', function(message) {
	console.log('Consumed message:', message)
})
