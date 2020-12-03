<script>
export default {
    name: "LineShapeBase",
    props: ['position', 'definition'],
    emits: ['update:definition'],
    computed: {
        source() {
            return this.position.source
        },
        target() {
            return this.position.target
        },
    },
    mounted() {
        this.$emit('update:definition', this.getDefinition())
    },
    watch: {
        position: {
            deep: true,
            handler() {
                this.$emit('update:definition', this.getDefinition())
            },
        },
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
