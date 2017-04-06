#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var key = process.argv.slice(2).toString();

if (key.length === 0) {
  console.log("Usage: node doctor <join>.<lastname>");
  process.exit(1);
}

amqp.connect('amqp://localhost', function (err, conn) {
  conn.createChannel(function (err, ch) {
      var exchange = 'medical_exam';
      var userData = key.split(".");
      var msg = `Perform a medical examination Mr/Mrs ${userData[1]}\'s ${userData[0]}`;

      ch.assertExchange(exchange, 'topic', { durable: false });
      ch.publish(exchange, userData[0], new Buffer(msg));
      console.log(`[SENT] '${msg}'`);
  });

  sgetTimeout(function () { conn.close(); process.exit(0); }, 500);
});