#!/usr/bin/env node

console.log("*******************************")
console.log("************ TECHN ************");
console.log("*******************************")

const amqp = require('amqplib/callback_api');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node technician <joint>.* <joint>.*");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchange = 'medical_examination';
        ch.assertExchange(exchange, 'topic', { durable: false }); // queue  won't  survive  broker  restarts

        args.forEach(function(key) {
            const pattern = key.split('.');
            ch.assertQueue(pattern[0]);
            ch.prefetch(1); // load-balancing
            console.log('[*] Waiting for logs. To exit press CTRL+C');
            ch.bindQueue(pattern[0], exchange, key);

            ch.consume(pattern[0], function(msg) {
                console.log(`[RECEIVED] '${msg.content.toString()}'`);
                const examData = msg.fields.routingKey.split('.');
                const reply = `Mr/Mrs ${examData[1]}\'s medical examination result: ${examData[0].toUpperCase()} TWISTED`;
                ch.sendToQueue(msg.properties.replyTo, new Buffer(reply), { correlationId: msg.properties.correlationId });
                ch.sendToQueue('reply', new Buffer(reply));
                console.log(`[SENT] '${reply}'`);
            }, { noAck: true }); // don't send acknowledgement to doctor
        });

        ch.consume('reply', function(msg) {
            console.log(`[ADMIN] '${msg}'`);
        });
    });
});