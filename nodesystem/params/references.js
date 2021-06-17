// потребность: должен быть параметр-ссылка на другой объект
// решение: добавляет гуи для хранения ссылки на другой объект
// особенности: если мы ставим ссылку на другой объект,то должны забывать о ней 
// в случае удаления того объекта.

import ref_as_obj_setup from "./ref-as-obj.js";

export default function setup(vz, x) {
  
  x.addObjRef = function( name, value, crit_fn, fn ) {
    x.setReference( name ); // флаг что это ссылка
    var rec = x.addGui( { type: "objref", name: name, value: value, crit_fn: crit_fn, fn: fn } );
    return rec;
  }
  x.addObjectRef = x.addObjRef;
  
  x.chain("setParam",function (name, value) {
    if (x.isReference( name )) {
      // ага это ссылка
      var xpath = vz.get_path( x );

      var old = x.getParam( name );
      if (old) {
        var oldobj = vz.find_by_path( x, old );
        if (oldobj && oldobj.references_to_me) {
          delete oldobj.references_to_me[ xpath ];
        }
      }
      
      var obj = vz.find_by_path( x,value );

      if (obj) {
        if (!obj.references_to_me) obj.references_to_me = {};
        obj.references_to_me[ xpath ] = name;
      }
    }
    //x.setReference( name, value ); // ставим флаг что у нас есть ссылка
    this.orig( name, value );
  });
  
  x.setReference = function( name ) {
    if (!x.references) x.references = {};
    x.references[name] = true;
  }
  
  x.isReference = function(name) {
    return x.references && x.references[name]
  }
  

    // забыть все ссылки на нас надо
  x.chain("remove",function() {
    Object.keys( x.references_to_me || {} ).forEach( function(k) {
      var ko = vz.find_by_path( vz.root, k );
      if (ko) {
        var pn = x.references_to_me[k];
        ko.setReference( pn, undefined );
      }
    });
    this.orig();
  });
  
  // R-SETREF-OBJ
  ref_as_obj_setup( x );

  return x;
}
