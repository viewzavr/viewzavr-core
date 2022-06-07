// F-SCOPE

export function setup( vz )
{
  vz_add_scopes( vz );
}

function vz_add_scopes( vz ) {
  vz.chain( "create_obj", function (obj,options) {

    obj.$scopes = [];
    obj.$scopes.createScope = (comment) => {
      if (!comment)
         debugger;
      let newscope = {$comment: comment};
      obj.$scopes.push( newscope );
      return newscope;
    };
    obj.$scopes.createAbandonedScope = (comment) => {
      if (!comment)
         debugger;
      let newscope = {$comment: comment};
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
