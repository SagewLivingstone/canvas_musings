import conway_common from "./conway_common.js";

export default /* wgsl */ `

    @group(0) @binding(0) var<uniform> grid: vec2f;
    @group(0) @binding(1) var<storage> cellState: array<u32>;

    ${conway_common}

    struct VertexInput {
        @location(0) pos: vec2f,
        @builtin(instance_index) index: u32,
    };

    struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) @interpolate(flat) cell: vec2u,
    }

    @vertex
    fn vertexMain(input: VertexInput) -> VertexOutput
    {
        let i = f32(input.index);
        let cell = vec2u(u32(i % grid.x), u32(floor(i / grid.x)));
        let state = f32(cellState[input.index]);

        let celloffset = vec2f(cell.xy) / grid * 2;
        let gridpos = (input.pos * state + 1)/grid - 1 + celloffset;

        var output: VertexOutput;
        output.pos = vec4f(gridpos, 0, 1);
        output.cell = cell;
        return output;
    }

    struct FragmentInput {
        @location(0) @interpolate(flat) cell: vec2u,
    };
    
    @fragment
    fn fragmentMain(input: FragmentInput) -> @location(0) vec4f
    {
        // let c = input.cell / grid;
        let neighbors = f32(activeNeighbors(input.cell));
        let np = neighbors / 8;
        let hotcolor = vec3f(1.9, 0.55, 0);
        let coldcolor = vec3f(0.226, 0, 0.615);
        let color = mix(coldcolor, hotcolor, np);
        return vec4f(color, 1);
    }
`