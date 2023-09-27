import { CMap as Map } from "./map";
import * as fs from 'fs';

fs.readFile('./daddy/Kobra2_solo.map', (_, data) => {
    const map = new Map(Uint8Array.from(data));
    console.log(map);
});
