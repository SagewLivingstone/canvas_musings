export const compute_src = (WORKGROUP_SIZE) => /* wgsl */ `

    @group(0) @binding(0) var<uniform> grid: vec2f;

    @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
    @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

    fn cellIndex(cell: vec2u) -> u32 {
        return (cell.y % u32(grid.y)) * u32(grid.x)
                + (cell.x % u32(grid.x));
    }

    fn cellActive(x: u32, y: u32) -> u32 {
        return cellStateIn[cellIndex(vec2u(x, y))];
    }

    @compute
    @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
        let index = cellIndex(global_id.xy);
        let activeNeighbors = cellActive(global_id.x+1, global_id.y+1) +
                    cellActive(global_id.x+1, global_id.y) +
                    cellActive(global_id.x+1, global_id.y-1) +
                    cellActive(global_id.x, global_id.y-1) +
                    cellActive(global_id.x-1, global_id.y-1) +
                    cellActive(global_id.x-1, global_id.y) +
                    cellActive(global_id.x-1, global_id.y+1) +
                    cellActive(global_id.x, global_id.y+1);

        switch (activeNeighbors) {
            case 2: {
                cellStateOut[index] = cellStateIn[index];
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