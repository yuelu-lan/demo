import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * 数字位数
 */
const digit = 3;

/**
 * 待处理文件夹的绝对路径
 * NOTE: windows 路径中的“\”在 js 会被视为转义符，所以将 dirPath 放到一个 txt 文件中
 */
const workDirPath = fs.readFileSync('./dirPath.txt', 'utf-8').trim();

if (!workDirPath) {
  throw '请在 dirPath.txt 文件中输入文件夹绝对路径！';
}

/**
 * 将 1.xx 改名为 001.xx
 */
const main = () => {
  const files = fs.readdirSync(workDirPath);

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const { name, ext } = path.parse(fileName);
    const fullName = path.join(workDirPath, fileName);
    const stat = fs.lstatSync(fullName);

    if (!stat.isFile() || !/^\d+$/.test(name)) {
      continue;
    }

    if (name.length >= digit) {
      continue;
    }

    let newName = name;
    while (newName.length < digit) {
      newName = '0' + newName;
    }

    const newFullName = path.join(workDirPath, newName + ext);
    fs.rename(fullName, newFullName, (err) => {
      if (!err) {
        return;
      }

      console.error(`${fullName} 转换出错！`, err);
    });
  }
};

main();

console.log('文件名修改成功！');

// 合并 ts 分片
// copy /b *.ts main.ts
