var docs     = require('../docs'),
    weld     = require('weld').weld,
    markdown = require('github-flavored-markdown'),
    findit   = require('findit'),
    fs       = require('fs'),
    path     = require('path'),
    helpers  = require('../helpers');

var dir = exports;

var fs = require('fs');

dir.weld = function(dom, dirs) {

    var $ = docs.window.$;

  Object.keys(dirs).forEach(function(d) {

    //start with our theme
    dom.innerHTML = docs.content.theme['./theme/directory.html'].toString();

    //
    // In order to build a ToC for the directories view, we need to load the
    // articles. These lines are copypasted from articles.js.
    // This needs to be dealt with in a better way.
    //
    var _articles = findit.sync('./pages/articles');

    //
    // Filter out all non-markdown files
    //
    _articles = _articles.filter(function(a){
      a = a.replace('./pages/articles', '');
      if(a.match(/\./)){
        return false;
      } else {
        return true;
      }
    });

    // Here, we build up the table of contents.
    var toc = helpers.filesToTree(_articles);
        toc = helpers.treeToHTML(toc);

    //set up the data
    var data = {
      pwd: d.replace("./pages", ""),
      ls: dirs[d],
      toc: toc,
      metadata: {
        breadcrumb: d.split("/").slice(2)
      }
    };

    //weld it!
    weld(dom, data, {
      map: function(parent, element, key, val) {

        if ($(element).attr("id") === "toc") {
          element.innerHTML = val;
          return false;
        }

        if ($(element).hasClass("ls")) {
          var title = val.split("/");
          title = title[title.length - 1].replace(/-/g, " ");
          var listing = $("<tr>").attr("class", "ls").append(
            $("<td>").append(
              $("<a>").attr("href", val.replace("pages/", "")).text(title)
            )
          );

          $("tr", $(element)).replaceWith(listing);
          return false;
        }

        //
        // Create breadcrumb
        //
        if ($(element).hasClass('breadcrumb')) {
          var crumb = '';
          $('.breadcrumb', parent).each(function(i,v){
            crumb += ('/' + $(v).html());
          });
          crumb += ('/' + val);
          $(element).attr('href', crumb);
          $(element).html(val);
          return false;
        }

        return true;

      }
    });

    //Attach the results to dirs
    dirs[d].content = dom.innerHTML;
  });
  
  return dom;

};


dir.generate = function(output, dirs) {

  //
  // Generate the dir views yo
  //
  Object.keys(dirs).forEach(function(file){
    var newPath = file.replace('./pages', './public');
    newPath =  path.normalize(newPath + '/index.html');

    helpers.writeFile(newPath, dirs[file].content, function(){});
  });

  return dirs;
};

// This returns a hash of the form { path: [children] }
dir.load = function() {
  var _dir = findit.sync('./pages');

  var dir = {};

  // Grab all folders that *only* have more folders
  _dir.filter(function(dir){

    if (fs.statSync(dir).isDirectory()) {
      return fs.readdirSync(dir).every(function(p) {
          var isDir = fs.statSync(dir+"/"+p).isDirectory();
          if (!isDir && path.extname(p).length === 0) {
          }
          return isDir;
      });
    } else {
      return false;
    }

  }).forEach(function(d) {
    dir[d] = fs.readdirSync(d).map(function(files) {
        return path.resolve("/"+d+"/"+files).replace("./pages", "");
    });
  });

  return dir;
};
