import conway_common from "./conway_common.js";

export default (WORKGROUP_SIZE) => /* wgsl */ `

    @group(0) @binding(0) var<uniform> grid: vec2f;

    @group(0) @binding(1) var<storage> cellState: array<u32>;
    @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

    ${conway_common}

    @compute
    @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
        let activeNeighbors = activeNeighbors(global_id.xy);

        let index = cellIndex(global_id.xy);
        switch (activeNeighbors) {
            case 2: {
                cellStateOut[index] = cellState[index];
            }
            case 3: {
                cellStateOut[index] = 1;
            }
            default: {
                cellStateOut[index] = 0;
            }
        }
    }

`