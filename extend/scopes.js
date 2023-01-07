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

/* изначально я пользовался этими скопами чтобы хранить ссылки на объекты.
   т.е компаланг исходник в нем местами написаны айди объектов типа v: ...
   и вот надо это v найти. И в исходниках все статично, v не меняется, оно привязывается один раз.

   но затем я стал пользоваться чтобы в скоп писать и меняемые данные. поэтому стало 
   использоваться создание временных объектов типа positional-env, и тогда обращение
   к нему научены links-are-objects зачитывать правильно значение.

   и кроме того еще появилась операция let (см misc/let) которая сохраняет тоже в скоп,
   но для них придумано что let создает ячейки (cells) в обязательном порядке.
   и далее ссылки (links-are-objects) - научены, что если вернули cell то ей надо выполнить get
   и тогда получим значение. при этом find, который и есть основной клиент scope на тему поиска,
   в это даже не вникает.

   но затем выяснилось такой аспект, что например репитеру тоже надо сохранять значения в scope.
   и если это значение является объектом - то оно воспринимается как статичный случай (см выше)
   ссылки на объект. и получается затем что обновление данных репитером - не работает.

   в общем начинается размышление, как же быть. то ли всех в ячейки сажать?.. но тогда получится
   что find находит ячейки а не объекты.. правда ссылки это разруливают..
   но хочется оставить случай когда в scope сажать напрямую ячейки, без промежуточных..

   решение следующее. попробуем всегда создавать для scope-значений ячейки.
   но если пишут значение-ячейку, то сохранять ей напрямую.
   но для этого требуется, чтобы scope знали о ячейках.. а они часть компаланга а не viewzavr-core..

   решил пока обойтись не ячейками а прокси-объектами positional как раньше и ввел параметр use_proxy
   и репитер будет их указывать. а в будущем можно будет и ячейки внедрить, а этот параметр забыть.
*/

export function setup( vz )
{
  vz_add_scopes( vz );
}

// также вручную добавляются $lexicalParentScope
function vz_add_scopes( vz ) {

  let scopes_id_counter = 0;

  vz.createAbandonedScope = ( comment ) => {
  if (!comment)
         debugger;
      let newscope = {
          $comment: comment,
          $scope_id: (scopes_id_counter++),
          $forget: (name) => {
              let v = newscope[name];
              if (v?.$this_is_proxy_by_scopes)
                 v.remove();
              delete newscope[name];
          },
          $add: ( name, env, force_proxy=false ) => {

            if (!env?.on || force_proxy) { // мы пока не умеем ссылаться на не-объекты и поэтому сделаем объект для значений

              let existing_obj = newscope[name];
              if (existing_obj)
              {
                // там может быть и канал..
                if (existing_obj.setParam)
                    existing_obj.setParam( 0, env );
                else
                if (existing_obj.set)
                    existing_obj.set( env );
                // но вообще это какая-то интересная, прикольная история про то что я стал писать туда ячейки
                // это как бы хорошо но дало обратную сторону - я теперь не могу туда сохранить ячейку ))))
                // стал  юзать force_proxy посмотрю что будет  
                // update - это исползьуется let-ом. чтобы обновлять заодно быстро значения. он сюды каналы пишет.
                return;
              }

              // todo интересно а как я их чищу? эти созданные объекты?
              // по идее их надо чистить при удалении скопов.. сообразно надо эти скопы как-то прицеплять к remove..
              // ну а может они и норм им.. и вообще - проще сделать тут просто ячейки (cell)
              // todo перевести на ячейки

              let param_env = vz.createObj();
              param_env.feature("is_positional_env");
              param_env.setParam( 0, env );
              param_env.$this_is_proxy_by_scopes=true;
              env = param_env;
            }

            //console.log("adding scope name",name,env)

            // функция добавляет объект в скопу. она умная, удалит запись когда объект удалится
            newscope[name]=env;

            // но теперь это касается не только окружений а и любых значений
            if (env?.on) 
                env.on('remove',() => {
                  // console.log("deleting scope name",name,"due to env remove",env.$vz_unique_id)
                  delete newscope[name]
            });
          }
        };
      return newscope;  
  };

// vz_add_scopes это получается модификатор объекта.. а не самостоятельная сущность...
// и ее смысл.. ну населить в объект $scopes переменную Хотя она особо и не нужна
// но мы там часто юзаем scopes.top() и все такое..
// но так-то вроде она и не нужна, это правда
  vz.chain( "create_obj", function (obj,options) {
    obj.$scopes = [];
    obj.$scopes.createScope = (comment) => {
      let newscope = obj.$scopes.createAbandonedScope( comment );
      obj.$scopes.push( newscope );
      return newscope;
    };
    obj.$scopes.createAbandonedScope = vz.createAbandonedScope;

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
