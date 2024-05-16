import { cutFile } from './utils/cutFile.js';

const inputDom = document.getElementById('upload-file');

inputDom.onchange = async (e) => {
  const file = e.target.files[0];

  console.time('cut-file');
  const chunks = await cutFile(file);
  console.timeEnd('cut-file');

  console.log('🚀 ~ inputDom.onclick= ~ chunks:', chunks);
  console.log('hash', chunks.map((i) => i.hash).join('-'));
};
