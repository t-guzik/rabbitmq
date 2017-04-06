#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var key = process.argv.slice(2).toString();

if (key.length === 0) {
  console.log("Usage: node doctor <join>.<lastname>");
  process.exit(1);
}

amqp.connect('amqp://localhost', function (err, conn) {
  conn.createChannel(function (err, ch) {
    var exchange = 'medical_examination';
    var userData = key.split(".");
    var msg = `Perform a medical examination Mr/Mrs ${userData[1]}\'s ${userData[0]}`;
    var corr = generateUuid();

    ch.assertQueue('', { exclusive: true }, function (err, q) {
      console.log('[*] Waiting for reply. To exit press CTRL+C');
      ch.consume(q.queue, function (msg) {
        if (msg.properties.correlationId == corr) {
          console.log(' [RECEIVED] Got %s', msg.content.toString());
        }
      }, { noAck: true });

      ch.assertExchange(exchange, 'topic', { durable: false });
      ch.publish(exchange, key, new Buffer(msg), { correlationId: corr, replyTo: q.queue });
      console.log(`[SENT] '${msg}'`);
    });

    setTimeout(function() { conn.close(); process.exit(0); }, 500);
  });
});

function generateUuid() {
  return Math.random().toString();
}