<template>
    <div class="canvas-config">
        <p>
            节点拖拽
            <a-switch
                :default-checked="draggable"
                @change="checked=>$emit('update:draggable', checked)"
            />
        </p>
        <p>
            节点连接
            <a-switch/>
        </p>
    </div>
</template>

<script>
export default {
    name: "CanvasConfig",
    props: ['draggable', 'linkable'],

}
</script>

<style scoped lang="less">
.canvas-config {
    position: absolute;
    right: 0;
    top: 0;
    width: 200px;
    height: 800px;
    overflow: auto;
    background-color: #eee;
}
</style>
