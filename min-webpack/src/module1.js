import module1_1 from './module1-1.js';

const module_name = 'module1';
console.log('🚀 ~ module_name:', module_name);

export default {
  module_name,
  child: [module1_1],
};
