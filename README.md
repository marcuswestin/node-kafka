Main project repo moved
-----------------------
This project is most actively used and maintained by Taylor Gautier at Tagged.

Please see the [Tagged node-kafka repo](https://github.com/tagged/node-kafka).


Kafka javascript API
-----------------------
Interact with [Kafka](http://sna-projects.com/kafka/), LinkedIn's disk based message queue using node.js

Get up and running
------------------

 1 Install kafka

	npm install kafka

 2 Start zookeeper, kafka server, and a consumer (see http://sna-projects.com/kafka/quickstart.php)

 3 Publish and consume some messages!

	var kafka = require('kafka')
	
	new kafka.Consumer().connect().subscribeTopic('test').on('message', function(topic, message) {
		console.log("Consumed message:", message)
	})
	
	var producer = new kafka.Producer().connect().on('connect', function() {
		producer.send("hey!")
		producer.close()
	})

API
---

`kafka.Consumer`

	var consumer = new kafka.Consumer({
		// these are the default values
		host:         'localhost',
		port:          9092,
		pollInterval:  2000,
		maxSize:       1048576 // 1MB
	})
    consumer.on('message', function(topic, message) { 
        console.log(message)
    })
	consumer.connect(function() {
        consumer.subscribeTopic({name: 'test', partition: 0})
    })

`kafka.Producer`

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

Authors
-------

- Marcus Westin (clover)
- Taylor Gautier (tagged)

Contributors
------------

- Laurie Harper
- @omnichuck
- @philips
