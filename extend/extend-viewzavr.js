import * as FT from "./feature-tools.js";

export default function setup( vz ) {
   
  FT.add_features_registry( vz );
    FT.add_appends( vz ); // думаю вызов фичи должен быть здесь. аддитивность - подключаем фичу один раз.
    FT.add_feature_map( vz );

  FT.add_features_use( vz, vz );
  FT.add_create_env( vz, vz );
  
  vz_add_features_to_new_objs( vz );
  vz_activate_features_from_new_obj_params( vz, (o) => o.features );
  vz_activate_features_from_new_obj_params( vz, (o) => o.params?.features );
  vz_activate_features_from_new_obj_params( vz, (o) => o.extend );
  vz_activate_features_from_new_obj_params( vz, (o) => o.params?.extend );
  // потребность "фича object на новых объектах" => можно создавать новые объекты вообще только из фич
  vz_add_feature_object_to_new_objects( vz );

  vz_add_type_as_feature( vz );
  vz_add_cats_as_feature( vz );
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
    if (f_from_options( options ))
      obj.extend( f_from_options( options ) );
    return obj;
  });
}

function vz_add_feature_object_to_new_objects( vz, f_from_options ) {
  //let orig = vz.create_obj;
  vz.register_feature( "viewzavr-object", () => {} );
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
     if (!vz.get_feature_core( code )) vz.register_feature( code, () => {} );
     var res = this.orig( code, title, fn, opts );
     // зарегаем категории как фичи (они могут появиться только после срабатывания addItemType)
     var cats = vz.getCatsByType( code );
     for (var q of cats) {
        if (!vz.get_feature_core( q )) vz.register_feature( q, () => {} );
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