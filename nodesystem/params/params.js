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

/*
    x.vz.history.add( 
        //["link setting value",val,"\n",obj.params.from,"\n -------> \n",obj.params.to, obj.getPath() ]
        { "info": "set_param",
          "name": name,
            "value" : value,
            "tgt_obj": x.getPath()
        }
      );
*/      

    // вот тут мы видим великую засаду теперь...
    // кто угодно может писать в params и мы это не можем отловить..
    // ибо и читающие - x.params.name...
    // хотя может можно таки ловить записи...
    
    return old;
  }

  let vz_param_state_counters = {};

  x.setParam = function(name,value, ...rest) {
    if (x.vz.verbose)
      console.log('SETPARAM',name,x.getPath(),value)
    //if (name == "assigned") console.trace()
    
    //if (name == "width" && value == "10px") debugger;

    //var old = x.getParam()
    let param_existed = x.hasParam( name );

    var old = x.setParamWithoutEvents( name, value, ...rest );

    // важно это делать после установки значения, т.к. ссылки текущая версия почему-то читает из значения (а не из аргумента события)
    x.emit(name + "_assigned",value); // F-PARAMS-STREAM
    x.emit("param_assigned",name,value); // F-PARAMS-STREAM

/*  we still need to track that param exist.. F-PARAM-VALUE-ALWAYS
    if (typeof(value) == "undefined")
      x.removeParam( name );
    else
*/

    // iiiiimport. хорошо бы 
    // если не было ничего - надо явно прописать !param_existed ||
    // попробуем.. будем передавать для записи undefined-значений.. что влияет 
    // и на compalang let - он начинает работать для всех значений
    if ( !param_existed || old != value || typeof(old) != typeof(value)) {
      
      if (Number.isNaN(old) && Number.isNaN(value))
      {
          // отдельный случай - эти штуки всегда неравны...
      }
      else
        x.signalTracked( name );
    }
    else {
      /* нахрен это, накололся
      // случай когда передаем массивы
      if (value?.$vz_param_state_counter) {
        console.log("value?.$vz_param_state_counter present, ",value?.$vz_param_state_counter," comparing with",vz_param_state_counters)
        if (value.$vz_param_state_counter != vz_param_state_counters[name])
        {
          vz_param_state_counters[name] = value.$vz_param_state_counter;
          console.log('not eqal = copy counter')
          x.signalTracked( name ); 
        }
      } 
      */ 
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

  // todo это неправильное название. правильное paramConnected или типа того.
  // а paramAssigned это именно что x.hasParam. В том смысле что у нас есть состояния 
  // - прицеплен так или иначен, присвоен (т.е. какое-то значение уже есть)
  x.paramAssigned = function(name) {
    return x.hasParam(name) || x.hasLinksToParam(name);
  }

  // присвоена константа либо есть связь (но не факт что есть присвоение) - т.е значение есть либо вероятно скоро будет.
  x.paramConnected = function(name) {
    return x.hasParam(name) || x.hasLinksToParam(name);
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
  // pevents это получается для changed-событий
  //x.trackParam = x.pevents.on.bind( x.pevents );
  // F-PARAMS-STREAM-2
  // была идея - trackParam теперь это assigned, а старое это trackParamChanged
  // но пока решился трекать отдельно: trackParamAssigned...
  x.trackParamAssigned = (name,fn) => {
     return x.on( name + "_assigned", fn)
  }
  x.trackParamChanged = x.pevents.on.bind( x.pevents );
  x.trackParam = x.pevents.on.bind( x.pevents );
  x.untrackParam = x.pevents.off.bind( x.pevents );
  x.signalTracked = function(name) {
    if (x.removed) return; // бывали случаи
    
    let value = x.getParam(name);
    x.pevents.emit( name,value );
    x.emit('param_changed',name,value);
    x.emit(`param_${name}_changed`,value); // все-таки мне удобно так тоже ловить, из compolang

    x.setParamOption( name,"changed_timestamp", performance.now() );
    // @todo move out
  }
  x.signalParam = x.signalTracked;


  x.onvalue = function(name,fn) {
    var res = x.trackParam(name,(val) => {
      //if (typeof(val) != "undefined") 
      if (val != null) 
        callfn(val);
    });
    let val = x.params[name];
    //if (typeof(val) != "undefined") 
    if (val != null) 
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

  // мониторит набор параметров и если все не undefined то срабатывает
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
         //if (typeof(x.params[name]) == "undefined" ) {
          if (x.params[name] == null) 
           all_params_exist = false;
         
      }
      if (all_params_exist) 
        fn2();
    }

    var fn2_delayed = _delayed( call_if_all_exist,0,x );

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

  // если хотя бы 1 не undefined то срабатывает
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
         //if (typeof(x.params[name]) !== "undefined" ) {
          if (x.params[name] != null) {
           some_params_exist = true;
         }
      }
      if (some_params_exist) 
        fn2();
    }

    var fn2_delayed = _delayed( call_if_any_exist,0,x );    

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
  } // onvalues_any

    // эксперимент todo
    // names это массив вида [ env, name1, name2, env2, name3 ]
    // ну или еще как..
    // мб это просто trackParams

    // monitor_values - мониторит параметры безо всякой проверки их содержимого
    // разово вызывает fn и на старте
    // но нет. не содержимого. а их наличия. так попробуем.

    // todo разобраться что это за функция, как я ее использую, зачем она нужна

    // проверка на наличие вынесена в отдельрную функцию monitor_defined

    // вызывает fn а) на старте, б) при изменении параметров / все это без проверок
    x.monitor_values = function(names,fn) {

      if (!Array.isArray(names)) names=[names];

      // вызов
      function fn2() {
         var vals = [];
         for (let name of names)  {
           vals.push( x.params[name] );
         }
         
         // может тут тоже требовать чтобы все было, до кучи уж
         fn( ...vals );
      }

      var fn2_delayed = _delayed( fn2,0,x );    

      var acc = [];
      for (let name of names) {
        var res = x.trackParam(name,fn2_delayed);
        acc.push( res );
      }
      // всеобщая отписка
      let resall = () => {
        acc.forEach( (x) => x() );
      }

      //fn2_delayed();
      fn2()

      return resall;

    };

    // вызывает функцию fn когда все параметры заданы; в т.ч. и на старте запускает fn.
    x.monitor_defined = function(names,fn) {

      if (!Array.isArray(names)) names=[names];

      // вызов
      function fn2() {
         var vals = [];
         for (let name of names)  {
           if (!x.hasParam(name))
             return
           vals.push( x.params[name] );
         }
         
         // может тут тоже требовать чтобы все было, до кучи уж
         fn( ...vals );
      }

      var fn2_delayed = _delayed( fn2,0,x );    

      var acc = [];
      for (let name of names) {
        var res = x.trackParam(name,fn2_delayed);
        acc.push( res );
      }
      // всеобщая отписка
      let resall = () => {
        acc.forEach( (x) => x() );
      }

      //fn2_delayed();
      fn2()

      return resall;

    };    

    // вызывает функцию fn когда какой-либо параметр из списка присваивается
    x.monitor_assigned = function(names,fn, call_on_start) {

      if (!Array.isArray(names)) names=[names];

      // вызов
      function fn2() {
         var vals = [];
         for (let name of names)  {
           vals.push( x.params[name] );
         }
         // может тут тоже требовать чтобы все было, до кучи уж
         fn( ...vals );
      }

      var acc = [];
      for (let name of names) {
        var res = x.trackParamAssigned(name,fn2);
        acc.push( res );
      }
      // всеобщая отписка
      let resall = () => {
        acc.forEach( (x) => x() );
      }
      
      if (call_on_start)
          fn2()

      return resall;

    };

  // todo сделать тут setParam?...
}

import {_delayed} from "../../extend/delayed-pool.js";
