const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB
const THREAD_COUNT = navigator.hardwareConcurrency ?? 4;

export const cutFile = (file) => {
  return new Promise((resolve) => {
    const chunkCount = Math.ceil(file.size / CHUNK_SIZE);

    /**
     * 每个线程需要处理多少个 chunk
     */
    const threadChunkCount = Math.ceil(chunkCount / THREAD_COUNT);
    const chunks = [];
    /**
     * 有多少的线程完成了
     */
    let finishWorkerCount = 0;

    for (let i = 0; i < THREAD_COUNT; i++) {
      // 创建一个工作者线程，并分配任务（Worker 独立于主线程）
      const worker = new Worker(
        // 绝对路径
        new URL('../workers/worker.js', import.meta.url),
        // 相对路径（是以 index.html 为基准）
        // './workers/worker.js',
        {
          type: 'module',
        },
      );

      const startChunkIndex = i * threadChunkCount;
      /**
       * NOTE: endChunkIndex 在下一个线程
       */
      let endChunkIndex = (i + 1) * threadChunkCount;
      if (endChunkIndex > chunkCount) {
        endChunkIndex = chunkCount;
      }

      worker.postMessage({
        file,
        CHUNK_SIZE,
        startChunkIndex,
        endChunkIndex,
      });

      worker.onmessage = (e) => {
        for (let i = startChunkIndex; i < endChunkIndex; i++) {
          chunks[i] = e.data[i - startChunkIndex];
        }
        // 结束线程
        worker.terminate();
        finishWorkerCount++;

        // 全部线程都完成了
        if (finishWorkerCount === THREAD_COUNT) {
          resolve(chunks);
        }
      };
    }
  });
};
