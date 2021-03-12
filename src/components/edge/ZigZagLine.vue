<script>
import LineShapeBase from './LineShapeBase.vue';

const offset = 20
const vectors = {
  left: [0, 0.5, -1, 0],
  right: [1, 0.5, 1, 0],
  top: [0.5, 0, 0, -1],
  bottom: [0.5, 1, 0, 1]
}

export default {
  name: 'ZigZagLine',
  extends: LineShapeBase,
  computed: {
    start() {
      let { x, y, width, height, orientation = 'right' } = this.source
      const vector = vectors[orientation]
      x += vector[0] * width
      y += vector[1] * height
      return { x, y }
    },
    startPoint() {
      return this.stringifyPoint(this.start)
    },
    end() {
      let { x, y, width, height, orientation = 'left' } = this.target
      const vector = vectors[orientation]
      x += vector[0] * width
      y += vector[1] * height
      return { x, y }
    },
    endPoint() {
      return this.stringifyPoint(this.end)
    },
    zig() {
      let { x, y, width, height, orientation = 'right' } = this.source
      const vector = vectors[orientation]
      x += vector[0] * width + vector[2] * offset
      y += vector[1] * height + vector[3] * offset
      return { x, y }
    },
    zigPoint() {
      return `${this.zig.x},${this.zig.y}`
    },
    zag() {
      let { x, y, width, height, orientation = 'left' } = this.target
      const vector = vectors[orientation]
      x += vector[0] * width + vector[2] * offset
      y += vector[1] * height + vector[3] * offset
      return { x, y }
    },
    zagPoint() {
      return `${this.zag.x},${this.zag.y}`
    },
  },
  methods: {
    getDefinition() {
      return `M ${this.startPoint} L ${this.zigPoint} L ${this.zagPoint} L ${this.endPoint}`
    }
  }
}
</script>
