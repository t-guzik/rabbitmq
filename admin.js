#!/usr/bin/env node

console.log("*******************************")
console.log("************ ADMIN ************");
console.log("*******************************")

const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchange = 'logs';

        ch.assertExchange(exchange, 'fanout', { durable: false }); // queue  won't  survive  broker  restarts

        console.log("[*] Waiting for logs. To exit press CTRL+C");

        ch.assertQueue('reply');
        ch.consume('reply', function(msg) {
            console.log(`[LOG] ${msg.content.toString()}`);
        }, { noAck: true });

    });
});