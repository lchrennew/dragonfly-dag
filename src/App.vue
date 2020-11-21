<template>
    <dragonfly-canvas :nodes="nodes" :edges="edges">
        <template #nodeRenderer="{node}">
            Hi, {{ node.id }}
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
