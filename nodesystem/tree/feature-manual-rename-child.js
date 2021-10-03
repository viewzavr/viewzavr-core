// фича переименовывания объекта

export default function setup( obj, nf ) {

  var _obj = obj;
  obj = nf( obj );

  var gcounter = 0;
  
  obj.renameChild = function( name, newname ) {
    var existing = obj.getChildByName( name );
    if (!existing) return;

    delete obj.childrenTable[ name ];
    obj.childrenTable[ newname ] = existing;

    nf( existing ).name = newname;

    _obj.signal("child_renamed", existing ); // тпу
    obj.signalOnTree( "change_in_tree", _obj ); // todo сделать новое имя этому сигналу.. мб проще даже типа treechange
    existing.signal("name_changed", name, newname );

    return existing;
  }

  return obj;
}
