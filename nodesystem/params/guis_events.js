// методы работы visible про гуи. тестовая версия, надо рефакторить.

// need: надо управлять видимостью гуев хоть как-то
// idea: переместить в опции параметров, с которыми надо работать все-равно

// todo - events каждый раз создаются... на каждом addGui.. а они могут быть и повторными...

export default function setup(x) {

  var orig = x.addGui;
  x.addGui = function(rec) {
    var res = orig(rec);
    //console.log("______ GPN emit gui-added",rec.name,x.getPath())
    x.emit("gui-added",rec.name);
    //console.log("emit","gui-changed-"+rec.name)
    x.emit("gui-changed-"+rec.name,rec.name);

/*
    rec.events.addEventListener( "visible-changed",() => {
      x.emit("gui-visible-changed",rec.name);
    } );
*/

    return res;
  };

  var orig2 = x.removeGui;
  x.removeGui = function(name) {
    var res = orig2(name);
    x.emit("gui-removed",name);
    return res;
  };

  return x;
}
