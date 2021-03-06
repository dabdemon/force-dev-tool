"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var CliUtils = require('../cli/utils');
var Diff = require('../diff');
var MetadataContainer = require('../metadata-container');
var MetadataComponent = require('../metadata-component');
var MetadataFile = require('../metadata-file');
var Manifest = require('../manifest');
var path = require('path');
var fs = require('fs-extra');
var vinylFs = require('vinyl-fs');
var mergeStream = require('merge-stream');

var doc = "Usage:\n" +
	"	force-dev-tool changeset create <name> [<metadataFileOrComponentNames>...] [options]\n" +
	"\n" +
	"Options:\n" +
	"	--apiVersion=<apiVersion>    API version. Defaulted to API version of project.\n" +
	"	-d=<directory>               Path to target directory.\n" +
	"	--dry-run                    Only print what would be done.\n" +
	"	--ignore-whitespace          Whether to include whitespace when comparing metadata for inclusion/removal.\n" +
	"	--destructive                Creates a destructive changeset.\n" +
	"	-f --force                   Overwrites the target directory if it exists already.";

var SubCommand = module.exports = function(project) {
	var self = this;
	Command.call(self, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	self.name = self.opts['<name>'] || 'foo';
	var targetBaseDirectory = self.opts['-d'] ? path.resolve(self.opts['-d']) : path.join(self.project.storage.getConfigPath(), 'deployments');
	self.currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(self.project.storage.getPackageXmlPath()));
	var apiVersion = self.opts['--apiVersion'] || self.currentPackageXml.apiVersion || config.get('defaultApiVersion');
	// check whether deployment path exists already
	var deploymentPath = path.resolve(path.join(targetBaseDirectory, self.name));
	var force = self.opts['--force'] || false;
	if (fs.pathExistsSync(deploymentPath)) {
		if (force) {
			fs.removeSync(deploymentPath);
		} else {
			return callback("Deployment directory already exists: " + deploymentPath);
		}
	}

	var metadataContainer = new MetadataContainer();
	self.opts['<metadataFileOrComponentNames>'].forEach(function(componentOrFileName) {
		var component;
		if (fs.pathExistsSync(componentOrFileName)) {
			component = new MetadataFile({
				path: path.relative(path.join(process.cwd(), 'src'), componentOrFileName)
			}).getComponent();
		} else {
			component = new MetadataComponent(componentOrFileName);
		}
		if (component) {
			if (self.opts['--destructive']) {
				metadataContainer.destructiveManifest.add(component);
			} else {
				metadataContainer.manifest.add(component);
			}
		} else {
			console.error('could not determine component for: `' + componentOrFileName + '`');
		}
	});

	var stdin = proc.stdin
		.pipe(Diff.stream({
			ignoreWhitespace: !!self.opts['--ignore-whitespace']
		}))
		.pipe(MetadataContainer.diffStream())

	mergeStream(stdin, metadataContainer.getStream())
		.pipe(MetadataContainer.completeMetadataStream())
		.pipe(MetadataContainer.outputStream({
			apiVersion: apiVersion
		}))
		.pipe(vinylFs.dest(deploymentPath))
		.on('end', function() {
			return callback(null, "exported metadata container to " + path.relative(proc.cwd, deploymentPath));
		});

};
