// простой поиск первого объекта по имени
// с учетом что у нас локальные имена, это все выглядит странно
// по идее, надо путь.. типа *.some.name и если * то значит провести подпоиск во всех
// ну ладно пока такая версия

export default function setup( mv ) {

mv.findObj = function(name,startobj) {

  if (!startobj) startobj = mv.root;
  var s = startobj.ns.getChildByName( name );
  if (s) return s;
  
  var cc = startobj.ns.getChildren();
  for (var i=0; i<cc.length; i++) {
    var q = mv.findObj( name, cc[i] );
    // тут я задумался - можно конечно findObj добавить в объект "объект"
    // но в целом зачем не это? зачем вообще эти штуки аля ООП?
    // когда оно и внешним образом вроде норм?.. не знаю.. надо думать тут..
    if (q) return q;
  }

  return undefined;
}

}