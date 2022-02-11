// добавляет понятие параметров к x

export default function setup(x) {

  x.params = {};

  // выделено в отдельный метод так как нам оказалось необходимо в ГУИ выставлять значение параметра,
  // заданное через гуи, на этапе инициализации - считается что события "параметр изменился" там при этом
  // происходить не должно. @todo разобраться со всей этой историей, построить ясную модель.
  x.setParamWithoutEvents = function(name,value) {

    //x.addParam( name );
    /*
    if (name === "origin" && x.getPath() === "/view-cmp-Lidar_crop_p3_4")
      debugger;
    */  

    var old = x.params[name];
    x.params[name]=value;

    // вот тут мы видим великую засаду теперь...
    // кто угодно может писать в params и мы это не можем отловить..
    // ибо и читающие - x.params.name...
    // хотя может можно таки ловить записи...
    
    return old;
  }

  x.setParam = function(name,value) {
    //if (name == "width" && value == "10px") debugger;

    //var old = x.getParam()
    var old = x.setParamWithoutEvents( name, value );
    

/*  we still need to track that param exist.. F-PARAM-VALUE-ALWAYS
    if (typeof(value) == "undefined")
      x.removeParam( name );
    else
*/

    // iiiiimport. хорошо бы 
    if (old != value || typeof(old) != typeof(value)) {
      x.signalTracked( name );
    }
    return x;
  }

  x.getParam = function(name) {
    return x.params[name];
  }

  x.removeParam = function(name) {
    //console.log("removeParam called name=",name );
    delete x.params[name];
    return x;
  }

  // все-таки копить параметры..
  /*
  x.addParam = function(name) {
    if (!x.hasParam(name)) x.params[name] = undefined;
  }
  */
  
  /* 
  x.hasParam = function(name) {
    return x.params.hasOwnProperty(name);
  }
  */
  
  /////
  
  x.getParams = function() {
    return x.params;
  }

  x.getParamsNames = function() {
    return Object.keys( x.params );
  }

  x.hasParam = function(name) {
    return x.params.hasOwnProperty(name);
  }

  x.setParams = function(value) {
    x.params = value;
    // тотальненько..
  }
  
  /////
  setup_params_events( x );

  return x;
}

import * as E from "../events/init.js";

function setup_params_events(x) {
  x.pevents = E.createNanoEvents();
  x.trackParam = x.pevents.on.bind( x.pevents );
  x.untrackParam = x.pevents.on.bind( x.pevents );
  x.signalTracked = function(name) {
    if (x.removed) return; // бывали случаи
    
    let value = x.getParam(name);
    x.pevents.emit( name,value );
    x.emit('param_changed',name,value);
    x.emit(`param_${name}_changed`,name,value); // все-таки мне удобно так тоже ловить, из compolang

    x.setParamOption( name,"changed_timestamp", performance.now() );
    // @todo move out
  }
  x.signalParam = x.signalTracked;


  x.onvalue = function(name,fn) {
    var res = x.trackParam(name,(val) => {
      if (typeof(val) != "undefined") 
        callfn(val);
    });
    let val = x.params[name];
    if (typeof(val) != "undefined") 
        callfn(val);
    function callfn( val ) {
       //try {
         fn( val );
       //} catch ( err ) {
       //  console.error("obj.onvalue: error during calling user callback. obj=", x.getPath(),"name=",name,"fn=",fn,"err=",err);
       //  throw err;
       //}      
    }
    return res;
  }

  x.onvalues = function(names,fn) {
    if (!Array.isArray(names)) names=[names];

    // вызов
    function fn2() {
       var vals = [];
       for (let name of names) 
        vals.push( x.params[name] );
       //    fn.call( undefined, ...vals ); // зис им перебиваем конеш
       // может тут тоже требовать чтобы все было, до кучи уж
       //try {
         fn( ...vals );
       //} catch ( err ) {
       //  console.error("obj.onvalues: error during calling user callback. obj=",x.getPath(),"names=",names,"fn=",fn,"err=",err);
       //  throw err;
      // }
    }
    // если все ненулевые значения - сработаем сразу
    function call_if_all_exist( ename, evalue ) {
      
      var all_params_exist=true;
      for (let name of names) {
         if (typeof(x.params[name]) == "undefined" ) {
           all_params_exist = false;
         }
      }
      if (all_params_exist) 
        fn2();
    }

    var fn2_delayed = _delayed( call_if_all_exist );    

    var acc = [];
    for (let name of names) {
      var res = x.trackParam(name,fn2_delayed);
      acc.push( res );
    }
    // всеобщая отписка
    let resall = () => {
      acc.forEach( (x) => x() );
    }

    call_if_all_exist();

    return resall;
  } // onvalues

  x.onvalues_any = function(names,fn) {
    if (!Array.isArray(names)) names=[names];

    // вызов
    function fn2() {
       var vals = [];
       for (let name of names) 
        vals.push( x.params[name] );
       //    fn.call( undefined, ...vals ); // зис им перебиваем конеш
       // может тут тоже требовать чтобы все было, до кучи уж
       fn( ...vals );
    }
    // если есть ненулевые значения - сработаем сразу
    function call_if_any_exist() {
      var some_params_exist=false;
      for (let name of names) {
         if (typeof(x.params[name]) !== "undefined" ) {
           some_params_exist = true;
         }
      }
      if (some_params_exist) 
        fn2();
    }

    var fn2_delayed = _delayed( call_if_any_exist );    

    var acc = [];
    for (let name of names) {
      var res = x.trackParam(name,fn2_delayed);
      acc.push( res );
    }
    // всеобщая отписка
    let resall = () => {
      acc.forEach( (x) => x() );
    }

    call_if_any_exist();

    return resall;
  } // onvalues

    // эксперимент todo
    // names это массив вида [ env, name1, name2, env2, name3 ]
    // ну или еще как..
    x.monitor_values = function(names,fn) {
    };

  // todo сделать тут setParam?...
}


function setup_params_events_old(x) {
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  x.pevents = new EventTarget();
  
  // может события заюзать?
  x.trackParam = function(name,fn) {
    
/*    var z = function(e) {
      fn( e.detail );
    }
*/
    
    x.pevents.addEventListener(name,fn);
  }
  
  x.untrackParam = function(name,fn) {
    // find z by fn...
    x.pevents.removeEventListener(name,fn);
  }
  x.signalTracked = function(name) {
    x.pevents.dispatchEvent( new CustomEvent(name, {detail: x.getParam(name)}) );
  }
  x.signalParam = x.signalTracked;
  // мысль в том что trackParam хорошо бы функцию передавал которая на вход имеет значение параметра
  // и мб старое значение, а не то что какой-то непонятный event (я не чувствую что он мне нужен если честно)
  // но смогу ли я отписываться от событий - вот что мне непонятно.
  // видимо смогу, но надо сохранять отдельно таблицу fn -> newfn
  
  /* if we remove pevents, then others may not talk to obj events after obj is removed
     maybe replace pevents with new EventTarget?..
  x.chain("remove",function() {
    this.orig();  
    x.pevents = undefined; // to help remove things in gc
  });
  */  
}


function _delayed( f,delay=0 ) {
  var t;

  var res = function(...args) {
    if (t) return;
    t = setTimeout( () => {
      t=null;
      f(...args);
    },delay);
  }

  return res;
}