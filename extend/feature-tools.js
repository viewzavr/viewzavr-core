/*
  Implements 'features' for viewzavr and its objects. Adds methods:

  vz.register_feature(name,f) - registers feature function f in feature table
  // todo: specify target env type, eg vz, obj?
  
  vz.feature(names) - implements feature for viewzavr. example: vz.feature("timers")
  
  obj.feature(names) - implements feature for object. example: obj.feature("disable_dump"); var obj2 = vz.createObj({feature: "disable_dump"})
   note: here we see a fun thing. we have a default feature of dumping objects, and we have to remove the feature. as we have no interface for removing
   features, we implement another one which will do the thing. I think that if we add interface for removing features, will it be usable?
   (e.g. obj.remove_feature("dump")) Maybe this is an idea for future (for the moment viewzavr is not implemented as a pack of features).
*/


/*
   problem

   we have a lot of programmatical things for viewzavr and it's objects.
   some of them may be useful for all objects, some of them only in certain projects, and some of them only for certain objects in certain projects.
   thus we have the following problems and requirements
   P1. somehow separate viewzavr into parts, so user of viewzavr is not overwhelmed of millions of features
   P2. suggestg a way for adding special behaviour for some objects (aka mixins).

   2nd might be implemented by a user via call to some function which extends the objects, but we have 2 problems here
   P2.1. there is still no import tables in browsers, so some common features are hard to import,
   P2.2. in dumps like json and xml, there is no way to call functions and some declarative methods required.
   Example of declarative methods for 2.2. might be a special object that implements selected features on target object.
   however even in that case it needs a way to resolve feature function by it's name.
   
   solution
   
   we introduce the following
   * a table of features (feature-id,feature-function).
   * a way to attach features by feature-id.
   
   Thus:
   P1 viewzavr is separated into features, some for viewzavr itself, other for its objects, maybe others for others things.
   P2 special behaviour might be added by attaching features to particular object
   P2.1. we implement own import table for this class of functions
   P2.2. might be implemented as special attributes for json/xml, say "feature".

   note

   I think of features as of packages. E.g. these are codes applied in some environment for purpose of modifying that environment.
   (btw those codes are free, as delegates of the core system, and might do anything they decide).
   This differs from behaviour constructors (for example "attr_reader :some" in ruby). The latter are functions with arguments
   (e.g. switched env), while features/packages have no switched env; they just plain codes/expressions.
   However I still do not understand the real difference and have to understand more.
   (because for example we actually might require codes with arguments, for example by calling A=5 B=7 some.sh)

   implementation

   A suggested approach is itself a feature, and we start by implementing it as a plain js function, see attach_feature_table_to_viewzavr
   It seems useful to apply features only once, F-ONCE.
   It seems useful to apply some features by default.
   
   Maybe have have to split feature tables, or somehow determine is feature appliable to target object (e.g. for viewzavr, for object, so on).
   
   ideas
   
   * make feature a list of other feature names? e.g. res.add("somefeature","other features list")
   * we need something like this for "default" features for objects, so on. e.g. vz.feature_table.features_list["object_default"]
   
     this will allow to split viewzavr and it's behavriour into features itself.
     actually it is already a feature-splitted (every file in viewzavr-core is a feature, initiated by setup(vz))
     but it seems we need more managed way (task - determine the difference).
   
   * btw what to do if default feature is registered, but some tree already exist?

   * feature default in subtree?
   
   update - probably features auto-activated for some scope is simpler todo with event handlers.
   update - for features consisting of features, it is simple call to feature function of child features and target env.
   
*/


//import {createNanoEvents} from "../utils/nano-events.js";
import {createNanoEvents} from "../nodesystem/events/init.js";

//////////////////////////////////////////////////////////

export function normalize_feature_name(name) {
  if (name.replaceAll)
    name = name.replaceAll("_","-");
  return name;
}


