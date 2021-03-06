'use strict';

const path = require('path');
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall');
const fse = require('fs-extra');
const { isObject } = require('@fishbone-cli/utils');
const formatPath = require('@fishbone-cli/format-path');
const { getDefaultRegistry, getNpmLatestVersion } = require('@fishbone-cli/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package 类 options 参数不能为空！');
    }
    if (!isObject(options)) {
      throw new Error('Package 类 options 必须为对象！');
    }
    // console.log('package constructor exec');
    // package 路径
    this.targetPath = options.targetPath;
    // package 缓存路径
    this.storeDir = options.storeDir;
    // package name
    this.packageName = options.packageName;
    // package Version
    this.packageVersion = options.packageVersion; 
    // package 缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }
  
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirsSync(this.storeDir);
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
    // console.log(this.packageVersion);
  }
  
  //_@imooc-cli_init@1.1.3@@imooc-cli 
  // @imooc-cli_init 1.1.2
  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }
  
  getSpecificCacheFilePath(version) {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`);
  }

  // 判断当前 Package 是否存在
  async exist() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  // 安装 Package
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      pkgs: [
        { name: this.packageName, version: this.packageVersion },
      ],
      registry: getDefaultRegistry(),
    });
  }

  // 更新 Package
  async update() {
    await this.prepare();
    // 1. 获取最新 npm 模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 2. 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 3. 如果不存在，则直接安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        pkgs: [
          { name: this.packageName, version: latestPackageVersion },
        ],
        registry: getDefaultRegistry(),
      });
      this.packageVersion = latestPackageVersion;
    }
  }

  // 获取入口文件
  getRootFilePath() {
    const _getRootFile = function (targetPath) {
      // 1. 获取 package.json 所在的路径
      const dir = pkgDir(targetPath);
      if (dir) {
        // 2. 读取 package.json
        // 3. 寻找 main/lib
        const pkgjsonFile = require(path.resolve(dir, 'package.json'));
        if (pkgjsonFile && pkgjsonFile.main) {
          // 4. 处理路径的兼容 macOS Win32
          return formatPath(path.resolve(dir, pkgjsonFile.main));
        }
      }
      return null;
    }
    if (this.storeDir) {
     return _getRootFile(this.cacheFilePath);
    } else {
     return _getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
