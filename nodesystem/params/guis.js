// добавляет понятие элементов управления к x
// 

export default function setup(x) {

  x.guis = {};
  
  // need this to remove circluar ref (when gui record holds ref to owner obj)
  x.chain("remove",function() {
    x.guis = {};
    this.orig();
  });


  x.addGui = function(rec) {
    if (!rec.fn) rec.fn = function() {};

    // R-NEED-GUI-TITLE
    // R-PROVIDE-GUI-TITLE
    // F-USE-PARAM-OPTIONS
    rec.getTitle = function() { 
      var t = x.getParamOption( rec.name,"title" ) || rec.name;
      return t;
    }
  
    rec.setValue = function(val) {
      rec.value = val;
      rec.fn( val );
    }

    // для комбо
    rec.getValues = function() { return rec.values };

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
    return x.addGui( { type: "slider", name: name, value: value, min: min, max: max, step: step, fn: fn } );
  }
  x.addCombo = function(name, value, values, fn) {
    return x.addGui( { type: "combo", name: name, value: value, values: values, fn: fn } );
  };

  x.addComboValue = function(name, value, values, fn) {
    return x.addGui( { type: "combovalue", name: name, value: value, values: values, fn: fn } );
  };
  x.addComboString = x.addComboValue;

  x.addCmd = function( name, fn ) {
    // feature: when adding cmd, also add method to obj
    x[name] = fn;

    return x.addGui( { type: "cmd", name: name, fn: fn });
  };

  x.hasCmd = function(name) {
    let gui = x.getGui( name );
    return (gui?.type === "cmd" && gui?.fn);
  }
  x.callCmd = function( name, ...args ) {
    let gui = x.getGui( name );
    if (gui?.type === "cmd")
      return gui.fn.apply( gui.fn, args );
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
    x.setParamOption( name,"internal",true ); // R-DO-NOT-SAVE-LABEL-VALUE
    return x.addGui( { type: "label", name: name, value: value, fn: fn });
    //return x.addGui( { type: "label", name: name, value: value, fn: fn, forceUseGuiValue: true });
  };
//  x.addUrl = function( name, value, fn ) {
//    return x.addGui( { type: "url", name: name, value: value, fn: fn });
//  };
  x.addFile = function( name, value, fn ) {
    return x.addGui( { type: "file", name: name, value: value, fn: fn });
  };
  
  x.addArray = function( name, value, text_formating_options, fn ) {
    //x.setParam( name,value );
    //x.setParamOption( name,"internal",true );
    return x.addGui( { type: "array", name: name, value: value, fn: fn, columns_count: text_formating_options });    
    //return x.addGui( { type: "text", name: name, value: value, fn: fn });
  };

  return x;
}
