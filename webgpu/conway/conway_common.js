
export default /* wgsl */ `
    fn cellIndex(cell: vec2u) -> u32 {
        return (cell.y % u32(grid.y)) * u32(grid.x)
                + (cell.x % u32(grid.x));
    }

    fn cellActive(x: u32, y: u32) -> u32 {
        return cellState[cellIndex(vec2u(x, y))];
    }

    fn activeNeighbors(cell: vec2u) -> u32 {
        return cellActive(cell.x+1, cell.y+1) +
               cellActive(cell.x+1, cell.y) +
               cellActive(cell.x+1, cell.y-1) +
               cellActive(cell.x, cell.y-1) +
               cellActive(cell.x-1, cell.y-1) +
               cellActive(cell.x-1, cell.y) +
               cellActive(cell.x-1, cell.y+1) +
               cellActive(cell.x, cell.y+1);
    }
`