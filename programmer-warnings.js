// aim: warn programmer if something going wrong


import * as E from "./nodesystem/events/init.js";

export default function setup( vz ) {

  //////////////////////////////// 
  var orig1 = vz.addTreeToObj;
  vz.addTreeToObj = function(obj, tree_name) {
    orig1(obj, tree_name);

    var orig2 = obj[tree_name].removeChildren;
    obj[tree_name].removeChildren = function() {
      var res = orig2();
      if (obj[tree_name].children.length > 0) {
      	console.warn("VIEWZAVR-WARNING: removeChildren: some children left in place. Broken .remove method?",obj[tree_name].children.map((c)=>c.historicalType))
        var c1 = obj[tree_name].children[0];
        c1.remove();
      }
      return res;  
    }

  };

  ////////////////////////////////
  var eorig = E.createNanoEvents;
  E.setNanoEvents( function() {
    var nanoevents = eorig();  
    var eorigon = nanoevents.on.bind(nanoevents);
    nanoevents.on = function(event,cb) {
      var res = eorigon( event,cb );
      if (nanoevents.events[event].length > 1000)
        console.warn("VIEWZAVR-WARNING: events: a lot of event handlers. Forget to unsubscribe?",event,cb,nanoevents);
      return res;
    }
    return nanoevents;
  } );

}