// тестовая версия
// словарь с уведомлениями

// need: попытка навести универсальность. т.е. не setParam а obj.params.set, не setGuiVisible а obj.guivisile.set..
// need: надо как-то хранить опции параметров.. и тоже от них уведомления как-то получать..

function dic_with_events() {
  var x = {};
  
  x.events_dic = new EventTarget();

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
    x.signal( name,value );
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

/*  
  x.setParamOption("x","visible",false );
  x.setParamOption("x","save",false );
  
  x.setParamOption
  
  x.paramOptions("x").set("visible",false);
  x.paramOptions("x").set("save",false);
  
  x.paramOptions("x").track
*/
  
  var alldic = {};
  x.param_options = alldic;

  x.paramOptions = function(name) {
    if (!alldic[name])
         alldic[name] = dic_with_events();
    return alldic[name];
  }
  
  x.setParamOption = function(name,name2,value) {
    x.paramOptions(name).set(name2,value);
  }
  x.getParamOption = function(name,name2) {
    return x.paramOptions(name).get(name2);
  }  
  x.trackParamOption = function(name,name2,fn) {
    x.paramOptions(name).track(name2,fn);
  }
  x.untrackParamOption = function(name,name2,fn) {
    x.paramOptions(name).untrack(name2,fn);
  }  
  
  return x;
}
