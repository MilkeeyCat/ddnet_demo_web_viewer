import { DemoReader } from './demo';
import * as fs from 'fs';

fs.readFile('./goat-demo.demo', (_, data) => {
    const demoReader = new DemoReader(Uint8Array.from(data));

    demoReader;
});
