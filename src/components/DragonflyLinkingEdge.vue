<template>
    <component :is="lineShape" v-model:definition="definition" :position="{target, source}"/>
    <path :d="definition" class="edge linking"/>
</template>

<script>
export default {
    name: "DragonflyLinkingEdge",
    props: [ 'lineShape', 'target', 'source' ],
    data() {
        return {
            definition: ''
        }
    },
}
</script>
