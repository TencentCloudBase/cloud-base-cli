
import inquirer from 'inquirer'
import { FunctionContext } from '../../types'
import { CloudBaseError } from '../../error'
import { deleteFunction, batchDeleteFunctions } from '../../function'
import { successLog } from '../../logger'

export async function deleteFunc(ctx: FunctionContext) {
    const { name, envId, functions } = ctx

    let isBatchDelete = false

    // 不指定云函数名称，默认删除所有函数
    if (!name) {
        const answer = await inquirer.prompt({
            type: 'confirm',
            name: 'isBatch',
            message: '无云函数名称，是否需要删除配置文件中的全部云函数？',
            default: false
        })

        // 危险操作，再次确认
        if (answer.isBatch) {
            const { reConfirm } = await inquirer.prompt({
                type: 'confirm',
                name: 'reConfirm',
                message: '确定要删除配置文件中的全部云函数？',
                default: false
            })
            isBatchDelete = reConfirm
        }

        if (!isBatchDelete) {
            throw new CloudBaseError('请指定需要删除的云函数名称！')
        }
    }

    if (isBatchDelete) {
        const names: string[] = functions.map(item => item.name)
        return await batchDeleteFunctions({
            names,
            envId
        })
    }

    await deleteFunction({
        envId,
        functionName: name
    })

    successLog(`删除函数 [${name}] 成功！`)
}