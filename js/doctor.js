#!/usr/bin/env node

console.log("*******************************")
console.log("************ DOCTOR ***********");
console.log("*******************************")

const amqp = require('amqplib/callback_api');
const key = process.argv.slice(2).toString();

// check args correctness
if (key.length === 0) {
    console.log("Usage: node doctor <join>.<lastname>");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchange = 'medical_examination';
        const userData = key.split(".");
        const msg = `Perform a medical examination Mr/Mrs ${userData[1]}\'s ${userData[0]}`;
        const correlation = generateUuid();

        ch.assertQueue('', { exclusive: true }, function(err, q) { // create fresh, unique queue
            ch.consume(q.queue, function(msg) {
                if (msg.properties.correlationId == correlation) {
                    console.log('[RECEIVED] Got %s', msg.content.toString());
                }
            }, { noAck: true }); // don't send acknowledgement to technician

            ch.assertExchange(exchange, 'topic', { durable: false }); // queue won't survive broker restarts
            ch.publish(exchange, key, new Buffer(msg), { correlationId: correlation, replyTo: q.queue });
            ch.sendToQueue('reply', new Buffer(msg));
            console.log(`[SENT] '${msg}'`);
            console.log('[*] Waiting for reply. To exit press CTRL+C');
        });

        ch.consume('reply', function(msg) {
            console.log(`[ADMIN] '${msg}'`);
        });

        setTimeout(function() {
            conn.close();
            process.exit(0);
        }, 500);
    });
});

function generateUuid() {
    return Math.random().toString();
}