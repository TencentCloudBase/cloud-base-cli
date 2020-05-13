import fs from 'fs'
import chalk from 'chalk'
import path from 'path'
import tar from 'tar-fs'
import fse from 'fs-extra'
import { prompt } from 'enquirer'
import { searchConfig } from '@cloudbase/toolbox'

import { Command, ICommand } from '../common'
import { listEnvs } from '../../env'
import { CloudBaseError } from '../../error'
import { InjectParams, ArgsOptions, Log, Logger } from '../../decorators'
import { fetch, fetchStream, loadingFactory, checkFullAccess } from '../../utils'

// 云函数
const listUrl = 'https://cli.service.tcloudbase.com/list'

@ICommand()
export class InitCommand extends Command {
    get options() {
        return {
            cmd: 'init',
            options: [
                {
                    flags: '--template <template>',
                    desc: '指定项目模板名称'
                },
                {
                    flags: '--project <project>',
                    desc: '指定项目名称'
                },
                {
                    flags: '--server',
                    desc: '创建派主机 Node 项目'
                }
            ],
            desc: '创建并初始化一个新的云开发项目',
            requiredEnvId: false
        }
    }

    @InjectParams()
    async execute(@ArgsOptions() options, @Log() logger?: Logger) {
        const loading = loadingFactory()
        loading.start('拉取环境列表中')
        let envData = []
        try {
            envData = (await listEnvs()) || []
        } catch (e) {
            loading.stop()
            throw e
        }
        loading.stop()

        const envs: { name: string; value: string }[] = envData
            .filter((item) => item.Status === 'NORMAL')
            .map((item) => ({
                name: `${item.Alias} - [${item.EnvId}:${item.PackageName || '空'}]`,
                value: item.EnvId
            }))
            .sort()

        if (!envs.length) {
            throw new CloudBaseError(
                '没有可以使用的环境，请使用 cloudbase env:create $name 命令创建免费环境！'
            )
        }

        const { env } = await prompt({
            type: 'select',
            name: 'env',
            message: '选择关联环境',
            choices: envs,
            result(choice) {
                return this.map(choice)[choice]
            }
        })

        // 确定项目名称
        let projectName
        if (options.project) {
            projectName = options.project
        } else {
            const { projectName: promptProjectName } = await prompt({
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                initial: 'cloudbase-demo'
            })

            projectName = promptProjectName
        }

        // 拉取模板
        loading.start('拉取云开发模板列表中')
        const templates = await fetch(listUrl)
        loading.stop()

        let templateName

        // 确定模板名称
        if (options.template) {
            templateName = options.template
        } else {
            let { selectTemplateName } = await prompt({
                type: 'select',
                name: 'selectTemplateName',
                message: '选择云开发模板',
                choices: templates.map((item) => item.name)
            })
            templateName = selectTemplateName
        }

        const selectedTemplate = templates.find((item) => item.name === templateName)

        if (!selectedTemplate) {
            logger.info(`模板 \`${templateName}\` 不存在`)
            return
        }

        // 项目目录
        const projectPath = path.join(process.cwd(), projectName)

        if (checkFullAccess(projectPath)) {
            const { cover } = await prompt({
                type: 'confirm',
                name: 'cover',
                message: `已存在同名文件夹：${projectName}，是否覆盖？`,
                initial: false
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

        loading.start('下载文件中')

        if (options.server) {
            await this.copyServerTemplate(projectPath)
            // 重命名 _gitignore 文件
            fs.renameSync(
                path.join(projectPath, '_gitignore'),
                path.join(projectPath, '.gitignore')
            )
        } else {
            await this.extractTemplate(projectPath, selectedTemplate.path)
        }

        loading.stop()

        // 写入 envId
        const { filepath } = await searchConfig(projectPath)

        // 配置文件未找到
        if (!filepath) {
            this.initSuccessOutput(projectName)
            return
        }

        const configContent = fs.readFileSync(filepath).toString()

        fs.writeFileSync(filepath, configContent.replace('{{envId}}', env))
        this.initSuccessOutput(projectName)
    }

    async extractTemplate(projectPath: string, templatePath: string) {
        // 文件下载链接
        const url = `https://636c-cli-1252710547.tcb.qcloud.la/cloudbase-templates/${templatePath}.tar.gz`

        return fetchStream(url).then(async (res) => {
            if (!res) {
                throw new CloudBaseError('请求异常')
            }
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

    async copyServerTemplate(projectPath: string) {
        // 模板目录
        const templatePath = path.resolve(__dirname, '../../templates', 'server/node')
        fse.copySync(templatePath, projectPath)
    }

    // 项目初始化成功后打印提示语
    @InjectParams()
    initSuccessOutput(projectName, @Log() log?: Logger) {
        log.success(`创建项目 ${projectName} 成功！\n`)
        const command = chalk.bold.cyan(`cd ${projectName}`)

        log.info('🎉 欢迎贡献你的模板 👉')
        log.printClickableLink('https://github.com/TencentCloudBase/cloudbase-templates')

        log.info(
            `👉 执行命令 ${command} 进入项目文件夹，👉 执行命令 ${chalk.bold.cyan(
                'cloudbase framework:deploy'
            )} 一键部署`
        )
    }
}
