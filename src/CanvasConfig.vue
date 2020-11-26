<template>
    <div class="canvas-config">
        <p>
            画布缩放(滚轮)
            <a-switch
                :default-checked="zoomable"
                @change="$emit('update:zoomable', $event)"
            />
        </p>
        <p>缩放比例
            <a-slider :value="zoomScale" :min="minZoomScale" :max="maxZoomScale" :step="0.01"
                      @change="$emit('update:zoomScale', $event)"/>
        </p>
        <p>缩放范围
            <a-slider :value="[minZoomScale, maxZoomScale]"
                      :min="0.01"
                      :max="5"
                      :step="0.01"
                      range
                      @change="()=>{$emit('update:minZoomScale', $event[0]);$emit('update:maxZoomScale', $event[1])}"/>
        </p>
        <p>
            画布移动
            <a-switch
                :default-checked="movable"
                @change="$emit('update:movable', $event)"
            />
        </p>
        <p>
            节点拖拽
            <a-switch
                :default-checked="draggable"
                @change="$emit('update:draggable', $event)"
            />
        </p>
        <p>
            节点连接
            <a-switch
                :default-checked="linkable"
                @change="$emit('update:linkable', $event)"
            />
        </p>

        <p>
            显示箭头
            <a-switch
                :default-checked="showArrow"
                @change="$emit('update:showArrow', $event)"
            />
        </p>
        <p>
            箭头比例
            <a-slider :value="arrowZoomRatio" :min="1" :max="3" :step="0.01"
                      @change="$emit('update:arrowZoomRatio', $event)"/>
        </p>
        <p>
            箭头居中
            <a-switch
                :default-checked="midArrow"
                @change="$emit('update:midArrow', $event)"
            />
        </p>
        <p>画布拖拽行为
            <a-radio-group :value="canvasDragging" size="small"
                           @change="$emit('update:canvasDragging', $event.target.value)">
                <a-radio-button value="off">
                    锁定
                </a-radio-button>
                <a-radio-button value="select">
                    框选
                </a-radio-button>
                <a-radio-button value="scroll">
                    滚动
                </a-radio-button>
                <a-radio-button value="zoom">
                    缩放
                </a-radio-button>
            </a-radio-group>
        </p>
        <p>节点拖拽行为
            <a-radio-group :value="nodeDragging" size="small"
                           @change="$emit('update:nodeDragging', $event.target.value)">
                <a-radio-button value="off">
                    锁定
                </a-radio-button>
                <a-radio-button value="move">
                    移动
                </a-radio-button>
                <a-radio-button value="link">
                    连接
                </a-radio-button>
            </a-radio-group>
        </p>
    </div>
</template>

<script>
export default {
    name: "CanvasConfig",
    props: ['draggable', 'linkable', 'movable', 'showArrow', 'arrowZoomRatio', 'midArrow', 'zoomable', 'zoomScale', 'minZoomScale', 'maxZoomScale', 'canvasDragging', 'nodeDragging'],
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
