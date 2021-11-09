/////////////// adds categories of types into nodesystem

// m.addItemType(code,title,initfn,opts)
// opts may contain field "cat"

// vz.getCats() -> various cat field values
// vz.getTypesByCat(category) -> list of codes (types) of that category

export default function setup(vz) {

  var cats_dic = {};

  vz.tools.chain(vz, "addItemType", function(code, title, fn, opts) {

    // feature: split : in title into 2

    if (!opts) opts = {};

    if (!opts.cats && opts.cat) {
      opts.cats = [opts.cat]
    }

    if (opts.cats && typeof(opts.cats) == "string")
      opts.cats = opts.cats.split(/\s+/);

    if (!opts.cats) {
      var parts = title.split(": ");
      if (parts.length >= 2) {
        title = parts[1]; // ну это никуда не уходит..
        let cats = parts[0].split(" ").map(s => s.trim().toLowerCase())
        // короче категория это идентификатор. если надо будет пробелы в ней - делаем ей title, отд опция
        opts.cats = cats;
        // feature: cats are lower-case
      }
    }

    if (!opts.hidegui) {
      var cats = opts?.cats || ["uncategorized"];
      for (let cat of cats) {
        cats_dic[cat] ||= [];
        if (cats_dic[cat].indexOf(code) < 0)
          cats_dic[cat].push(code);
      }
    }

    this.orig(code, title, fn, opts);
  });

  vz.getCats = function() {
    return Object.keys(cats_dic);
  }

  vz.getTypesByCat = function(cat) {
    //return cats_dic[cat] || [];
    var t = cats_dic[cat] || [];
    t = t.sort( function(a,b) { return gettitle(vz,a).localeCompare( gettitle(vz,b) ) }); // F-SORT-TYPES sort by name
    return t;
  }

  vz.getCatsByType = function(type) {
    var opts = vz.getTypeOptions(type);
    return opts.cats || ["uncategorized"]
  }

  vz.getCatsDic = () => cats_dic;

} // setup

function gettitle( vz, code ) {
  var s = vz.getTypeOptions(code).title;
  return s;
}

/* воообще категории под вопросом. особенно с учетом появления фич.
   если категория это что-то визуальное (для диалога добавления)
   то ей нужно описание.
   если же мы в категориях хотим упоминать фичи, которые следует активировать....
   думаю что фичи должны идти отдельным списком.

   если идти темой конструкторов и аксессоров, то список категорий и категории - это разное?
   или все живет и управляется списком категорий? (без категорий как отдельных сущностей)
   вопрос интересный. сейчас вообще у нас получается этот список неявный,
   наполняется косвенно, и затем доступен через аксессоры выше (getCats и т.п.)
   дизайн, однако...
*/