<template>
  <slot/>
</template>

<script setup>
import { computed, provide, reactive } from "vue";

const emit = defineEmits([ 'update:Selection' ])

const props = defineProps({
  selection: { type: Array },
})

const computedSelection = computed(() => reactive(props.selection ?? []))

const selected = computed(() => {
  return Object.fromEntries(
      computedSelection.value.map(id => [ id, true ]));
})

const multiple = computed(() => computedSelection.value.length > 1)

provide('selectAgain', (...ids) => {
  if (!props.selection) {
    computedSelection.value.length = 0
    computedSelection.value.push(...ids)
  }
  emit('update:Selection', [ ...ids ])
})

provide('selectMore', (...ids) => {
  if (!props.selection) computedSelection.value.push(...ids)
  emit('update:Selection', [ ...ids ])
})

provide('multipleSelected', multiple)

provide('selected', selected)
provide('unselect', (...ids) => {
  const selection = computedSelection.value.filter(id => !ids.includes(id))
  if (!props.selection) {
    computedSelection.value.length = 0
    computedSelection.value.push(...selection)
  }
  emit('update:Selection', [ ...selection ])
})
</script>
