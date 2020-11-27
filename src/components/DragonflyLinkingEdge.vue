<template>
    <slot/>
</template>

<script>
export default {
    name: "DragonflyLinkingEdge",
    provide() {
        return {
            linking: true
        }
    }
}
</script>
