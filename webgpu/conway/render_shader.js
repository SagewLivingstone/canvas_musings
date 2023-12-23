export const render_src = /* wgsl */ `

    @group(0) @binding(0) var<uniform> grid: vec2f;
    @group(0) @binding(1) var<storage> cellState: array<u32>;

    struct VertexInput {
        @location(0) pos: vec2f,
        @builtin(instance_index) index: u32,
    };

    struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) cell: vec2f,
    }

    @vertex
    fn vertexMain(input: VertexInput) -> VertexOutput
    {
        let i = f32(input.index);
        let cell = vec2f(floor(i / grid.x), i % grid.x);
        let state = f32(cellState[input.index]);

        let celloffset = cell / grid * 2;
        let gridpos = (input.pos * state + 1)/grid - 1 + celloffset;

        var output: VertexOutput;
        output.pos = vec4f(gridpos, 0, 1);
        output.cell = cell;
        return output;
    }

    struct FragmentInput {
        @location(0) cell: vec2f,
    };
    
    @fragment
    fn fragmentMain(input: FragmentInput) -> @location(0) vec4f
    {
        let c = input.cell / grid;
        return vec4f(c, 0.7-c.y, 1);
    }
`