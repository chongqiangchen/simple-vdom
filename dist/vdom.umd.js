(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, (global.vdom = global.vdom || {}, global.vdom.js = factory()));
}(this, function () { 'use strict';

  var _ = {};

  _.type = function (obj) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g,'')
  };

  _.isArray = function isArray(list) {
    return _.type(list) === 'Array'
  };

  _.slice = function slice(arrayLike,index) {
    return Array.prototype.slice.call(arrayLike,index)
  };

  _.truthy = function truthy(value) {
    return !!value
  };

  _.isString = function isString(list) {
    return _.type(list) === 'String'
  };

  _.each = function each(array,fn) {
    for(var i = 0,len=array.length;i<len;i++){
      fn(array[i],i);
    }
  };

  _.toArray = function toArray(listLike) {
    if(!listLike){
      return []
    }
    var list = [];
    for(var i = 0,len=listLike.length; i<len; i++){
      list.push(listLike[i]);
    }

    return list
  };

  _.setAttr = function setAttr(node,key,value) {
    switch(key){
      case 'style':
        node.style.cssText = value;
        break
      case 'value':
        var tagName = node.tagName || '';
        tagName = tagName.toLowerCase();
        if(tagName === 'input' || tagName === 'textarea'){
          node.value = value;
        }else{
          node.setAttribute(key,value);
        }
        break
      default:
        node.setAttribute(key,value);
        break
    }
  };

  function Element(tagName, props, children) {
    if (!(this instanceof Element)) {
      if (!_.isArray(children) && children != null) {
        children = _.slice(arguments, 2).filter(_.truthy);
      }
      return new Element(tagName, props, children)
    }

    if (_.isArray(props)) {
      children = props;
      props = {};
    }

    this.tagName = tagName;
    this.props = props || {};
    this.children = children || {};
    this.key = this.props.key || void 0;
  }

  Element.prototype.render = function () {
    var el = document.createElement(this.tagName);
    var props = this.props;

    for (var propName in props) {
      el.setAttribute(propName, props[propName]);
    }

    var children = this.children || [];

    children.forEach(function (child) {
      var childEl = (child instanceof Element) 
        ? child.render() 
        : document.createTextNode(child);
      el.appendChild(childEl);
    });

    return el;
  };

  function patch($dom, patches) {
    const index = {
      value: 0
    };
    dfsWalk($dom, index, patches);
  }

  patch.NODE_DELETE = 'NODE_DELETE'; //节点被删除
  patch.NODE_TEXT_MODIFY = 'NODE_TEXT_MODIFY'; //文本节点被更改
  patch.NODE_REPLACE = 'NODE_REPLACE'; //节点被替换
  patch.NODE_ADD = 'NODE_ADD'; //增加节点
  patch.NODE_ATTRIBUTE_MODIFY = 'NODE_ATTRIBUTE_MODIFY'; //更新属性
  patch.NODE_ATTRIBUTE_ADD = 'NODE_ATTRIBUTE_ADD'; //增加属性
  patch.NODE_ATTRIBUTE_DELETE = 'NODE_ATTRIBUTE_DELETE'; //删除属性

  //根据不同类型的差异对当前节点进行DOM操作：

  function dfsWalk($node, index, patches, isEnd = false) {
    if (patches[index.value]) {
      patches[index.value].forEach(function (p) {
        switch (p.type) {
          case patch.NODE_ATTRIBUTE_MODIFY:
            {
              $node.setAttribute(p.key, p.value);
              break;
            }
          case patch.NODE_ATTRIBUTE_DELETE:
            {
              $node.removeAttribute(p.key, p.value);
              break;
            }
          case patch.NODE_ATTRIBUTE_ADD:
            {
              $node.setAttribute(p.key, p.value);
              break;
            }
          case patch.NODE_ADD:
            {
              $node.appendChild(p.value.render());
              break;
            }
          case patch.NODE_TEXT_MODIFY:
            {
              $node.textContent = p.value;
              break;
            }
          case patch.NODE_REPLACE:
            {
              $node.replaceWith(p.value.render());
              break;
            }
          case patch.NODE_DELETE:
            {
              $node.remove();
              break;
            }
          default:
            {
              console.log(p);
            }
        }
      });
    }
    if(isEnd){
      return;
    }
    if($node.children.length > 0){
      for(let i = 0; i<$node.children.length;i++){
        index.value++;
        dfsWalk($node.children[i],index,patches);
      }
    }else{
      index.value++;
      dfsWalk($node,index,patches,true);
      
    }
  }

  // import _ from './util';


  function diff(oldTree, newTree) {
    const patches = {};
    const index = {
      value: 0
    };

    dfsWalk$1(oldTree, newTree, index, patches);
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
        });
      } else if (newProps[propKey] !== oldProps[propKey]) {
        //新旧属性都存在，但值不同：属性被修改
        currentIndexPatches.push({
          type: patch.NODE_ATTRIBUTE_MODIFY,
          key: propKey,
          alue: newProps[propKey]
        });
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
        });
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
        dfsWalk$1(oldChildren[i], newChildren[i], index, patches);
      }
      console.log('多出来的节点：'+i);
      for (; i < newChildren.length; i++) {
        currentIndexPatches.push({
          type: patch.NODE_ADD,
          value: newChildren[i]
        });
      }
    }else{
      //对比新旧子元素的变化
      for(let i = 0; i<oldChildren.length; i++){
        index.value++;
        dfsWalk$1(oldChildren[i],newChildren[i],index,patches);
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
  function dfsWalk$1(oldNode,newNode,index,patches){
    const currentIndex = index.value;
    const currentIndexPatches = [];
    if(newNode === undefined){
      //节点被移除
      currentIndexPatches.push({
        type:patch.NODE_DELETE,
      });
    }else if(typeof oldNode === 'string' && typeof newNode === 'string'){
      if(oldNode !== newNode){
        currentIndexPatches.push({
          type:patch.NODE_TEXT_MODIFY,
          value:newNode,
        });
      }
    } else if(oldNode.tagName === newNode.tagName && oldNode.key === newNode.key){
      diffProps(oldNode.props,newNode.props,index,currentIndexPatches);
      diffChildren(oldNode.children,newNode.children,index,currentIndexPatches,patches);
    }else{
      currentIndexPatches.push({
        type:patch.NODE_REPLACE,
        value:newNode
      });
    }
    if(currentIndexPatches.length > 0){
      patches[currentIndex] = currentIndexPatches;
    }
  }

  const vdom = {
    Element,
    diff,
    patch
  };

  window.vdom = vdom;

  return vdom;

}));
