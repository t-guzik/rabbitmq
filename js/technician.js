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
        const logs_queue = 'logs_to_technician';
        const result_queue = 'result';

        ch.assertExchange(exchange, 'topic', { durable: false }); // queue  won't  survive  broker  restarts
        ch.assertExchange(exchange_result, 'topic', { durable: false }); // queue  won't  survive  broker  restarts

        ch.assertQueue(result_queue);

        /** Handle all examination types */
        args.forEach(function(key) {
            const pattern = key.split('.'); // [joint, any_lastname]
            ch.assertQueue(pattern[0]);
            ch.prefetch(1); // load-balancing
            ch.bindQueue(pattern[0], exchange, key);

            console.log('[*] Waiting for logs. To exit press CTRL+C');
            ch.consume(pattern[0], function(msg) {
                console.log(`[RECEIVED] '${msg.content.toString()}'`);
                const examinationData = msg.fields.routingKey.split('.');   // [joint, lastname]
                const reply = `Mr/Mrs ${examinationData[1]}\'s medical examination result: ${examinationData[0].toUpperCase()} TWISTED`;
                ch.publish(exchange_result, msg.properties.replyTo, new Buffer(reply), {persistent: false});
                console.log(`[SENT] '${reply}'`);
            }, { noAck: true }); // don't send acknowledgement to doctor
        });

        /** Logs from admin */
        ch.assertQueue(logs_queue, { durable: false });
        ch.consume(logs_queue, function(msg) {
            console.log(`[ADMIN] '${msg.content}'`);
        });
    });
});