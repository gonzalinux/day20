<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import AppInput from '@/components/AppInput.vue'
import BaseModal from '@/components/BaseModal.vue'
import { useRoomStore } from '@/stores/room'

const emit = defineEmits<{ 'open-combined': [] }>()

const room = useRoomStore()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const newPlayerName = ref('')
const addingPlayer = ref(false)
const error = ref('')
const loggingOut = ref(false)

const editingUserId = ref('')
const editName = ref('')
const savingName = ref(false)
const confirmingAction = ref<'' | 'removePin' | 'removeUser' | 'makeAdmin' | 'removeAdmin'>('')
const actionError = ref('')

const editingUser = computed(() => room.users.find((u) => u.id === editingUserId.value))

function openEdit(userId: string) {
  editingUserId.value = userId
  editName.value = room.users.find((u) => u.id === userId)?.name ?? ''
  confirmingAction.value = ''
  actionError.value = ''
}

function closeEditModal() {
  editingUserId.value = ''
  editName.value = ''
  savingName.value = false
  confirmingAction.value = ''
  actionError.value = ''
}

async function handleRename() {
  if (!editName.value.trim()) return
  savingName.value = true
  actionError.value = ''
  try {
    await room.renameUser(editingUserId.value, editName.value.trim())
    closeEditModal()
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : String(e)
  } finally {
    savingName.value = false
  }
}

function startConfirm(action: 'removePin' | 'removeUser' | 'makeAdmin' | 'removeAdmin') {
  confirmingAction.value = action
  actionError.value = ''
}

async function executeConfirm() {
  actionError.value = ''
  const userId = editingUserId.value
  try {
    if (confirmingAction.value === 'removePin') {
      await room.removePin(userId)
    } else if (confirmingAction.value === 'removeUser') {
      await room.removeUser(userId)
    } else if (confirmingAction.value === 'makeAdmin') {
      await room.changeUserRole(userId, 'subAdmin')
    } else if (confirmingAction.value === 'removeAdmin') {
      await room.changeUserRole(userId, 'user')
    }
    closeEditModal()
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : String(e)
  }
}

const confirmMessage = computed(() => {
  const name = editingUser.value?.name ?? ''
  switch (confirmingAction.value) {
    case 'removePin': return t('room.removePinConfirm', { name })
    case 'removeUser': return t('room.removeUserConfirm', { name })
    case 'makeAdmin': return t('room.makeAdminConfirm', { name })
    case 'removeAdmin': return t('room.removeAdminConfirm', { name })
    default: return ''
  }
})

const modalActions = computed(() => {
  if (confirmingAction.value) {
    return [
      {
        label: t('room.durationCancel'),
        handler: () => { confirmingAction.value = ''; actionError.value = '' },
        variant: 'secondary' as const,
      },
      { label: t('room.confirm'), handler: executeConfirm, variant: 'danger' as const },
    ]
  }
  return [
    { label: t('room.durationCancel'), handler: closeEditModal, variant: 'secondary' as const },
  ]
})

async function submitAddPlayer() {
  addingPlayer.value = true
  error.value = ''
  try {
    await room.addUser(newPlayerName.value, 'user')
    newPlayerName.value = ''
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    addingPlayer.value = false
  }
}

