// тут сидят разные прочие фичи

//import obj_chain_setup from "./obj-chain.js";
//import obj_defaults_setup from"./obj-have-defaults.js";
import setup_find from "./find.js";

export default function setup(m) {

  setup_find( m );
  
  /////// фича "при удалении у объекта ставится флаг что он удален"
  // эта фича надо потому что асинхронная загрузка файлов бывает прилетает когда объект уже решили удалить

  m.chain( "create_obj", function (obj,options) {
    obj.chain( "remove", function () {
      if (obj.ns.getChildren().length > 0)
        debugger;
      obj.removed = true;
      return this.orig();
    });
    return this.orig( obj, options );
  });

  ///////// фича "у объекта есть метод chain"

  m.chain( "create_obj", function (obj,options) {

    obj.chain = function( name, newfn ) {
      return m.chain.call( obj, name, newfn );
    }

    return this.orig( obj, options );
  } );
  

/* эта фича отменяется - вьюзавр и деревА объектов пусть будут независимы для красоты
  //////// фича "у объекта если не указан парент то это m.root

  m.chain( "create_obj", function(obj,opts) {
    if (!opts.parent && m.root) {
      opts.parent = m.root;
      //if (!opts.name) opts.name = opts.type || "item";
    };
    return this.orig( obj, opts );
  });
*/ 
  
  ////////// фича "у всякого объекта есть имя"
  m.chain( "create_obj", function(obj,opts) {
    if (!opts.name) {
         opts.name = opts.type || "item";
    }
    return this.orig( obj, opts );
  });
  
  ////////// фича "у объекта есть метод create_obj"
  
  m.chain( "create_obj", function (obj,options) {

    obj.create_obj = function( newobj, opts ) {
      if (!opts) opts = {};
      opts.parent = obj;
      //debugger;
      return m.create_obj.call( m, newobj, opts );
    }

    return this.orig( obj, options );
  } );  
  
  /////// фича "у объекта есть поле vz - ссылка на вьюзавра"

  m.chain( "create_obj", function (obj,options) {
    obj.vz = m;
    return this.orig( obj, options );
  });  
  
  /////// фича "у объекта можно подавать ему пустые параметры"

  m.chain( "create_obj", function (obj,options) {
    return this.orig( obj || {}, options || {} );
  });

  /////// фича "remove" вызывает событие remove
  m.chain( "create_obj", function (obj,options) {
    var res = this.orig( obj, options );
    obj.chain( "remove", function () {
      //console.log("emitting remove",obj.getPath(),obj)
      obj.removing=true;
      obj.emit("coremove");
      obj.emit("remove");
      return this.orig();
    });  
    return res;
  });
  
}