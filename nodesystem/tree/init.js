// добавляет древовидности объектам, создаваемым через create_obj

import setup_ch from "./children.js";
import setup_find from "./traverse.js";

// пока решил сажать древовидность в .ns
// это плохая практика, ибо контекст объекта не принадлежит нам, а что делать..
// можно сделать отдельно - узлы иерархии и объекты..
// но тогда вызов создания объекта что должен возвращать? объект или узел иерархии?

export default function setup(m) {

  // ТПУ
  m.addTreeToObj = function(obj, tree_name) {
    setup_tree(obj, tree_name)
  }

  m.chain("create_obj", function(obj, opts) {

    m.addTreeToObj(obj, "ns");

    // при добавлении объекта следим за уникальностью его имени в списке детей родителя
    if (opts.parent && opts.name) {
      // добавляем только если parent_tree совпадает с текущим деревом, либо если parent_tree не указано а текущее дерево это ns
      // if (opts.parent_tree == tree_name || (!opts.parent_tree && tree_name === "ns"))

        opts.parent.ns.appendChild(obj, opts.name, true);
    } else
    if (opts.name)
      obj.ns.name = opts.name;

    return this.orig(obj, opts);
  });

}


function setup_tree(obj, tree_name) {
  obj[tree_name] = {};
  setup_ch(obj, function(o) {
    return o[tree_name]
  });
  setup_find(obj, function(o) {
    return o[tree_name]
  });

  // при удалении объекта удаляем его дерево
  obj.chain("remove", function() {
    // slice(0) делает дубликат... объектов нам..
    // а без этого дубликата children меняются и forEach пропускает некоторых выходит
    // по уму можно сделать не дубликат а более лучший обход, через while или типа того, ну да ладно..

    //console.log("i am ",obj.getPath(),"id",obj.$vz_unique_id);
    //console.log("i have children count",obj[tree_name].getChildren().length)

    // оптимизация
    obj[tree_name].updateChildrenTable = () => {};
    let cc =obj[tree_name].children.slice(0);
    obj[tree_name].children=[];
    obj[tree_name].childrenTable={};
    //obj[tree_name].forgetChild = () => {};

    cc.forEach((c) => {
      //console.log("removing child ",c.getPath());
      //if (c.ns.name == "object_g_2_2xw709pds") debugger;
      c.remove();
    });
    
    //delete obj.ns;
    return this.orig();
  });
}