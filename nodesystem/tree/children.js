// добавляет понятие списка детей в obj
// добавляет методы .appendChild, .removeChild и т.п.
// особенность - считается что это единичная иерархия

import rename_feature from "./feature-auto-rename-child.js";
import manual_rename_feature from "./feature-manual-rename-child.js";
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

    if (obj.removed) {
      console.error("WARNING: adding to removed obj");
    }

    if (!obj.hasChild( cobj )) obj.children.push( cobj );
    
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
    //obj.childrenTable[ name ] = cobj;
    nf(cobj).name = name;
    obj.updateChildrenTable();
  };
  
  obj.hasChild = function( cobj ) {
    var i = obj.children.indexOf( cobj );
    return (i >= 0);
  }

  obj.forgetChild = function( cobj ) {
    
    var i = obj.children.indexOf( cobj );
    if (i >= 0) obj.children.splice( i,1 );

    obj.updateChildrenTable();
    /*
    Object.keys( obj.childrenTable ).forEach(key => {
      if (obj.childrenTable[ key ] == cobj)
          delete obj.childrenTable[ key ];
    });
    */
  }

  obj.getChildren = function() { return obj.children; }
  obj.setChildren = (arr) => {
    obj.children = arr;
    obj.updateChildrenTable();
  }
  obj.updateChildrenTable = () => {
    let ct = {};
    for (let c of obj.children) ct[ nf(c).name ] = c;
    //obj.childrenTable = ct; // так нельзя стирать ибо у нас на childrenTable ссылка стоит из items и из $vz_items
    for (let k of Object.keys(obj.childrenTable))
       delete obj.childrenTable[k];
    Object.assign( obj.childrenTable, ct );
  }
  
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
  manual_rename_feature( _obj, nf );

  return obj;
}
