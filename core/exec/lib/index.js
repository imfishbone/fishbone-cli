'use strict';
const path = require('path');
const Package = require('@fishbone-cli/package');
const log = require('@fishbone-cli/log');

const SETTINGS = {
  // init: '@fishbone-cli/init'
  init: '@imooc-cli/init'
}

const CACHE_DIR = 'dependencies';

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  let storeDir = '';
  let pkg;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);
  const cmdObj = arguments[arguments.length -1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = targetPath + '/node_modules';
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
      storeDir
    });
    if (await pkg.exist()) {
      // 更新
      // console.log('更新package');
      await pkg.update();
    } else {
      // 安装
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
      storeDir
    });
  }
  // console.log('pkg.exist', await pkg.exist());
  const rootFile = pkg.getRootFilePath();
  console.log(rootFile, 'rootFile');
  if (rootFile) {
    require(rootFile).apply(null, arguments);
  }
}

module.exports = exec;
