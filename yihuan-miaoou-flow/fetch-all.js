const START = '2026-07-02 00:00:00';
const STEP_MS = 7 * 24 * 3600 * 1000;
const boundary = '----WebKitFormBoundaryo3A96XEyAkGfI1O5';
const CRLF = '\r\n';

const cookie = '<在此填入 cookie，登录 kf.wanmei.com 后从浏览器导出>';

const headers = {
  accept: '*/*',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
  'content-type': `multipart/form-data; boundary=${boundary}`,
  'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Microsoft Edge";v="150"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  cookie,
  Referer: 'https://kf.wanmei.com/selfItemFlowQuery?gameId=191',
};

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const encodeTime = (s) => s.replace(/ /g, '+').replace(/:/g, '%3A');

function buildBody(startStr, endStr) {
  const startEnc = encodeTime(startStr);
  const endEnc = encodeTime(endStr);
  const queryStr = `capTicket=&secCode=&typeId=29&gameId=191&server=&roleId=219012188065&itemType=13&itemSubType=1&item5=110&item12=&startTime=${startEnc}&endTime=${endEnc}&pageSize=1000&pageNo=1&item=`;
  const fields = [
    ['capTicket', ''], ['secCode', ''], ['typeId', '29'], ['gameId', '191'], ['server', ''],
    ['roleId', '219012188065'], ['itemType', '13'], ['item1', ''], ['itemSubType', '1'],
    ['item4', ''], ['item5', '110'], ['item8', ''], ['item11', ''], ['item12', ''],
    ['startTime', startStr], ['endTime', endStr], ['pageSize', '1000'], ['pageNo', '1'], ['item', ''],
  ];
  let body = '';
  for (const [name, value] of fields) {
    body += `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`;
  }
  for (let i = 0; i < queryStr.length; i++) {
    body += `--${boundary}${CRLF}Content-Disposition: form-data; name="${i}"${CRLF}${CRLF}${queryStr[i]}${CRLF}`;
  }
  body += `--${boundary}--${CRLF}`;
  return body;
}

async function querySeg(startStr, endStr) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://kf.wanmei.com/selfItemFlowQuery/search', {
        method: 'POST', headers, body: buildBody(startStr, endStr),
      });
      const parsed = JSON.parse(await res.text());
      if (parsed.code === 0) return parsed.data;
      console.log(`  attempt ${attempt + 1} 失败: ${parsed.message}`);
    } catch (err) {
      console.log(`  attempt ${attempt + 1} 异常: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`查询失败: ${startStr} ~ ${endStr}`);
}

const startMs = Date.parse(START);
const endMs = Date.now();

const segments = [];
let s = startMs;
while (s < endMs) {
  const e = Math.min(s + STEP_MS, endMs);
  segments.push([fmtDate(s), fmtDate(e)]);
  s = e + 1000;
}

const merged = [];
const failedSegs = [];
for (const [startStr, endStr] of segments) {
  console.log(`查询 ${startStr} ~ ${endStr}`);
  try {
    const data = await querySeg(startStr, endStr);
    const result = data.result || [];
    console.log(`  total=${data.total} 返回=${result.length} 条`);
    for (const item of result) {
      merged.push({ logTime: item.logTime, scratchCardId: item.scratchCardId, award: item.award });
    }
  } catch (err) {
    console.error(err.message);
    failedSegs.push([startStr, endStr]);
  }
  await new Promise((r) => setTimeout(r, 500));
}

merged.sort((a, b) => (a.logTime < b.logTime ? -1 : a.logTime > b.logTime ? 1 : 0));
const { writeFileSync } = await import('node:fs');
writeFileSync('merged.json', JSON.stringify(merged, null, 2));
console.log(`\n完成: 共 ${merged.length} 条, 保存到 merged.json`);
console.log('最早:', merged[0]);
console.log('最晚:', merged[merged.length - 1]);
if (failedSegs.length) {
  console.log(`\n失败 ${failedSegs.length} 段:`);
  for (const [s, e] of failedSegs) console.log(`  ${s} ~ ${e}`);
}
