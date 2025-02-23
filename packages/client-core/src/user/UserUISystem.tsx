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

import React, { useEffect } from 'react'

import { defineSystem } from '@etherealengine/engine/src/ecs/functions/SystemFunctions'
import { getMutableState, none } from '@etherealengine/hyperflux'

import { FaceRetouchingNatural, Send } from '@mui/icons-material'

import { InviteService } from '../social/services/InviteService'
import AvatarModifyMenu from './components/UserMenu/menus/AvatarModifyMenu'
import AvatarSelectMenu from './components/UserMenu/menus/AvatarSelectMenu'
import EmoteMenu from './components/UserMenu/menus/EmoteMenu'
import ProfileMenu from './components/UserMenu/menus/ProfileMenu'
import ReadyPlayerMenu from './components/UserMenu/menus/ReadyPlayerMenu'
import SettingMenu from './components/UserMenu/menus/SettingMenu'
import ShareMenu from './components/UserMenu/menus/ShareMenu'
import { PopupMenuState } from './components/UserMenu/PopupMenuService'

export const EmoteIcon = () => (
  <svg width="35px" height="35px" viewBox="0 0 184 184" version="1.1">
    <path
      fill="var(--iconButtonColor)"
      d="M105.314,76.175l-0,24.977c3.463,10.391 8.751,32.633 -1.824,48.494c-1.64,2.552 -5.469,2.917 -7.839,0.729c-1.823,-1.641 -2.005,-4.375 -0.729,-6.381c7.11,-10.938 4.011,-27.711 0,-40.108l-10.938,31.904c-1.277,4.011 -6.381,5.47 -9.663,2.735l-17.137,-14.949c-2.187,-1.824 -2.37,-4.923 -0.547,-7.11c1.823,-2.188 5.105,-2.37 7.11,-0.547l11.85,10.027l5.834,-21.877l0,-26.799c-5.287,-0.183 -11.121,-0.365 -16.59,-0.548c-4.011,-0.182 -7.11,-3.646 -6.745,-7.839l2.37,-27.893c0.729,-2.005 2.917,-3.281 4.922,-3.281c3.282,-0 6.016,3.281 5.105,6.563l-1.823,14.767c-0.365,2.552 1.823,4.922 4.375,4.922l30.081,-0c1.459,-0 2.734,-0.547 3.464,-1.641c4.193,-5.469 6.927,-14.22 8.386,-20.601c1.094,-3.281 3.281,-4.01 5.651,-4.01c2.918,0.364 4.923,3.281 4.376,6.198c-2.005,9.115 -7.293,26.982 -19.689,32.268Z"
    />
    <path
      fill="var(--iconButtonColor)"
      d="M82.89,53.205c-2.917,-4.375 -3.464,-9.298 -1.094,-13.491c2.005,-4.011 6.198,-6.381 10.574,-6.381c6.563,0 12.032,5.47 12.032,12.033c0,4.375 -2.552,9.115 -6.199,11.485c-1.823,1.276 -3.828,1.823 -5.833,1.823c-1.459,0 -2.735,-0.364 -4.193,-0.911c-2.188,-0.912 -4.011,-2.37 -5.287,-4.558Z"
    />
  </svg>
)

export const UserMenus = {
  Profile: 'user.Profile',
  Settings: 'user.Settings',
  ReadyPlayer: 'user.ReadyPlayer',
  AvatarSelect: 'user.AvatarSelect',
  AvatarModify: 'user.AvatarModify',
  Share: 'user.Share',
  Emote: 'user.Emote'
}

const reactor = () => {
  InviteService.useAPIListeners()

  useEffect(() => {
    const popupMenuState = getMutableState(PopupMenuState)

    popupMenuState.menus.merge({
      [UserMenus.Profile]: ProfileMenu,
      [UserMenus.Settings]: SettingMenu,
      [UserMenus.AvatarSelect]: AvatarSelectMenu,
      [UserMenus.AvatarModify]: AvatarModifyMenu,
      [UserMenus.ReadyPlayer]: ReadyPlayerMenu,
      [UserMenus.Share]: ShareMenu,
      [UserMenus.Emote]: EmoteMenu
    })

    popupMenuState.hotbar.merge({
      [UserMenus.Profile]: FaceRetouchingNatural,
      [UserMenus.Share]: Send,
      [UserMenus.Emote]: EmoteIcon
    })

    return () => {
      popupMenuState.menus.merge({
        [UserMenus.Profile]: none,
        [UserMenus.Settings]: none,
        [UserMenus.AvatarSelect]: none,
        [UserMenus.AvatarModify]: none,
        [UserMenus.ReadyPlayer]: none,
        [UserMenus.Share]: none,
        [UserMenus.Emote]: none
      })

      popupMenuState.hotbar.merge({
        [UserMenus.Profile]: none,
        [UserMenus.Share]: none,
        [UserMenus.Emote]: none
      })
    }
  }, [])
  return null
}

export const UserUISystem = defineSystem({
  uuid: 'ee.client.UserUISystem',
  execute: () => {},
  reactor
})