export function create_feature_table() {
  let res = { list: {}
            };
  // feature_list in form feature_id -> feature_function( target_env ).
  // here target_env is some object, say viewzavr or viewzavr's object.

  // adds a feature record to a table
  res.add = (name,f) => {
    //console.log("feature-tools: registering feature",name)
    var name2 = normalize_feature_name(name); // i love feature-name, but it may arrive as feature_name (from functions names)
    var existing = res.list[name] || res.list[name2]; 
    if (existing && !existing.may_override) {
      console.error("feature-tools: feature named ",name,"already resigered. skipping add");
      //console.trace();
      return;
    }
    res.list[name] = f;
    // microfeature: dash-names
    res.list[name2] = f;
    if (f)
       res.emit(`feature-registered-${name2}`,name2,f);
  }
  res.get = (name) => {
    return res.list[name];
  }

  // вот тут у меня уже вопрос, зачем вот так вот.. вмешивать какие-то имена в окружение...
  // вдруг конфликты будут.. почему нельзя действительно в под-окружение это добавить?
  add_events( res );

  // applies feature to target_env

/* заменяется далее
  res.apply = (name,target_env,...args) => {
    let f = res.list[name];
    if (!f) {
      // ну и что... что нету функции....
      console.error("viewzavr features: feature",name,"not found. object desired for feature is ",target_env );
      return;
    }

    // F-ONCE
    // keeps record of applied features in that target_env
    // (I think that is normal to change that env for that purpose).    
    
    // возможно тут и не надо once, а сделать это опцией. потому что фигня получается если у нас аргументы у extend-ов.
    // но с другой стороны, если надо что-то с аргументами. то extend может выдать функцию такую, которая уже будет что-то делать на базе аргументов.
    // посмотрим в общем.
    if (target_env.has_feature(name))
      return;
    target_env.set_has_feature(name);
        
    // so, apply the feature
    f( target_env,...args );
    return true;
   }
*/

   return res;
}

export function feature_names_to_arr( names ) {
  if (!names || names == "") return [];
  if (names.split) names = names.split(/[\s,]+/);
  /*
  else
  if (typeof(names) === "object") {
    if (!Array.isArray(names))
      names = Object.keys(names);
  }
  */
  // тут у нас идет потеря аргументов фич.. если фичи активировались как
  // obj.feature( { feature1: {params...}, feature2: {params...}})
  if (Array.isArray(names)) return names.filter( x => !!x );
  return [names];
}


export function add_features_registry( env ) {
  env.feature_table = create_feature_table();
  // here names is array of feature names, or a string in form "feature1 feature2, feature3"
  env.feature_for = (target_env, features, ...args) => {
    var names = feature_names_to_arr(features);
    //if (names.split) names = names.split(/[\s,]+/);
    var result;
    names.forEach( (name) => {
       result = env.feature_table.apply( name, target_env, ...args );
    } );

    return result;
  }

  env.unfeature_for = (target_env, features, ...args) => {
    var names = feature_names_to_arr(features);
    var result;
    names.forEach( (name) => {
       result = env.feature_table.unapply( name, target_env, ...args );
    } );

    return result;
  }

  // вот это все результат того что я разрешил чтобы features были строкой с пробелами или массивом
  // можно было остановиться и сказать что ток 1 штучка
  env.toggle_feature_for = (target_env, features, ...args) => {
    var names = feature_names_to_arr(features);
    var result;
    names.forEach( (name) => {

       if (target_env.is_feature_applied(name))
         result = env.feature_table.unapply( name, target_env, ...args );
       else
         result = env.feature_table.apply( name, target_env, ...args );
    } );

    return result;
  }  

  env.register_feature = (name,f) => {
    env.feature_table.add( name, f );
    //env.emit("feature-registered",name,f);
  } // table_name ?  
  env.get_feature_core = ( name ) => env.feature_table.get( name );

  // хорошо бы чтобы это тоже стало фичей.. но я до сих пор не переключил мозги, может потом смогу
  // featureset = набор { ключ -> функция }
  env.register_feature_set = ( featureset ) => {
    for (var name of Object.keys(featureset)) {
        if (name == "setup") continue;
        // фича если идет префикс feature_ то выкусить.
        // иначе не удается в функциях использовать красивые имена типа if
        var reging_name = name;
        if (reging_name.startsWith("feature_"))
            reging_name = reging_name.slice( 8 );
        env.register_feature( reging_name, featureset[name] );
    }
  }
}

