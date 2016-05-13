"use strict";

var vscode = require('vscode');
let log;

function pad(input, length) {
	if (input == undefined) {
		input = "";
	}
	while (input.length < length) {
		input += " ";
	}
	return input;
}

function appendHeading(name) {
	log.appendLine("\n"+name+"\n---------------------------------------------------------------------------------");
}

function appendEntry(entry, qualified) {
		
	var qualifiedName = formatQualifiedName(entry, qualified);
    var suffix = ""
	
	if ( entry.hasOwnProperty("binding") && entry.binding ) {
		suffix = " binding";
	}
    
	log.appendLine( pad(qualifiedName, 66) + (entry.publish ? "public":"private") + suffix);	
}

function formatQualifiedName(entry, qualified) {
    if (qualified == undefined) {
        qualified = true;
    }
    
    var qualifiedName = (qualified ? (entry.namespace + "/"):"") + entry.name;
	return qualifiedName;
}

function setLog(_log) {
    log = _log;
}

module.exports = {
    pad:pad,
    appendHeading:appendHeading,
    appendEntry:appendEntry,
    formatQualifiedName:formatQualifiedName,
    setLog:setLog
}