import fs from 'fs';
import path from 'path';
import { deepEachFile, IFileDetails } from '../utils/index';

/**
 * 待处理文件夹的绝对路径
 * NOTE: windows 路径中的“\”在 js 会被视为转义符，所以将 dirPath 放到一个 txt 文件中
 */
const workDirAbsPath = fs
  .readFileSync(path.join(__dirname, './dirPath.txt'), 'utf-8')
  .trim();

if (!workDirAbsPath) {
  throw '请在 dirPath.txt 文件中输入文件夹绝对路径！';
}

const defaultFontFamily = 'SourceHanSerifCN-Bold';

/**
 * 缓存需要跳过的文件夹，避免重复计算
 */
const skipDirs: Record<string, boolean> = {};

const assHandle = ({
  dirAbsPath,
  fileAbsPath,
  fileName,
  ext,
}: IFileDetails) => {
  if (!['.ass'].includes(ext) || skipDirs[dirAbsPath]) {
    return;
  }

  const files = fs.readdirSync(dirAbsPath);
  for (const file of files) {
    // 如果文件夹内存在 xxx.OV.ass 的文件，代表以前已经处理过了
    if (file.includes('OV.ass')) {
      // 缓存
      skipDirs[dirAbsPath] = true;
      return;
    }
  }

  const fileStr = fs.readFileSync(fileAbsPath, 'utf-8').trim();
  // 创建文件副本
  fs.copyFileSync(
    fileAbsPath,
    path.join(dirAbsPath, `${fileName}.OV${ext}`),
    fs.constants.COPYFILE_EXCL,
  );

  /**
   * 1. Style: Default,微软雅黑,20,&H00FDFEFE
   * 2. Default,,0,0,0,,{\fn黑体}美 国 往 事
   * 3. {\fn微软雅黑\c&H000000&\4c&H000000&}
   */
  const result = fileStr
    .replaceAll(/Style: [^,]+,[^,]+/g, (str) => {
      const fragments = str.split(',');
      fragments[1] = defaultFontFamily;

      return fragments.join(',');
    })
    .replaceAll(/{\\fn[^\\]+}/g, '')
    .replaceAll(/\\fn[^\\]+/g, '');

  fs.writeFile(fileAbsPath, result, (err) => {
    if (!err) {
      return;
    }

    console.error(`${fileName} 写入出错！`, err);
  });
};

const main = () => {
  deepEachFile(workDirAbsPath, assHandle);
};

main();
