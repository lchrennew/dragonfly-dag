<script>
export default {
    name: "LineShapeBase",
    props: ['source', 'target', 'definition'],
    emits: ['update:definition'],
    mounted() {
        this.$emit('update:definition', this.getDefinition())
    },
    watch: {
        source() {
            this.$emit('update:definition', this.getDefinition())
        },
        target() {
            this.$emit('update:definition', this.getDefinition())
        }
    },
    methods: {
        stringifyPoint({x, y}) {
            return `${x},${y}`
        }
    },
    render() {
    }
}
</script>

<style scoped>

</style>
