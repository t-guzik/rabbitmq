#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Usage: node technician <joint>.* <joint>.*");
    process.exit(1);
}

amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        var exchange = 'medical_examination';
        ch.assertExchange(exchange, 'topic', { durable: false });
        
        args.forEach(function (key) {
            var data = key.split('.');
            ch.assertQueue(data[0]);
            ch.prefetch (1);
            console.log('[*] Waiting for logs. To exit press CTRL+C');
            ch.bindQueue(data[0], exchange, key);

            ch.consume(data[0], function (msg) {
                console.log(` [RECEIVED] '${msg.content.toString()}'`);

                var examData = msg.fields.routingKey.split('.');
                var reply = `Mr/Mrs ${examData[1]}\'s medical examination result: ${examData[0].toUpperCase()} TWISTED`;
                ch.sendToQueue(msg.properties.replyTo, new Buffer(reply), 
                    {correlationId: msg.properties.correlationId});
                console.log(` [SENT] '${reply}'`);
            }, { noAck: true });
        });
    });
});