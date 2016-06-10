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

function appendActivation(entry, qualified) {

	var qualifiedName = formatQualifiedName(entry, qualified);
	var suffix = ''

	if ( entry.hasOwnProperty('binding') && entry.binding ) {
		suffix = ' binding';
	}

	log.appendLine( pad(entry.activationId, 45) + entry.name);
}

function formatQualifiedName(entry, qualified) {
	if (qualified == undefined) {
		qualified = true;
	}

	var qualifiedName = (qualified ? (entry.namespace + '/'):'') + entry.name;
	return qualifiedName;
}

function parseQualifiedName(name) {
	var nameString = name.toString();
	var startIndex = nameString.indexOf('/');
	var namespace = nameString.substring(0, startIndex);
	var parsedName = nameString.substring(startIndex+1);
	return {
		"name":parsedName,
		"namespace":namespace
	};
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

function parseParametersString(parameterString) {
	var params = {};

	var tokens = parameterString.split('-p ');

	for (var x=0; x<tokens.length; x++) {
		var token = tokens[x]
		var firstSpace = token.indexOf(' ');
		if (token.length >0 && firstSpace >= 0) {
			var key = token.substring(0, firstSpace).trim();
			var value = token.substring(firstSpace+1).trim();
			params[key] = value;
		}
	}

	console.log(params)

	return params;
}

module.exports = {
	pad:pad,
	appendHeading:appendHeading,
	appendEntry:appendEntry,
	formatQualifiedName:formatQualifiedName,
	setLog:setLog,
	printOpenWhiskError: printOpenWhiskError,
	parseParametersString: parseParametersString, 
	parseQualifiedName:parseQualifiedName,
	appendActivation:appendActivation
}