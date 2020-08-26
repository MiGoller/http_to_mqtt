# A simple HTTP to MQTT bridge

The idea of creating a simple HTTP to MQTT bridge stroke me when I was trying to integrate IFTTT with my smart-home infrastructure. Right now there is no MQTT service available in [IFTTT](https://ifttt.com/about) and I still have to use [Maker Webhooks](https://ifttt.com/maker_webhooks) to fire HTTP-request against some APIs.

My project is based on a fork of [petkov's HTTP to MQTT bridge](https://github.com/petkov/http_to_mqtt) with a richer set of configuration strategies and error handling.

## Usage

You can run the app on any Node JS capable server or hosting provider.

Just clone the repository and install the dependencies
```bash
$ git clone https://github.com/MiGoller/http_to_mqtt.git
$ cd http_to_mqtt
$ npm install
```

Now run the app ...
```bash
$ node ./index.js [<args>]
```

... and the app will confirm it's started.
```
http_to_mqtt is running on port 5000
```

By default the `http_to_mqtt` will listen on port 5000 and will try to connect to a MQTT broker on `localhost` listening on port 1883. 

### How to publish to a topic

If you want to publish a message to a topic you'll just have to post a request with a JSON-body to your instance.

```bash
$ curl -H "Content-Type: application/json" "http://localhost:5000/post"  -d '{"topic" : "MyTopic", "message" : "Hello World" }'
```
`http_to_mqtt` will respond with `ok`, if the bridge was able to publish the message.

```
OK
```

### Hot to subscribe to a topic

Lets say you want to subscribe to a topic `MySubscriptionTopic`.

```bash
$ curl -ivs --raw http://localhost:5000/subscribe?topic=MySubscriptionTopic
```

`curl` with options `-ivs` and `--raw` will show incoming messages as they are received.

Look for further details on https://github.com/petkov/http_to_mqtt#subscribe-to-a-topic .

## Configuration settings

`http_to_mqtt` let you define options for running the bridge and your MQTT broker.

### MQTT settings

| Setting 	| Description 	                | Default 	            | Example  	|
|---------	|-------------	                |---------	            |---	|
| URL       | The URL of your MQTT broker.  | `mqtt://localhost`    | `mqtt://broker.hivemq.com:1883`  |
| Username 	| Your MQTT username            | not set / empty       | `MySpecialUsername`  	|
| Password 	| Your MQTT password            | not set / empty       | `MyPassword123`  	|
| Client-ID	| Your MQTT client's ID         | not set / empty       | `openHab`  	|

### Bridge settings

| Setting 	            | Description 	                | Default 	            | Example  	|
|---------	            |-------------	                |---------	            |---	|
| Port                  | Local TCP listening port.     | `5000`                | `8082`  |
| Secret 	            | The secret key (auth key).    | not set / empty       | `s-bEwbqE8*_j3@9fvfGi`  	|
| Keep-alive topic      | MQTT keep-alive topic         | `keep_alive`          |   	|
| Keep-alive message    | MQTT keep-alive message       | `keep_alive`          |   	|
| Debug-mode 	        | Enable / disable debugging    | `false`               | `true` or `false`	|

## Configuration strategies

You have the choice on how to apply settings to your `http_to_mqtt` instance. `http_to_mqtt` will check for each configuration setting in the following order.
1. JSON file
2. Command line arguments
3. Environment variables

### JSON settings-file

`http_to_mqtt` supports configuration by a settings-file. Just pass a JSON settings-file to the command line.

```
node ./index.js --settings <PathToJsonFile>
```

You can set any option by the command line argument's names.

### Command line arguments

`http_to_mqtt` will pay attention on the following command line arguments passed to `index.js`.

| Argument 	                | Description 	                | Default 	            | Example  	|
|---------	                |-------------	                |---------	            |---	|
| `mqtt_url`                | The URL of your MQTT broker.  | `mqtt://localhost`    | `--mqtt_url mqtt://broker.hivemq.com:1883`  |
| `mqtt_user` 	            | Your MQTT username            | not set / empty       | `--mqtt_user MySpecialUsername`  	|
| `mqtt_pass` 	            | Your MQTT password            | not set / empty       | `--mqtt_pass MyPassword123`  	|
| `mqtt_clientid`           | Your MQTT client's ID         | not set / empty       | `--mqtt_clientid openHab`  	|
| `port`                    | Local TCP listening port.     | `5000`                | `--port 8082`  |
| `secret`                  | The secret key (auth key).    | not set / empty       | `--secret 's-bEwbqE8*_j3@9fvfGi'`  	|
| `keep_alive_topic`        | MQTT keep-alive topic         | `keep_alive`          | `--keep_alive_topic MyTopic`   	|
| `keep_alive_message`      | MQTT keep-alive message       | `keep_alive`          | `--keep_alive_message MyTopic`  	|
| `debug` 	                | Enable / disable debugging    | `false`               | `--debug true` or `--debug false`	|

### Environment variables

`http_to_mqtt` supports environment variables for setting up the bridge. Just set the the following environment variables accordingly. This is a common method for instances running on container platforms like Docker.

| Variable 	                | Description 	                | Default 	            | Example  	|
|---------	                |-------------	                |---------	            |---	|
| `MQTT_URL`, `MQTT_HOST`   | The URL of your MQTT broker.  | `mqtt://localhost`    | `mqtt://broker.hivemq.com:1883`  |
| `MQTT_USER` 	            | Your MQTT username            | not set / empty       | `MySpecialUsername`  	|
| `MQTT_PASS` 	            | Your MQTT password            | not set / empty       | `MyPassword123`  	|
| `MQTT_CLIENT_ID`          | Your MQTT client's ID         | not set / empty       | `openHab`  	|
| `PORT`                    | Local TCP listening port.     | `5000`                | `8082`  |
| `SECRET`, `AUTH_KEY`      | The secret key (auth key).    | not set / empty       | `s-bEwbqE8*_j3@9fvfGi`  	|
| `KEEP_ALIVE_TOPIC`        | MQTT keep-alive topic         | `keep_alive`          |   	|
| `KEEP_ALIVE_MESSAGE`      | MQTT keep-alive message       | `keep_alive`          |   	|
| `DEBUG_MODE` 	            | Enable / disable debugging    | `false`               | `true` or `false`	|

## Thanks

Special thanks to [petkov's HTTP to MQTT bridge](https://github.com/petkov/http_to_mqtt). 
