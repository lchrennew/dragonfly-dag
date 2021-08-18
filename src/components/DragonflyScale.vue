<template>
    <div class="dragonfly-scale">1 : {{ parseFloat(scale.toPrecision(3)) }}</div>
</template>

<script>
export default {
    name: "DragonflyScale",
    inject: ['scale']
}
</script>
