#!/usr/bin/env node
const yargs = require('yargs');
const commands = require('./commands');

const argv =
  yargs
  .scriptName('aagent')
  .options({
    'testnet': {
      alias: 't',
      default: false,
      describe: 'testnet',
      type: 'boolean'
    }
  })
  .command('init [folder]', 'init project', yargs => {
    yargs.positional('folder', {
      description: 'folder for project'
    });
  }, argv => {
    commands.init(argv.folder);
  })
  .command('validate [file]', 'aa file validation', yargs => {
    yargs.positional('file', {
      description: 'path to oscript file'
    })
  }, argv => {
    commands.validate(argv.file);
  })
  .command('deploy [file]', 'Open wallet for deploy', yargs => {
    yargs.positional('file', {
      description: 'path to oscript file'
    })
  }, async argv => {
    commands.deploy(argv.file, argv.testnet);
  })
  .showHelpOnFail(true)
  .demandCommand(1, '')
  .recommendCommands()
  .strict()
  .help('help').argv;
