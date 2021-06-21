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
  //x.trackSignal = x.track;
  
  x.untrack = function(name,fn) {
    x.events_dic.removeEventListener(name,fn);
  }
  
  x.signal = function(name,arg1) {
    x.events_dic.dispatchEvent( new CustomEvent(name, {detail: arg1} ) );
  }

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
