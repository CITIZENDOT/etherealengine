/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import appRootPath from 'app-root-path'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import { KTX2EncodeArguments } from '@etherealengine/engine/src/assets/constants/CompressionParms'

import { Application } from '../../../declarations'

declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    'ktx2-encode': {
      create: (data: KTX2EncodeArguments) => Promise<string | string[]>
    }
  }
}

async function createKtx2(data: KTX2EncodeArguments): Promise<string | string[]> {
  const serverDir = path.join(appRootPath.path, 'packages/server')
  const projectDir = path.join(appRootPath.path, 'packages/projects')
  const BASIS_U = path.join(appRootPath.path, 'packages/server/public/loader_decoders/basisu')
  const inURI = /.*(projects\/.*)$/.exec(data.src)![1]
  const inPath = path.join(projectDir, inURI)
  const app: Application = this.app
  const fileData = fs.statSync(inPath)
  const isDir = fileData.isDirectory()
  async function doEncode(inPath) {
    const outPath = inPath.replace(/\.[^\.]+$/, '.ktx2')
    const outURIDir = path.dirname(inURI)
    const fileName = /[^\\/]*$/.exec(outPath)![0]
    const args = `-ktx2${data.mode === 'UASTC' ? ' -uastc' : ''}${data.mipmaps ? ' -mipmap' : ''}${
      data.flipY ? ' -y_flip' : ''
    }${data.srgb ? ' -linear' : ''} -q ${data.quality} ${inPath}`
    console.log(args)
    console.log(execFileSync(BASIS_U, args.split(/\s+/)))
    console.log(execFileSync('mv', [fileName, outPath]))
    const result = await this.app.service('file-browser').patch(null, {
      fileName,
      path: outURIDir,
      body: fs.readFileSync(outPath),
      contentType: 'image/ktx2'
    })
    return result
  }
  if (isDir) {
    const files = fs
      .readdirSync(inPath)
      .filter((file) => file && ['.jpg', '.jpeg', '.png'].some((ending) => file.endsWith(ending)))
      .map((file) => path.join(inPath, file))
    return await Promise.all(files.map(doEncode))
  } else return await doEncode(inPath)
}

export default (app: Application): any => {
  app.use('ktx2-encode', {
    create: createKtx2.bind({ app })
  })
}
