import * as FT from "./feature-tools.js";

export default function setup( vz ) {

  FT.add_events( vz );
   
  FT.add_features_registry( vz );
    FT.add_appends( vz ); // думаю вызов фичи должен быть здесь. аддитивность - подключаем фичу один раз.
    FT.add_feature_map( vz );

  FT.add_features_use( vz, vz );
  FT.add_create_env( vz, vz );
  
  vz_add_features_to_new_objs( vz );
  vz_add_host_field_to_new_objects( vz );

  /* оказывается вредно вроде как..
  vz_activate_features_from_new_obj_params( vz, (o) => o.features );
  vz_activate_features_from_new_obj_params( vz, (o) => o.feature );
  vz_activate_features_from_new_obj_params( vz, (o) => o.params?.features );
  vz_activate_features_from_new_obj_params( vz, (o) => o.params?.feature );
  vz_activate_features_from_new_obj_params( vz, (o) => o.extend );
  vz_activate_features_from_new_obj_params( vz, (o) => o.params?.extend );
  */
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

  vz.register_feature_set({viewzar_translate});
  vz.feature( "viewzar_translate"); // может на уровне обьекта это тоже?

  // //vz.register_feature_map({"viewzavr-object":{append:[vzf_manual_features]}})
}


function vz_add_features_to_new_objs( vz ) {
  vz.chain( "create_obj", function (obj,options) {
    // setup
    FT.add_features_use( obj, vz );
    FT.add_create_env( obj, vz );
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
    
    return obj;
  });
}

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
  obj.trackParam("manual_features", (v) => {
    obj.manual_feature( v );
  })
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