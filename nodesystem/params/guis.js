// добавляет понятие элементов управления к x
// 

export default function setup(x) {

  x.guis = {};
  
  // need this to remove circluar ref (when gui record holds ref to owner obj)
  x.chain("remove",function() {
    //console.log("in clear guis code",x.getPath())
    x.guis = {}; // поставим в конец... чтобы команды успели проходить..
    // не помогло
    this.orig();
  });


  x.addGui = function(rec) {
    if (!rec.fn) rec.fn = function() {};
    //console.log("addGui obj=",x.getPath(),rec.name)

    // R-NEED-GUI-TITLE
    // R-PROVIDE-GUI-TITLE
    // F-USE-PARAM-OPTIONS
    rec.getTitle = function() { 
      var t = x.getParamOption( rec.name,"title" ) || rec.name;
      if (x.translate_text) t = x.translate_text(t);
      return t;
    }
  
    rec.setValue = function(val) {
      rec.value = val;
      rec.fn( val );
    }

    // для комбо
    rec.getValues = function() {
      var v = x.getParamOption( rec.name,"values" ); // || rec.values;
      return v;
    };
    //rec.valuesUpdated

//  возможно, это все стоит связать с опциями параметра, т.е. setParamOption
//    rec.set = function( optionname, value ) {
//      rec[optionname] = value;
//    }

    rec.getType = () => rec.type;

    x.guis[ rec.name ] = rec;
    return rec;
  };

  x.getGui = function( name ) {
    return x.guis[ name ];
  }

  x.getGuiNames = () => Object.keys( x.guis );
  
  x.removeGui = function(name) {
    delete x.guis[ name ];
  }

  // как-то бы придумать чтобы легче добавлять параметры на основе text..
  // т.е. там текст и фукнкции преобразования.. (маленький текст строка, 
  // и большой текст - 2 функции)
  // ну и вообще подумать о комбинациях... как-то..
  x.addFloat = function( name, value, fn ) {
    return x.addGui( { type: "float", name: name, value: value, fn: fn });
  };

  x.addSlider = function (name, value, min, max, step, fn) {
    //x.setParamOption( name, "min", min );
    //console.log("addSlider name=",name,"max=",max)
    return x.addGui( { type: "slider", name: name, value: value, min: min, max: max, step: step, fn: fn } );
  }
  x.addCombo = function(name, value, values, fn) {
    x.setParamOption( name,"values",values);
    return x.addGui( { type: "combo", name: name, value: value, values: values, fn: fn, min: 0, max: values.length-1, step: 1 } );
  };

  x.addComboValue = function(name, value, values, fn) {
    x.setParamOption( name,"values",values);
    return x.addGui( { type: "combovalue", name: name, value: value, values: values, fn: fn, min: 0, max: values.length-1, step: 1 } );
  };
  x.addComboString = x.addComboValue;

  x.addEditableCombo = function(name, value, values, fn) {
    if (values)
        x.setParamOption( name,"values",values);
    let rec = x.addGui( { type: "editablecombo", name: name, value: value, values: values, fn: fn } );
    rec.getValues = () => x.getParamOption("name","values");
    return rec;
  };

  x.addCmd = function( name, fn, force ) {
    // feature: when adding cmd, also add method to obj
    // ну получается.. я тут делаю ||= и это значит что если уже есть - то не будет.
    // сейчас это используется когда мы заменяем rescan_params для dom_group (то ли в 2д то ли в 3д)
    // может быть тут стоит событийные вещи какие-то приделать или что-то другое

    if (typeof(fn) == 'string')
        fn = eval(fn);

    // todo класть команды не в x[name] а в x.$commands[name]
    x.$commands ||= {}; 
    
    if (force) {
      x[name] = fn;
    }
    else
      x[name] ||= fn; // todo расхреначить это

//    if (name == 'open-window')
      //debugger;
    //console.log( "addCmd name=",name,"fn=",fn,"force=",force)

    // таки это лучше так как - иначе ссылки не узнают про то что команда добавилась..
    x.setParam( name, (...args) => x.callCmd(name,...args));

    var res = x.addGui( { type: "cmd", name: name });

    // F-PENDING-CMDS
    if (x.pendingCmds && x.pendingCmds[name]) {
      var args = x.pendingCmds[name];
      delete x.pendingCmds[name];
      fn( ...args );
    }

    return res;
  };

  x.hasCmd = function(name) {
    let gui = x.getGui( name );
    return (gui?.type === "cmd" && gui?.fn);
  }
  x.callCmd = function( name, ...args ) {
    let gui = x.getGui( name );
    if (gui?.type === "cmd" && x[name]) {
      // может тут событий повызывать?
      //return gui.fn.apply( gui.fn, args );
      // вроде так интереснее вызывать..
      return x[name].apply( x, args );
    }
    else
    {
        // F-PENDING-CMDS
        x.pendingCmds ||= {};
        x.pendingCmds[name] = [...args];
    }
  }
  
  x.addColor = function( name, value, fn ) {
    return x.addGui( { type: "color", name: name, value: value, fn: fn });
  };
  x.addCheckbox = function( name, value, fn ) {
    return x.addGui( { type: "checkbox", name: name, value: value, fn: fn });
  };

  x.addText = function( name, value, fn ) {
    return x.addGui( { type: "text", name: name, value: value, fn: fn });
  };

  x.addString = function( name, value, fn ) {
    return x.addGui( { type: "string", name: name, value: value, fn: fn });
  };
  
  x.addLabel = function( name, value, fn ) {
    //x.setParamOption( name,"internal",true ); // R-DO-NOT-SAVE-LABEL-VALUE
    return x.addGui( { type: "label", name: name, value: value, fn: fn });
    //return x.addGui( { type: "label", name: name, value: value, fn: fn, forceUseGuiValue: true });
  };

/*
  x.addStatus = function( name, value ) {
    //x.setParamOption( name,"internal",true ); // R-DO-NOT-SAVE-LABEL-VALUE
    // да вроде как не надо - запоминается нынче только manual-вещи
    return x.addGui( { type: "status", name: name, value: value });
  };
*/  

//  x.addUrl = function( name, value, fn ) {
//    return x.addGui( { type: "url", name: name, value: value, fn: fn });
//  };

  x.addFile = function( name, value, fn ) {
    return x.addGui( { type: "file", name: name, value: value, fn: fn });
  };

  x.addFiles = function( name, value, fn ) {
    return x.addGui( { type: "files", name: name, value: value, fn: fn });
  };
  
  x.addArray = function( name, value, text_formating_options, fn ) {
    //x.setParam( name,value );
    //x.setParamOption( name,"internal",true );
    return x.addGui( { type: "array", name: name, value: value, fn: fn, columns_count: text_formating_options });    
    //return x.addGui( { type: "text", name: name, value: value, fn: fn });
  };

  x.addVector = function( name, value, text_formating_options, fn ) {
    //x.setParam( name,value );
    //x.setParamOption( name,"internal",true );
    return x.addGui( { type: "vector", name: name, value: value, fn: fn, columns_count: text_formating_options });    
    //return x.addGui( { type: "text", name: name, value: value, fn: fn });
  };  

  return x;
}
