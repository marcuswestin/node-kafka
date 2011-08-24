/* 
 * A simple demonstration of using the consumer
 * class which allows for subscribing to and 
 * unsubscribing from topics.
 */
var kafka = require('../kafka')

var consumer = new kafka.Consumer({
	host:'localhost',
	port:9092,
})

consumer.connect().on('message', function(topic, message) {
	console.log('Consumed message:', message)
})

consumer.subscribeTopic('test')
