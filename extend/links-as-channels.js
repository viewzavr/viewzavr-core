// делаем облегченные ссылки, без объектов F-LITE-LINKS

export function setup( vz )
{
  viewzavr_links_as_channels( vz );
}

export function viewzavr_links_as_channels( vz ) {
  vz.register_feature_set({viewzavr_object_connect})
  vz.register_feature_map({"viewzavr-object":"viewzavr_object_connect"});
  //viewzar_translate
}

function viewzavr_object_connect( env ) {

  env.$connection_dic = {}

  /* на эту тему вроде нет пользователей
  env.is_connected = function( name, src ) {
    return env.$connection_dic.hasOwnProperty( name )
  }
  */
  
  env.on("remove",() => {
    for (let k of Object.values(env.$connection_dic)) k(); // отпишемся..
    env.$connection_dic = {}  
  })

  /*
  env.connected_param_names = () => {
    return Object.keys( env.$connection_dic )
  }*/

  /////////////// а теперь встраиваемся в апи системы
  
  env.getLinkedParamsNames = () => {
    return env.linksToObjectParamsNames().concat( Object.keys( env.$connection_dic ) )
  }

  env.getConnectedParamsNames = () => {
    return env.getParamsNames().concat( env.linksToObjectParamsNames() ).concat( Object.keys( env.$connection_dic ) ) 
  }

/*
  env.paramConnected = function(name) {
    return env.hasParam(name) || env.hasLinksToParam(name) || is_connected( env, name );
  }
  env.paramAssigned = function(name) {
    return env.hasParam(name) || env.hasLinksToParam(name) || is_connected( env, name );
  }
*/  
  let orig = env.hasLinksToParam;
  env.hasLinksToParam = function(pname) {
    return (orig( pname ) || is_connected( env, pname ))
  }
  env.linkParam = function( paramname, link_source, soft_mode, manual, stream_mode ) {
     return env.createLinkTo( { param: paramname, from: link_source, soft_mode:soft_mode, manual: manual, stream_mode: stream_mode })
  }  

  // opts: param, from, target_host_env
  // target_host_env значит что надо цепляться не к объекту а к его хосту.. 
  env.createLinkTo = function( opts ) {
//    if (env.hosted && (opts.from[0] == "." && opts.from[1] != "."))
//        console.warn(". is ok?", opts.from, opts, env)
    
    //let tgt_obj = env.vz.find_by_path( env, arr[0], obj );
    //let tgt_env = opts.target_host_env && env.hosted ? env.host : env
    //let tgt_env = env // усе никаких больше ~
    return connect_source( env, opts.param, opts.from, opts.from_base_obj || env, opts.$scopeFor, opts.locinfo )
  }
        
}

function is_connected( env,src ) {
  return env.$connection_dic.hasOwnProperty( src )
}

// тут прям алгоритм поиска исходного канала по src_string. лучшее из links-are-objects взято.
  function connect_source( env, name, src_string, src_base_obj, use_scope, locinfo, type, retry_counter=20 ) {
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
        else connect_source( env, name, src_string, src_base_obj, use_scope, locinfo, type, retry_counter-1  )
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
    return connect_param( env, name,src_channel, locinfo, type );

    //console.log("connect_source",name,src_string)
  }  

function connect_param( env, name, src, locinfo, type='assigned' ) {

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
        if (v?.is_event_args) v = v[0]
        env.setParam( name, v )
      });
      /*
      let unsub = () => {
        unsub0()
        console.log("unsubbed from",name)
      }
      */

      unsub.src = src; // удобно для отладки
      unsub.locinfo = locinfo;

      env.$connection_dic[ name ] = unsub; // а если там уже есть

      //console.log("subbed to",name)

      if (src.is_value_assigned()) {
        let v = src.get()
        if (v?.is_event_args) v = v[0]
        env.setParam( name,v  )
      }

      // todo нужна ли отписка при удалении целевого канала?
    }
    else {
      delete env.$connection_dic[ name ]      
    }
  }  