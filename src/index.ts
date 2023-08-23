import { DemoReader } from './demo';
// import { Map } from "./map";
import * as fs from 'fs';

fs.readFile('./goat-demo.demo', (_, data) => {
    const demoReader = new DemoReader(Uint8Array.from(data));

    console.log(demoReader);
});

// fs.readFile('./Yeyou_3.map', (_, data) => {
//     const map = new Map(Uint8Array.from(data));
//     console.log(map);
// });
