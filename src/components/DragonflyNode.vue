<template>
    <div class="dragonfly-node">
        <slot/>
    </div>
</template>

<script>
export default {
    name: "DragonflyNode",
    props: ['node']
}
</script>

<style scoped lang="less">
.dragonfly-node {
    position: absolute;
}
</style>
