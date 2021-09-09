// добавляет понятие списка детей в obj
// добавляет методы .appendChild, .removeChild и т.п.
// особенность - считается что это единичная иерархия

import rename_feature from "./feature-auto-rename-child.js";
import items_feature from "./feature-items.js";

// nf это функция которая по объекту выдает область его древовидных штук..
export default function setup( obj, nf ) {

  var _obj = obj;
  obj = nf( obj );

  obj.children = [];
  obj.childrenTable = {};
  var gcounter = 0;
  
  obj.appendChild = function( cobj,name,enableRename ) {
    var cnf = nf( cobj );
    if (cnf.parent)  cnf.parent.ns.forgetChild( cobj );

    if (!obj.hasChild( cobj)) obj.children.push( cobj );
    if (!name) {
      console.error("WARNING: appendChild: no name specified");
    }
    
    if (name) {
      obj.childrenTable[ name ] = cobj;
    }
    
    cnf.parent = _obj;
    cnf.name   = name;
  }
  
  // appendChildWithName ? и тогда трекать что объект уже есть?..
  obj.setChildName = function( cobj, name ) {
    obj.childrenTable[ name ] = cobj;
    nf(cobj).name = name;
  };
  
  obj.hasChild = function( cobj ) {
    var i = obj.children.indexOf( cobj );
    return (i >= 0);
  }

  obj.forgetChild = function( cobj ) {
    var i = obj.children.indexOf( cobj );
    if (i >= 0) obj.children.splice( i,1 );

    Object.keys( obj.childrenTable ).forEach(key => {
      if (obj.childrenTable[ key ] == cobj)
          delete obj.childrenTable[ key ];
    });
  }

  obj.getChildren = function() { return obj.children; }
  
  obj.getChildByName = function(name) {
    return obj.childrenTable[ name ];
  }
  
  obj.getChildNames = function() {
    return Object.keys( obj.childrenTable );
  }

  // call .remove on all children
  obj.removeChildren = function() {
    let list = obj.getChildren().slice(0);
    for (let c of list) c.remove();
  }

  _obj.chain("remove", function() {
    if (obj.parent) {
      nf(obj.parent).forgetChild( _obj );
      obj.parent = null;
    }
    this.orig();
  });
  
  rename_feature( _obj,nf );
  items_feature( _obj, nf );

  return obj;
}
