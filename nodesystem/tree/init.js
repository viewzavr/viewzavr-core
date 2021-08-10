// добавляет древовидности объектам, создаваемым через create_obj

import setup_ch from "./children.js";
import setup_find from "./traverse.js";

// пока решил сажать древовидность в .ns
// это плохая практика, ибо контекст объекта не принадлежит нам, а что делать..
// можно сделать отдельно - узлы иерархии и объекты..
// но тогда вызов создания объекта что должен возвращать? объект или узел иерархии?

export default function setup(m,das_tree_name="ns") {
let tree_name = das_tree_name;
//var gcounter = 0;

m.chain("create_obj",function(obj,opts) {
  // console.log("?>>>>>>>>>>>>>>>>>",opts);

  obj[tree_name] = {};
    setup_ch( obj, function(o) { return o[tree_name] } );
  setup_find( obj, function(o) { return o[tree_name] } );

  // при добавлении объекта следим за уникальностью его имени в списке детей родителя
  if (opts.parent && opts.name) {

    /*
    // делалка уникальности.. почему-то здесь
    var name = opts.name;
    while (opts.parent.ns.getChildByName( name )) {
      gcounter=gcounter+1;
      name = opts.name + "_" + gcounter.toString();
    }
    */

    // добавляем только если parent_tree совпадает с текущим деревом, либо если parent_tree не указано а текущее дерево это ns
    if (opts.parent_tree == tree_name || (!opts.parent_tree && tree_name === "ns"))
        opts.parent[tree_name].appendChild( obj, opts.name, true );
  }
  else
  if (opts.name)
    obj[tree_name].name = opts.name;

  // при удалении объекта удаляем его дерево
  obj.chain( "remove", function () {
    // slice(0) делает дубликат... объектов нам..
    // а без этого дубликата children меняются и forEach пропускает некоторых выходит
    // по уму можно сделать не дубликат а более лучший обход, через while или типа того, ну да ладно..
    
    obj[tree_name].getChildren().slice(0).forEach( (c) => {
      // console.log("removing child ",c);
      //if (c.ns.name == "object_g_2_2xw709pds") debugger;
      c.remove();
    });
    //delete obj.ns;
    return this.orig();
  });

  return this.orig( obj, opts );
});

}