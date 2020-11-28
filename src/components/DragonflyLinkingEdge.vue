<template>
    <component :is="lineShape" :target="target" :source="source" v-model:definition="definition"/>
    <path :d="definition" class="linking"/>
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
