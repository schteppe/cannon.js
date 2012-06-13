/**
 * @file doc.js
 * @brief Main JavaScript file
 */

/**
 * @mainpage About
 *
 * @section intro_sec What is Doc.js?
 * Doc.js is a web based on-the-fly documentation generator.
 * 
 * @section install_sec Usage
 * 
 * @subsection step1 Step 1: Document your code
 * Using Doc.js comment blocks.
 * 
 * @subsection step1 Step 2: Create an HTML file
 * Create an HTML file that imports doc.js and runs DOCJS.Generate(["file1.js","file2.js",...]). Add some CSS while you're at it, or use a CSS template.
 *
 * @subsection step1 Step 3: Done
 * Open your HTML file in your browser and view the result.
 *
 * @section contrib_sec Contribute
 * If you like this software, help making it better. Fork the code on https://github.com/schteppe/doc.js
 *
 */

var DOCJS = {};

/**
 * @fn DOCJS.Generate
 * @param Array urls
 * @param Object options
 */
DOCJS.Generate = function(urls,opt){
    $("body").append("<article>\
      <nav></nav>\
      <footer>\
	<a href=\"http://github.com/schteppe/doc.js\">github.com/schteppe/doc.js</a>\
      </footer>\
    </article>");

    opt = opt || {};
    var options = {
	title:"Hello World!",
	description:"My first Doc.js documentation"
    };
    $.extend(options,opt);

    // Utils
    String.prototype.trim=function(){return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');};
    String.prototype.ltrim=function(){return this.replace(/^\s+/,'');}
    String.prototype.rtrim=function(){return this.replace(/\s+$/,'');}
    String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');}

    var mainpage,
    pages=[],
    classes=[],
    filedesc = [],
    functions=[],
    methods=[],
    properties=[],
    name2class={};
    
    // Set repos header
    $("nav")
	.append("<h1>"+options.title+"</h1>")
	.append("<p>"+options.description+"</p>");

    function update(){
	
	// Register hash for datatypes
	for(var i in classes){
	    name2class[classes[i].name] = classes[i];
	}
	
	// Check for main page
	for(var i in pages){
	    if(pages[i] instanceof DOCJS.MainPage){
		mainpage = pages[i];
		pages.splice(i,1);
	    }
	}

	// Sort
	var sortbyname=function(a,b){
	    if(a.name>b.name) return 1;
	    if(a.name<b.name) return -1;
	    else return 0;
	};
	pages.sort(sortbyname);
	classes.sort(sortbyname);
	functions.sort(sortbyname);
	
	function datatype2link(name){
	    if(name2class[name])
		return "<a href=\"#"+name+"\">"+name+"</a>";
	    else
		return name;
	}
	
	// Main page
	if(mainpage){
	    $("nav")
		.append("<h2>Pages</h2>")
		.append("<ul><li><a href=\"#"+mainpage.name+"\">"+mainpage.name+"</a></li></ul>");
	    $("article")
		.append(
		    $("<section id=\"pages\"><h1>Pages</h1></section>")
			.append("<div id=\""+mainpage.name+"\" class=\"page\">"+mainpage.toHTML()+"</div>")
		);
	}
	
	// Classes
	var $ul = $("<ul></ul>");
	var $details = $("<section id=\"classes\"><h1>Classes</h1></section>");
	for(var j=0; j<classes.length; j++){
	    var args = [], c = classes[j];
	    $class_sec = $("<section id=\""+c.name+"\"></section>");
	    for(var k in c.parameters){
		args.push("<span class=\"datatype\">"+datatype2link(c.parameters[k].type)+"</span>" + " " + c.parameters[k].name);
	    }
	    var sign = c.name;
	    $class_sec
		.append("<h2>"+c.name+"</h2>")
		.append("<p>"+c.brief+"</p>");
	    
	    // Methods
	    var $methods = $("<table></table>").addClass("member_overview");
	    $methods.append("<tr><td class=\"datatype\">&nbsp;</td><td>" + c.name + " ( " + args.join(" , ") + " )</td></tr>");
	    for(var k in methods){
		var m = methods[k];
		if(m.memberof==c.name){
		    
		    var margs = [];
		    for(var k in m.parameters)
			margs.push("<span class=\"datatype\">"+datatype2link(m.parameters[k].type)+"</span>" + " " + m.parameters[k].name);

		    $methods
			.append("<tr><td class=\"datatype\">"+(m.returnvalue ? datatype2link(m.returnvalue.type) : "&nbsp;")+"</td><td>" + m.name + " ( " +margs.join(" , ")+ " )</td></tr>")
			.append("<tr><td></td><td class=\"brief\">"+m.brief+"</td></tr>");
		    
		    if(m.returnvalue && m.returnvalue.type && m.returnvalue.brief)
			$methods.append("<tr><td></td><td class=\"brief\">Returns: "+m.returnvalue.brief+"</td></tr>");
		}
	    }
	    
	    var np=0, $properties = $("<table></table>").addClass("member_overview");
	    for(var k in properties){
		var p = properties[k];
		if(p.memberof==c.name){
		    $properties.append("<tr><td class=\"datatype\">"+(p.type ? datatype2link(p.type) : "&nbsp;")+"</td><td>" + p.name + "</td><td class=\"brief\">"+p.brief+"</td></tr>");
		    np++;
		}
	    }
	    
	    $class_sec
		.append("<h3>Public member functions</h3>")
		.append($methods);
	    if(np){
		$class_sec
		    .append("<h3>Properties</h3>")
		    .append($properties);
	    }

	    $details.append($class_sec);

	    $class = $("<li><a href=\"#"+c.name+"\">"+sign+"</a></li>");
	    if(j==0)
		$ul = $("<ul class=\"class_overview\"></ul>");
	    $ul.append($class);
	}
	$classes = $("<div><h2>Classes</h2></div>")
	    .append($ul);
	$("nav").append($classes);
	$("article").append($details);
	
	// Functions
	var $ul = $("<ul></ul>");
	var $details = $("<section id=\"functions\"><h1>Functions</h1></section>");
	for(var j=0; j<functions.length; j++){
	    var args = [];
	    var f = functions[j];
	    
	    $funsec = $("<section></section>");

	    // Construct signature
	    for(var k in f.parameters){
		var p = f.parameters[k];
		args.push("<span class=\"datatype\">"+datatype2link(p.type)+ "</span> " + p.name);
	    }
	    $funsec.append("<h2 id=\""+f.name+"\"><span class=\"datatype\">"+(f.returnvalue ? datatype2link(f.returnvalue.type) : "") + "</span> " + f.name+" ( "+args.join(" , ")+" )</h2>")
		.append("<p>"+f.brief+"</p>");
	    
	    // Parameter details
	    $params = $("<table></table>");
	    for(var k in f.parameters){
		var p = f.parameters[k];
		$params.append("<tr><th><span class=\"datatype\">"+(p.type ? datatype2link(p.type) : "&nbsp;")+ "</span> <span class=\"param\">" + p.name+"</span></th><td>"+p.brief+"</td></tr>");
	    }
	    $funsec.append($params);
	    $details.append($funsec);
	    
	    /*
	    $class = $("<tr><td class=\"datatype\">"+(f.returnvalue && f.returnvalue.type.length ? datatype2link(f.returnvalue.type) : "&nbsp;")+"</td><td><a href=\"#"+f.name+"\">"+f.name+"</a> ( <span class=\"datatype\">"+args.join("</span> , <span class=\"datatype\">")+"</span> )</td>");
	    if(j==0)
		$ul = $("<table class=\"function_overview\"></table>");
	    $ul.append($class);
	    */

	    // For the nav
	    $fun = $("<li><a href=\"#"+f.name+"\">"+f.name+"</a></li>");
	    if(j==0)
		$ul = $("<ul class=\"function_overview\"></ul>");
	    $ul.append($fun);
	}
	if(functions.length){
	    $("nav")
		.append("<h2>Functions</h2>")
		.append($ul);
	    $("article")
		.append($details);
	}
	
    }
    DOCJS.update = update;
    
    // Get the files
    for(var i=0; i<urls.length; i++){
	$.ajax({
	    url:urls[i],
	    dataType:'text',
	    success:function(data){
		functions = functions.concat(DOCJS.ParseFunctions(data));
		methods = methods.concat(DOCJS.ParseMethods(data));
		classes = classes.concat(DOCJS.ParseClasses(data));
		properties = properties.concat(DOCJS.ParseProperties(data));
		pages = pages.concat(DOCJS.ParsePages(data));
		update();
	    }
	});
    }
};

/**
 * @class DOCJS.File
 * @brief A representation of a file
 * @author schteppe
 * @param string filename
 * @param array options
 * @todo Needed?
 */
DOCJS.File = function(filename,options){
  // Extend options
  options = options || {};
  var opt = {
    success:function(){},
    async:true
  };
  $.extend(opt,options);

  /**
   * @property string name
   * @brief The file name
   * @memberof DOCJS.File
   */
  this.name = filename;

  /**
   * @property array classes
   * @brief Classes found in the file
   * @memberof DOCJS.File
   */
  this.classes = [];

  /**
   * @property array methods
   * @brief Methods found in the file
   * @memberof DOCJS.File
   */
  this.methods = [];

  /**
   * @property array functions
   * @brief Functions found in the file
   * @memberof DOCJS.File
   */
  this.functions = [];

  /**
   * @property array pages
   * @brief Pages found in the file
   * @memberof DOCJS.File
   */
  this.pages = [];

  /**
   * @property array properties
   * @memberof DOCJS.File
   */
  this.properties = [];

  /**
   * @property string content
   * @memberof DOCJS.File
   */
  this.content = null;

  /**
   * @property string brief
   * @memberof DOCJS.File
   */
  this.brief = "";
};

/**
 * @fn DOCJS.ParseBlocks
 * @author schteppe
 * @brief Parse documentation blocks.
 * @param string src Source code to parse.
 * @return array
 */
DOCJS.ParseBlocks = function(src){
  // Get doc blocks a la doxygen
  // (.(?!\*\/))* is negative lookahead, anything not followed by */
  var blocks = src.match(/[\s\t]*\/\*\*\n(^(.(?!\*\/))*\n)+[\n\s\t]*\*\//gm) || [];//match(/\/\*\*([.\n\s\t\r\w*\@:\.\?\!\-_\d#]*)\*\//gm) || [];
  for(i in blocks){
    // trim
    blocks[i] = blocks[i]
      .replace(/\/\*\*[\n\t\r]*/,"")
      .replace(/[\n\t\r]*\*\/$/,"");
    var lines = blocks[i].split("\n");
    for(j in lines)
      lines[j] = lines[j].replace(/^[\s\t]*\*[\s\t]*/,"");
    blocks[i] = lines.join("\n");
  } 
  return blocks;
};

/**
 * @fn DOCJS.ParseMethods
 * @author schteppe
 * @param string src
 * @return array An array of parsed DOCJS.Method objects
 */
DOCJS.ParseMethods = function(src){
  var result = [];
  // Get doc blocks a la doxygen
  var blocks = DOCJS.ParseBlocks(src);
  for(i in blocks){
    // Methods have "@memberof" tags to reference their class AND a "@fn" tag for their name
    var fns = blocks[i].match(/\@fn([^@]*)/g);
    var memberofs = blocks[i].match(/\@memberof([^@]*)/g);
    if(memberofs && memberofs.length>=1 && fns && fns.length>=1){
      var m = new DOCJS.Method();
      m.memberof = memberofs[0].replace(/[\s]*@memberof[\s]*/,"").trim();
      m.name = fns[0].replace(/[\s]*@fn[\s]*/,"");
      m.parameters = DOCJS.ParseParameters(blocks[i]);
      m.brief = DOCJS.ParseBrief(blocks[i]);
      m.returnvalue = DOCJS.ParseReturn(blocks[i]);
      result.push(m);
    }
  }
  return result;
};

/**
 * @fn DOCJS.ParsePages
 * @author schteppe
 * @param string src
 * @return array An array of parsed DOCJS.Page objects
 */
DOCJS.ParsePages = function(src){
  var result = [];
  // Get doc blocks a la doxygen
  var blocks = DOCJS.ParseBlocks(src);
  for(i in blocks){
    // Pages got the @page command
    var pages = blocks[i].match(/\@(page|mainpage)([^@]*)/g);
    if(pages && pages.length>=1){
      var p = pages[0].match("main") ? new DOCJS.MainPage() : new DOCJS.Page();
      p.name = "Main page";
      blocks[i].replace(/\@(page|mainpage)[\s]*(.*)/,function(m,$1,$2){ p.name = $2.trim(); return m; });
      p.content = blocks[i].replace(/[\s]*@(page|mainpage).*/,"").trim();
      result.push(p);
    }
  }
  return result;
};

/**
 * @fn DOCJS.ParseClasses
 * @author schteppe
 * @brief Parse source code.
 * @param string src
 * @return array An array of parsed objects
 */
DOCJS.ParseClasses = function(src){

  var result = [];

  // Get doc blocks a la doxygen
  var blocks = DOCJS.ParseBlocks(src);
  for(i in blocks){

    // Classes have "@class" to define their name
    var classes = blocks[i].match(/\@class([^@]*)/g);
    for(j in classes){
      classes[j] = classes[j]
	.replace(/[\s]*@class[\s]*/,"");
      var s = classes[j];
      var c = new DOCJS.Class();
      c.name = s.trim();
      c.parameters = DOCJS.ParseParameters(blocks[i]);
      c.brief = DOCJS.ParseBrief(blocks[i]);
      result.push(c);
    }
  }
  return result;
};

/**
 * @fn DOCJS.ParseFunctions
 * @author schteppe
 * @param string src
 * @return array An array of parsed objects
 */
DOCJS.ParseFunctions = function(src){

  var result = [];

  // Get doc blocks a la doxygen
  var blocks = DOCJS.ParseBlocks(src);
  for(i in blocks){
    // functions have "@fn" to define their name
    var functions = blocks[i].match(/\@fn([^@]*)/g);
    var memberofs = blocks[i].match(/\@memberof([^@]*)/g);
    if(functions && !memberofs){
      for(j in functions){
	functions[j] = functions[j]
	  .replace(/[\s]*@fn[\s]*/,"");
	var s = functions[j];
	var c = new DOCJS.Function();
	c.name = s.trim();
	c.parameters = DOCJS.ParseParameters(blocks[i]);
	c.brief = DOCJS.ParseBrief(blocks[i]);
	c.returnvalue = DOCJS.ParseReturn(blocks[i]);
	result.push(c);
      }
    }
  }

  return result;
};

/**
 * @fn DOCJS.ParseParameters
 * @author schteppe
 * @brief Parses parameter data from a string.
 * @param string src Source code to parse from.
 * @return array An array of DOCJS.Parameter objects
 */
DOCJS.ParseParameters = function(src){
  var result = [],
  params = src.match(/@param([^@]*)/g);
  for(j in params){
    params[j] = params[j]
      .replace(/[\s]*@param[\s]*/,"");
    var s = params[j].split(" ",2);
    var param = new DOCJS.Parameter();
    if(s.length==2){
      param.type = s[0].trim();
      param.name = s[1].trim();
    } else if(s.length==1){
      param.type = "";
      param.name = s[0].trim();
    }
    param.brief = params[j].replace(s[0],"").replace(s[1],"").trim();
    result.push(param);
  }
  return result;
};

/**
 * @fn DOCJS.ParseProperties
 * @author schteppe
 * @param string src Source code to parse from.
 * @return array An array of DOCJS.Property objects
 */
DOCJS.ParseProperties = function(src){
  var result = [];

  var blocks = DOCJS.ParseBlocks(src);
  for(i in blocks){
    // Properties have @property and @memberof commands
    var properties = blocks[i].match(/\@property([^\n])*/),
      memberofs = blocks[i].match(/\@memberof([^\n])*/);
    if(properties && memberofs){
      properties[0] = properties[0]
	.replace(/[\s]*@property[\s]*/,"");
      var s = properties[0].split(" ");
      if(s.length<2)
	throw "@param needs two parameters, type and name";
      var property = new DOCJS.Property();
      property.memberof = memberofs[0].replace(/[\s]*@memberof[\s]*/,"").trim();
      property.type = s.shift().trim();
      property.name = s.shift().trim();
      property.brief = DOCJS.ParseBrief(blocks[i]);
      result.push(property);
    }
  }
  return result;
};

/**
 * @fn DOCJS.ParseBrief
 * @author schteppe
 * @brief Parses brief information from a code block
 * @param string src
 * @return string Brief description
 */
DOCJS.ParseBrief = function(src){
  var result = "",
  briefs = src.match(/@brief([^@]*)/g);
  for(j in briefs){
    briefs[j] = briefs[j]
      .replace(/[\s]*@brief[\s]*/,"");
    result += briefs[j].trim();
  }
  return result;
};

/**
 * @fn DOCJS.ParseReturn
 * @author schteppe
 * @brief Parses the information about the return value
 * @param string src
 * @return DOCJS.ReturnValue
 */
DOCJS.ParseReturn = function(src){
  var returns = src.match(/@return([^@]*)/);
  if(returns && returns.length){
    var result = new DOCJS.ReturnValue();
    var r = returns[0].replace(/[\s]*@return[\s]*/,"").trim().split(" ");
    result.type = r.shift();
    result.brief = r.join(" ");
    return result;
  }
};

/**
 * @class DOCJS.Class
 * @author schteppe
 * @brief A representation of a class.
 */
DOCJS.Class = function(){

  /**
   * @property DOCJS.Class parent
   * @memberof DOCJS.Class
   */
  this.parent = null;

  /**
   * @property array methods
   * @memberof DOCJS.Class
   */
  this.methods = [];

  /**
   * @property array properties
   * @memberof DOCJS.Class
   */
  this.properties = [];

  /**
   * @property array parameters
   * @memberof DOCJS.Class
   */
  this.parameters = []; // for constructor

  /**
   * @property string brief
   * @memberof DOCJS.Class
   */
  this.brief = "";
};

/**
 * @brief A representation of a function
 * @author schteppe
 * @class DOCJS.Function
 */
DOCJS.Function = function(){

  /**
   * @property string name
   * @memberof DOCJS.Function
   */
  this.name = "(untitled function)";

  /**
   * @property string brief
   * @memberof DOCJS.Function
   */
  this.brief = "";

  /**
   * @property string description
   * @memberof DOCJS.Function
   */
  this.description = "";

  /**
   * @property array parameters
   * @memberof DOCJS.Function
   */
  this.parameters = [];

  /**
   * @property DOCJS.ReturnValue returnvalue
   * @memberof DOCJS.Function
   */
  this.returnvalue = null;
};

/**
 * @brief A representation of a class method.
 * @author schteppe
 * @class DOCJS.Method
 * @extends DOCJS.Function
 */
DOCJS.Method = function(){

  /**
   * @property string memberof
   * @memberof DOCJS.Method
   */
  this.memberof = "";

  DOCJS.Function.call( this );
};
DOCJS.Method.prototype = new DOCJS.Function();

/**
 * @brief A representation of a class property.
 * @author schteppe
 * @class DOCJS.Property
 */
DOCJS.Property = function(){

  /**
   * @property string type
   * @memberof DOCJS.Property
   */
  this.type = "";

  /**
   * @property string name
   * @memberof DOCJS.Property
   */
  this.name = "";

  /**
   * @property string brief
   * @memberof DOCJS.Property
   */
  this.brief = "";
};

/**
 * @brief A representation of a page.
 * @author schteppe
 * @class DOCJS.Page
 */
DOCJS.Page = function(){

  /**
   * @property string name
   * @memberof DOCJS.Page
   */
  this.name = "";

  /**
   * @property string content
   * @memberof DOCJS.Page
   */
  this.content = "";
};
/**
 * @fn toHTML
 * @memberof DOCJS.Page
 * @brief Returns the page content in HTML format.
 * @return string
 */
DOCJS.Page.prototype.toHTML = function(){
  return (this.content
	  .replace(/\@section\s+([\w_]+)\s+([^\n]+)/gm,function(m,$1,$2){return "<h1 id=\""+$1+"\">"+$2+"</h1>";})
	  .replace(/\@subsection\s+([\w_]+)\s+([^\n]+)/gm,function(m,$1,$2){return "<h2 id=\""+$1+"\">"+$2+"</h2>";})
	  );
};

/**
 * @brief A representation of the main page.
 * @author schteppe
 * @class DOCJS.MainPage
 * @extends DOCJS.Page
 */
DOCJS.MainPage = function(){
  DOCJS.Page.call( this );
};
DOCJS.MainPage.prototype = new DOCJS.Page();

/**
 * @class DOCJS.Variable
 * @brief A representation of a variable.
 * @author schteppe
 */
DOCJS.Variable = function(){

  /**
   * @property string type
   * @memberof DOCJS.Variable
   */
  this.type = "";

  /**
   * @property string name
   * @memberof DOCJS.Variable
   */
  this.name = "";

  /**
   * @property string brief
   * @memberof DOCJS.Variable
   */
  this.brief = "";
};

/**
 * @brief A representation of a parameter.
 * @author schteppe
 * @class DOCJS.Parameter
 * @extends DOCJS.Variable
 */
DOCJS.Parameter = function(){
  DOCJS.Variable.call( this );
};
DOCJS.Parameter.prototype = new DOCJS.Variable();

/**
 * @class DOCJS.ReturnValue
 * @brief Represents the return information
 * @extends DOCJS.Variable 
 */
DOCJS.ReturnValue = function(){
  DOCJS.Variable.call( this );
};
DOCJS.ReturnValue.prototype = new DOCJS.Variable();