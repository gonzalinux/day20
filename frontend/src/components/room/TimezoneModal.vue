<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ save: [tz: string]; close: [] }>()

const { t } = useI18n()

const search = ref('')
// @ts-expect-error this thing exists
const allTimezones: string[] = Intl.supportedValuesOf('timeZone')

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return allTimezones
  return allTimezones.filter((tz: string) => tz.toLowerCase().includes(q))
})

function select(tz: string) {
  emit('save', tz)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div
        class="relative rounded-2xl bg-bg shadow-xl p-6 w-full max-w-sm mx-4 max-h-[80vh] flex flex-col"
      >
        <h3 class="text-xl font-heading font-bold text-accent mb-4">
          {{ t('room.changeTimezone') }}
        </h3>

        <input
          v-model="search"
          type="text"
          :placeholder="t('room.searchTimezone')"
          class="w-full px-3 py-2 rounded-lg bg-secondary/10 text-primary font-body text-sm border border-secondary/20 focus:outline-none focus:border-accent mb-3"
        />

        <div class="flex-1 overflow-y-auto min-h-0">
          <button
            v-for="tz in filtered"
            :key="tz"
            class="w-full text-left px-3 py-2 text-sm font-body text-primary hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
            @click="select(tz)"
          >
            {{ tz }}
          </button>
          <p v-if="filtered.length === 0" class="text-center text-secondary/60 text-sm py-4">—</p>
        </div>

        <button
          class="mt-3 w-full px-4 py-3 rounded-lg bg-secondary/20 text-primary font-heading font-bold hover:bg-secondary/30 transition-colors cursor-pointer"
          @click="emit('close')"
        >
          {{ t('room.durationCancel') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
