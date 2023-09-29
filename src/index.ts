import { CMap as Map } from "./map";
import * as fs from 'fs';

fs.readFile('./daddy/Exhale.map', (_, data) => {
    const map = new Map(Uint8Array.from(data));
    console.log(map);
});
