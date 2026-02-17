<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import { useRoomStore } from '@/stores/room'
import { useToast } from '@/composables/useToast'
import { getMe } from '@/services/auth'

const { t, locale } = useI18n()
const route = useRoute()
const room = useRoomStore()
const toast = useToast()

room.$reset()
room.room.id = route.params.id as string

const fullLayout = ref(false)

function onAfterLeave() {
  fullLayout.value = route.path.endsWith('/calendar')
}

onMounted(async () => {
  try {
    const me = await getMe(room.room.id).catch(() => null)
    if (me?.userId) {
      room.currentUserId = me.userId
    }
  } catch {}

  try {
    await Promise.all([room.fetchRoom(), room.fetchUsers()])
  } catch {
    toast.show(t('room.loadError'), 'error')
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-bg font-body overflow-hidden">
    <!-- Navbar -->
    <nav class="flex-none flex items-center justify-between px-4 py-2 bg-transparent">
      <RouterLink
        :to="localePath('/', locale)"
        class="font-heading font-bold text-primary no-underline shrink-0"
      >
        <span class="text-3xl">D</span><span class="text-xl">ay</span
        ><span class="text-3xl">20</span>
      </RouterLink>
      <h1 v-if="room.room.name" class="text-2xl font-heading font-bold text-primary truncate mx-3">
        {{ room.room.name }}
      </h1>
      <div class="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <LangToggle />
      </div>
    </nav>

    <!-- Content -->
    <main
      class="flex flex-col flex-1 min-h-0 w-full"
      :class="fullLayout ? '' : 'items-center justify-center px-2 lg:px-6'"
    >
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in" @after-leave="onAfterLeave">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
