import { CMap } from "./map";
import * as fs from 'fs';

fs.readFile('./daddy/Exhale.map', (_, data) => {
    const map = CMap.fromBytes(Uint8Array.from(data));
    console.log(map);
});
