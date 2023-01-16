import setup_guis from   "./guis.js";
import setup_guis_visible from   "./guis_visible.js";
import setup_params from "./params.js";
import setup_params_guis from "./connect-guis-params.js";
//import setup_refs from   "./references.js";
import setup_param_options from   "./params_options.js";
import setup_guis_events from   "./guis_events.js";

export default function setup( m ) {

  m.chain( "create_obj", function (obj,options){
    setup_params( obj );
    setup_guis( obj );
//    setup_refs( m, obj );
    setup_params_guis( obj );
    setup_guis_visible( obj );
    setup_param_options( obj );
    setup_guis_events( obj );

    return this.orig( obj, options );
  } );

}