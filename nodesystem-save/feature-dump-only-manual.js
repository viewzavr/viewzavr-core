// фича "кладем в дамп только если значение настраивали руками"

import * as P from "../utils/prepend.js";

export default function setup(m) {

  P.chain(m,"create_obj", function(obj, opts) {

    this.orig(obj, opts);

/*  получается у меня нет кода инициализации объекта в контексте объекта.. 
    => нет возможности использовать замыкания для хранения состояния.. вот это сработало бы:
    кстати это как вариант развития событий, т.к. все-равно нужен будет порядок в create_obj и т.п. навести

    obj.chain("init",function() {
      let somestate;

      obj.chain("some-method", function() {
  
      })
    })
*/
    let dumporig = obj.dumpParam;
    
    /*
    let psetorig = obj.setParamWithoutEvents;
    P.chain(obj,"setParamWithoutEvents",function(name,value) {
      obj.initial_param_values ||= {}
      if (!obj.initial_param_values[name]) {
        obj.initial_param_values[name] = { value }
      }
      return this.orig( name, value );
    });*/

    obj.getParamManualFlag = function(name) {
      return obj.getParamOption(name,"manual") || obj.getParamOption(name,"always_manual");
    }

    obj.setParamManualFlag = function(name,ismanual) {
      return obj.setParamOption(name,"manual",ismanual);
    }

    // запоминаем что выставлено руками
    // оказывается флажок ismanual это лишь триггер вызывать выставление опции..
    // ну т.е. это удобняшка такая выходит...
    P.chain(obj,"setParamWithoutEvents", function(name,value,ismanual) {
      if (!ismanual || (ismanual && value != obj.params[name])) // manual выставляем ток если новое значенье
         obj.setParamManualFlag( name,ismanual );
      return this.orig( name, value, ismanual );
    });

    // created this method(tpu) to implement R-SETREF-OBJ
    P.chain(obj,"dumpParam", function(name) {
      // настраивали руками - окей; а если роботы делали - зачем нам это?
      if (obj.getParamManualFlag( name ))
        return this.orig(name);
      return undefined;
    });

    // фича "не надо дампить объект, который не создавали руками"
    P.chain(obj,"dump", function(force) {
      if (obj.ismanual() || obj === obj.findRoot() || force || obj.params.force_dump) 
        return this.orig();
      // флаг force_dump для того что если объект таки надо сохранять по каким-то причинам (insert_default_children)

      // но - может оказаться что объект автоматический, а в глубинах его сидит объект с настроенными вручную параметрами
      // и это надо тоже сохранить
      // @todo подумать над этим - может быть там стоит говорить о patch или params_for?

      // далее алгоритм возвращения дампа, если в поддереве что-то поменяли руками.      
      let result = this.orig();
      if (result.params)
         return result;

      let first_child = Object.values( result.children || {} )[0] || {};
      if (first_child.params || first_child.children || first_child.manual) {
         // что-то есть, ладно
         return result;
      }

      return undefined;
      //return this.orig();
    });

    return obj;
  }); // create_obj

}