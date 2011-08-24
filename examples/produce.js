var kafka = require('../kafka')

var producer = new kafka.Producer({ host: 'localhost', port: 9092 })

producer.connect().on('connect', function() {
	var topic = 'test', message = 'hey'
	
	producer.send(message, topic)
	producer.close()
})

