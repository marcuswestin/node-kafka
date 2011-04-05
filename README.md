Kafka javascript client
-----------------------
Interact with Kafka, consume and produce

Get up and running
------------------
1. `npm install kafka`
2. Start zookeeper, kafka server, and a consumer (http://sna-projects.com/kafka/quickstart.php)
3. publish and consumer some messages:

	var kafka = require('kafka')

	var consumer = new kafka.Consumer()
	consumer.connect().on('message', function(message) {
		console.log("Consumed message:", message)
	})
	
	var producer = new kafka.Producer()
	producer.connect().on('connect', function() {
		producer.send("hey!")
		producer.close()
	})

API
---

	var consumer = new kafka.Consumer({
		// these are the default values
		host:         'localhost',
		port:          9092,
		topic:        'test',
		partition:    0,
		pollInterval: 2000,
		maxSize:      1048576 // 1MB
	})
	consumer.connect()
	consumer.on('connect', function() { })
	consumer.on('message', function(message) { })
	
	var producer = new kafka.Producer({
		// these are also the default values
		host:         'localhost',
		port:         9092,
		topic:        'test',
		partition:    0
	})
	producer.connect(function() {
		producer.send('message bytes')
	})
