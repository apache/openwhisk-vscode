"use strict";

var vscode = require('vscode');
var openwhisk = require('openwhisk');

let util = require("./util.js");
let wskLst = require("./wsk.list.js");
let wskHelp = require("./wsk.help.js");
let wskAction = require("./wsk.action.js");
let wskPackage = require("./wsk.package.js");
let wskTrigger = require("./wsk.trigger.js");
let wskRule = require("./wsk.rule.js");

var ow;
let log = vscode.window.createOutputChannel("OpenWhisk");


function init(context) {
    
    var apiKey = "";
    var namespace = ""
    
    ow = openwhisk({api: 'https://openwhisk.ng.bluemix.net/api/v1/', api_key: apiKey, namespace: namespace});
    
    util.setLog(log);
    
	wskLst.register(ow, context, log);
	wskHelp.register(ow, context, log);
	wskAction.register(ow, context, log);
	wskPackage.register(ow, context, log);
	wskTrigger.register(ow, context, log);
	wskRule.register(ow, context, log);
    
    //todo: whisk dashboard/cli/link to bluemix
    //todo: configuration/env variables
}

module.exports = {
  init: init,
  ow: ow
};