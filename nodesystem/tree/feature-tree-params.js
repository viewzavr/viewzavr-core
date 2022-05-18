// замысел что вывести children и парент в област параметров.
// экспериментально..

// F-ITEMS feature
export default function setup( obj, nf ) {
  obj.setParam("children", obj.ns.children )

  let o1 = obj.setChildren;
  obj.setChildren = (arr) => {
    o1( arr );
    obj.setParam("children", obj.ns.children );
  };

  // так то дорогая вещь просто заради того чтобы копировать по change-цепочке...
  // короче пока оставим
  obj.on("childrenChanged", () => {
    obj.setParam("children", [...obj.ns.children] );
    //obj.signalParam( "children" );
  });

  return obj;
}
