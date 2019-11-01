"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const inquirer_1 = __importDefault(require("inquirer"));
const utils_1 = require("../../utils");
const logger_1 = require("../../logger");
const env_1 = require("../../env");
const error_1 = require("../../error");
const platformMap = {
    'WECHAT-OPEN': '微信开放平台',
    'WECHAT-PUBLIC': '微信公众平台'
};
commander_1.default
    .command('env:login:list [envId]')
    .description('列出环境登录配置')
    .action(function (envId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { configFile } = options.parent;
        const assignEnvId = yield utils_1.getEnvId(envId, configFile);
        const configList = yield env_1.getLoginConfigList({
            envId: assignEnvId
        });
        const head = ['平台', '平台 Id', '创建时间', '状态'];
        const tableData = configList.map(item => [
            platformMap[item.Platform]
                ? platformMap[item.Platform]
                : item.Platform,
            item.PlatformId,
            item.CreateTime,
            item.Status === 'ENABLE' ? '启用' : '禁用'
        ]);
        utils_1.printCliTable(head, tableData);
    });
});
commander_1.default
    .command('env:login:create [envId]')
    .description('创建环境登录配置')
    .action(function (envId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { configFile } = options.parent;
        const assignEnvId = yield utils_1.getEnvId(envId, configFile);
        const { platform, status, appId, appSecret } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'platform',
                choices: [
                    {
                        name: '微信公众平台',
                        value: 'WECHAT-PUBLIC'
                    },
                    {
                        name: '微信开放平台',
                        value: 'WECHAT-OPEN'
                    }
                ],
                message: '请选择登录方式：',
                default: 'WECHAT-PUBLIC'
            },
            {
                type: 'list',
                name: 'status',
                choices: [
                    {
                        name: '启用',
                        value: 'ENABLE'
                    },
                    {
                        name: '禁用',
                        value: 'DISABLE'
                    }
                ],
                message: '请选择登录方式状态：',
                default: 'ENABLE'
            },
            {
                type: 'input',
                name: 'appId',
                message: '请输入 AppId：'
            },
            {
                type: 'input',
                name: 'appSecret',
                message: '请输入 AppSecret：'
            }
        ]);
        if (!appId || !appSecret) {
            throw new error_1.CloudBaseError('appId 和 appSecret 不能为空！');
        }
        yield env_1.createLoginConfig({
            envId: assignEnvId,
            appId,
            appSecret,
            platform,
            status
        });
        logger_1.successLog('创建登录方式成功！');
    });
});
commander_1.default
    .command('env:login:update [envId]')
    .description('更新环境登录方式配置')
    .action(function (envId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { configFile } = options.parent;
        const assignEnvId = yield utils_1.getEnvId(envId, configFile);
        const configList = yield env_1.getLoginConfigList({
            envId: assignEnvId
        });
        const configChoices = configList.map(item => ({
            name: `${platformMap[item.Platform]}：${item.PlatformId} [${item.Status === 'ENABLE' ? '启用' : '禁用'}]`,
            value: item.Id,
            short: `${platformMap[item.Platform]}：${item.PlatformId}`
        }));
        const { configId, status, appId, appSecret } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'configId',
                choices: configChoices,
                message: '请选择需要配置的条目：'
            },
            {
                type: 'list',
                name: 'status',
                choices: [
                    {
                        name: '启用',
                        value: 'ENABLE'
                    },
                    {
                        name: '禁用',
                        value: 'DISABLE'
                    }
                ],
                message: '请选择登录方式状态：',
                default: '启用'
            },
            {
                type: 'input',
                name: 'appId',
                message: '请输入 AppId（配置状态时可不填）：'
            },
            {
                type: 'input',
                name: 'appSecret',
                message: '请输入 AppSecret（配置状态时可不填）：'
            }
        ]);
        yield env_1.updateLoginConfig({
            envId: assignEnvId,
            configId,
            appId,
            appSecret,
            status
        });
        logger_1.successLog('更新登录方式成功！');
    });
});