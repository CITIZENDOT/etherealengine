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

import type { Knex } from 'knex'

import { instanceAuthorizedUserPath } from '@etherealengine/engine/src/schemas/networking/instance-authorized-user.schema'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex: Knex): Promise<void> {
  const oldTableName = 'instance_authorized_user'

  const oldNamedTableExists = await knex.schema.hasTable(oldTableName)
  const tableExists = await knex.schema.hasTable(instanceAuthorizedUserPath)
  if (oldNamedTableExists) {
    // In case sequelize creates the new table before we migrate the old table
    if (tableExists) await knex.schema.dropTable(instanceAuthorizedUserPath)
    await knex.schema.renameTable(oldTableName, instanceAuthorizedUserPath)
  }

  if (!tableExists && !oldNamedTableExists) {
    await knex.schema.createTable(instanceAuthorizedUserPath, (table) => {
      //@ts-ignore
      table.uuid('id').collate('utf8mb4_bin').primary()
      //@ts-ignore
      table.uuid('userId').collate('utf8mb4_bin').notNullable()
      //@ts-ignore
      table.uuid('instanceId').collate('utf8mb4_bin').notNullable().index()
      table.dateTime('createdAt').notNullable()
      table.dateTime('updatedAt').notNullable()

      table.foreign('userId').references('id').inTable('user').onDelete('CASCADE').onUpdate('CASCADE')
      table.foreign('instanceId').references('id').inTable('instance').onDelete('CASCADE').onUpdate('CASCADE')

      // Setting unique constraint for userId and instanceId combination
      table.unique(['userId', 'instanceId'], {
        indexName: 'instance_authorized_user_instanceId_userId_unique'
      })
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable(instanceAuthorizedUserPath)

  if (tableExists === true) {
    await knex.schema.dropTable(instanceAuthorizedUserPath)
  }
}
