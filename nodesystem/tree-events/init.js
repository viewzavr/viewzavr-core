// Добавляет полезныя сигналы в дерево
// по сути это как т-каналы ксати тоже, эти сигналы
// только они пост-фактум работают и на результат не влияют..

export default function setup(m) {

  m.chain("addTreeToObj", function(obj, tree_name) {
    this.orig(obj, tree_name);

    var orig = obj[tree_name].appendChild;
    obj[tree_name].appendChild = function(cobj, name, rename) {
      var res = orig(cobj, name, rename);
      var p = obj;
      while (p) {
        p.signal("appendChild", cobj); // @todo TODO move to tree from object
        p = p[tree_name].parent;
      }
      cobj.signal("parentChange");
      return res;
    }

    var orig2 = obj[tree_name].forgetChild;
    obj[tree_name].forgetChild = function(cobj) {

      var res = orig2(cobj);
      var p = obj;
      while (p) {
        p.signal("forgetChild", cobj);
        p = p[tree_name].parent;
      }
      return res;
    }

  });

}