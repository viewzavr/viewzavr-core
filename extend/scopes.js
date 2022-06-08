// F-SCOPE

/* потребность правильно проводить поиск имен приводит к такой механике
   которая как-то правильно называется но я назвал ее пока scopes.

   из записок:

   логика - объекты и скопы вообще не связаны как бы...
    ну один во многих может быть, а что толку то...
    эти скопы как бы параллельно живут..
    но в итоге оказываются в link-ах и прочих кто вызывает find-obj... и вот они уже должны
    предоставить правильный скопе. ну оно их и берет из массива что хранит.
    хотя хранить не обязательно.

   репитер:
    lexical-parent должен создать, для доступа к наруже себя...
    и плюс - новое скопе окружение для нутрянок...
    смысл - там внутри д быть свой мир и плюс доступ наружу.
    но доступа снаружи в этот мир быть не должно.

    и репитер д создавать для каждого экземпляра в отдельности скопу.

    и все инсертеры должны создавать свой скоп.
    короче везде где мозг подразумевает область видимости - там и создавать.

    так выходит. ну и распространять на создаваемые в этой области детей, так выходит.

   ------ 

   короче выяснилось что у всего у чего мы мысленно считаем "отдельный скоп"
   у того и скоп и надо создавать.
   и в сего у чего мы мысленно считаем есть доступ к другим скопам
   то туда и надо этот доступ прокладывать (addScopeRef)

   ну и фишка что мы вызывая restoreFromDump даем туда аргумент scope текущий
   и он прокидывается через этот аргумент рекурсивно на все поддерево
   и в link-i попадает и все работает.
   а когда оно заходит в реализацию компаланг-фич, там начинается отдельный restoreFromDump
   (как бы боковой) и для него создается отдельный скопе, как бы вложенный, и получается
   что ссылки внутри фичи уже его используют.
   и аналогично с репитерами и прочеме insert-children и if-ами.

*/

export function setup( vz )
{
  vz_add_scopes( vz );
}

function vz_add_scopes( vz ) {
  vz.chain( "create_obj", function (obj,options) {

    obj.$scopes = [];
    obj.$scopes.createScope = (comment) => {
      let newscope = obj.$scopes.createAbandonedScope( comment );
      obj.$scopes.push( newscope );
      return newscope;
    };
    obj.$scopes.createAbandonedScope = (comment) => {
      if (!comment)
         debugger;
      let newscope = {
          $comment: comment,
          $add: ( name, env ) => {
            // функция добавляет объект в скопу. она умная, удалит запись когда объект удалится
            newscope[name]=env;
            env.on('remove',() => delete newscope[name]);
          }
        };
      return newscope;
    };
    obj.$scopes.addScopeRef = (ref) => { 
      if (!ref) {
         console.error("addScopeRef with empty scope!",ref,obj)
         debugger;
         return;
      }
      obj.$scopes.push( ref );
    };
    obj.$scopes.top = () => {
      return obj.$scopes[ obj.$scopes.length-1 ];
    }

/*
    if (options.$scopeParent) {
      debugger;
      obj.$scopes.addScopeRef(options.$scopeParent);
    }  
*/    
      // вот это момент вилки для ссылок
    
    this.orig( obj, options );
    return obj;
 });
}
