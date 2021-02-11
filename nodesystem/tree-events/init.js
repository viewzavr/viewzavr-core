// Добавляет полезныя сигналы в дерево
// по сути это как т-каналы ксати тоже, эти сигналы
// только они пост-фактум работают и на результат не влияют..

export default function setup( m ) {
  m.chain("create_obj",function(obj0,opts) {
    var obj = this.orig( obj0, opts );
    
    var orig = obj.ns.appendChild;
    obj.ns.appendChild = function( cobj,name ) {
      var res = orig( cobj, name );
      var p = obj; while (p) {
        p.signal("appendChild",cobj);
        p = p.ns.parent;
      }      
      return res;
    }
    
    var orig2 = obj.ns.forgetChild;
    obj.ns.forgetChild = function( cobj ) {

      var res = orig2( cobj );
      var p = obj; while (p) {
        p.signal("forgetChild",cobj);
        p = p.ns.parent;
      }
      return res;
    }
    
    return obj;
  });
}