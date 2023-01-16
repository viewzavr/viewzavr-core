import * as FT from "./feature-tools.js";

export default function setup( vz ) {

  FT.add_events( vz );
   
  FT.add_features_registry( vz );
    FT.add_appends( vz ); // думаю вызов фичи должен быть здесь. аддитивность - подключаем фичу один раз.
    FT.add_feature_map( vz );

  FT.add_features_use( vz, vz );
  //FT.add_create_env( vz, vz );
  
  vz_add_features_to_new_objs( vz );
  vz_add_host_field_to_new_objects( vz );

  //vz_track_lifetime( vz );

  // потребность "фича object на новых объектах" => можно создавать новые объекты вообще только из фич
  vz_add_feature_object_to_new_objects( vz );

  vz_add_type_as_feature( vz );
  vz_add_cats_as_feature( vz );

  ///////////////
  vz.register_feature_set({vzf_manual_features})
  vz.register_feature_map({"viewzavr-object":"vzf_manual_features"});
  //vz.register_feature_set({vzf_manual_features,vzf_object_uniq_ids})
  //vz.register_feature_map({"viewzavr-object":"vzf_manual_features vzf_object_uniq_ids"});
  vz.register_feature_set({viewzavr_object_uniq_ids});
  vz.feature( "viewzavr_object_uniq_ids"); // под вопросом.. может достаточно и просто стыковки с объектом..

  // vz.register_feature_set({viewzar_translate});
  // vz.feature( "viewzar_translate"); // может на уровне обьекта это тоже?

  // //vz.register_feature_map({"viewzavr-object":{append:[vzf_manual_features]}})

  viewzavr_connect( vz )
}


function vz_add_features_to_new_objs( vz ) {
  vz.chain( "create_obj", function (obj,options) {
    // setup
    FT.add_features_use( obj, vz );
    // вроде как не надо FT.add_create_env( obj, vz );
    // call constructor
    this.orig( obj, options );
    return obj;
 });
}

function vz_activate_features_from_new_obj_params( vz, f_from_options ) {
  //let orig = vz.create_obj;
  vz.chain( "create_obj", function (obj,options) {
    this.orig( obj, options );
    if (f_from_options( options )) {
      var ff = f_from_options( options );
      if (typeof(ff) == "string" || Array.isArray(ff))
        obj.feature( ff );
      else if (typeof(ff) == "object") {    
        for (let k of Object.keys(ff)) {
          obj.feature( k, ff[k].params || {}, options );
        }
      }
    }
    return obj;
  });
}

// F-HOST
function vz_add_host_field_to_new_objects( vz, f_from_options ) {
  //let orig = vz.create_obj;
  vz.chain( "create_obj", function (obj,options) {
    this.orig( obj, options );

    obj.host = obj;
    
    obj.toString = () => obj.getPath()
    
    return obj;
  });
}

// измерение на тему сколько объектов создано и тут же удалено
function vz_track_lifetime( vz, f_from_options ) {
  //let orig = vz.create_obj;
  let total_waste = 0;
  vz.chain( "create_obj", function (obj,options) {
    this.orig( obj, options );

    obj.$timestamp = performance.now();

    obj.on("remove",() => {
        let t = performance.now();
        let delta = t - obj.$timestamp;
        if (delta < 100) {
          total_waste++; 
          console.log("object short time",delta,"ms",obj.getPath(),"total wasted objs",total_waste)
        }
           
    });
    
    return obj;
  });
};

function vz_add_feature_object_to_new_objects( vz, f_from_options ) {
  //let orig = vz.create_obj;
  vz.register_feature( "viewzavr-object", { func: ()=>{}, may_override: true } );
  vz.chain( "create_obj", function (obj,options) {
    this.orig( obj, options );
    obj.feature( "viewzavr-object" );
    return obj;
  });
}

function vz_add_type_as_feature( vz ) {
  vz.chain( "create_obj_by_type", function (options) {
    var result = this.orig( options );
    if (result && options.type)
        result.feature( options.type );
    return result;
  });

  vz.chain("addItemType", function(code,title,fn,opts) {
     // зарегаем тип как фичу
     if (!vz.get_feature_core( code )) vz.register_feature( code, { func: ()=>{}, may_override: true } );
     var res = this.orig( code, title, fn, opts );
     // зарегаем категории как фичи (они могут появиться только после срабатывания addItemType)
     var cats = vz.getCatsByType( code );
     for (var q of cats) {
        if (!vz.get_feature_core( q )) vz.register_feature( q, { func: ()=>{}, may_override: true } );
     }

     return res;
  })
}

function vz_add_cats_as_feature( vz ) {
  vz.chain( "create_obj_by_type", function (options) {
    var result = this.orig( options );
    if (result && options.type) {
        var cats = vz.getCatsByType( options.type );
        result.feature( cats ); // прямо вот категории как метки.. хм.. может хотя бы приписать category- ?
      }
    return result;
  });
}

