// F-ITEMS feature
export default function setup( obj, nf ) {

  var _obj = obj;
  obj = nf( obj );

  _obj.items = obj.childrenTable;

  
  //Object.defineProperty( )

  return obj;
}
