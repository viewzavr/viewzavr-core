// a viewzavr core

import utils_setup from            "./utils/init.js";
import nodesystem_setup from       "./nodesystem/init.js";
import nodesystem_types_setup from "./nodesystem-types/init.js";
import nodesystem_save_setup from  "./nodesystem-save/init.js";
import nodesystem_links from  "./nodesystem-links/init.js";

export function setup( m, opts={} ) {
  utils_setup( m ); // ну пусть пока будет
  nodesystem_setup( m );
  nodesystem_types_setup( m ); // под вопросом..
  nodesystem_save_setup( m );
  nodesystem_links( m );

  
  // external function
  m.createObj = function( opts={} ) {
    return m.create_obj( opts.body || {}, opts );
  }

  // вообще конечно вопрос - зачем мне отдельно byType? почему нельзя соединить в createObj?
  m.createObjByType = function( opts ) {
    return m.create_obj_by_type( opts );
  }

  m.getDir = function(url) {
    url = url.split(/[\#\?]/)[0];
    //url = url.split("#")[0];
    //url = url.split("?")[0];
    var i = url.lastIndexOf("/");
    if (i >= 0)
        return url.substr( 0,i+1 );
    return url; // hmm
  }
  
  // feature: createObj is a common thing
  m.createObj = function( opts1={}, opts2={}, opts3={} ) {
    var opts = Object.assign( {}, opts1, opts2, opts3 );
    return m.create_obj( opts.body || {}, opts );
  }
  
  m.createObjByType = function( opts1={}, opts2={}, opts3={} ) {
    // todo: hack, keep opts1 type for historicalType?

    // feature: first arg may be type
    if (typeof(opts1) === "string")
      opts1 = { type: opts1 }

    var opts = Object.assign( {}, opts1, opts2, opts3 );
    return m.create_obj_by_type( opts );
  }

  // feature: createObj may respond to type
  /*
  m.createObj = function( opts1={}, opts2={}, opts3={} ) {
    // feature: first arg may be type
    if (typeof(opts1) === "string")
      opts1 = { type: opts1 }

    var opts = Object.assign( {}, opts1, opts2, opts3 );
    if (opts.type)
      return  m.create_obj_by_type( opts );
    return m.create_obj( opts.body || {}, opts );
  }
  */

}

// this creates a Viewzavr object - a main thing that we need
export function create(opts) {
  var mv = {};
  setup( mv, opts );
  return mv;
}
