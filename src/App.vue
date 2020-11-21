<template>
    <dragonfly-canvas :nodes="nodes" :edges="edges">
        <template #nodeRenderer="{node}">
            <div class="node">Hi, {{ node.id }}</div>
        </template>
    </dragonfly-canvas>
</template>

<script>

import DragonflyCanvas from "./components/DragonflyCanvas.vue";

export default {
    name: 'App',
    components: {
        DragonflyCanvas
    },
    data() {
        return {
            nodes: [
                {id: 'dragonfly'},
                {id: 'butterfly'},
            ],
            edges: [
                {id: 'love', source: 'butterfly', target: 'dragonfly'},
            ],
        }
    }
}
</script>
<style lang="less">
.node {
    padding: 1em;
    background-color: #9cdfff;
}
</style>
