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
let wskUtil = require("./wsk.util.js");
let wskProperty = require("./wsk.property.js");

var ow;
let log = vscode.window.createOutputChannel("OpenWhisk");


function init(context) {

	//api key and namespace will be set when config values are loaded
	ow = openwhisk({api: 'https://openwhisk.ng.bluemix.net/api/v1/', api_key: '', namespace: ''});

	util.setLog(log);

	wskProperty.register(ow, context, log);
	wskLst.register(ow, context, log, wskProperty);
	wskHelp.register(ow, context, log, wskProperty);
	wskAction.register(ow, context, log, wskProperty);
	wskPackage.register(ow, context, log, wskProperty);
	wskTrigger.register(ow, context, log, wskProperty);
	wskRule.register(ow, context, log, wskProperty);
	wskUtil.register(ow, context, log, wskProperty);
}

module.exports = {
	init: init,
	ow: ow
};