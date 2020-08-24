#!/usr/bin/env node

const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const yargs = require('yargs');

//  Prepare commandline argument parsing
var argv = yargs
    .scriptName('http_to_mqtt2')
    .usage('$0 <cmd> [args]')
    .config('settings', function (configPath) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    })
    .help()
    .alias('help', 'h')
    .argv;

//  Get the settings
const settings = {
    mqtt: {
        url: argv.mqtt_url || process.env.MQTT_URL || process.env.MQTT_HOST || '',
        user: argv.mqtt_user || process.env.MQTT_USER || '',
        password: argv.mqtt_pass || process.env.MQTT_PASS || '',
        clientId: argv.mqtt_clientid || process.env.MQTT_CLIENT_ID || null
    },
    keepalive: {
        topic: argv.keep_alive_topic || process.env.KEEP_ALIVE_TOPIC || 'keep_alive',
        message: argv.keep_alive_message || process.env.KEEP_ALIVE_MESSAGE || 'keep_alive'
    },
    debug: argv.debug || process.env.DEBUG_MODE || false,
    secret: argv.secret || process.env.SECRET || process.env.AUTH_KEY || '',
    http_port: argv.port || process.env.PORT || 5000
}

var app = express();
var mqttClient = getMqttClient();

/**
 * Connect to the MQTT broker
 */
function getMqttClient() {

    //  Set authentication information for MQTT broker
    const mqttOptions = { 
        username: settings.mqtt.user,
        password: settings.mqtt.password
    };

    //  Set client id for MQTT broker
    if (settings.mqtt.clientId) {
        mqttOptions.clientId = settings.mqtt.clientId
    }

    //  Return connected MQTT client
    return mqtt.connect(settings.mqtt.url, mqttOptions);
}

/**
 * Simple request logger
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function logRequest(req, res, next) {
    const reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var message = `Request [${req.originalUrl}] from ${reqIp}`;

    if (settings.debug) {
        message += ` with payload [${JSON.stringify(req.body)}]`;
    } else {
        message += '.';
    }
    console.log(message);

    next();
}

/**
 * Authorize HTTP request if matching secret
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function authorizeRequest(req, res, next) {
    if (settings.secret && req.body['key'] != settings.secret) {
        console.error('Access denied.');
        res.sendStatus(401);
    }
    else {
        next();
    }
}

/**
 * Check request for single file upload
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function checkSingleFileUpload(req, res, next) {
    if (req.query.single) {
        try {
            //  Upload file
            var upload = multer().single(req.query.single);
            upload(req, res, next);
        } catch (error) {
            //  Failed to upload file
            console.error(`Failed to upload file: ${error}`);
            res.status(500).send('Failed to upload file');
        }
    }
    else {
        next();
    }
}

/**
 * Generate MQTT message from request path
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function checkMessagePathQueryParameter(req, res, next) {
    if (req.query.path) {
        req.body.message = req.body[req.query.path];
    }
    next();
}

/**
 * Set MQTT topic from request
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function checkTopicQueryParameter(req, res, next) {

    if (req.query.topic) {
        req.body.topic = req.query.topic;
    }

    next();
}

/**
 * Ensure MQTT topic is set.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function ensureTopicSpecified(req, res, next) {
    if (!req.body.topic) {
        console.error('Topic not specified');
        res.status(500).send('Topic not specified');
    }
    else {
        next();
    }
}

//  Setup Express
app.set('port', settings.http_port);
app.use(bodyParser.json());

/**
 * Send keep-alive message to MQTT broker
 */
app.get('/keep_alive/', logRequest, function (req, res) {
    try {
        mqttClient.publish(settings.keepalive.topic, settings.keepalive.message);
        res.sendStatus(200);
    } catch (error) {
        //  Failed to publish keep alive message
        console.error(`Failed to publish keep alive message: ${error}`);
        res.status(500).send('Failed to publish keep alive message');
    }
});

/**
 * Publish a HTPP post request to the MQTT broker
 */
app.post('/post/', logRequest, authorizeRequest, checkSingleFileUpload, checkMessagePathQueryParameter, checkTopicQueryParameter, ensureTopicSpecified, function (req, res) {
    try {
        mqttClient.publish(req.body['topic'], req.body['message']);
        res.sendStatus(200);
    } catch (error) {
        //  Failed to publish message to topic
        console.error(`Failed to publish message [${req.body['message']}] to topic [${req.body['topic']}]: ${error}`);
        res.status(500).send('Failed to publish message to topic');
    }
});

/**
 * Subscripte to a MQTT topic to stay API-compatible to https://github.com/petkov/http_to_mqtt
 */
app.get('/subscribe/', logRequest, authorizeRequest, function (req, res) {

    var topic = req.query.topic;

    if (!topic) {
        console.error('Topic not specified');
        res.status(500).send('topic not specified');
    }
    else {
        //  Create a new mqttClient instance for the new subscription to avoid adding listeners to the main mqttClient.
        var mqttClient = getMqttClient();

        mqttClient.on('connect', function () {
            mqttClient.subscribe(topic);
        });

        mqttClient.on('message', function (t, m) {
            if (t === topic) {
                res.write(m);
            }
        });

        req.on("close", function () {
            mqttClient.end();
        });

        req.on("end", function () {
            mqttClient.end();
        });
    }
});

//  Start listening
try {
    app.listen(app.get('port'), function () {
        console.log('http_to_mqtt is running on port', app.get('port'));
    });
} catch (error) {
    //  Failed to start Express listener
    console.error(`Failed to start http_to_mqtt bridge: ${error}`);
}
