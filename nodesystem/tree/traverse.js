// меня смущает надо ли это вообще во вьюзавре методах иметь
// ну пока оставим..тем более что трижс например имеет такой метод.. ну ладно..
// хотя вариантов обхода множество и зачем внедрять такой алгоритм в ядро мне непонятно если честно

// добавляет в список детей функцию обхода
// nf это функция которая по объекту выдает область его древовидных штук..
// может быть этой функции тут не место, может ей место в viewzavr
// а может и вообще в утилитах

// пока не стал добавлять в ведро
// новый замысел: vz.feature("find"); vz.find( blabla ) - загрузка фич по требованию.
// формально тогда они не становятся АПИ!...
// либо даже как в js: find = vz.feature("find");
// т.е. это по сути такой набор библиотек...

export default function setup( origobj, nf ) {

  var obj = nf( origobj );
  
  obj.find = function( fn ) {
    var cc = obj.getChildNames();
    for (var i=0; i<cc.length; i++) {
      var name = cc[i];
      var cobj = obj.getChildByName( name );
      var res = fn( cobj );

      if (res) return res;
      var res2 = nf(cobj).find( fn );
      if (res2) return res;
    }
    return undefined;
  }

  obj.traverse = function( fn ) {
    var cc = obj.getChildNames();
    for (var i=0; i<cc.length; i++) {
      var name = cc[i];
      var cobj = obj.getChildByName( name );
      var res = fn( cobj );
      nf(cobj).traverse( fn );
    }
  }

}
