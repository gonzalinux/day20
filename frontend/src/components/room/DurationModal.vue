<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ min: number; max: number }>()
const emit = defineEmits<{ save: [min: number, max: number]; close: [] }>()

const { t } = useI18n()

const editMin = ref(props.min)
const editMax = ref(props.max)

function clamp(val: number, lo: number, hi: number) {
  return Math.min(Math.max(val, lo), hi)
}

function setMin(val: number) {
  editMin.value = clamp(val, 1, editMax.value)
}

function setMax(val: number) {
  editMax.value = clamp(val, editMin.value, 24)
}

function save() {
  emit('save', editMin.value, editMax.value)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative rounded-2xl bg-bg shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-xl font-heading font-bold text-accent mb-6">
          {{ t('room.settingsDuration') }}
        </h3>

        <div class="flex flex-col gap-5">
          <!-- Min -->
          <div class="flex items-center justify-between">
            <span class="text-lg text-primary font-body">{{ t('room.settingsDurationMin') }}</span>
            <div class="flex items-center gap-2">
              <button
                class="size-9 rounded-lg bg-secondary/20 hover:bg-accent/20 text-primary text-lg font-bold transition-colors cursor-pointer"
                @click="setMin(editMin - 1)"
              >-</button>
              <span class="w-10 text-center text-primary font-body font-bold text-lg">{{ editMin }}{{ t('room.settingsDurationUnit') }}</span>
              <button
                class="size-9 rounded-lg bg-secondary/20 hover:bg-accent/20 text-primary text-lg font-bold transition-colors cursor-pointer"
                @click="setMin(editMin + 1)"
              >+</button>
            </div>
          </div>

          <!-- Max -->
          <div class="flex items-center justify-between">
            <span class="text-lg text-primary font-body">{{ t('room.settingsDurationMax') }}</span>
            <div class="flex items-center gap-2">
              <button
                class="size-9 rounded-lg bg-secondary/20 hover:bg-accent/20 text-primary text-lg font-bold transition-colors cursor-pointer"
                @click="setMax(editMax - 1)"
              >-</button>
              <span class="w-10 text-center text-primary font-body font-bold text-lg">{{ editMax }}{{ t('room.settingsDurationUnit') }}</span>
              <button
                class="size-9 rounded-lg bg-secondary/20 hover:bg-accent/20 text-primary text-lg font-bold transition-colors cursor-pointer"
                @click="setMax(editMax + 1)"
              >+</button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 px-4 py-3 rounded-lg bg-secondary/20 text-primary font-heading font-bold hover:bg-secondary/30 transition-colors cursor-pointer"
            @click="emit('close')"
          >
            {{ t('room.durationCancel') }}
          </button>
          <button
            class="flex-1 px-4 py-3 rounded-lg bg-accent text-bg font-heading font-bold hover:opacity-90 transition-opacity cursor-pointer"
            @click="save"
          >
            {{ t('room.durationSave') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
