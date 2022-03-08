'use strict';

module.exports = core;
const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const log = require('@fishbone-cli/log');
// const init = require('@fishbone-cli/init');
const exec = require('@fishbone-cli/exec');
const userHome = require('userhome');
const pathExists = require('path-exists').sync;
const commander = require('commander');
const constant = require('./const');
const pkg = require('../package.json');
const dotEnv = require("dotenv");
const program = new commander.Command();

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
    if (program.opts().debug) {
      console.log(e);
    }
  }
}

async function prepare() {
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启 debug 模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试路径', '');

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);
  
  // 开启 debug 模式
  program.on('option:debug', function() {
    if (this.opts().debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 指定 targetPath
  program.on('option:targetPath', function() {
    process.env.CLI_TARGET_PATH = this.opts().targetPath;
  });

  // 开启未知命令监听
  program.on('command:*', function(obj) {
    const availabelCommands = program.commands.map(cmd => cmd.name);
    console.log(colors.red(`未知命令：${obj[0]}`));
    if (availabelCommands.length > 0 ) {
      console.log(colors.red(`可用命令${availabelCommands.join(',')}`));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

async function checkGlobalUpdate() {
  // 1. 获取当前版本号和包名
  // 2. 调用 npm api 获取所有版本号
  // 3. 提取所有版本号，对比哪些版本号大于当前版本号
  // 4. 获取最新版本号提示用户更新到改版本
  const {version, name} = pkg;
  const currentVersion = version;
  const npmName = name;
  const {getNpmSemverVersion} = require('@fishbone-cli/get-npm-info');
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn('更新提示', colors.yellow(`
    请手动更新${npmName}，
    当前版本号${currentVersion}，
    最新版本${lastVersion}
    更新命令：npm install -g ${npmName}`));
  }
}

function checkEnv() {
  const dotEnv = require('dotenv');
  const dotEnvPath = path.resolve(userHome(), '.env');
  if (pathExists(dotEnvPath)) {
    dotEnv.config({
      path: dotEnvPath
    });
  }
  createDefaultConfig()
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome()
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome(), process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome(), constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkUserHome() {
  const user_home = userHome();
  if (!user_home || !pathExists(user_home)) {
    throw new Error(colors.red('当前登陆用户主目录不存在！'));
  }
}

function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
}

function checkPkgVersion() {
  log.notice('cli', pkg.version);
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_VERSION;
  if (!semver.gt(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`fishbone-cli 需要 Node.js 最低版本为${lowest_version}`))
  }
}