export function add_features_use( env, registry_env ) {
  env.feature = (names,...args) => registry_env.feature_for( env, names,...args );
  // тут идет спор - это может быть использовано не для фич vz, а просто для поиска фич, find_feature.

  env.unfeature = (names,...args) => registry_env.unfeature_for( env, names,...args );

  env.toggle_feature = (names,...args) => registry_env.toggle_feature_for( env, names,...args );

  env.extend = env.feature; // пока идет конкурс имен

  env.set_feature_applied = (name,value=true) => {
    name = normalize_feature_name( name );
    //name = name.replaceAll("_","-");
    env.$features_applied ||= {};    
    if (value)
      env.$features_applied[name] = value;
    else
      delete env.$features_applied[name];

    // ТПУ
    // todo испускать события ток если первый раз это состояние
    if (name.split) {
      if (value)
        env.emit(`feature-applied-${name}`);
      else
        env.emit(`feature-unapplied-${name}`);
    };

    // todo идея таки писать в параметры - всем проще станет..
    //if (!env.setParam) debugger;
    //env.setParam("$features_applied",Object.keys( env.$features_applied ))
  }

  env.is_feature_applied = (name) => {
    name = normalize_feature_name( name );
    // дорогое удовольствие наверное @todo @optimize
    //name = name.replaceAll("_","-"); 
    env.$features_applied ||= {};
    return env.$features_applied[name];
  }
  // идея - is_features_applied т.е. name массив и выдает true если все

  // todo:
  // idea: if aready is_feature, call cb too
  //env.on_feature = (name,cb)
}

// добавляет метод env(name)
export function add_create_env( target_env, registry_env ) {
  target_env.env = (name) => {
    let e = name ? (target_env[name] || {}) : {};
    add_features_use( e, registry_env );
  }
}


/////////////////////////////////// фича "добавки к фичам"
// потребность - чтобы при срабатывании фичи NAME1 срабатывали еще дополнительные фичи по списку, связанному с NAME1
// особенность - контроль чтобы в списке доп-фич фичи не было дублирования, чтобы одну и ту же суб-фичу не применять два раза.

// F-APPEND-RECALL - если фичу расширяют после ее применения на окружении, то расширение надо применить и тогда

var reported_feautures = {};
var missing_and_found_feautures = {};

