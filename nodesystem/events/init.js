// https://github.com/ai/nanoevents
export var createNanoEvents = () => ({
  events: {},
  emit(event, ...args) {
    ;(this.events[event] || []).forEach(i => i(...args))
  },
  on(event, cb) {
    ;(this.events[event] = this.events[event] || []).push(cb)
    return () =>
      (this.events[event] = (this.events[event] || []).filter(i => i !== cb))
  },
  off(event, cb) {
    ;(this.events[event] = (this.events[event] || []).filter(i => i !== cb))
  }
})

export function setNanoEvents( fn ) {
  createNanoEvents = fn;
}

export function addEventsTo( x ) {
  x.events_dic = createNanoEvents();

  x.track = x.events_dic.on.bind(x.events_dic);
  x.untrack = x.events_dic.off.bind(x.events_dic);
  x.signal = x.events_dic.emit.bind(x.events_dic);
  x.on = x.events_dic.on.bind(x.events_dic);
  x.off = x.events_dic.off.bind(x.events_dic);
  x.emit = x.events_dic.emit.bind(x.events_dic);

  x.once = function( event, cb ) {
    var unbind;
    var f = (...args) => {
      if (unbind) { unbind(); unbind = null; };
      cb( ...args );
    }
    unbind = x.on( event, f );
    return unbind;
  }
}

export function setup_item(x) {
  addEventsTo( x );

  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget

/*
  var orig_on = x.on;
  x.on = funtion(name,fn) {
    if (Array.isArray(name))
  }
*/  
  
  //x.trackSignal = x.track;  
  // кстати нам наиболее важно даже не только on, а on в контексте другого объекта.
  // вот это будет дело. т.е. удалять подписки если другой объект удалился или мы удалились.
  // @todo, @idea
  

  return x;
}

export default function setup( m ) {

  m.chain( "create_obj", function (obj,options){
    setup_item( obj );
    return this.orig( obj, options );
  } );

}
