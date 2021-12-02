// Добавляет полезныя сигналы в дерево
// по сути это как т-каналы ксати тоже, эти сигналы
// только они пост-фактум работают и на результат не влияют..

export default function setup(m) {

  m.chain("addTreeToObj", function(obj, tree_name) {
    this.orig(obj, tree_name);

    // вопрос, это получается сигнал то на объекте у нас а не на дереве
    // ну пусть так пока будет
    // это сигнал наверх
    obj[tree_name].signalOnTree = function( ...args ) {
      var p = obj;
      while (p) {
        p.signal( ...args );
        p = p[tree_name].parent;
      }
    }

    var orig = obj[tree_name].appendChild;

    obj[tree_name].appendChild = function(cobj, name, rename) {
      var res = orig(cobj, name, rename);
      obj[tree_name].signalOnTree("appendChildInTree");
      obj.signal("appendChild", cobj);
      cobj.signal("parent_change");
      obj[tree_name].signalOnTree("change_in_tree");
      return res;
    }


    var orig2 = obj[tree_name].forgetChild;
    obj[tree_name].forgetChild = function(cobj) {

      var res = orig2(cobj);

      if (!cobj) return;
      
      obj[tree_name].signalOnTree("forgetChildInTree");
      obj.signal("forgetChild", cobj);
      cobj.signal("parent_change", cobj );
      obj[tree_name].signalOnTree("change_in_tree");
      return res;
    }

  });

}