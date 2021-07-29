// добавляет понятие параметров к x

export default function setup(x) {

  x.params = {};

  x.setParam = function(name,value) {
    var old = x.params[name];

/*  we still need to track that param exist.. F-PARAM-VALUE-ALWAYS
    if (typeof(value) == "undefined")
      x.removeParam( name );
    else
*/    
    x.params[name]=value;

    if (old != value) {
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

  x.setParams = function(value) {
    x.params = value;
    // тотальненько..
  }
  
  /////
  
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

  return x;
}
