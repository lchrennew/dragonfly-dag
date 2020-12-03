<template>
    <component :is="lineShape" :position="{target, source}" v-model:definition="definition"/>
    <path :d="definition" class="edge linking"/>
</template>

<script>
export default {
    name: "DragonflyLinkingEdge",
    props: ['lineShape', 'target', 'source'],
    data() {
        return {
            definition: ''
        }
    },
}
</script>
