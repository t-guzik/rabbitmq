#!/usr/bin/env node

console.log("*******************************");
console.log("************ DOCTOR ***********");
console.log("*******************************");

const amqp = require('amqplib/callback_api');
const key = process.argv.slice(2).toString();

// check args correctness
if (key.length === 0) {
    console.log("Usage: node doctor <joint>.<lastname>");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchange = 'medical_examination';
        const exchange_result = 'medical_examination_result';
        const exchange_info = 'admin_info';

        const patientData = key.split("."); // [joint, lastname]
        const msg = `Perform a medical examination Mr/Mrs ${patientData[1]}\'s ${patientData[0]}`;

        ch.assertExchange(exchange, 'topic', { durable: false }); // queue won't survive broker restarts
        ch.assertExchange(exchange_result, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_info, 'fanout', { durable: false }); // queue  won't  survive  broker  restarts

        ch.assertQueue('', { exclusive: true }, function(err, q) { // unique, temporary queue
            ch.bindQueue(q.queue, exchange_result, q.queue);
            ch.publish(exchange, key, new Buffer(msg), { replyTo: q.queue });
            console.log(`[SENT] '${msg}'`);

            console.log('[*] Waiting for reply. To exit press CTRL+C');
            ch.consume(q.queue, function(msg) {
                console.log('[RECEIVED] Got %s', msg.content.toString());
            }, { noAck: true }); // dont send acknowledgement to technician
        });

        /** Logs from admin */
        ch.assertQueue('', { exclusive: true }, function(err, q) { // unique, temporary queue
            ch.bindQueue(q.queue, exchange_info, 'log');
            ch.consume(q.queue, function(msg) {
                console.log(`[ADMIN] '${msg.content}'`);
            }, { noAck: true });
        });

        setTimeout(function() {
            conn.close();
            process.exit(0);
        }, 5000);
    });
});