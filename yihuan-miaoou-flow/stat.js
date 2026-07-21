const fs = await import('node:fs');
const data = JSON.parse(fs.readFileSync('merged.json', 'utf8'));

const PRICE = {
  '《荧幕之外》': 10000,
  '《海特洛快讯》': 20000,
  '《猫会梦见什么》': 50000,
  '《拉面的艺术》': 50000,
  '《在书本之外》': 50000,
};

const parseAward = (a) => {
  if (!a) return 0;
  const m = a.match(/方斯\*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};

const fmt = (n) => n.toLocaleString('zh-CN');

const perCard = new Map();
const gainByAward = new Map();
let totalCost = 0;
let totalGain = 0;

for (const it of data) {
  const card = it.scratchCardId;
  const cost = PRICE[card];
  if (cost === undefined) {
    console.warn(`未知读物: ${card}（消耗按 0 计）`);
  } else {
    totalCost += cost;
  }
  const gain = parseAward(it.award);
  totalGain += gain;

  let entry = perCard.get(card);
  if (!entry) { entry = { count: 0, gain: 0 }; perCard.set(card, entry); }
  entry.count += 1;
  entry.gain += gain;

  const awardKey = it.award || '(空)';
  gainByAward.set(awardKey, (gainByAward.get(awardKey) || 0) + 1);
}

console.log('== 按读物统计 ==');
for (const [card, e] of [...perCard.entries()].sort((a, b) => PRICE[a[0]] - PRICE[b[0]])) {
  const cost = (PRICE[card] || 0) * e.count;
  const profit = e.gain - cost;
  console.log(`${card}  ${e.count}次  消耗 ${fmt(cost)}  获得 ${fmt(e.gain)}  收益 ${fmt(profit)}`);
}

console.log('\n== 获得明细（按奖金档）==');
for (const [award, count] of [...gainByAward.entries()].sort((a, b) => parseAward(a[0]) - parseAward(b[0]))) {
  const unit = parseAward(award);
  console.log(`${award.padEnd(14)} ${count}次 × ${unit} = ${fmt(count * unit)}`);
}

console.log('\n== 汇总 ==');
console.log(`总消耗：${fmt(totalCost)} 方斯`);
console.log(`总获得：${fmt(totalGain)} 方斯`);
console.log(`流水（消耗+获得）：${fmt(totalCost + totalGain)} 方斯`);
console.log(`收益（获得-消耗）：${fmt(totalGain - totalCost)} 方斯`);
console.log(`记录总数：${data.length} 条`);
