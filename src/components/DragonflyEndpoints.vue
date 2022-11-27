<template>
    <div :class="orientation" class="dragonfly-endpoints">
        <template v-if="endpoints">
            <dragonfly-endpoint
                v-for="endpoint in endpoints"
                :key="endpoint.key"
                :endpoint="endpoint"
            />
        </template>
        <slot v-else/>
    </div>
</template>

<script>
import DragonflyEndpoint from "./DragonflyEndpoint.vue";

const orientationVectors = {
    left: [ 0, 0 ],
    right: [ 1, 0 ],
    top: [ 0, 0 ],
    bottom: [ 0, 1 ],
}

export default {
    name: "DragonflyEndpoints",
    components: { DragonflyEndpoint },
    props: [ 'endpoints', 'orientation' ],
    provide() {
        return {
            getPosition: this.getPosition,
            orientation: this.orientation,
        }
    },
    methods: {
        getPosition() {
            const width = this.$el.parentNode.clientWidth
            const height = this.$el.parentNode.clientHeight
            const vector = orientationVectors[this.orientation]
            return {
                left: width * vector[0],
                top: height * vector[1],
            }
        }
    }
}
</script>