export function add_appends_to_table(env) {
  env.appends = {}
  env.append = (name,name2) => {
    //console.error('add_appends_to_table is deprecated')
    //debugger;

    env.appends[name] ||= [];
    if (env.appends[name].indexOf(name2) < 0) {
        env.appends[name].push( name2 ); // todo optimize
        env.emit(`feature-appended-${name}`,name2); // F-APPEND-RECALL
        //console.log("vz: appended feature ",name2,"to",name)
    }
    // по идее теперь надо найти все объекты и применить к ним это обновление
    // todo  
  }
  /*
  let orig = env.apply;
  */
  env.run_appends = (name,target_env,...args) => { // башенка / событие (но однократное)
    //if (orig( name, target_env, ...args)) {
    for (let appended_name of (env.appends[name] || []))
        env.apply( appended_name, target_env, ...args );
  }

  env.unapply = (name,target_env,...args) => {
    if (!target_env.is_feature_applied(name))
      return;
    target_env.set_feature_applied(name,false);
    // ок пока не умеем удалять
  }

  env.apply = (name,target_env,...args) => {
    name = normalize_feature_name(name);

    // F-ONCE
    // keeps record of applied features in that target_env
    // (I think that is normal to change that env for that purpose).    
    
    // возможно тут и не надо once, а сделать это опцией. потому что фигня получается если у нас аргументы у extend-ов.
    // но с другой стороны, если надо что-то с аргументами. то extend может выдать функцию такую, которая уже будет что-то делать на базе аргументов.
    // посмотрим в общем.
    if (target_env.is_feature_applied(name))
      return;
    target_env.set_feature_applied(name);

    // F-FEAT-FUNC
    if (name.bind) // в качестве фичи передали функцию - наш новый путь 2022-08
    {
       result = invoke_feature_function( name, target_env,env, ...args ); 
       return result;
    }
    // F-FEAT-FEAT-OBJ
    if (name.is_feature_applied && name.is_feature_applied("feature")) {
      let f = name.params.output;
      result = invoke_feature_function( f, target_env,env, ...args ); 
      return result; 
    }

    let f = env.list[name];
    let appends = env.appends[name];
    if (!f && !appends) {
      console.error(`viewzavr: feature '${name}' is not defined (no code and no appended features). object desired for feature is `,target_env.getPath ? target_env.getPath() : target_env );
      target_env.vz.console_log_diag( target_env );

      // субфишка - если это тип или категория - то не ругаться
      // но тут вьюзавра еще нету..
      // значит другая идея - при регистрации типа или категории - добавлять их в список фич. ну.
      /*
      if (vz.getTypeInfo(f) || vz.getCatsDic()[f])
      {
      }
      else
      */

      let error_report_tmr;
      
      if (!reported_feautures[name]) { // будем ток 1 раз ныть
        reported_feautures[name] = true;
        missing_and_found_feautures[name] = true;
        let ms = 5000;

        error_report_tmr = setTimeout( () => {
          if (missing_and_found_feautures[name]) {
              console.error(`viewzavr features: feature '${name}' is not defined (no code and no appended features) even after ${ms}ms timeout. object desired for feature is `,target_env.getPath ? target_env.getPath() : target_env );
              target_env.vz.console_log_diag( target_env );

              if (env.list[name])
                console.error("dual error. feature is prezent in env.list",missing_and_found_feautures[name])
          }              
          // todo поставить тут проверку что еще может что-то загружается.. а то таймаут это не о чем
        },ms)

        //console.log(`viewzavr features: feature ${name} is scheduled for timeout"`,error_report_tmr)
      }
      // ну и что что фичи нет - потом может появится..
      //return;
      var unbind1 = env.on(`feature-registered-${normalize_feature_name(name)}`,(name2,newf) => {
        //console.log(`viewzavr features: feature '${name}'(${name2}) is post-applied!`,error_report_tmr)
        unbind1();
        if (error_report_tmr) { clearTimeout( error_report_tmr ); error_report_tmr=null; }
        // ладно уж почистим и таймер
        missing_and_found_feautures[name] = false;
        //newf( target_env,...args );
        invoke_feature_function( newf, target_env, env, ...args );
      })
      target_env.on("remove",() => unbind1() );
      // todo то же самое с appends
    }
        
    // so, apply the feature
    var result = true;
    if (f) {
      if (f.func) f = f.func;
      //result = f( target_env,...args );
      result = invoke_feature_function( f, target_env,env, ...args );
    }
    //console.log("running desired appends for",name)
    if (appends) 
      env.run_appends( name, target_env, ...args );

    // F-APPEND-RECALL - добавить вызов новых аппендов
    // короче практика показала что это жутко дорогая вещь какая-то
    // а именно много событий ждем.. если это удалить все побыстрее мбыть optimize

    let unbind_fa = env.on(`feature-appended-${name}`,(name2) => {
      // console.log("INTERESTING PLACE - feature appended",name,"with",name2)
      env.run_appends( name, target_env, ...args );
    }); 
    target_env.on("remove",() => unbind_fa() );
    

    return result;
   }

   // F-FEAT-PARAMS
   function invoke_feature_function(f,target_env, feature_env, ...args) {
      return f( target_env, ...args );

/*
      if (target_env.master_env) {
        // ситуация когда target_env является спец-окружением для фичи, которая по факту прицеплена к другому окружению
        // задаваемому master_env
        return f( target_env.master_env, target_env, ...args );
      }
      else // простая ситуация - фича в этом же окружении
        return f( target_env,target_env, ...args );
*/        
   }
}

