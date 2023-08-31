import { CMap as Map } from "./map";
import * as fs from 'fs';

fs.readFile('./daddy/Yeyou_3.map', (_, data) => {
    const map = new Map(Uint8Array.from(data));
    console.log(map);
});
