// R-SETREF-OBJ we should be able to set references to objects as objects, not as strings

export default function setup( obj ) {

  obj.chain("setParam",function (name, value) {
    if (obj.isReference( name )) {
      if (value && !value.setParam) {
          var target_obj  = obj.vz.find_by_path( obj,value );
          if (!target_obj) {
            add_retry( obj, name, value );
            return;
          }
          value = target_obj;
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
    console.log("retry setting obj-ref",paramname, value );
    obj.setParam( paramname, value );
  }, 150 );
}
