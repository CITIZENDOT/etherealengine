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

import {
  LocationInstanceConnectionService,
  LocationInstanceState,
  useWorldInstance
} from '@etherealengine/client-core/src/common/services/LocationInstanceConnectionService'
import {
  MediaInstanceConnectionService,
  MediaInstanceState,
  useMediaInstance
} from '@etherealengine/client-core/src/common/services/MediaInstanceConnectionService'
import { ChannelService, ChannelState } from '@etherealengine/client-core/src/social/services/ChannelService'
import { LocationState } from '@etherealengine/client-core/src/social/services/LocationService'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@etherealengine/engine/src/ecs/classes/EngineState'
import { NetworkState } from '@etherealengine/engine/src/networking/NetworkState'
import { getMutableState, none, useHookstate } from '@etherealengine/hyperflux'

import { Groups } from '@mui/icons-material'

import { FriendService } from '../social/services/FriendService'
import FriendsMenu from '../user/components/UserMenu/menus/FriendsMenu'
import MessagesMenu from '../user/components/UserMenu/menus/MessagesMenu'
import { PopupMenuState } from '../user/components/UserMenu/PopupMenuService'

export const WorldInstanceProvisioning = () => {
  const locationState = useHookstate(getMutableState(LocationState))
  const isUserBanned = locationState.currentLocation.selfUserBanned.value
  const engineState = useHookstate(getMutableState(EngineState))

  const worldNetwork = Engine.instance.worldNetwork
  const currentLocationInstanceConnection = useWorldInstance()
  const networkConfigState = useHookstate(getMutableState(NetworkState).config)

  ChannelService.useAPIListeners()

  const locationInstance = useHookstate(getMutableState(LocationInstanceState))
  const instance = useWorldInstance()

  // Once we have the location, provision the instance server
  useEffect(() => {
    const currentLocation = locationState.currentLocation.location
    const isProvisioned = worldNetwork?.hostId && currentLocationInstanceConnection?.provisioned.value

    if (currentLocation.id?.value) {
      if (!isUserBanned && !isProvisioned) {
        const search = window.location.search
        let instanceId
        let roomCode

        if (search != null) {
          if (networkConfigState.instanceID.value)
            instanceId = new URL(window.location.href).searchParams.get('instanceId')
          if (networkConfigState.roomID.value) roomCode = new URL(window.location.href).searchParams.get('roomCode')
        }

        if (!networkConfigState.instanceID.value && networkConfigState.roomID.value) {
          LocationInstanceConnectionService.provisionExistingServerByRoomCode(
            currentLocation.id.value,
            roomCode,
            currentLocation.sceneId.value
          )
        } else {
          LocationInstanceConnectionService.provisionServer(
            currentLocation.id.value,
            instanceId || undefined,
            currentLocation.sceneId.value,
            roomCode || undefined
          )
        }
      }
    }
  }, [locationState.currentLocation.location])

  // Once scene is loaded and the server is provisioned, connect to the instance server
  useEffect(() => {
    if (
      engineState.sceneLoaded.value &&
      currentLocationInstanceConnection?.value &&
      currentLocationInstanceConnection.provisioned.value &&
      currentLocationInstanceConnection.readyToConnect.value &&
      !currentLocationInstanceConnection.connecting.value &&
      !currentLocationInstanceConnection.connected.value
    )
      LocationInstanceConnectionService.connectToServer(worldNetwork.hostId)
  }, [
    engineState.sceneLoaded,
    currentLocationInstanceConnection?.connected,
    currentLocationInstanceConnection?.readyToConnect,
    currentLocationInstanceConnection?.provisioned,
    currentLocationInstanceConnection?.connecting
  ])

  // Populate the URL with the room code and instance id
  useEffect(() => {
    if (!networkConfigState.roomID.value && !networkConfigState.instanceID.value) return

    if (instance?.connected?.value) {
      const parsed = new URL(window.location.href)
      const query = parsed.searchParams

      if (networkConfigState.roomID.value) query.set('roomCode', instance.roomCode.value)

      if (networkConfigState.instanceID.value) query.set('instanceId', worldNetwork.hostId)

      parsed.search = query.toString()
      if (typeof history.pushState !== 'undefined') {
        window.history.replaceState({}, '', parsed.toString())
      }
    }
  }, [locationInstance.instances, instance, networkConfigState])

  return null
}

export const MediaInstanceProvisioning = () => {
  const channelState = useHookstate(getMutableState(ChannelState))

  const mediaNetworkHostId = Engine.instance.mediaNetwork?.hostId
  const worldNetworkHostId = Engine.instance.worldNetwork?.hostId
  const currentChannelInstanceConnection = useMediaInstance()
  const currentWorldInstanceConnection = useWorldInstance()
  const joiningNewMediaChannel = useHookstate(getMutableState(MediaInstanceState).joiningNewMediaChannel)

  MediaInstanceConnectionService.useAPIListeners()

  // Once we have the world server, provision the media server
  useEffect(() => {
    if (channelState.channels.channels?.value.length) {
      const currentChannel =
        channelState.targetChannelId.value === ''
          ? channelState.channels.channels.value.find((channel) => channel.instanceId === worldNetworkHostId)?.id
          : channelState.targetChannelId.value
      if (!currentChannelInstanceConnection?.provisioned.value && currentChannel)
        MediaInstanceConnectionService.provisionServer(currentChannel, true)
    }
  }, [
    channelState.channels.channels?.length,
    joiningNewMediaChannel,
    currentWorldInstanceConnection?.connected,
    channelState.targetChannelId
  ])

  // Once the media server is provisioned, connect to it
  useEffect(() => {
    if (
      mediaNetworkHostId &&
      currentChannelInstanceConnection?.value &&
      currentChannelInstanceConnection.provisioned.value &&
      currentChannelInstanceConnection.readyToConnect.value &&
      !currentChannelInstanceConnection.connecting.value &&
      !currentChannelInstanceConnection.connected.value
    ) {
      MediaInstanceConnectionService.connectToServer(
        mediaNetworkHostId,
        currentChannelInstanceConnection.channelId.value!
      )
    }
  }, [
    currentChannelInstanceConnection?.connected,
    currentChannelInstanceConnection?.readyToConnect,
    currentChannelInstanceConnection?.provisioned,
    currentChannelInstanceConnection?.connecting
  ])

  return null
}

export const SocialMenus = {
  Friends: 'Friends',
  Messages: 'Messages'
}

export const FriendMenus = () => {
  FriendService.useAPIListeners()

  useEffect(() => {
    const menuState = getMutableState(PopupMenuState)
    menuState.menus.merge({
      [SocialMenus.Friends]: FriendsMenu,
      [SocialMenus.Messages]: MessagesMenu
    })
    menuState.hotbar.merge({
      [SocialMenus.Friends]: Groups
    })

    return () => {
      menuState.menus[SocialMenus.Friends].set(none)
      menuState.menus[SocialMenus.Messages].set(none)

      menuState.hotbar[SocialMenus.Friends].set(none)
    }
  }, [])

  return null
}

export const InstanceProvisioning = () => {
  const networkConfigState = useHookstate(getMutableState(NetworkState).config)

  return (
    <>
      {networkConfigState.world.value && <WorldInstanceProvisioning />}
      {networkConfigState.media.value && <MediaInstanceProvisioning />}
      {networkConfigState.friends.value && <FriendMenus />}
    </>
  )
}
