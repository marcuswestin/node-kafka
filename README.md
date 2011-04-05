Kafka javascript client
-----------------------
Interact with Kafka, consume and produce

Get up and running
------------------
Install kafka
	npm install kafka
Start zookeeper, kafka server, and a consumer
	// see http://sna-projects.com/kafka/quickstart.php
Publish and consume some messages!
	var kafka = require('kafka')
	
	new kafka.Consumer().connect().on('message', function(message) {
		console.log("Consumed message:", message)
	})
	
	var producer = new kafka.Producer().connect().on('connect', function() {
		producer.send("hey!")
		producer.close()
	})

API
---
kafka.Consumer
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
		
kafka.Producer
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
