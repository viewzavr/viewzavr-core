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


export function create_feature_table() {
  let res = { list: {} };
  // feature_list in form feature_id -> feature_function( target_env ).
  // here target_env is some object, say viewzavr or viewzavr's object.

  // adds a feature record to a table
  res.add = (name,f) => {
    res.list[name] = f;
  }

  // applies feature to target_env

  res.apply = (name,target_env,...args) => {
    let f = res.list[name];
    if (!f) {
      console.error("viewzavr features: feature",name,"not found. object desired for feature is ",target_env );
      return;
    }

    // F-ONCE
    // keeps record of applied features in that target_env
    // (I think that is normal to change that env for that purpose).    
    
    // возможно тут и не надо once, а сделать это опцией. потому что фигня получается если у нас аргументы у extend-ов.
    // но с другой стороны, если надо что-то с аргументами. то extend может выдать функцию такую, которая уже будет что-то делать на базе аргументов.
    // посмотрим в общем.
    
        target_env.applied_features ||= {};
        if (target_env.applied_features[name]) return;
        target_env.applied_features[name] = true;
        
    // so, apply the feature
    return f( target_env,...args );
   }
   return res;
}

export function add_features_registry( env ) {
  env.features = create_feature_table();

  env.feature_table = create_feature_table();
  // here names is array of feature names, or a string in form "feature1 feature2, feature3"
  env.feature_for = (target_env, names, ...args) => {
    if (names.split) names = names.split(/[\s,]+/);
    names.forEach( (name) => env.feature_table.apply( name, target_env, ...args ) );
  }

  env.register_feature = (name,f) => env.feature_table.add( name, f ); // table_name ?  

  // хорошо бы чтобы это тоже стало фичей.. но я до сих пор не переключил мозги, может потом смогу
  env.register_feature_set = ( featureset ) => {
    for (var name of Object.keys(featureset)) {
        if (name == "setup") continue;
        env.register_feature( name, featureset[name] );
    }
  }

}

export function add_features_use( env, registry_env ) {
  env.feature = (names,...args) => registry_env.feature_for( env, names,...args );
  // тут идет спор - это может быть использовано не для фич vz, а просто для поиска фич, find_feature.

  env.extend = env.feature; // пока идет конкурс имен
}

// добавляет метод env(name)
export function add_create_env( target_env, registry_env ) {
  target_env.env = (name) => {
    let e = target_env[name] || {};
    add_features_use( e, registry_env );
  }
}

/*
export function attach_features_feature_to_viewzavr( vz ) {
  add_features_registry( vz );
  add_features_use( vz );
  add_create_env( vz, vz );

  let orig = vz.create_obj;
  vz.chain( "create_obj", function (obj,options) {
    // setup
    add_features_use( obj, vz );
    add_create_env( obj, vz );
    // call constructor
    this.orig( obj, options );
    
    // feature: implement default features (determined by viewzavr)
    // obj.feature( "viewzavr-object-features" );
    
    // feature: implement features listed in 'features' key in options
    if (options.features)
      obj.feature( options.features );
    // feature: implement features listed in 'features' key in options.params
    if (options?.params?.features)
      obj.feature( options.params.features );
      
    // TODO это тоже фича, анализировать фичи.. надо бы это оформить как фичу...
    
    
    return obj;
  });
}
*/

function add_features_to_new_objs( vz ) {
  vz.chain( "create_obj", function (obj,options) {
    // setup
    add_features_use( obj, vz );
    add_create_env( obj, vz );
    // call constructor
    this.orig( obj, options );
    return obj;
 });
}

function activate_features_from_new_obj_params( vz, f_from_options ) {
  //let orig = vz.create_obj;
  vz.chain( "create_obj", function (obj,options) {
    this.orig( obj, options );
    if (f_from_options( options ))
      obj.extend( f_from_options( options ) );
    return obj;
  });

}

// this is a feature of attaching feature table to x
export default function setup( vz ) {
//   attach_features_feature_to_viewzavr( vz );
   
  add_features_registry( vz );
  add_features_use( vz );
  add_create_env( vz, vz );
  
  add_features_to_new_objs( vz );
  activate_features_from_new_obj_params( vz, (o) => o.features );
  activate_features_from_new_obj_params( vz, (o) => o.params?.features );
  activate_features_from_new_obj_params( vz, (o) => o.extend );
  activate_features_from_new_obj_params( vz, (o) => o.params?.extend );
}
