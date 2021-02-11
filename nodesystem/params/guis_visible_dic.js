// тестовая версия
// словарь с уведомлениями

// need: попытка навести универсальность. т.е. не setParam а obj.params.set, не setGuiVisible а obj.guivisile.set..
// need: надо как-то хранить опции параметров.. и тоже от них уведомления как-то получать..

function dic_with_events() {
  var x = {};
  
  x.events = new EventTarget();

  x.track = function(name,fn) {
    x.events_dic.addEventListener(name,fn);
  }
  x.untrack = function(name,fn) {
    x.events_dic.removeEventListener(name,fn);
  }
  x.signal = function(name,arg1) {
    x.events_dic.dispatchEvent( new CustomEvent(name, {detail: arg1} ) );
  }
  x.set = function(name, value) {
    x[name] = value;
  }
  x.get = function(name) {
    return x[name];
  }
  x.remove = function(name) {
    delete x[name];
  }

  return x;
}

export default function setup(x) {
  x.guivisible = dic_with_events();

  return x;
}
