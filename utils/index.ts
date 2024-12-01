import fs from 'fs';
import path from 'path';

export type IFileDetails = {
  /** 文件所在文件夹的绝对路径 */
  dirAbsPath: string;
  /** 文件绝对路径 */
  fileAbsPath: string;
  /** 文件名（不包含文件后缀） */
  fileName: string;
  /**
   * 文件后缀
   * @example .txt
   */
  ext: string;
};

/**
 * 深度遍历文件夹内的文件
 * @param dirAbsPath 需要遍历的文件夹的绝对路径
 * @param callback 对文件的处理函数
 */
export const deepEachFile = (
  dirAbsPath: string,
  callback: (detail: IFileDetails) => void,
) => {
  const files = fs.readdirSync(dirAbsPath);

  for (const fileName of files) {
    const fileAbsPath = path.join(dirAbsPath, fileName);
    const stat = fs.lstatSync(fileAbsPath);

    if (stat.isDirectory()) {
      deepEachFile(fileAbsPath, callback);
    }

    if (stat.isFile()) {
      const { name, ext } = path.parse(fileName);

      callback({
        dirAbsPath,
        fileAbsPath,
        fileName: name,
        ext,
      });
    }
  }
};
