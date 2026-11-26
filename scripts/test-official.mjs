import assert from 'node:assert/strict';
import {parseOfficial,number} from './official-tracking.mjs';
const row=(time,status,office)=>`<tr><td>${time}</td><td>${status}</td><td>${office}</td><td></td></tr>`;
const html=rows=>`${number}<table><th>Date</th><th>Status</th><th>Post office/Airport</th>${rows}</table>`;
let d=parseOfficial(html(row('13:02 24-Nov-2026','Ready for dispatch','CNSHAD')+row('09:08 26-Nov-2026','Arrival at inward office of exchange','INTERNATIONAL POST OFFICE')+row('17:53 26-Nov-2026','Arrival at Office of Exchange','Integrated Mail Center')));
assert.equal(d.events.length,3);assert.equal(d.stage,'korea');assert.equal(d.location,null);assert.equal(d.events[0].time,'2026-11-26T17:53:00+09:00');assert.equal(d.events[2].city.zh,'上海');
assert.throws(()=>parseOfficial('<html>Service unavailable</html>'));assert.throws(()=>parseOfficial(html('')));assert.throws(()=>parseOfficial(html(row('invalid date','Delivered','office'))));
d=parseOfficial(html(row('10:00 27-Nov-2026','Delivered','office')));assert.equal(d.stage,'delivered');
console.log('PASS official rows, timezone, bilingual states, unknown city, rejected pages and delivery');
