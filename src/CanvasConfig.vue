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
            <a-switch
                :default-checked="linkable"
                @change="checked=>$emit('update:linkable', checked)"
            />
        </p>
        <p>
            画布移动
            <a-switch
                :default-checked="movable"
                @change="checked=>$emit('update:movable', checked)"
            />
        </p>
        <p>
            显示箭头
            <a-switch
                :default-checked="showArrow"
                @change="checked=>$emit('update:showArrow', checked)"
            />
        </p>
        <p>
            箭头比例
            <a-slider :value="arrowZoomRatio" :min="1" :max="3" @change="value=>$emit('update:arrowZoomRatio', value)"/>
        </p>
        <p>
            箭头居中
            <a-switch
                :default-checked="midArrow"
                @change="checked=>$emit('update:midArrow', checked)"
            />
        </p>
    </div>
</template>

<script>
export default {
    name: "CanvasConfig",
    props: ['draggable', 'linkable', 'movable', 'showArrow', 'arrowZoomRatio','midArrow'],

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
