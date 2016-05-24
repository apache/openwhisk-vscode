'use strict';

var vscode = require('vscode');
let log;

function pad(input, length) {
	if (input == undefined) {
		input = '';
	}
	while (input.length < length) {
		input += ' ';
	}
	return input;
}

function appendHeading(name) {
	log.appendLine('\n'+name+'\n---------------------------------------------------------------------------------');
}

function appendEntry(entry, qualified) {

	var qualifiedName = formatQualifiedName(entry, qualified);
	var suffix = ''

	if ( entry.hasOwnProperty('binding') && entry.binding ) {
		suffix = ' binding';
	}

	log.appendLine( pad(qualifiedName, 66) + (entry.publish ? 'public':'private') + suffix);
}

function formatQualifiedName(entry, qualified) {
	if (qualified == undefined) {
		qualified = true;
	}

	var qualifiedName = (qualified ? (entry.namespace + '/'):'') + entry.name;
	return qualifiedName;
}

function setLog(_log) {
	log = _log;
}

function printOpenWhiskError(error) {
	log.appendLine('\nERROR: '+error.toString());
	if (error.error.activationId) {
		log.appendLine('activationId: '+error.error.activationId);
	}
	if (error.error.logs && (error.error.logs.length > 0)) {
		for (var x=0; x<error.error.logs.length; x++) {
			log.appendLine(error.error.logs[x]);
		}
	}
}

module.exports = {
	pad:pad,
	appendHeading:appendHeading,
	appendEntry:appendEntry,
	formatQualifiedName:formatQualifiedName,
	setLog:setLog,
	printOpenWhiskError: printOpenWhiskError
}