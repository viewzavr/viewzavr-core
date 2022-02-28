// special variables useful for debugging
// also $vz_path used for caching

export default function setup( vz ) {

  //////////////////////////////// $vzpath
  // 1. caching, 2. debug in browser - see as soon as possible
  var orig0 = vz.get_path;
  vz.get_path = function(obj) {
    if (!obj) return undefined;
    obj.$vz_path ||= orig0( obj );
    return obj.$vz_path;
  }

  /*
  vz.chain("get_path",function(obj) => {
    this.orig
  });*/
  
  var orig1 = vz.addTreeToObj;
  vz.addTreeToObj = function(obj, tree_name) {
    orig1(obj, tree_name);

    /*

    var orig2 = obj[tree_name].appendChild;
    obj[tree_name].appendChild = function(o,name,...args) {
      var res = orig2(o,name,...args);
      o.$vz_path = undefined; // reset
      vz.get_path( o );
      return res;
    }
    
    var orig3 = obj[tree_name].forgetChild;
    obj[tree_name].forgetChild = function(o,...args) {
      var res = orig3(o,...args);
      if (o)
          o.$vz_path = undefined; // reset
      // vz.get_path( o );
      return res;
    }

    */

    // вопрос конечно - добавили фичу renameChild где-то там, почему мы тут это должны учитывать?
    // какое у нас правило?
    /*
    var orig4 = obj[tree_name].renameChild;
    obj[tree_name].renameChild = function(...args) {
      var o = orig4(...args);
      if (o) o.$vz_path = undefined; // reset
      return o;
    }
    */

    // новая идея - пусть они общаются через третью природу, точки передачи управления.
    // вопрос конечно что это за точки, какой у них прикладной смысл - с этим надо разобраться.
    // ну не вызывают такие точки - и ладно.
    obj.on("name_changed", () => {
      obj.$vz_path = undefined;
      // короче выяснилось что удобно всегда видеть путь при отладке в браузере
      vz.get_path( obj ); 
    })

    obj.on("parent_change", () => {
      obj.$vz_path = undefined;
      // короче выяснилось что удобно всегда видеть путь при отладке в браузере
      vz.get_path( obj ); 
    })

  };

  //////////////////////////////// $vz_type
  {
  var eorig = vz.create_obj_by_type;
  vz.create_obj_by_type = function( opts ) {
    var res = eorig(opts);
    if (res) {
      if (res.$vztype) {
        res.$vz_type_chain ||= [];
        res.$vz_type_chain.push( opts.type );
      }
      else
      {
        res.$vz_type = opts.type;
      }
    }
    return res;
  }
  }
  
  vz.chain( "create_obj", function (obj,options) {
    this.orig( obj, options );
    
    // удобно для отладки все три - в dev tools смотреть
    obj.$vz_items = obj.items;
    obj.$vz_params = obj.params;
    
    
    Object.defineProperty( obj, "$vz_parent",{
      enumerable: true, // тогда видно в девтулс
      get: function() { return obj.ns.parent; }
    } );

    return obj;
  });
  /*  
  {
  var qorig = vz.create_obj;
  vz.create_obj = function( obj,opts ) {
  }
  }
  */

}