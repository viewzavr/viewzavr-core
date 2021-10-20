// тестовая версия
// словарь с уведомлениями

// need: попытка навести универсальность. т.е. не setParam а obj.params.set, не setGuiVisible а obj.guivisile.set..
// need: надо как-то хранить опции параметров.. и тоже от них уведомления как-то получать..

import * as E from "../events/init.js";

function dic_with_events() {
  var x = {};
  
  x.events_dic = E.createNanoEvents();

  x.track = x.events_dic.on.bind(x.events_dic);
  x.untrack = x.events_dic.off.bind(x.events_dic);
  x.signal = x.events_dic.emit.bind(x.events_dic);
  x.on = x.events_dic.on.bind(x.events_dic);
  x.off = x.events_dic.off.bind(x.events_dic);
  x.emit = x.events_dic.emit.bind(x.events_dic);

  x.set = function(name, value) {
    x[name] = value;
    x.emit( name,value );
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
  x.getParamOption = function(name,name2,defaultvalue) {
    let r =  x.paramOptions(name).get(name2);
    if (typeof(r) === "undefined") return defaultvalue;
    return r;
  }
  
  x.trackParamOption = function(name,name2,fn) {
    return x.paramOptions(name).track(name2,fn);
  }
  x.untrackParamOption = function(name,name2,fn) {
    x.paramOptions(name).untrack(name2,fn);
  }
  
  return x;
}
