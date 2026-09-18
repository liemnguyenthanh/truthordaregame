import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const template=readFileSync('scripts/sw-template.js','utf8');
const version=createHash('sha256').update(template).update(new Date().toISOString()).digest('hex').slice(0,12);
writeFileSync('public/sw.js',template.replace('__VERSION__',version));
