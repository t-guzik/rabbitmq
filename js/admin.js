#!/usr/bin/env node

console.log("*******************************");
console.log("************ ADMIN ************");
console.log("*******************************");

const amqp = require('amqplib/callback_api');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchange = 'medical_examination';
        const exchange_result = 'medical_examination_result';
        const exchange_info = 'admin_info';
        const logs_queue_from_doctor = 'logs_from_doctor';
        const logs_queue_from_technician = 'logs_from_technician';

        ch.assertExchange(exchange, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_result, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_info, 'fanout', { durable: false }); // queue  won't  survive  broker  restarts

        ch.assertQueue(logs_queue_from_doctor, { durable: false });
        ch.assertQueue(logs_queue_from_technician, { durable: false });
        console.log("[*] Waiting for logs. Type 'exit' to finish.");

        ch.bindQueue(logs_queue_from_doctor, exchange, '#');
        ch.bindQueue(logs_queue_from_technician, exchange_result, '#');

        ch.consume(logs_queue_from_doctor, function(msg) {
            if (msg.fields.routingKey != 'log')
                console.log(`[LOG] ${msg.content}`);
        }, { noAck: true });

        ch.consume(logs_queue_from_technician, function(msg) {
            if (msg.fields.routingKey != 'log')
                console.log(`[LOG] ${msg.content}`);
        }, { noAck: true });

        asyncReadLine(exchange_info, ch, conn);
    });
});

var asyncReadLine = function(exchange_info, ch, conn) {
    rl.question('Type message to all:\n', (answer) => {
        if (answer == 'exit') {
            rl.close();
            conn.close();
            process.exit(0);
            return;
        }

        ch.publish(exchange_info, '', new Buffer(answer));
        asyncReadLine(exchange_info, ch, conn);
    });
};