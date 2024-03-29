// потребность: должен быть параметр-ссылка на другой объект
// решение: добавляет гуи для хранения ссылки на другой объект
// особенности: если мы ставим ссылку на другой объект,то должны забывать о ней 
// в случае удаления того объекта.

// словарь obj.references хранит список имен параметров, являющихся ссылками

// короче этот файл про хранение ссылок в целом

// идея - может не crit-fn а а) функция поставки объектов в целом? б) набор фич для поиска?
// update - наверное функция поставки объектов. а фичи или какие там другие критерии - вопрос отдельный

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

      let t = typeof(value);
      if (value !== null && t !== "string" && t !== "undefined" && !(value && value.setParam)) {
          console.error("setting invalid value to reference parameter. assign skipped. obj=",x.getPath(),"param=",name,"value=",value);
          return this.orig( name, value );
      }

      var f = x.getParamOption(name,"tree_func");
      var tree_to_find_in = f ? f() : x;

      var obj = vz.find_by_path( tree_to_find_in,value,tree_to_find_in ); 

      if (obj) {
        ref_event_unbinds[ name ] = obj.on("parent_change",() => { // это включает в себя и remove
          // а зачем это вообще?
          // ммм... ммм.. ну типа сменился парент.. у объекта на который ссылались... 
          // и типа мы тут тогда обратно строчку пишем тудысь.. ну ладно... хм...
          x.setParam( name, ref_values[name], x.getParamManualFlag( name ) );
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

    // важный момент инфа что это ссылка может прийти сильно позже
    // (так вышло с компалангой почему-то) - надоть отреагировать и тогда
    let curvalue = x.params[name];
    if (typeof(curvalue) == 'string')
        //x.setParam( name, curvalue, x.getParamManualFlag(name) ); 
        // вроде как надо с событием, если там получится.. чтобы всякие get-ы сработали кто на этот параметр опирается
        // но нет. там сами вышлют событие. так решил. а то setParam не чухает что значение поменялось и тупит
        x.setParamWithoutEvents( name, curvalue, x.getParamManualFlag(name) );
    
  }
  
  x.isReference = function(name) {
    return x.references && x.references[name]
  }
  
  // R-SETREF-OBJ
  ref_as_obj_setup( x );

  return x;
}
