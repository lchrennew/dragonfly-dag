<template>
    <div
        class="dragonfly-endpoint"
        @mousedown.stop="onMouseDown"
        draggable="true"
        @dragstart.prevent="onDragStart"
    >
        <slot/>
    </div>
</template>

<script>
export default {
    name: "DragonflyEndpoint",
    props: ['id'],
    inject: ['node', 'endpointReposition'],
    methods: {
        onMouseDown() {
            console.log('mouse down')
        },
        onDragStart() {
            console.log('drag start')
        }
    },
    mounted() {
        const x = this.$el.offsetWidth / 2 + this.$el.offsetLeft + this.$el.parentNode.offsetLeft - this.$el.parentNode.parentNode.offsetWidth / 2
        const y = this.$el.offsetHeight / 2 + this.$el.offsetTop + this.$el.parentNode.offsetTop - this.$el.parentNode.parentNode.offsetHeight / 2
        this.endpointReposition(this.id, x, y)
    }
}
</script>

<style scoped lang="less">
.dragonfly-endpoint {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 10px;
    border: solid 2px #ff7700;
    background-color: #fff;
    position: relative;
}
</style>
