// import _ from './util';
import patch from './patch';


function diff(oldTree, newTree) {
  const patches = {};
  const index = {
    value: 0
  }

  dfsWalk(oldTree, newTree, index, patches)
  return patches;
}
/**
 * diffProps：比较属性变化
 * @param {*} oldProps 
 * @param {*} newProps 
 * @param {*} index 
 * @param {*} currentIndexPatches 
 */
function diffProps(oldProps, newProps, index, currentIndexPatches) {
  //遍历旧的属性，找到被删除的修改的情况
  for (const propKey in oldProps) {
    //新的属性中不存在，旧属性存在，属性被删除
    if (!newProps.hasOwnProperty(propKey)) {
      currentIndexPatches.push({
        type: patch.NODE_ATTRIBUTE_DELETE,
        key: propKey,
      })
    } else if (newProps[propKey] !== oldProps[propKey]) {
      //新旧属性都存在，但值不同：属性被修改
      currentIndexPatches.push({
        type: patch.NODE_ATTRIBUTE_MODIFY,
        key: propKey,
        alue: newProps[propKey]
      })
    }
  }

  //遍历新元素，找到增加的部分
  for (const propKey in newProps) {
    //旧属性中不存在，新属性中存在：增加属性
    if (!oldProps.hasOwnProperty(propKey)) {
      currentIndexPatches.push({
        type: patch.NODE_ATTRIBUTE_ADD,
        key: propKey,
        value: newProps[propKey]
      })
    }
  }
}

/**
 * diffChildren：顺序比较子元素的变化
 * @param {*} oldChildren 
 * @param {*} newChildren 
 * @param {*} index 
 * @param {*} currentIndexPatches 
 * @param {*} patches 
 */
function diffChildren(oldChildren, newChildren, index, currentIndexPatches, patches) {
  const currentIndex = index.value;
  if (oldChildren.length < newChildren.length) {
    //有元素被添加
    let i = 0;
    for (; i < oldChildren.length; i++) {
      index.value++;
      dfsWalk(oldChildren[i], newChildren[i], index, patches)
    }
    console.log('多出来的节点：'+i)
    for (; i < newChildren.length; i++) {
      currentIndexPatches.push({
        type: patch.NODE_ADD,
        value: newChildren[i]
      })
    }
  }else{
    //对比新旧子元素的变化
    for(let i = 0; i<oldChildren.length; i++){
      index.value++;
      dfsWalk(oldChildren[i],newChildren[i],index,patches)
    }
  }
}
/**
 * dfsWalk:比较innerHtml的变化
 * @param {*} oldNode 
 * @param {*} newNode 
 * @param {*} index 
 * @param {*} patches 
 */
function dfsWalk(oldNode,newNode,index,patches){
  const currentIndex = index.value;
  const currentIndexPatches = [];
  if(newNode === undefined){
    //节点被移除
    currentIndexPatches.push({
      type:patch.NODE_DELETE,
    })
  }else if(typeof oldNode === 'string' && typeof newNode === 'string'){
    if(oldNode !== newNode){
      currentIndexPatches.push({
        type:patch.NODE_TEXT_MODIFY,
        value:newNode,
      })
    }
  } else if(oldNode.tagName === newNode.tagName && oldNode.key === newNode.key){
    diffProps(oldNode.props,newNode.props,index,currentIndexPatches);
    diffChildren(oldNode.children,newNode.children,index,currentIndexPatches,patches)
  }else{
    currentIndexPatches.push({
      type:patch.NODE_REPLACE,
      value:newNode
    })
  }
  if(currentIndexPatches.length > 0){
    patches[currentIndex] = currentIndexPatches;
  }
}

export default diff;