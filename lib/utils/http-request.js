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
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
function fetch(url, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.http_proxy) {
            config.agent = new https_proxy_agent_1.default(process.env.http_proxy);
        }
        const res = yield node_fetch_1.default(url, config);
        return res.json();
    });
}
exports.fetch = fetch;
function fetchStream(url, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.http_proxy) {
            config.agent = new https_proxy_agent_1.default(process.env.http_proxy);
        }
        return node_fetch_1.default(url, config);
    });
}
exports.fetchStream = fetchStream;