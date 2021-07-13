export function setup_item(x) {

  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  x.events_dic = new EventTarget();

  x.track = function(name,fn) {
    x.events_dic.addEventListener(name,fn);
    // an idea from https://github.com/ai/nanoevents which we even probably should use for events.
    var untrack = function() {
      x.untrack( name, fn );
    }
    return untrack;
  }
  
  x.untrack = function(name,fn) {
    x.events_dic.removeEventListener(name,fn);
  }
  
  x.signal = function(name,arg1) {
    x.events_dic.dispatchEvent( new CustomEvent(name, {detail: arg1} ) );
  }

  // переходим к варианту nanoevents (пока на уровне интерфейса)
  x.on = function(name,fn) {
    var f2 = function(event) {
      var arg1 = event.data.detail.arg1;
      fn( arg1 );
    }
    x.events_dic.addEventListener(name,f2);
    // an idea from https://github.com/ai/nanoevents which we even probably should use for events.
    var untrack = function() {
      x.untrack( name, f2 );
    }
    return untrack;
  }
  x.emit = x.signal;
  
  //x.trackSignal = x.track;  
  // кстати нам наиболее важно даже не только on, а on в контексте другого объекта.
  // вот это будет дело. т.е. удалять подписки если другой объект удалился или мы удалились.
  // @todo, @idea

  /*
  x.emit = x.signal;
  x.on = x.track;
  x.off = x.untrack;
  */

  return x;
}

export default function setup( m ) {

  m.chain( "create_obj", function (obj,options){
    setup_item( obj );
    return this.orig( obj, options );
  } );

}
