// 这样引入后，SparkMD5 就被挂载到了 worker 上，就可以直接使用 SparkMD5 了
// @ts-ignore
import './SparkMD5.js';

/**
 * @param {File} file
 * @param {number} index 第几片
 * @param {number} chunkSize
 */
export const createChunk = (file, index, chunkSize) => {
  return new Promise((resolve) => {
    const start = index * chunkSize;
    const end = start + chunkSize;
    const blob = file.slice(start, end);

    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      spark.append(e.target.result);

      resolve({
        start,
        end,
        index,
        hash: spark.end(),
        blob,
      });
    };

    fileReader.readAsArrayBuffer(blob);
  });
};
