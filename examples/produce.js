var kafka = require('../kafka-node')

var producer = new kafka.Producer('localhost', 9092)

producer.connect(function() {
	var topic = 'test',
		message = 'hey'

	producer.send(message, topic)
	producer.close()
})

