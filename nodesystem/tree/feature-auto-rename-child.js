// фича переименовывания добавляемого объекта в списке объектов родителя
export default function setup( obj, nf ) {

  var _obj = obj;
  obj = nf( obj );

  var gcounter = 0;
  
  var orig = obj.appendChild;

  obj.appendChild = function( cobj,name,enableRename, position ) {
    if (name) {
      // todo: check name here, and maybe rename?
      var existing = obj.getChildByName( name );
      if (existing && existing != cobj) {
        if (enableRename) {
          while (obj.getChildByName( name )) {
            gcounter=gcounter+1;
            name = name + "_" + gcounter.toString();
          }
        }
        else {
          console.warn( "WARNING: overwriting existing child with same name and removing existing child!",name );
          // obj.forgetChild( existing );
          existing.remove();
        }
      }
    }
    return orig( cobj, name, enableRename, position );
  }
    

  return obj;
}
