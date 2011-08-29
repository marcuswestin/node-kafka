/*
 * This example demonstrates using the Basic Consumer
 *
 * The Basic Consumer is an advanced API - if you are
 * looking for something simple and efficient use 
 * the Consumer API instead.  
 *
 * The use of Basic Consumer shown in this example 
 * would be very inefficient since it polls kafka 
 * as fast as it possibly can.  You should not
 * do this.  The example is written only to 
 * demonstrate how to use the Basic Consumer API
 *
 * A real world implementation using this class 
 * should implement a more efficient strategy
 * and backoff when there are no messages to consume
 *
 * See Consumer.js for a more realistic use case
 */
var kafka = require('kafka')

var client  = new kafka.Client({
    host:'localhost',
    port:9092,
})

client.on('message', function(topic, message, offset) {
    console.log("Consumed topic:" + topic + " message:" + message)

})
client.on('lastmessage', function(topic, offset) {
    client.fetchTopic({name: topic, offset: offset})
})
client.connect(function() { 
    client.fetchTopic({name: "test", offset: 0})
    client.fetchTopic({name: "test2"})
})
