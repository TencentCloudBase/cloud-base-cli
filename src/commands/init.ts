import fs from 'fs'
import tar from 'tar-fs'
import path from 'path'
import fse from 'fs-extra'
import inquirer from 'inquirer'
import program from 'commander'
import { CloudBaseError } from '../error'
import { successLog } from '../logger'
import { listEnvs } from '../env'
import { fetch, fetchStream, loading } from '../utils'

// 云函数
const listUrl =
    'https://service-lqbcazn1-1252710547.ap-shanghai.apigateway.myqcloud.com/release/'

async function extractTemplate(projectPath: string, templatePath: string) {
    // 文件下载链接
    const url = `https://6261-base-830cab-1252710547.tcb.qcloud.la/cloudbase-examples/${templatePath}.tar.gz`

    return fetchStream(url).then(async res => {
        if (res.status !== 200) {
            throw new CloudBaseError('未找到文件')
        }

        // 解压缩文件
        await new Promise((resolve, reject) => {
            const extractor = tar.extract(projectPath)
            res.body.on('error', reject)
            extractor.on('error', reject)
            extractor.on('finish', resolve)
            res.body.pipe(extractor)
        })
    })
}

async function copyServerTemplate(projectPath: string) {
    // 模板目录
    const templatePath = path.resolve(
        __dirname,
        '../../templates',
        'server/node'
    )
    fse.copySync(templatePath, projectPath)
}

program
    .command('init')
    .option('--server', '创建 node 项目')
    .description('创建并初始化一个新的项目')
    .action(async function(cmd) {
        let cancelLoading = loading('拉取环境列表')
        let envData = []
        try {
            envData = (await listEnvs()) || []
        } catch (e) {
            cancelLoading()
            throw e
        }
        cancelLoading()
        const envs: string[] = envData
            .map(item => `${item.EnvId}:${item.PackageName}`)
            .sort()

        if (!envs.length) {
            throw new CloudBaseError(
                '没有可以使用的环境，请先开通云开发服务并创建环境（https://console.cloud.tencent.com/tcb）'
            )
        }

        const { env } = await inquirer.prompt({
            type: 'list',
            name: 'env',
            message: '选择关联环境',
            choices: envs
        })

        const { projectName } = await inquirer.prompt({
            type: 'input',
            name: 'projectName',
            message: '请输入项目名称',
            default: 'cloudbase-demo'
        })

        const { lang } = await inquirer.prompt({
            type: 'list',
            name: 'lang',
            message: '选择模板语言',
            choices: ['PHP', 'Java', 'Node']
        })

        cancelLoading = loading('拉取云开发模板列表中')

        const templateList = await fetch(listUrl)

        cancelLoading()

        const templates = templateList.filter(item => item.lang === lang)

        const { selectTemplateName } = await inquirer.prompt({
            type: 'list',
            name: 'selectTemplateName',
            message: '选择云开发模板',
            choices: templates.map(item => item.name)
        })

        const selectedTemplate = templates.find(
            item => item.name === selectTemplateName
        )

        // 项目目录
        const projectPath = path.join(process.cwd(), projectName)

        if (fs.existsSync(projectPath)) {
            const { cover } = await inquirer.prompt({
                type: 'confirm',
                name: 'cover',
                message: `已存在同名文件夹：${projectName}，是否覆盖？`,
                default: false
            })
            // 不覆盖，操作终止
            if (!cover) {
                throw new CloudBaseError('操作终止！')
            } else {
                // 覆盖操作不会删除不冲突的文件夹或文件
                // 删除原有文件夹，防止生成的项目包含用户原有文件
                fse.removeSync(projectPath)
            }
        }

        cancelLoading = loading('下载文件中')

        if (cmd.server) {
            await copyServerTemplate(projectPath)
            // 重命名 _gitignore 文件
            fs.renameSync(
                path.join(projectPath, '_gitignore'),
                path.join(projectPath, '.gitignore')
            )
        } else {
            await extractTemplate(projectPath, selectedTemplate.path)
        }

        cancelLoading()

        // 写入 envId
        const configFileJSONPath = path.join(projectPath, 'cloudbaserc.json')
        const configFileJSPath = path.join(projectPath, 'cloudbaserc.js')
        const configFilePath = [configFileJSPath, configFileJSONPath].find(
            item => fs.existsSync(item)
        )
        // 配置文件未找到
        if (!configFilePath) {
            successLog(`创建项目 ${projectName} 成功`)
            return
        }

        const configContent = fs.readFileSync(configFilePath).toString()

        fs.writeFileSync(
            configFilePath,
            configContent.replace('{{envId}}', env.split(':')[0])
        )

        successLog(`创建项目 ${projectName} 成功！\n`)

        console.log('🎉 欢迎贡献你的模板 👉 https://github.com/TencentCloudBase/cloudbase-examples')
    })
