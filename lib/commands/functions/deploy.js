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
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const utils_1 = require("../../utils");
const error_1 = require("../../error");
const function_1 = require("../../function");
const env_1 = require("../../env");
function deploy(ctx, commandOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, envId, config, functions } = ctx;
        const envInfo = yield env_1.getEnvInfo(envId);
        if (envInfo.Source === 'miniapp') {
            throw new error_1.CloudBaseError('无法部署小程序云函数！');
        }
        const { force, codeSecret } = commandOptions;
        let isBatchCreating = false;
        if (!name) {
            const { isBatch } = yield inquirer_1.default.prompt({
                type: 'confirm',
                name: 'isBatch',
                message: '没有指定部署函数，是否部署配置文件中的全部函数？',
                default: false
            });
            isBatchCreating = isBatch;
            if (!isBatchCreating) {
                throw new error_1.CloudBaseError('请指定部署函数名称！');
            }
        }
        if (isBatchCreating) {
            return yield function_1.batchCreateFunctions({
                envId,
                force,
                functions,
                log: true,
                codeSecret,
                functionRootPath: path_1.default.join(process.cwd(), config.functionRoot)
            });
        }
        let newFunction;
        if (functions && functions.length > 0) {
            newFunction = functions.find(item => item.name === name);
        }
        if (!newFunction || !newFunction.name) {
            const { useDefaultFunctionDeployOptions } = yield inquirer_1.default.prompt({
                type: 'confirm',
                name: 'useDefaultFunctionDeployOptions',
                message: '未找到函数发布配置，使用默认配置？',
                default: false
            });
            if (useDefaultFunctionDeployOptions) {
                newFunction = {
                    name,
                    config: {
                        runtime: 'Nodejs8.9',
                        installDependency: true
                    },
                    handler: 'index.main',
                    ignore: ['node_modules', 'node_modules/**/*']
                };
            }
            else {
                throw new error_1.CloudBaseError(`函数 ${name} 配置不存在`);
            }
        }
        const loading = utils_1.loadingFactory();
        loading.start('函数部署中...');
        try {
            yield function_1.createFunction({
                force,
                envId,
                func: newFunction,
                codeSecret,
                functionRootPath: path_1.default.join(process.cwd(), config.functionRoot)
            });
            loading.succeed(`[${newFunction.name}] 函数部署成功！`);
        }
        catch (e) {
            loading.stop();
            if (e.code === 'ResourceInUse.FunctionName') {
                const { force } = yield inquirer_1.default.prompt({
                    type: 'confirm',
                    name: 'force',
                    message: '存在同名云函数，是否覆盖？',
                    default: false
                });
                if (force) {
                    loading.start('函数部署中...');
                    try {
                        yield function_1.createFunction({
                            envId,
                            force: true,
                            func: newFunction,
                            codeSecret,
                            functionRootPath: path_1.default.join(process.cwd(), config.functionRoot)
                        });
                        loading.succeed(`[${newFunction.name}] 函数部署成功！`);
                    }
                    catch (e) {
                        loading.stop();
                        throw e;
                    }
                    return;
                }
            }
            throw e;
        }
    });
}
exports.deploy = deploy;