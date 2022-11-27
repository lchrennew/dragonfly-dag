import { computed, ref } from "vue";

const innerWidth = ref(window.innerWidth)
const outerWidth = ref(window.outerWidth)
const dpr = ref(window.devicePixelRatio)
window.addEventListener('resize', () => {
    innerWidth.value = window.innerWidth
    outerWidth.value = window.outerWidth
    dpr.value = window.devicePixelRatio
})
export const zoomLevel = computed(() => outerWidth.value / innerWidth.value)
export const pixelRatio = computed(() => dpr.value / zoomLevel.value)