export function add_appends( env ) {
   add_appends_to_table( env.feature_table );
   env.register_feature_append = ( name, names ) => {
      if (names.split) names = names.split(/[\s,]+/);
      for (let appended_name of names)
         env.feature_table.append( name, appended_name )
   }
}


/////////////////////////////////// фича "карты фич"
// update из будущего - какая-то невероятная муть..
// потребность - уметь красиво задать карту добавок к фичам.
/* пример: 
   var app = {
      main: "features",
      features: "hash-settings auto-load-settings auto-save-settings auto-save-screenshot datapath-from-url commands-socket show-file-progress"
   }
   vz.register_feature_map( app, "main" );
*/   

export function add_feature_map( env ) {
  // в общем это пока загадочный для меня метод, непонятный. что-то типа массовй регистрации аппендов, получается.
  // но тогда это register_feature_appends_map
  env.register_feature_map = ( map, entry_point ) => {
    if (entry_point) 
      interpret( map, entry_point, env );
    else {
      for (let name of Object.keys(map))
        interpret( map, name, env );
    }
  }
  // идея apply_feature_map и там типа карта и точка входа. так вот, 1) развернуть карту и 2) применить точку входа.
}

// возможно тут понадобится еще include файлов. и тогда будет счастьие. а может и нет, может это надо в list.txt будет добавить.
/* замысел алгоритма:
     идти по ключам указанной записи 
       * и если ключ append то это значит что надо зарегистрировать append к записи.
       * а для других ключей - повторить процедуру рекурсивно.
*/
// todo - в будущем лесом это. надо просто идти по всем ключам и все.
    function interpret( code, feature, registry_env ) {
      let value = code[ feature ];

      if (!value) return; // ну или обратиться в словарь? - вдруг там что еще развернется..

      if (typeof(value) == "string") value = { append: value }
        //else if (Array.isArray( value ))
      if (typeof(value) == 'function') value = { core: value }

      for (let n of Object.keys(value)) {
         if (n == "append") {
           let toappend = value[n];
           if (typeof(toappend) == "string") toappend = toappend.trim().split(/[\s,]+/);
           //registry_env.register_feature_append( toappend );
            /* вроде не надо разбивать --- надо! */
           for (let item of toappend) {
              registry_env.register_feature_append( feature, item );
              // и надо пройти по этой фиче в дерево наше
              interpret( code, item, registry_env );
           }
         }
         else if (n == 'core') {
            registry_env.register_feature( feature, value[n]);
         }
         else
           interpret( code, n, registry_env );
      }
    }

export function add_features_post_apply( env ) {
  var o1 = env.register_feature;
  env.register_feature = (name,f) => {
    return o1(name,f);
  }
}

export function add_events( env ) {
  var nanoevents = createNanoEvents();
  env.emit = nanoevents.emit.bind(nanoevents);
  env.on = nanoevents.on.bind(nanoevents);
  env.off = nanoevents.off.bind(nanoevents);

  env.once = (event,cb) => {
    let unbind_once;
    unbind_once = nanoevents.on( event, (...args) => {
      cb(...args)
      if (unbind_once) unbind_once();
      unbind_once = null;
    } );
    return unbind_once;
  }
}

/////////
/*
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
*/

/*
export var createNanoEvents = () => ({
  events: {},
  emit(event, ...args) {
    ;(this.events[event] || []).forEach(i => i(...args))
  },
  on(event, cb) {
    this.events[event] ||= new Set();
    this.events[event].add(cb);
    return () => this.events[event].delete(cb)
  },
  off(event, cb) {
    this.events[event] ||= new Set();
    this.events[event].delete(cb)
  }
})
*/

