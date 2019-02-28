import _ from './util'

function Element(tagName, props, children) {
  if (!(this instanceof Element)) {
    if (!_.isArray(children) && children != null) {
      children = _.slice(arguments, 2).filter(_.truthy)
    }
    return new Element(tagName, props, children)
  }

  if (_.isArray(props)) {
    children = props
    props = {}
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
      : document.createTextNode(child)
    el.appendChild(childEl)
  })

  return el;
}

export default Element;