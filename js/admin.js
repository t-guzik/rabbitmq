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

amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        const exchange = 'medical_examination';
        const exchange_result = 'medical_examination_result';
        const from_doctor_queue = 'doctor_logs';
        const from_technician_queue = 'technician_logs';
        const logs_doctor_queue = 'logs_to_doctor';
        const logs_technician_queue = 'logs_to_technician';

        ch.assertExchange(exchange, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_result, 'topic', { durable: false }); // queue  won't  survive  broker  restarts

        ch.assertQueue(from_doctor_queue, { durable: false });
        ch.assertQueue(from_technician_queue, { durable: false });
        ch.assertQueue(logs_doctor_queue, { durable: false });
        ch.assertQueue(logs_technician_queue, { durable: false });
        console.log("[*] Waiting for logs. Type 'exit' to finish.");

        ch.bindQueue(from_doctor_queue, exchange, '#');
        ch.bindQueue(from_technician_queue, exchange_result, '#');

        ch.consume(from_doctor_queue, function (msg) {
            console.log(`[LOG] ${msg.content}`);
        }, { noAck: true });

        ch.consume(from_technician_queue, function (msg) {
            console.log(`[LOG] ${msg.content}`);
        }, { noAck: true });

        asyncReadLine(logs_doctor_queue, logs_technician_queue, ch, conn);
    });
});

var asyncReadLine = function (logs_doctor_queue, logs_technician_queue, ch, conn) {
    rl.question('Type message to all:\n', (answer) => {
        if(answer == 'exit'){
            rl.close();
            conn.close();
            process.exit(0);
            return;
        }

        ch.sendToQueue(logs_technician_queue, new Buffer(answer), {persistent: false});
        ch.sendToQueue(logs_doctor_queue, new Buffer(answer), {persistent: false});
        asyncReadLine(logs_doctor_queue, logs_technician_queue, ch, conn);
    });
};