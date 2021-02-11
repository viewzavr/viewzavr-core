// добавляет связь параметров и гуи

export default function setup(x) {

  var orig = x.addGui;
  x.addGui = function(rec) {
    var orig_fn = rec.fn;
    var itsme = false;
    x.trackParam( rec.name, function() {
      if (!itsme) {
        itsme = true;
        var v = x.getParam( rec.name );
        rec.setValue( v );
        orig_fn( v ); // вызываем handler гуевого типа - ибо гуя может и не быть и он тогда не сработает
        // при этом повторный вызов от гуя если он есть мы отсечем - см ниже проверку на itsme
        itsme = false;
      }
    });
    
    // rec.fn is a gui handler function (see guis.js)
    rec.fn = function(value) {
      if (!itsme) {
        itsme = true;
        x.setParam( rec.name, value );
        if (orig_fn) orig_fn( value );
        itsme = false;
      }
      
    };
    
    // эта штука тут должна быть, до нашего переопределения setValue..
    rec = orig( rec );
    
    // без этой штуки вызов rec.setValue не меняет значение слайдера в гуях..
    var orig_setvalue = rec.setValue;
    rec.setValue = function(v) {
      if (!itsme) {
        itsme = true;
        x.setParam( rec.name, v );
        itsme = false;
      }
      return orig_setvalue( v );
    }
    /*
    rec.trackChanged = function(handler) {
      return x.trackParam( rec.name );
    }
    */
    // без этой штуки мы не сможем сделать трекинг в ParamEdit
    rec.obj = x; 
    
    // ну тут мы экспериментально щас как дернем за веревочку
    // проверка if стоит чтобы команды не посылать сразу )))
    // if (rec.value && orig_fn) orig_fn( rec.value );
    // усиление - нам надо таки выставить значение заданное в гуе
    // чтобы оно ушло уехало в параметры..
    // кстати можно будет тут сделать где-то флаг на тему что это дефолтное значение параметра..
    
//    if (rec.value && typeof( x.getParam( rec.name ) ) == "undefined")
//       x.setParam( rec.name, rec.value );
        //rec.setValue( rec.value );
    
        
    // новая идея: всегда вызывать гуи. но. НЕ. не будет вызывать всегда.. будем вызывать если..
    // передавать значение - если уже было в параметре как-то задано, то гуи его не переопределяет
    
    // короче - вызываем обработчик гуя, если он задал значение, а оно отличается от того что выставлено
    // к этому моменту уже в параметрах. вот.
    
    var cpv = x.getParam( rec.name );
    if (typeof( cpv ) != "undefined" && cpv != rec.value)
      x.signalTracked( rec.name ); // тыркнули за веревочку - с текущим значением параметра
    else
    if (typeof( cpv ) == "undefined" && rec.value) {
      x.setParam( rec.name, rec.value ); 
      // надо и похоже выставить значение, и дернуть за веревочку тоже.. 
    }
      
//    else
//      if (rec.value) // тыркнули за веревочку, но гуевым значением (а надо?)
//        x.setParam( rec.name, rec.value );
        
    // короче тут надо крепко разобраться!
    
    return rec;
  };

  return x;

}
