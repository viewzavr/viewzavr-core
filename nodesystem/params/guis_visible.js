// методы работы visible про гуи. тестовая версия, надо рефакторить.

// need: надо управлять видимостью гуев хоть как-то
// idea: переместить в опции параметров, с которыми надо работать все-равно

export default function setup(x) {

  var orig = x.addGui;
  x.addGui = function(rec) {
    rec.events = new EventTarget();
    rec.setVisible = function(val) {
      rec.visible = val;
      rec.events.dispatchEvent( new CustomEvent("visible-changed", {detail: val} ) );
    }
    if (!rec.hasOwnProperty("visible")) rec.visible = true;
    return orig( rec );
  };
  x.setGuiVisible = function(name,value) {
    //debugger;
    var rec = x.guis[name];
    if (rec) rec.setVisible( value );
  }
  x.getGuiVisible = function(name) {
    var rec = x.guis[name];
    if (rec) return rec.visible;
  }

  return x;
}
