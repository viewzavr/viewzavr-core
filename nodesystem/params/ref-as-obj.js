// R-SETREF-OBJ we should be able to set references to objects as objects, not as strings
// also, sets value to object. thus getParam("some-ref") returns object.

// а этот файл про то что на getParam мы выдаем таки объект а не строчку

export default function setup( obj ) {

  obj.chain("setParamWithoutEvents",function (name, value) {
    if (obj.isReference( name )) {
      if (value && !value.setParam) { // то есть value это текстовая ссылка
          //var tree_to_find_in = obj.getParamOption(name,"tree") || obj;
          //var target_obj  = obj.vz.find_by_path( tree_to_find_in,value );
          //var target_obj  = obj.vz.find_by_path( obj,value );

          let t = typeof(value);
          if (value !== null && t !== "string" && t !== "undefined") {
              console.error("setting invalid value to reference parameter. assign skipped. obj=",obj.getPath(),"param=",name,"value=",value);
              //return this.orig( name, value );
              return;
          }

          var f = obj.getParamOption(name,"tree_func");
          var tree_to_find_in = f ? f() : obj;

          // TODO похоже у нас тут дублирующся find_by_path причем с разными tree_func

          var target_obj  = obj.vz.find_by_path( tree_to_find_in,value, tree_to_find_in ); 

          if (!target_obj) {
            add_retry( obj, name, value );
            return obj.getParam( name ); // по протоколу setParamWithoutEvents надо старое вернуть
          }
          else
            forget_retry( obj, name );

          value = target_obj; // будем класть на хранение уже объекты
      }
        else forget_retry( obj, name );
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

// todo такие таймеры это конечно вещь, особенно в сетевых приложениях
// заменить на ожидание загрузки модулей @timers @todo и прочих операций
function add_retry( obj, paramname, value ) {
  obj.ref_retry_counters ||= {};
  obj.ref_retry_counters[paramname] ||= 1;

  obj.feature("delayed");
  obj.objs_find_retry ||= obj.delayed( function(paramname,value) {
    if (obj.removed) return;
    if (!obj.ref_retry_counters[paramname]) return; // отпала необходимость

    //console.warn("ref-as-obj: retry setting obj-ref, obj=",obj.getPath(), {paramname,value} );

    obj.ref_retry_counters[paramname] = obj.ref_retry_counters[paramname]+1;
    
    if (obj.ref_retry_counters[paramname] < 100)
      obj.setParam( paramname, value );
    else
      console.error("ref-as-obj: stopped because of retry counter limit.","obj=",obj.getPath(), {paramname,value})
  }, 15 );

  //setTimeout( , 150 );
  obj.objs_find_retry( paramname, value );
}

export function forget_retry( obj, paramname ) {
  if (obj.ref_retry_counters) {
    delete obj.ref_retry_counters[paramname];
  }
}
