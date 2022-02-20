// потребность: должен быть параметр-ссылка на другой объект
// решение: добавляет гуи для хранения ссылки на другой объект
// особенности: если мы ставим ссылку на другой объект,то должны забывать о ней 
// в случае удаления того объекта.

// словарь obj.references хранит список имен параметров, являющихся ссылками

// короче этот файл про хранение ссылок в целом

// идея - может не crit-fn а а) функция поставки объектов в целом? б) набор фич для поиска?

import ref_as_obj_setup from "./ref-as-obj.js";

export default function setup(vz, x) {
  
  x.addObjRef = function( name, value, crit_fn, fn ) {
    x.setReference( name ); // флаг что это ссылка
    var rec = x.addGui( { type: "objref", name: name, value: value, crit_fn: crit_fn, fn: fn } );
    return rec;
  }
  x.addObjectRef = x.addObjRef;

  var ref_values = {};        // хранит поданные в setParam пути к объектам
  var ref_event_unbinds = {}; // функции отписки от объектов
  
  x.chain("setParamWithoutEvents",function (name, value) {
    if (x.isReference( name )) {
      // ага это ссылка
      if (ref_event_unbinds[ name ]) ref_event_unbinds[ name ]();

      var obj = vz.find_by_path( x,value ); // todo fix use start tree, see ref-as-obj

      if (obj) {
        ref_event_unbinds[ name ] = obj.on("parent_change",() => { // это включает в себя и remove
          x.setParam( name, ref_values[name] );
        });
      } else ref_event_unbinds[ name ] = null;

      ref_values[name] = value?.getPath ? value.getPath() : value;
    }
    //x.setReference( name, value ); // ставим флаг что у нас есть ссылка
    return this.orig( name, value );
  });
  
  x.setReference = function( name ) {
    if (!x.references) x.references = {};
    x.references[name] = true;
  }
  
  x.isReference = function(name) {
    return x.references && x.references[name]
  }
  
  // R-SETREF-OBJ
  ref_as_obj_setup( x );

  return x;
}
