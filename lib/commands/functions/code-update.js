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
const error_1 = require("../../error");
const function_1 = require("../../function");
const env_1 = require("../../env");
const utils_1 = require("../../utils");
function codeUpdate(ctx, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, envId, config, functions } = ctx;
        const envInfo = yield env_1.getEnvInfo(envId);
        if (envInfo.Source === 'miniapp') {
            throw new error_1.CloudBaseError('无法更新小程序云函数代码！');
        }
        const { codeSecret } = options;
        if (!name) {
            throw new error_1.CloudBaseError('请指定函数名称！');
        }
        const func = functions.find(item => item.name === name);
        if (!func || !func.name) {
            throw new error_1.CloudBaseError(`函数 ${name} 配置不存在`);
        }
        const loading = utils_1.loadingFactory();
        loading.start(`[${func.name}] 函数代码更新中...`);
        try {
            yield function_1.updateFunctionCode({
                func,
                envId,
                codeSecret,
                functionRootPath: path_1.default.join(process.cwd(), config.functionRoot)
            });
            loading.succeed(`[${func.name}] 函数代码更新成功！`);
        }
        catch (e) {
            loading.stop();
            throw e;
        }
    });
}
exports.codeUpdate = codeUpdate;