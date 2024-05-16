/**
 * Definition for a binary tree node.
 * class TreeNode {
 *     val: number
 *     left: TreeNode | null
 *     right: TreeNode | null
 *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.left = (left===undefined ? null : left)
 *         this.right = (right===undefined ? null : right)
 *     }
 * }
 */

/**
 * 中序遍历
 */
function getElementByMid(root: TreeNode | null): number[] {
  if (!root) return [];
  return [
    ...getElementByMid(root.left),
    root.val,
    ...getElementByMid(root.right),
  ];
}

function getAllElements(
  root1: TreeNode | null,
  root2: TreeNode | null,
): number[] {
  const leftArr = getElementByMid(root1);
  const rightArr = getElementByMid(root2);

  let result: number[] = [];

  while (leftArr.length || rightArr.length) {
    if (!rightArr.length || (leftArr.length && leftArr[0] < rightArr[0])) {
      result.push(leftArr.shift()!);
    } else {
      result.push(rightArr.shift()!);
    }
  }

  return result;
}

class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }
}
