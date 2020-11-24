<template>
    <div class="dragonfly-endpoints" :class="position">
        <template v-if="endpoints">
            <dragonfly-endpoint
                v-for="endpoint in endpoints"
                :key="endpoint.key"
                :id="endpoint.id"
            />
        </template>
        <slot v-else/>
    </div>
</template>

<script>
import DragonflyEndpoint from "./DragonflyEndpoint.vue";

const positionVectors = {
    left: [-0.5, -0.5],
    right: [0.5, -0.5],
    top: [-0.5, -0.5],
    bottom: [-0.5, 0.5],
}

export default {
    name: "DragonflyEndpoints",
    components: {DragonflyEndpoint},
    props: ['endpoints', 'position'],
    provide() {
        return {
            getPosition: this.getPosition
        }
    },
    methods: {
        getPosition() {
            const width = this.$el.parentNode.clientWidth
            const height = this.$el.parentNode.clientHeight
            const vector = positionVectors[this.position]
            return {
                left: width * vector[0],
                top: height * vector[1],
            }
        }
    }
}
</script>

<style scoped lang="less">
.dragonfly-endpoints {
    position: absolute;
    overflow: visible;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    z-index: 2;

    &.left {
        left: 0;
        top: 0;
        height: 100%;
        width: 0;
        flex-direction: column;
    }

    &.right {
        right: 0;
        top: 0;
        height: 100%;
        width: 0;
        flex-direction: column;
    }

    &.top {
        top: 0;
        left: 0;
        width: 100%;
        height: 0;
        flex-direction: row;
    }

    &.bottom {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 0;
        flex-direction: row;
    }

    &.left-top {
        width: 0;
        height: 0;
        left: 0;
        top: 0;
    }

    &.left-bottom {
        width: 0;
        height: 0;
        left: 0;
        bottom: 0;
    }

    &.right-top {
        width: 0;
        height: 0;
        right: 0;
        top: 0;
    }

    &.right-bottom {
        width: 0;
        height: 0;
        right: 0;
        bottom: 0;
    }
}
</style>