async function handleLogout() {
  loggingOut.value = true
  error.value = ''
  try {
    await room.logoutUser()
    const roomId = route.params.id as string
    router.push(localePath(`/rooms/${roomId}/pick-user`, locale.value))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="h-full p-2 overflow-y-auto flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-3xl font-heading font-bold text-accent">
        {{ t('room.navUsers') }}
      </h2>
      <button
        :disabled="loggingOut"
        class="px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors cursor-pointer font-heading font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleLogout"
      >
        {{ t('room.logout') }}
      </button>
    </div>

    <p v-if="room.room.description" class="text-primary/60 font-body text-sm mb-4 leading-relaxed">
      {{ room.room.description }}
    </p>

    <ul class="flex flex-col gap-2">
      <li
        v-for="user in room.users"
        :key="user.id"
        class="flex items-center justify-between px-4 rounded-lg"
        :class="user.id === room.currentUserId ? 'bg-accent/10 ring-1 ring-accent/30' : 'bg-bg/50'"
      >
        <span class="text-primary font-body text-xl pt-3 pb-1">{{ user.name }}</span>
        <div class="flex items-center gap-1.5">
          <VIcon v-if="user.hasPin" name="gi-padlock" class="text-secondary" scale="1" />
          <button
            v-if="user.id === room.currentUserId || (room.isAdmin && user.id !== room.currentUserId)"
            class="text-xs font-heading font-bold text-accent bg-accent/15 px-2 py-1 rounded hover:bg-accent/25 transition-colors cursor-pointer"
            @click="openEdit(user.id)"
          >
            {{ t('room.edit') }}
          </button>
          <span
            v-if="user.id === room.currentUserId"
            class="text-sm font-heading font-bold text-primary bg-primary/15 px-2 py-0.5 rounded"
          >
            {{ t('room.you') }}
          </span>
          <span
            v-if="user.role === 'admin' || user.role === 'subAdmin'"
            class="text-sm font-heading font-bold text-accent bg-accent/15 px-2 py-0.5 rounded"
          >
            {{ t('room.admin') }}
          </span>
        </div>
      </li>
    </ul>

    <!-- Bottom actions -->
    <div class="mt-auto pt-4 flex flex-col gap-2">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div v-if="room.isAdmin">
        <form class="flex gap-2" @submit.prevent="submitAddPlayer">
          <div class="flex-1">
            <AppInput v-model="newPlayerName" :placeholder="t('room.playerNamePlaceholder')" />
          </div>
          <button
            type="submit"
            :disabled="addingPlayer || !newPlayerName.trim()"
            class="bg-accent text-bg font-heading font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start"
          >
            {{ t('room.add') }}
          </button>
        </form>
      </div>
      <!-- Combined Calendar button -->
      <button
        class="w-full px-4 py-3 mb-15 text-lg lg:my-0 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors cursor-pointer font-heading font-bold"
        @click="emit('open-combined')"
      >
        {{ t('room.combinedCalendar') }}
      </button>
    </div>

    <!-- Edit User Modal -->
    <BaseModal
      v-if="editingUserId"
      :title="t('room.editUser', { name: editingUser?.name })"
      :actions="modalActions"
      @close="closeEditModal"
    >
      <!-- Confirm sub-view -->
      <div v-if="confirmingAction">
        <p class="text-primary/80 font-body">{{ confirmMessage }}</p>
        <p v-if="actionError" class="text-red-500 text-sm mt-2">{{ actionError }}</p>
      </div>
      <!-- Edit sub-view -->
      <div v-else class="flex flex-col gap-3">
        <p v-if="actionError" class="text-red-500 text-sm">{{ actionError }}</p>
        <form class="flex gap-2" @submit.prevent="handleRename">
          <div class="flex-1">
            <AppInput v-model="editName" :placeholder="t('room.newName')" />
          </div>
          <button
            type="submit"
            :disabled="savingName || !editName.trim()"
            class="bg-accent text-bg font-heading font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ t('room.rename') }}
          </button>
        </form>
        <template v-if="room.isAdmin && editingUserId !== room.currentUserId">
          <hr class="border-primary/10" />
          <div class="flex flex-col gap-2">
            <div v-if="editingUser?.role === 'user'" class="flex flex-col gap-1">
              <button
                :disabled="!editingUser?.hasPin"
                class="w-full px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors font-heading font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                :class="editingUser?.hasPin ? 'cursor-pointer' : ''"
                @click="editingUser?.hasPin && startConfirm('makeAdmin')"
              >
                {{ t('room.makeAdmin') }}
              </button>
              <p v-if="!editingUser?.hasPin" class="text-xs text-primary/50 font-body text-center">
                {{ t('room.makeAdminRequiresPin') }}
              </p>
            </div>
            <button
              v-if="editingUser?.role === 'subAdmin' && room.isCreator"
              class="w-full px-4 py-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors cursor-pointer font-heading font-bold text-sm"
              @click="startConfirm('removeAdmin')"
            >
              {{ t('room.removeAdmin') }}
            </button>
            <button
              v-if="editingUser?.hasPin"
              class="w-full px-4 py-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors cursor-pointer font-heading font-bold text-sm"
              @click="startConfirm('removePin')"
            >
              {{ t('room.removePin') }}
            </button>
            <button
              class="w-full px-4 py-2 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors cursor-pointer font-heading font-bold text-sm"
              @click="startConfirm('removeUser')"
            >
              {{ t('room.removeUser') }}
            </button>
          </div>
        </template>
      </div>
    </BaseModal>
  </div>
</template>
