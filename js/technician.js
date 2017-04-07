#!/usr/bin/env node

console.log("*******************************");
console.log("************ TECHN ************");
console.log("*******************************");

const amqp = require('amqplib/callback_api');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node technician <joint>.* <joint>.*");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        const exchange = 'medical_examination';
        const exchange_result = 'medical_examination_result';
        const exchange_info = 'admin_info';

        ch.assertExchange(exchange, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_result, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_info, 'fanout', { durable: false }); // queue  won't  survive  broker  restarts

        /** Handle all examination types */
        args.forEach(function(key) {
            const pattern = key.split('.'); // [joint, any_lastname]
            ch.assertQueue(pattern[0], { durable: false });
            ch.prefetch(1); // load-balancing
            ch.bindQueue(pattern[0], exchange, key);

            console.log('[*] Waiting for logs. To exit press CTRL+C');
            ch.consume(pattern[0], function(msg) {
                console.log(`[RECEIVED] '${msg.content.toString()}'`);
                const examinationData = msg.fields.routingKey.split('.'); // [joint, lastname]
                const reply = `Mr/Mrs ${examinationData[1]}\'s medical examination result: ${examinationData[0].toUpperCase()} TWISTED`;
                ch.publish(exchange_result, msg.properties.replyTo, new Buffer(reply));
                console.log(`[SENT] '${reply}'`);
            }, { noAck: true }); // don't send acknowledgement to doctor
        });

        /** Logs from admin */
        ch.assertQueue('', { exclusive: true }, function(err, q) { // unique, temporary queue
            ch.bindQueue(q.queue, exchange_info, 'log');
            ch.consume(q.queue, function(msg) {
                console.log(`[ADMIN] '${msg.content}'`);
            }, { noAck: true });
        });
    });
});