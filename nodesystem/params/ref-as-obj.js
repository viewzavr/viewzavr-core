// R-SETREF-OBJ we should be able to set references to objects as objects, not as strings
// also, sets value to object. thus getParam("some-ref") returns object.

export default function setup( obj ) {

  obj.chain("setParam",function (name, value) {
    if (obj.isReference( name )) {
      if (value && !value.setParam) { // то есть value это текстовая ссылка
          //var tree_to_find_in = obj.getParamOption(name,"tree") || obj;
          //var target_obj  = obj.vz.find_by_path( tree_to_find_in,value );
          //var target_obj  = obj.vz.find_by_path( obj,value );
          var f = obj.getParamOption(name,"tree_func");
          var tree_to_find_in = f ? f() : obj;
          var target_obj  = obj.vz.find_by_path( tree_to_find_in,value ); 

          if (!target_obj) {
            add_retry( obj, name, value );
            return;
          }
          value = target_obj; // будем класть на хранение уже объекты
      }
    }
    return this.orig( name, value );
  });
  
  obj.chain("dumpParam",function ( name ) {
    if (obj.isReference( name )) {
      var value = obj.params[name];
      if (value && value.getPath) return value.getPath(); // TODO: relative to...
    }
    return this.orig( name );
  });
}

// todo make collective timer
var retry_find_objs = [];
var retry_timer = null;

function add_retry( obj, paramname, value ) {
  setTimeout( function() {
    console.warn("ref-as-obj: retry setting obj-ref",paramname, value );
    obj.ref_retry_counters ||= {};
    obj.ref_retry_counters[paramname] = (obj.ref_retry_counters[paramname] || 0)+1;
    if (obj.ref_retry_counters[paramname] < 30)
      obj.setParam( paramname, value );
    else
      console.error("ref-as-obj: stopped because of retry counter limit.")
  }, 150 );
}