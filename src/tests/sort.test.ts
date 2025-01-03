import { readFileSync } from "fs";
import t from 'tap'
import { sortThread, formatThread, ThreadSortableItem } from "../index.js";

const raw = readFileSync('./src/tests/comments.json').toString();
const json = JSON.parse(raw) as ThreadSortableItem[];

t.test('sort thread', async () => {
  const sorted = sortThread(json);
  
  t.equal(sorted[0].id, '1');
  t.equal(sorted[3].id, '7');
  t.equal(sorted[7].id, '10');
  t.equal(sorted[9].id, '9');

  console.log(formatThread(sorted));
  t.end();
});