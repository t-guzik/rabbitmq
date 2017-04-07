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

amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        const exchange = 'medical_examination';
        const exchange_result = 'medical_examination_result';

        const logs_queue = 'logs_to_doctor';
        const result_queue = 'result';
        const patientData = key.split("."); // [joint, lastname]
        const msg = `Perform a medical examination Mr/Mrs ${patientData[1]}\'s ${patientData[0]}`;

        ch.assertExchange(exchange, 'topic', { durable: false }); // queue won't survive broker restarts

        ch.assertQueue('', { exclusive: true }, function (err, q) { // unique, temporary queue
            ch.bindQueue(q.queue, exchange_result, q.queue);
            ch.publish(exchange, key, new Buffer(msg), { replyTo: q.queue , persistent: false});
            console.log(`[SENT] '${msg}'`);

            console.log('[*] Waiting for reply. To exit press CTRL+C');
            ch.consume(q.queue, function (msg) {
                console.log('[RECEIVED] Got %s', msg.content.toString());
            }, { noAck: true }); // don't send acknowledgement to technician
        });

        /** Logs from admin */
        ch.assertQueue(logs_queue, { durable: false });
        ch.consume(logs_queue, function (msg) {
            console.log(`[ADMIN] '${msg.content}'`);
        });

        setTimeout(function () {
            conn.close();
            process.exit(0);
        }, 50000);
    });
});