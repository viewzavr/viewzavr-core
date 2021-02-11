// дает функцию setup(m) которая
// наполняет указанный объект m свойствами node-системы, а именно
// * m.create_obj для создания объектов, имеющих древовидность и параметры
// * m.root - корневой объект

// на вход ничего не требует


import setup_trees from "./tree/init.js";
import setup_params from "./params/init.js";
import setup_other from "./other/init.js";
import setup_events from "./events/init.js";
import setup_tree_events from "./tree-events/init.js";

//////

export default function setup(m) {

  m.create_obj = function(obj) { return obj; }
  
  m.chain = function ( name, newfn ) {
    var origfn = this[name] || function() {};
    this[name] = function() {
      return newfn.apply( {orig:origfn}, arguments );
    }
  }

  setup_trees(m);
  setup_params(m);
  
  setup_events(m);
  setup_other(m);
  
  setup_tree_events(m);

  return m;
}
