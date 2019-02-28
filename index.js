import Element from './lib/Element'
import diff from './lib/diff';
import patch from './lib/patch';
const vdom = {
  Element,
  diff,
  patch
};

window.vdom = vdom;
export default vdom;