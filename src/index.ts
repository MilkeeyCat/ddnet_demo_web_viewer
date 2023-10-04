import { DemoReader } from "./demo";
import * as fs from 'fs';

fs.readFile("./daddy/Kobra2.demo", (_, data) => {
    const demo = new DemoReader(data);
    console.log(demo.demo.chunks);
})
