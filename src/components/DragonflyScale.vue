<template>
    <div class="dragonfly-scale">1 : {{ parseFloat(scale.toPrecision(3)) }}</div>
</template>

<script setup>
import { inject } from "vue";

const scale = inject('scale')
</script>
