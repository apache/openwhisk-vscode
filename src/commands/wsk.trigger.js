'use strict';

var vscode = require('vscode');
let util = require('./util.js');

var log;
var ow;
var props;

function register(_ow, context, _log, _props) {
	ow = _ow;
	log = _log;
	props = _props;

	var defaultDisposable = vscode.commands.registerCommand('extension.wsk.trigger', defaultAction);



	context.subscriptions.push(defaultDisposable);
}


function defaultAction(params) {

	log.show(true);
	log.appendLine('\n$ wsk trigger');
	log.appendLine('available commands:');
	log.appendLine('    create              create new trigger');
	log.appendLine('    update              update an existing trigger');
	log.appendLine('    fire                fire trigger event');
	log.appendLine('    get                 get trigger');
	log.appendLine('    delete              delete trigger');
	log.appendLine('    list                list all triggers');
}

function list() {

	if (!props.validate()){
		return;
	}

	return ow.triggers.list().then(function (triggers) {
		util.appendHeading('triggers');
		for (var x=0; x<triggers.length; x ++){
				util.appendEntry(triggers[x]);
		}
	}).catch(function(error) {
		log.appendLine(error.toString())
	});
}

module.exports = {
	register: register,
	list:list
};