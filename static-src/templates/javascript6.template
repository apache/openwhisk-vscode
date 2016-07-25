/**
  *
  * main() will be invoked when you Run This Action.
  * 
  * @param Whisk actions accept a single parameter,
  *        which must be a JSON object.
  *
  * In this case, the params variable will look like:
  *     { "message": "xxxx" }
  *
  * @return The return value must also be JSON.
  *         It will be the output of this action.
  *         You can also return whisk.asyn(), and 
  *         later call whisk.done() for asynchronus operations
  *
  */

var request = require('request');

function main(args) {
    var url = 'https://httpbin.org/get';
    request.get(url, function(error, response, body) {
        whisk.done({response: body});
    });
    return whisk.async();
}