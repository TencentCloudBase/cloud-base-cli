import fs from 'fs'
import { CloudBaseError } from '../../error'

export function checkPathExist(dest: string, throwError: boolean = false): boolean {
    const exist = fs.existsSync(dest)

    if (!exist && throwError) {
        throw new CloudBaseError(`路径不存在：${dest}`)
    }

    return exist
}

export * from './del'