///////////////////// 
function vzf_manual_features( obj ) {

  /*
  obj.trackParam("manual_features", (v) => {
    obj.manual_feature( v );
  })
  */

  obj.manual_feature = (names,...args) => {
    var arr = FT.feature_names_to_arr( names );
    var has_new = false;
    for (var name of names) {
        if (!obj.is_feature_applied(name)) {
          has_new = true;
          break;
        }
    }

    if (has_new) {
      let promarr = [];
      let p = obj.feature( names,...args );
      promarr.push( p );
      var existing_arr = FT.feature_names_to_arr( (obj.params.manual_features || "") );
      let unique = [...new Set(arr.concat(existing_arr))];
      obj.setParam("manual_features", unique, true);
      // todo optimize
      return promarr;
    }
    //return Promise.resolve( obj );
  }

  obj.apply_manual_features = () => {
    if (obj.params.manual_features)
      return obj.manual_feature( obj.params.manual_features );
  }
  //см также dump-load restoreFeatures
}

///////////////////////
var uniq_counter = 0;
function vzf_object_uniq_ids( obj ) {
  obj.$vz_unique_id = uniq_counter++;
}

function viewzavr_object_uniq_ids( vz ) {
   vz.register_feature_set({vzf_object_uniq_ids})
   vz.register_feature_map({"viewzavr-object":"vzf_object_uniq_ids"});
}

//////////////////////
// idea - env.set_translation( table ); { key }
//      + env sends translation-changed to all childs. => translation is based on vzPlayer, not vz...

function viewzar_translate( vz ) {
  vz.translate_text = function(key) { return key; }
  vz.register_feature_set({viewzavr_object_translate_text})
  vz.register_feature_map({"viewzavr-object":"viewzavr_object_translate_text"});
  //viewzar_translate
}

function viewzavr_object_translate_text( env ) {
  env.translate_text = function(key) {
    if (env.ns && env.ns.parent && env.ns.parent.translate_text)
      return env.ns.parent.translate_text( key );
    if (env.vz != env)
      return env.vz.translate_text( key );
    return key;
  }
}

///////////////////


function viewzavr_connect( vz ) {
  vz.register_feature_set({viewzavr_object_connect})
  vz.register_feature_map({"viewzavr-object":"viewzavr_object_connect"});
  //viewzar_translate
}

function viewzavr_object_connect( env ) {
  env.$connection_dic = {}
  env.connect_param = function ( name, src, type='assigned' ) {
    if (src) {
      let existing = env.$connection_dic[ name ]
      if (existing) existing()

      if (!src.is_cell) {
        delete env.$connection_dic[ name ]
        //console.warn("connect_param: src is not cell",src,"me=",env)
        env.setParam( name, src ) // чисто значенье
        return 
      }

      let unsub = src.on( type, (v) => {
        env.setParam( name, v )
      });
      /*
      let unsub = () => {
        unsub0()
        console.log("unsubbed from",name)
      }
      */

      unsub.src = src; // так чисто..

      env.$connection_dic[ name ] = unsub; // а если там уже есть

      //console.log("subbed to",name)

      if (src.is_value_assigned()) 
          env.setParam( name, src.get() )

      // todo нужна ли отписка при удалении целевого канала?
    }
    else {
      delete env.$connection_dic[ name ]      
    }
  }
  env.is_connected = function( name, src ) {
    return env.$connection_dic.hasOwnProperty( name )
  }
  
  env.on("remove",() => {
    for (let k of Object.values(env.$connection_dic)) k(); // отпишемся..
    env.$connection_dic = {}  
  })

  env.connected_param_names = () => {
    return Object.keys( env.$connection_dic )
  }

  env.params_with_incoming_links = () => {
    return env.linksToObjectParamsNames().concat( Object.keys( env.$connection_dic ) )
  }

  // тут прям алгоритм поиска исходного канала по src_string. лучшее из links-are-objects взято.
  env.connect_source = function( name, src_string, src_base_obj, use_scope, type, retry_counter=100 ) {
    // src_base_obj - от кого отсчитывать ссылки в src_string

    if (!use_scope)
        use_scope = src_base_obj.$scopes.top() // захапаем текущий top
    
    let src_arr = src_string.split("->")
    let src_obj = env.vz.find_by_path( src_base_obj, src_arr[0], use_scope )
    //if (src_obj == env)
      //debugger
    if (!src_obj) {
       env.feature("delayed")
       env.timeout( () => {
        if (retry_counter < 0) 
        {
          console.warn("connect_source: not found",src_string, env, name)
        }
        else env.connect_source( name, src_string, src_base_obj, use_scope, type, retry_counter-1 )
       },2)

       // надо запомнить - чтобы имя хранилось, для connected_param_names
       if (env.$connection_dic[ name ]) env.$connection_dic[ name ]()
       env.$connection_dic[ name ] = () => {}
       return
    } 

    // F-POSITIONAL-ENVS и F-POSITIONAL-ENVS-OUTPUT
    // F-LINK-ACCESS-ENV-CONSTS
    let src_param_name = src_arr[1]
    if (src_obj.trackParam && (src_param_name == "." || src_param_name == null)) { 
      if (src_obj.is_feature_applied("is_positional_env"))  {
        src_param_name = 0;
      }
    }

    let src_channel = src_obj.is_cell || src_param_name == null || src_param_name == "." ? src_obj : src_obj.get_param_cell( src_param_name )

    //let tgt_obj = obj.vz.find_by_path( obj, arr[0], obj );
    env.connect_param( name,src_channel );

    //console.log("connect_source",name,src_string)
  }

        
}