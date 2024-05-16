import { createChunk } from './createChunk.js';

onmessage = async (e) => {
  const { file, CHUNK_SIZE, startChunkIndex, endChunkIndex } = e.data;

  const promises = [];
  for (let i = startChunkIndex; i < endChunkIndex; i++) {
    promises.push(createChunk(file, i, CHUNK_SIZE));
  }

  const chunks = await Promise.all(promises);
  postMessage(chunks);
};
