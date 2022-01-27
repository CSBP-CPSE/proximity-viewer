/*
 * Web Mapping Components
 * https://github.com/CSBP-CPSE/web-mapping-components/blob/master/LICENCE.md
 * v1.0
 */

/**
 * Util class, containing various utility methods for processing
 * data in different formats.
 * @class
 */
class Util {
	
	/**
	* Merges an object into another object. 
	*
	* @param {object} a - the object that will receive the properties 
	* @param {object} b - the object to merge into object A
	* @returns the modified Object
	*/
	static Mixin(a, b) {				
		for (var key in b) {
			if (b.hasOwnProperty(key)) a[key] = b[key];
		}

		// TODO : Why did I use arguments[0] instead of a?
		return arguments[0];
	}
	
	/**
	* Debounces a function. The function will be executed after a timeout 
	* unless the function is called again in which case, the timeout will
	* reset
	*
	* @param {function} delegate - the Function to debounce
	* @param {integer} threshold - the timeout length, in milliseconds
	* @returns {function} the debounced function
	*/
	static Debounce(delegate, threshold) {
		var timeout;
	
		return function debounced () {
			
			function delayed () {
				delegate.apply(this, arguments);
				
				timeout = null; 
			}
	 
			if (timeout) clearTimeout(timeout);
	 
			timeout = setTimeout(delayed.bind(this), threshold || 100); 
		};
	}
	
	/**
	* Formats a String using substitute strings
	*
	* Example: 
	* Input: Format("Hello world! My name is {0} {1}", ["Foo", "Bar"])
	* Output: "Hello world! My name is Foo Bar"
	*
	* @param {string} str - String, the String to format
	* @param {array} subs - Array(String), An array of Strings to substitute into the String
	* @returns {string} the formatted String
	*/
	static Format(str, subs) {
		if (!subs || subs.length == 0) return str;
		
		var s = str;

		for (var i = 0; i < subs.length; i++) {
			var reg = new RegExp("\\{" + i + "\\}", "gm");
			s = s.replace(reg, subs[i]);
		}

		return s;
	}
	
	/**
	 * Gets the value of the first property of a provided object
	 * 
	 * @param {object} obj - object to get first property from
	 * @returns the value of the first object
	 */
	static FirstProperty(obj) {
		var firstPropVal;
		var props = Object.getOwnPropertyNames(obj);
		
		if (props.length) {
			firstPropVal = obj[props[0]];
		}

		return firstPropVal;
	}

	/**
	 * ParseCsv takes a string containing csv data, and parses it to generate an array
	 * containing each row of the csv.
	 * 
	 * Example:
	 * 
	 * Util.ParseCsv("name,age\nfoo,22\nbar,24") -> [["name","age"],["foo","22"],["bar","24"]]
	 * 
	 * @param {string} csv - string containing csv data
	 * @returns {array} a list containing each row of csv data
	 */
	static ParseCsv(csv) {		
		var s = 0;
		var i = 0;
		
		var lines = [[]];

		// Replace CRLF line breaks with LF if they exist
		// This ensures that CR are not included in the array output
		let CRLFRegex = new RegExp("\r\n", "g");
		csv = csv.replace(CRLFRegex, "\n");

		while (s < csv.length) {
			if (csv[s] == '"') {
				s++;
				
				var e = csv.indexOf('"', s);
				
				lines[i].push(csv.substr(s, e - s));
				
				e++;
			}
			else {
				var e1 = csv.indexOf(',', s);
				var e2 = csv.indexOf('\n', s);
								
				var e = (e1 > -1 && e1 < e2) ? e1 : e2;							
								
				lines[i].push(csv.substr(s, e - s));
					
				if (e == e2) {					
					lines.push([]);
					
					i++;
				}
			}
				
			s = e + 1;
		}
		
		return lines;
	}
	
	/**
	 * Sets the disabled property to true or false for a provided selection
	 * of nodes if they are of a focusable type.
	 * 
	 * @param {array} nodes - A list of DOM selections.
	 * @param {boolean} disabled - true or false.
	 */
	static DisableFocusable(nodes, disabled) {
		var focusable = ["button", "fieldset", "input", "optgroup", "option", "select", "textarea"];
		
		nodes.forEach(n => {
			var selection = n.querySelectorAll(focusable);
			
			if (selection.length == 0) return;
			
			for (var i = 0; i < selection.length; i++) selection[i].disabled = disabled;
		});
	}
}

let _nls = null;
let _locale = null;
let _templatables = {};

/**
 * Core class
 * @class
 */
class Core {
	
	static set root(value) { this._root = value; }
	
	static get root() { return this._root; }
	
	/**
	* Gets the nls ressources
	*
	* Return : Object, an object containing the nls ressources
	*/
    static get nls() { return _nls; }
	
	/**
	* Sets the nls ressources
	*/
    static set nls(value) { _nls = value; }
	
	/**
	* Gets the locale String
	*
	* Return : String, a String containing the locale
	*/
    static get locale() { return _locale; }
	
	/**
	* Sets the locale String
	*/
    static set locale(value) { _locale = value; }
	
	/**
	* Get a localized nls string ressource
	*
	* Parameters :
	*	id : String, the id of the nls ressource to retrieve
	*	subs : Array(String), an array of Strings to substitute in the localized nls string ressource
	*	locale : String, the locale for the nls ressource
	* Return : String, the localized nls string ressource
	*/
	static Nls(id, subs, locale) {
		if (!this.nls) throw new Error("Nls content not set.");
		
		var itm = this.nls[id];

		if (!itm) throw new Error("Nls String '" + id + "' undefined.");

		var txt = itm[(locale) ? locale : this.locale];

		if (txt === undefined || txt === null) throw new Error("String does not exist for requested language.");

		return Util.Format(txt, subs);
	}
		
	/**
	* A convenience function to get a deffered object for asynchronous processing. 
	* Removes one level of nesting when working with promises
	*
	* Parameters :
	*	none
	* Return : Object, an object with a Resolve and Reject function
	*
	* { 
	*	promise: the promise object associated to the asynchronous process, 
	*	Resolve: a function to resolve the promise, 
	*	Reject: a function to reject the promise 
	* }
	*/
	static Defer() {
		var defer = {};
		
		defer.promise = new Promise((resolve, reject) => {
			defer.Resolve = (result) => { resolve({ result:result }); };
			defer.Reject = (error) => { reject({ error:error }); };
		});
		
		return defer;
	}
	
	/**
	* Get or set a templated class definition, this is required to nest Templated UI 
	* components within other Templated UI components.
	*
	* Parameters :
	*	id : String, the id of the templated class definition to get or set
	*	definition : Class, when specified, the class definition to set 
	* Return : Class, the class definition created  
	*/
	static Templatable(id, definition) {
		if (definition) {
			if (_templatables[id]) throw new Error(`Templatable ${id} is defined multiple times.`);
			
			else _templatables[id] = definition;
		}
		else if (!_templatables[id]) throw new Error(`Templatable ${id} is not defined.`);
		
		return _templatables[id];
	}
	
	/**
	* Get an Array of class definitions by matching its
	*
	* Parameters :
	*	id : String, the id of the nls ressource to retrieve
	*	subs : Array(String), an array of Strings to substitute in the localized nls string ressource
	*	locale : String, the locale for the nls ressource
	* Return : String, the localized nls string ressource
	*/
	static Templated(namespace) {
		var templated = [];
		
		for (var id in _templatables) {
			if (id.match(namespace)) templated.push(_templatables[id]);
		}
		
		return templated;
	}
}

/**
 * Dom class - A collection of methods for manipulating content in a Document Object Model (DOM).
 * @class
 */
class Dom {
	
	/**
	* Retrieve an Element using a selector
	*
	* @param {HTML Element} pNode - the parent node where to begin the search
	* @param {string} selector - a selector statement
	* @returns {HTML Element} The Element found, null otherwise
	*/
	static Node(pNode, selector) {
		return pNode.querySelectorAll(selector).item(0) || null;
	}

	/**
	* Create an Element appended to specified parent node
	*
	* @param {string} tagName - the type of Element to be created (div, span, label, input, etc.)
	* @param {object} options - a dictionary type object containing the options to assign to the created Element
	* @param {HTML Element} pNode - the parent Element where the created Element will be apended
	* @returns {HTML Element} the Element created
	*/
	static Create(tagName, options, pNode) {
		var elem = document.createElement(tagName);
		
		Util.Mixin(elem, options);
		
		this.Place(elem, pNode);
		
		return elem
	}

	/**
	* Create an SVG Element and append it to parent node.
	*
	* @param {string} tagName - the type of SVG Element to be created (rect, path, etc.)
	* @param {object} options - a dictionary type object containing the options to assign to the created SVG Element
	* @param {HTML Element} pNode - the parent Element where the created SVG Element will be apended
	* @returns {HTML Element} The SVG Element created
	*/
	static CreateSVG(tagName, options, pNode) {
		var elem = document.createElementNS("http://www.w3.org/2000/svg", tagName);
		
		for (var id in options) elem.setAttribute(id, options[id]);
		
		this.Place(elem, pNode);
		
		return elem;
	}

	/**
	* Create an Element from a namespace
	*
	* Valid Namespaces are : 
	*	HTML : http://www.w3.org/1999/xhtml
	*	SVG  : http://www.w3.org/2000/svg
	*	XBL  : http://www.mozilla.org/xbl
	*	XUL  : http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul
	*
	* @param {string} ns - the URI namespace containing the Element to create 
	* @param {string} tagName - the type of Element to be created (rect, path, etc.)
	* @param {object} options - a dictionary type object containing the options to assign to the created Element
	* @param {HTML Element} pNode - the parent Element where the created Element will be apended
	* @returns {HTML Element} The SVG Element created
	*/
	static CreateNS(ns, tagName, options, pNode) {
		var elem = document.createElementNS(ns, tagName);
		
		for (var id in options) elem.setAttribute(id, options[id]);
		
		this.Place(elem, pNode);
		
		return elem;
	}

	/**
	* Append an Element to another Element
	*
	* @param {HTML Element} elem - the Element to append
	* @param {HTML Element} pNode - the parent Element where the Element will be apended
	*/
	static Place(elem, pNode) {
		if (!!pNode) pNode.appendChild(elem);
	}

	/**
	* Remove all children of an Element
	*
	* @param {HTML Element} elem - The DOM Element being emptied
	*/
	static Empty(elem) {
		while (elem.firstChild) {
			elem.removeChild(elem.firstChild);
		}
	}

	/**
	* Add classes to an Element
	*
	* @param {HTML Element} elem - the Element to modify
	* @param {string} elemClasses - the class names to add to the Element
	*/
	static AddClasses(elem, elemClasses) {
		var c1 = elem.className.split(" ");
		
		elemClasses.split(" ").forEach(function(c) {
			if (c1.indexOf(c) == -1) c1.push(c);
		});
		
		elem.className = c1.join(" "); 
	}

	/**
	* Remove a class from an Element
	*
	* @param {HTML Element} elem - the Element to modify
	* @param {string} elemClass - the class to be removed from the Element
	*/
	static RemoveClass(elem, elemClass) {				
		var c1 = elem.className.split(" ");
		var c2 = elemClass.split(" ");
		
		elem.className = c1.filter(function(c) { return c2.indexOf(c) == -1; }).join(" ");
	}

	/**
	* Verify that an Element contains a class
	*
	* @param {HTML Element} elem - the Element to verify
	* @param {string} elemClass - the class to verify
	* @returns {boolean} true if the Element contains the class, false otherwise
	*/
	static HasClass(elem, elemClass) {
		return (' ' + elem.className + ' ').indexOf(' ' + elemClass + ' ') > -1;
	}

	/**
	* Set the class of an Element
	*
	* @param {HTML Element} elem - the Element to modify
	* @param {string} elemClass - set the class of the Element
	*/
	static SetClass(elem, elemClass) {
		elem.className = elemClass; 
	}

	/**
	* Toggle a class on or off for an Element
	*
	* @param {HTML Element} elem - the Element to modify
	* @param {string} elemClass - the class to add/remove from the Element
	* @param {boolean} enabled - true to add the class, or false to remove class
	*/
	static ToggleClass(elem, elemClass, enabled) {
		if (enabled) {
			this.AddClasses(elem, elemClass);
		} else {
			this.RemoveClass(elem, elemClass);
		}
	}
	
	/**
	* Get an attribute value from an Element
	*
	* @param {HTML Element} elem - the Element to retrieve the attribute from
	* @param {string} attr - the name of the attribute to retrieve
	* @returns {string} - the value of the attribute if found, null otherwise
	*/
	static GetAttribute(elem, attr) {
		var attr = elem.attributes.getNamedItem(attr);
		
		return attr ? attr.value : null;
	}
	
	/**
	* Set an attribute value on an Element
	*
	* @param {HTML Element} elem - the Element to set the attribute on
	* @param {string} attr - the name of the attribute to set
	* @param {string} value - the value of the attribute to set
	*/
	static SetAttribute(elem, attr, value) {
		elem.setAttribute(attr, value);
	}
	
	/**
	* Get the size of an Element
	*
	* @param {HTML Element} elem - the Element to retrieve the size
	* @returns {object} An object literal containing the size of the Element
	* { 
	*	w: width of the Element, 
	*	h: height of the Element 
	* }
	*/
	static Size(elem) {
		var style = window.getComputedStyle(elem);
		
		var h = +(style.getPropertyValue("height").slice(0, -2));
		var w = +(style.getPropertyValue("width").slice(0, -2));
		var pL = +(style.getPropertyValue("padding-left").slice(0, -2));
		var pR = +(style.getPropertyValue("padding-right").slice(0, -2));
		var pT = +(style.getPropertyValue("padding-top").slice(0, -2));
		var pB = +(style.getPropertyValue("padding-bottom").slice(0, -2));
		
		var w = w - pL - pR;
		var h = h - pT - pB;
		
		// Use smallest width as width and height for square grid that fits in container
		// var s = w < h ? w : h;
		
		return { w : w , h : h }
	}
	
	/**
	* Get the siblings of an Element
	*
	* @param {HTML Element} elem - the Element to retrieve the siblings
	* @returns {array} An array of elements containing the siblings of the input element
	*/
	static Siblings(elem) {
		var elements = [];
		
		for (var i = 0; i < elem.parentNode.children.length; i++) elements.push(elem.parentNode.children[i]);
		
		elements.splice(elements.indexOf(elem), 1);
		
		return elements;
	}
}

/**
 * Net class
 * @class
 */
class Net {
	
	/**
	* Execute a web request
	*
	* Parameters :
	*	url : String, the request URL
	* Return : none
	*
	* TODO : This should return a promise object but (ie11)
	*
	*/
	static Request(url) {
		var d = Core.Defer();
		var xhttp = new XMLHttpRequest();
		
		xhttp.onreadystatechange = function() {
			if (this.readyState != 4) return;
		
			// TODO : Switched to this.response, check if it breaks anything
			if (this.status == 200) d.Resolve(this.response);
			
			else {
				var error = new Error(this.status + " " + this.statusText);

				d.Reject(error);
			}
		};
		
		xhttp.open("GET", url, true);
		
		xhttp.send();
		
		return d.promise;
	}
	
	/**
	 * Request a JSON file 
	 * @param {string} url reference to a json file
	 * @returns a promise to the json file being requested
	 */
	static JSON(url) {
		var d = Core.Defer();
		
		Net.Request(url).then(r => d.Resolve(JSON.parse(r.result)), d.Reject);
				
		return d.promise;
	}
	
	/**
	* Get a parameter value from the document URL
	*
	* Parameters :
	*	name : String, the name of the parameter to retrieve from the URL
	* Return : String, the value of the parameter from the URL, an empty string if not found
	*/
	static GetUrlParameter (name) {				
		name = name.replace(/[\[\]]/g, '\\$&');
		
		var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
		
		var results = regex.exec(window.location.href);
		
		if (!results) return null;
		
		if (!results[2]) return '';
		
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}
	
	/**
	* Download content as a file
	*
	* Parameters :
	*	name : String, the name of the file to download
	*	content : 
	* Return : none
	*/
	static Download(name, content) {
		var link = document.createElement("a");
		
		link.href = "data:application/octet-stream," + encodeURIComponent(content);
		link.download = name;
		link.click();
		link = null;
	}
	
	/**
	* Gets the base URL for the app
	*
	* Parameters : none
	* Return : String, the base path to the web app
	*/
	static AppPath() {
		var path = location.href.split("/");
		
		path.pop();
		
		return path.join("/");
	}
	
	/**
	* Gets the base URL for the app
	*
	* Parameters : none
	* Return : String, the base path to the web app
	*/
	static FilePath(file) {
		file = file.charAt(0) == "/" ? file.substr(1) : file;
		
		var path = [Net.AppPath(), file];
				
		return path.join("/");
	}
}

/**
 * The Store class contains various utility methods used to store lode-viewer map 
 * properties in localStorage.
 * @class
 */
class Store { 
	
	/**
	 * Get the lode-map value from localStorage
	 * @returns {string} - map name
	 */
	static get Map() {
		return localStorage.getItem("lode-map") || "trans";
	}

	/**
	 * Set the lode-map value in localStorage
	 * @param {string} value - map name (e.g. odhf, odcaf) 
	 */
	static set Map(value) {
		localStorage.setItem("lode-map", value);
	}
	
	/**
	 * Get the lode-center-lat latitude value from localStorage
	 * @returns {number} - latitude value
	 */
	static get Lat() {
		return Number(localStorage.getItem("lode-center-lat")) || 60.847;
	}
	
	/**
	 * Set the lode-center-lat latitude value from localStorage
	 * @param {number} value - latitude value
	 */
	static set Lat(value) {
		localStorage.setItem("lode-center-lat", value);
	}
	
	/**
	 * Get the lode-center-lng longitude value from localStorage
	 * @returns {number} - longitude value
	 */
	static get Lng() {
		return Number(localStorage.getItem("lode-center-lng")) || -105.3905;
	}
	
	/**
	 * Set the lode-center-lng longitude value from localStorage
	 * @param {number} value - longitude value
	 */
	static set Lng(value) {
		localStorage.setItem("lode-center-lng", value);
	}
	
	/**
	 * Get the lode-zoom map zoom level from localStorage
	 * @returns {number} map zoom level
	 */
	static get Zoom() {
		return Number(localStorage.getItem("lode-zoom")) || 2;
	}
	
	/**
	 * Set the lode-zoom map zoom level from localStorage
	 * @param {number} value - map zoom level
	 */
	static set Zoom(value) {
		localStorage.setItem("lode-zoom", value);
	}
	
	/**
	 * Get the lode-opacity vector opacity level from localStorage
	 * @returns {number} - opacity value
	 */
	 static get Opacity() {
		// default opacity is set to 75%
		let opacity = 0.75;
		let storedOpacity = localStorage.getItem("lode-opacity");

		if (storedOpacity) {
			opacity = Number(storedOpacity);
		}

		return opacity;
	}
	
	/**
	 * Set the lode-opacity vector opacity level in localStorage
	 * @param {number} value - opacity value ranging from 0 - 1.
	 */
	static set Opacity(value) {
		localStorage.setItem("lode-opacity", value);
	}
	
	/**
	 * Get the lode-layer layer from localStorage
	 * @returns {string} - layer name
	 */
	static get Layer() {
		return localStorage.getItem("lode-layer") || "da";
	}
	
	/**
	 * Set the lode-layer layer in localStorage
	 * @param {string} value - layer name
	 */
	static set Layer(value) {
		localStorage.setItem("lode-layer", value);
	}

	/**
	 * Get the current search-item from the sessionStorage
	 * @returns {object} current search-item details
	 */
	static get SearchItem() {
		let currentSearchItem = sessionStorage.getItem("search-item");
		return JSON.parse(currentSearchItem);
	}

	/**
	 * Set the search-item in sessionStorage
	 * @param {object} value current search-item object details
	 */
	static set SearchItem(value) {
		let currentSearchItem = JSON.stringify(value);
		sessionStorage.setItem("search-item", currentSearchItem);
	}
}

/**
 * Evented class
 * @class
 */
class Evented { 

	constructor() {
		this.listeners = {};
	}

	addEventListener(type, callback, once){
		if (!(type in this.listeners)) this.listeners[type] = [];
		
		var h = { target:this, type:type, callback:callback, once:!!once };
		
		this.listeners[type].push(h);
		
		return h;
	}
	
	removeEventListener(type, callback){
		if (!(type in this.listeners)) return;

		var stack = this.listeners[type];

		for (var i = 0, l = stack.length; i < l; i++){
			if (stack[i].callback === callback){
				stack.splice(i, 1);
				
				return this.removeEventListener(type, callback);
			}
		}
	}
	
	dispatchEvent(event){
		if (!(event.type in this.listeners)) return;

		var stack = this.listeners[event.type];

		for (var i = 0; i < stack.length; i++) {
			stack[i].callback.call(this, event);
		}
		
		for (var i = stack.length - 1; i >= 0; i--) {
			if (!!stack[i].once) this.removeEventListener(event.type, stack[i].callback);
		}
	}
	
	Emit(type, data) {
		// Let base event properties be overwritten by whatever was provided.	
		var event = { bubbles:true, cancelable:true };
	
		Util.Mixin(event, data);
		
		// Use the type that was specifically provided, target is always this.
		event.type = type;
		event.target = this;
		
		this.dispatchEvent(event);
	}
	
	On(type, callback) {
		return this.addEventListener(type, callback, false);
	}

	Once(type, callback) {
		return this.addEventListener(type, callback, true);
	}

	Off(type, callback) {
		this.removeEventListener(type, callback);
	}
}

/**
 * Templated class
 * @class
 */
class Templated extends Evented { 

	constructor(container, options) {
		super();
		
		this.options = options || { };
		
		this.BuildTemplate();
		
		if (this.template) this.SetNamedNodes();
	
		if (this.template) this.BuildSubWidgets();
		
		if (this.template) this.SetRoots();
		
		if (container) this.Place(container);
	}
	
	BuildTemplate() {
		// Use template provided in options first, use Template function second
		var html = this.options.template ? this.options.template : this.Template();
		
		// TODO : I think it still works with empty templates.
		if (!html) return;
		
		// Trailing whitespaces can cause issues when parsing the template, remove them
		html = html.trim();
		
		// Replace all nls strings in template. Nls string pattern in templates is nls(StringId)
		html = this.Replace(html, /nls\((.*?)\)/, function(m) { return Core.Nls(m); });
		
		this.template = Dom.Create("div", { innerHTML:html });
	}
	
	SetNamedNodes() {		
		var named = this.template.querySelectorAll("[handle]");
		
		this.nodes = {};
		
		// Can't use Array ForEach here since named is a NodeList, not an array
		for (var i = 0; i < named.length; i++) { 
			var name = Dom.GetAttribute(named[i], "handle");
			
			this.nodes[name] = named[i];
		}
	}
	
	BuildSubWidgets() {
		var nodes = this.template.querySelectorAll("[widget]");
		
		// Can't use Array ForEach here since nodes is a NodeList, not an array
		for (var i = 0; i < nodes.length; i++) {
			var path = Dom.GetAttribute(nodes[i], "widget");
			var module = Core.Templatable(path);
			var widget = new module(nodes[i]);
			var handle = Dom.GetAttribute(widget.container, "handle");
			
			if (handle) this.nodes[handle] = widget;
		}
	}
	
	SetRoots() {
		this.roots = [];
		
		for (var i = 0; i < this.template.children.length; i++) {
			this.roots.push(this.template.children[i]);
		}
	}
	
	Place(container) {
		this.container = container;
		
		this.roots.forEach(r => Dom.Place(r, container));
	}
	
	Template() {
		return null;		
	}

	Replace(str, expr, delegate) {
		var m = str.match(expr);
		
		while (m) {
			str = str.replace(m[0], delegate(m[1]));
			m = str.match(expr);
		}
		
		return str;
	}
	
	Node(id) {
		return this.nodes[id];
	}
	
	// TODO : Build a root function
}

/**
 * Popup class
 * @class
 */
class Popup extends Templated { 
	
	get CloseBtnTitle() {
		let label = {
			en: "Close overlay (escape key)",
			fr: "Fermer la fenêtre superposée (touche d\'échappement)"
		};

		return label[Core.locale] || ""
	}

	set Content(content) {
		this.content = content;
		
		Dom.Place(content, this.Node("body"));
	}
	
	get Content() { return this.content; }
	
	constructor(classes, container) {	
		super(container || document.body);
				
		this.onBody_KeyUp_Bound = this.onBody_KeyUp.bind(this);
		
		this.content = null;
		this.h = null;
		
		this.Node("close").addEventListener("click", this.onBtnClose_Click.bind(this));
		
		if (classes) Dom.AddClasses(this.Node("root"), classes);
		
		this.Node("root").addEventListener("click", this.onModal_Click.bind(this));
		
		this.SetStyle(0, "hidden");
	}
	
	SetStyle(opacity, visibility) {
		this.Node("root").style.opacity = opacity;
		this.Node("root").style.visibility = visibility;
	}
	
	Show() {
		Util.DisableFocusable(Dom.Siblings(this.Node("root")), true);
		
		this.h = document.body.addEventListener("keyup", this.onBody_KeyUp_Bound);
		
		this.SetStyle(1, "visible");
		
		this.Emit("Show", { popup:this });
		
		this.Node("close").focus();
	}
	
	Hide() {
		Util.DisableFocusable(Dom.Siblings(this.Node("root")), false);
		
		document.body.removeEventListener("keyup", this.onBody_KeyUp_Bound);
		
		this.SetStyle(0, "hidden");
		
		this.Emit("Hide", { popup:this });
	}
	
	onBody_KeyUp(ev) {
		if (ev.keyCode == 27) this.Hide();
	}
	
	onModal_Click(ev) {
		this.Hide();
	}
	
	onBtnClose_Click(ev) {
		this.Hide();
	}
	
	Template() {
		return "<div handle='root' class='popup'>" +
				  "<div class='popup-container'>" +
					  "<div class='popup-header'>" +
						  "<div class='popup-title' handle='title'></div>" +
						  `<button title="${this.CloseBtnTitle}" class="close" handle="close">×</button>` +
					  "</div>" +
					
					  "<div class='popup-body' handle='body'></div>" +
				  "</div>" +
			  "</div>";
	}
}

/**
 * Tooltip class
 * @class
 */
class Tooltip extends Templated  {
		
	get BBox() {
		return this.Node("root").getBoundingClientRect();
	}
	
	constructor(node, classes) {	
		super(node || document.body);		

		if (classes) Dom.AddClasses(this.Node("root"), classes);		
	}
	
	Template() {
		return '<div handle="root" class="tooltip">' +
					'<div handle="content"></div>' +
				'</div>';
	}
	
	PositionTarget(target, offset) {
		var bbox1, bbox2;
		offset = offset || [0,0];
		
		bbox1 = target.getBoundingClientRect();
		bbox2 = this.Node("root").getBoundingClientRect();
		
		var x = bbox1.left +  bbox1.width / 2 - bbox2.width / 2 + offset[0];
		var y = bbox1.top + document.documentElement.scrollTop - bbox2.height - 5  + offset[1];
		
		this.PositionXY(x, y);
	}
	
	PositionXY(x, y) {
		this.Node("root").style.left = x + "px";
		this.Node("root").style.top = y + "px";
				
		if (this.BBox.left + this.BBox.width > window.innerWidth) {
			this.Node("root").style.top = y + 30 + "px";
			this.Node("root").style.left = -180 + x + "px";
		}
	}
	
	Show(x, y) {
		this.PositionXY(x, y);
		
		this.Node("root").style.opacity = 1;
	}
	
	Hide() {
		this.Node("root").style.opacity = 0;
	}
	
	Empty() {
		Dom.Empty(this.Node("content"));
	}
}

/**
 * Typeahead class
 * @class
 */
var typeahead = Core.Templatable("Basic.Components.Typeahead", class Typeahead extends Templated {
	
	/** 
	 * Set the placeholder text for the search input
	 * @param {string} value Placeholder text
	 */
    set placeholder(value) {
		this.Node('input').setAttribute('placeholder', value);
	}
	
	/**
	 * Set title for the search
	 * @param {string} value title property for the search input
	 */
	set title(value) {
		this.Node('input').setAttribute('title', value);
	}
	
	/**
	 * Set the typeahead items
	 * @param {array} value list of typeahead items
	 */
	set items(value) {
		this._items = value.map(i => {
			var li = Dom.Create("li", { innerHTML : i.label, tabIndex : -1 });
			var item = { data : i, node : li };
			
			li.addEventListener("mousedown", this.onLiClick_Handler.bind(this, item));
			
			return item; 
		});
	}
	
	/**
	 * Set the current typeahead item
	 * @param {object} value typeahead item
	 */
	set current(value) {
		this._curr = value;
	}
	
	/**
	 * Get the current typeahead item
	 * @returns {object} the currently selected typeahead item
	 */
	get current() {
		return this._curr;
	}
	
	constructor(container, options) {
		super(container, options);
		
		this._items = null;
		this._filt = null;
		this._curr = null;
		this._temp = null;
		
		this.Node("input").addEventListener("input", function(ev) { this.OnInputInput_Handler(ev); }.bind(this));	

		// this.Node("input").addEventListener("click", this.OnInputClick_Handler.bind(this));
		this.Node("input").addEventListener("keydown", function(ev) { this.OnInputKeyDown_Handler(ev); }.bind(this));		
		this.Node("input").addEventListener("blur", function(ev) { this.OnInputBlur_Handler(ev); }.bind(this));		
		this.Node("input").addEventListener("focusin", function(ev) { this.OnInputClick_Handler(ev); }.bind(this));		
		// this.Node("input").addEventListener("focusout", this.OnInputBlur_Handler.bind(this));
		
		if (!options) return;
		
		this.items = options.items;
	}
	
	// Empty the list of typeahead suggestions
	Empty() {
		Dom.Empty(this.Node("list"));
		
		this._filt = [];
	}
	
	/**
	 * Create a filtered list of typeahead search results and add them to the list
	 * @param {string} mask search input box text
	 */
	Fill(mask) {
		this._filt = this._items.filter(i => compare(i.data.label, mask));
		
		var frag = document.createDocumentFragment();
		
		for (var i = 0; i < this._filt.length; i++) {
			var curr = this._filt[i];
			
			// Maybe insert <b> at right index instead, faster?
			curr.node.innerHTML = curr.data.label.replace(mask, `<b>${mask}</b>`);
			curr.next = this._filt[(i + 1) % this._filt.length];
			curr.next.prev = curr;
		
			Dom.Place(curr.node, frag);
		}
				
		Dom.Place(frag, this.Node("list"));
		
		function compare(label, mask) {
			return label.toLowerCase().indexOf(mask.toLowerCase()) !== -1
		}
	}
	
	// Toggle collapsed class on typeahead DOM element
	UpdateClass() {
		Dom.ToggleClass(this.Node("root"), "collapsed", this._filt.length === 0);
	}
	
	// Reset the typeahead component
	Reset() {
		if (this._temp) Dom.SetClass(this._temp.node, "");
			
		this._temp = null;
		
		this.Empty();
		
		var value = this.current ? this.current.data.label : "";
		
		this.Node("input").value = value;
	}
	
	/**
	 * Handle input events on search input
	 * @param {InputEvent} ev
	 */
	OnInputInput_Handler(ev) {
		// If input is less than 3 character in length, do nothing
		if (ev.target.value.length < 3) return;
		
		this.Empty();
		
		// Fill in typeahead suggestions 
		this.Fill(ev.target.value);
		
		this.UpdateClass();
	}
	
	/**
	 * Handle click events on search input
	 * @param {FocusEvent} ev
	 */
	OnInputClick_Handler(ev) {
		// If input is less than 3 character in length, do nothing
		if (ev.target.value.length < 3) return;
		
		// Fill in typeahead suggestions 
		this.Fill(ev.target.value);
		
		this.UpdateClass();
		
		this.Emit("Focusin", {});
	}
	
	/**
	 * Handle specific key input events; including up, down, shift+up, enter and esc inputs
	 * @param {KeyboardEvent} ev
	 */
	OnInputKeyDown_Handler(ev) {
		// prevent default event on specifically handled keys
		if (ev.keyCode == 40 || ev.keyCode == 38 || ev.keyCode == 13 || ev.keyCode == 27) ev.preventDefault();

		// shift + up : select text
		if (ev.shiftKey == true &&  ev.keyCode == 38)  this.nodes.Input.select();
		
		// up or down key : cycle through dropdown
		else if (ev.keyCode == 40 || ev.keyCode == 38 ) {	
			this._temp = this._temp || this._filt[this._filt.length - 1];
			
			Dom.SetClass(this._temp.node, "");
			
			this._temp = (ev.keyCode == 40) ? this._temp.next : this._temp.prev;
			
			this.Node("input").value = this._temp.data.label;
			
			this.ScrollTo(this._temp);
			
			Dom.SetClass(this._temp.node, "active");
		}

		// enter : select currently focused
		else if (ev.keyCode == 13) {
			// if an item is currently selected through arrows, select that one
			if (this._temp) this.onLiClick_Handler(this._temp);
			
			// if a filtered list is being shown, select the first item
			else if (this._filt.length > 0) this.onLiClick_Handler(this._filt[0]);

			// nothing is selected (don't think this can happen		    	
			else {
				this.OnInputClick_Handler({ target:this.Node("input") });
			}
		}

		// if escape key
		else if (ev.keyCode == 27) this.OnInputBlur_Handler();
	}
	
	/**
	 * Handle blur events
	 * @param {FocusEvent} ev
	 */
	OnInputBlur_Handler(ev) {
		this.Reset();
		
		this.UpdateClass();
	}
	
	/**
	 * Handle click events on typeahead list item
	 * @param {object} item list item content
	 * @param {MouseEvent} ev
	 */
	onLiClick_Handler(item, ev) {
		this.current = item;
				
		this.Reset();
		
		this.UpdateClass();
		
		this.Emit("Change", { item:item.data });
	}
	
	ScrollTo(item) {
		// create rectangules to know the position of the elements
		var ul = this.Node("list");
		var liBx = item.node.getBoundingClientRect();
		var ulBx = ul.getBoundingClientRect();
		
		//if the element is in this range then it is inside the main container, don't scroll
		if (liBx.bottom > ulBx.bottom) ul.scrollTop = ul.scrollTop + liBx.bottom - ulBx.top - ulBx.height;
		
		else if (liBx.top < ulBx.top) ul.scrollTop = ul.scrollTop + liBx.top - ulBx.top;
	}

	// Create a html template for the typeahead component
	Template() {
		return "<div handle='root' class='typeahead collapsed'>" +
				 "<input handle='input' type='text' class='input'>" + 
			     "<ul handle='list' class='list'></ul>" +
			   "</div>";
	}
});

/**
 * Control class
 * @class
 */
class Control extends Templated { 
	
	constructor(options) {	
		super(null, options);
		
		if (!this.template) throw new Error("MapBox controls cannot be empty");
		
		if (this.template.children.length > 1) throw new Error("MapBox controls should have one root node");
		
		this._container = this.template.children[0];
	}
	
	onAdd(map) {
        this._map = map;
		
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        
		this._map = undefined;
    }
}

/**
 * Bookmarks class
 * @class
 */
class Bookmarks extends Control { 
		
	constructor(options) {	
		super(options);
		
		this._container = this.Node('root');
		
		if (!options.items) return;
		
		options.items = options.items.sort((a,b) => {
			if (a.label < b.label) return -1;
			
			if (a.label > b.label) return 1;

			return 0;
		});
		
		options.items.forEach((i) => { this.AddBookmark(i); });

		// If a custom label is provided, update control label
		if (options.label && typeof(options.label) === 'string') {
			this.Node('bookmarks-header').innerHTML = options.label;
		}

		// If a custom description is provided, update control description
		if (options.description && typeof(options.description) === 'string') {
			this.Node('description').innerHTML = options.description;
		}
	}
	
	AddBookmark(item) {
		var li = Dom.Create('li', { className:"bookmarks-list-item", innerHTML:item.label, tabIndex:0 }, this.Node("ul"));
		
		li.addEventListener("keydown", this.OnLiKeydown_Handler.bind(this, item));
		li.addEventListener("click", this.OnLiClick_Handler.bind(this, item));
	}
	
	OnLiKeydown_Handler(item, ev) {		
		if (ev.keyCode != 13) return;
		
		ev.preventDefault();
		
		this.Emit("BookmarkSelected", { item:item });
	}
	
	OnLiClick_Handler(item, ev) {		
		this.Emit("BookmarkSelected", { item:item });
	}
	
	Template() {
		return "<div handle='root' class='bookmarks'>" + 
				  "<div class='bookmarks-header-container'>" + 
					 `<img class='bookmarks-header-icon' src='${Core.root}assets/bookmarks.png'></img>` +
					 "<h2 handle='bookmarks-header' class='bookmarks-header'>Bookmarks</h2>" +
				  "</div>" +
				  "<ul handle='ul' class='bookmarks-list'></ul>" + 
				  "<div handle='description' class='bookmarks-description'></div>" +
			   "</div>"
	}
}

/**
 * Download class
 * @class
 */
class Download extends Control { 
		
	constructor(options) {	
		super(options);

		// If a custom label is provided, update menu label
		if (options.label && typeof(options.label) === 'string') {
			this.Node('link').innerHTML = options.label;
		}
		
		this._container = this.Node('root');

		if (options.link) this.Node('link').setAttribute('href', options.link); 
	}
	
	Template() {        
		return "<div handle='root' class='download mapboxgl-ctrl'>" +
					"<div class='control-label'>" + 
						"<a handle='link' target='_blank' class='link'>Download data</a>" + 
					"</div>" +
				"</div>";
	}
}

/**
 * Fullscreen class
 * @class
 */
class Fullscreen extends Evented { 
	
	set title(value) { this._fs._controlContainer.firstChild.title = value; }
	
	get fullscreen() { return this._fs._fullscreen; }
	
	constructor(options) {	
		super();
		
		this._fs = new maplibregl.FullscreenControl();
		
		this.options = options;
	}
			
	onFullscreenClick_Handler(ev) {		
		if (!this.fullscreen) this.Emit("enterFullscreen", {});
		
		else this.Emit("exitFullscreen", {});
	}
	
	onAdd(map) {		
		this._container = this._fs.onAdd(map);
		
		this._fs._controlContainer.firstChild.addEventListener("click", this.onFullscreenClick_Handler.bind(this));
		this._fs._controlContainer.firstChild.removeAttribute("aria-label");
		
		this.title = this.options.title;
		
        this._map = map;
		
        return this._container;
    }

    onRemove() {
		this._fs.onRemove();
		
        this._fs._container.parentNode.removeChild(this._fs._container);
		
		this._map = undefined;
    }
}

/**
 * Group class
 * @class
 */
class Group extends Control { 
		
	constructor(options) {	
		super(options);

		this._container = this.Node('root');
		
		this.controls = {};
		
		// Add controls to the group
		for (var id in options.controls) {
			this.AddControl(id, options.controls[id]);
		}
	}
	
	/**
	 * Add a control to the group
	 * @param {string} id The control id being added
	 * @param {object} control The control for 
	 */
	AddControl(id, control) {
		if (this.controls.hasOwnProperty(id)) throw new Error("Control already exists in the group");
		
		this.controls[id] = control;
		
		Dom.Place(control._container, this.Node("root"));
	}
	
	// HTML template for a group control
	Template() {
		return "<div handle='root' class='mapboxgl-ctrl mapboxgl-ctrl-group'></div>";
	}
}

/**
 * Collapsable Group class
 * @class
 */
class CollapsableGroup extends Control { 
		
	constructor(options) {	
		super(options);
		
		this.controls = {};

		this._container = this.Node('root');

		// Add summary label to the control
		if (options.summary && typeof(options.summary) === 'string') {
			this.Node('collapsable-group-summary').innerHTML = options.summary;
		}
		
		// Add controls to collapsable group
		for (var id in options.controls) {
			this.AddControl(id, options.controls[id]);
		}	
	}

	/**
	 * Add a control to the collapsable group
	 * @param {string} id The control id being added
	 * @param {object} control The control for 
	 */
	AddControl(id, control) {
		if (this.controls.hasOwnProperty(id)) throw new Error("Control already exists in the collapsable group");
		
		this.controls[id] = control;
		
		Dom.Place(control._container, this.Node("root"));
	}

	// HTML template for a collapsable group control
	Template() {
		return "<details open handle='root' class='mapboxgl-ctrl mapboxgl-ctrl-collapsable-group'>" +
		"<summary handle='collapsable-group-summary'></summary>" +
		"</details>";
	}
}

/**
 * LabelsToggle class
 * @class
 */
class LabelsToggle extends Control { 
		
	constructor(options) {	
		super(options);
		
		this.map = options.map;

		this._container = this.Node('root');

		// If a custom label is provided, update menu label
		if (options.label && typeof(options.label) === 'string') {
			this.Node('labels-toggle-label').innerHTML = options.label;
			Dom.SetAttribute(this.Node('labels-toggle-checkbox'), 'aria-label', options.label);
		}

		// Add event listeners for change events on maps menu
		this.Node('labels-toggle-checkbox').addEventListener('change', this.onLabelsToggleCheckboxChange_Handler.bind(this));
	}

	/**
	 * Retrieve a list of layers used by the map
	 * @returns {array} List containing all layers in the map's style specification
	 */
	getMapStyleLayers() {
		let mapStyle = this.map.GetStyle();
			
		if (mapStyle && mapStyle.layers) {
			return mapStyle.layers;
		}
	}

	/**
	 * Get a list of label layers.
	 * 
	 * Note: Label layers in Mapbox use the layer type 'symbol', and have the 
	 * property 'text-field' defined. 
	 * @returns {array} List of layer ids for label layers
	 */
	getLabelLayers() {
		let layerIds = [];
		let styleLayers = this.getMapStyleLayers();

		for (let i = 0; i < styleLayers.length; i += 1) {
			let layer = styleLayers[i];
			if (layer.type && layer.type === 'symbol') {
				let layerId = layer.id;

				if (this.map.GetLayoutProperty(layerId, 'text-field')) {
					layerIds.push(layer.id);
				}
			}
		}

		return layerIds;
	}

	/**
	 * Handle labels toggle checkbox changes
	 * @param {object} ev Change event
	 */
	onLabelsToggleCheckboxChange_Handler(ev) {
		let layerIds = this.getLabelLayers();

		if (ev && ev.currentTarget && ev.currentTarget.checked) {
			for (let i = 0; i < layerIds.length; i += 1) {
				let layerId = layerIds[i];
				this.map.ShowLayer(layerId);
			}
		} else {
			for (let i = 0; i < layerIds.length; i += 1) {
				let layerId = layerIds[i];
				this.map.HideLayer(layerId);
			}
		}
	}

	/**
	 * HTML Template for Labels Toggle Control
	 * @returns {string} Template representing a labels toggle control
	 */
	 Template() {
		return "<div handle='root' class='labels-toggle mapboxgl-ctrl'>" + 
					"<div class='labels-toggle-container'>" + 
						"<label handle='labels-toggle-label' class='labels-toggle-label'>Labels</label>" +
						"<input type='checkbox' checked aria-label='Labels' handle='labels-toggle-checkbox' name='labels-toggle-checkbox' class='labels-toggle-checkbox'></input>" +
					"</div>" +
			   "</div>"
	}
}

let n = 0;

/**
 * Legend class
 * @class
 */
class Legend extends Control { 
		
	constructor(options) {
		super(options);
		
		this._container = this.Node('root');

		this.config = options.config;
		this.title = options.title;
		this.subtitle = options.subtitle;
		this.banner = options.banner;
		this.chkBoxes = null;
		this.chkBoxesState = null;
		
		this.Reload(options.config, options.title, options.banner, options.subtitle);
	}
	
	Reload(config, title, banner, subtitle) {
		
		// Update legend properties
		this.config = config;
		this.banner = banner || null;
		this.title = title || null;
		this.subtitle = subtitle || null;

		/// Load legend items into legend
		this.LoadLegend(config);
						
		// Update legend labels with the current legend properties
		if (this.banner) this.Node('banner').innerHTML = this.banner;
		if (this.title) this.Node('title').innerHTML = this.title;
		if (this.subtitle) this.Node('subtitle').innerHTML = this.subtitle;
		
		// Hide portions on legend which aren't defined.
		Dom.ToggleClass(this.Node("banner"), "hidden", !this.banner);
		Dom.ToggleClass(this.Node("title"), "hidden", !this.title);
		Dom.ToggleClass(this.Node("subtitle"), "hidden", !this.subtitle);
	}
	
	/**
	 * Load legend as defined in map config file
	 * @param {object} config - legend object in map config file
	 */
	LoadLegend(config) {
		let i, legendItem;
		this.chkBoxes = [];
		this.chkBoxesState = [];

		Dom.Empty(this.Node("legend"));
		
		// Add each legend item
		if (Array.isArray(config)) {
			for (i = 0; i < config.length; i += 1) {
				legendItem = config[i];
				this.AddLegendItem(legendItem);
			}
		}
	}

	AddLegendItem(item) {
		var chkBox, svg, icn, lbl, i, id, div;
		if (!item.label && !item.group) return;
		
		id = "legend-check-" + ++n;
		div = Dom.Create("div", { className:"legend-item legend-item-1" }, this.Node("legend"));

		// Add groups of items if them exist in legend
		if (item.group && item.group.heading) {
			Dom.Create('div', {className: "legend-heading", innerHTML: item.group.heading}, div);
			if (item.group.items) {
				for (i = 0; i < item.group.items.length; i += 1) {
					// Copy item title to group item
					if (!item.group.items[i].title) {
						item.group.items[i].title = item.title;
					}

					// Add group item to legend
					this.AddLegendItem(item.group.items[i]);
				}
			}

		} else {
			chkBox = Dom.Create("input", { id:id, title: item.title, className: "legend-tickbox", type:"checkbox", checked:true }, div);
			svg = Dom.CreateSVG("svg", { width:15, height:15 }, div);
			icn = Dom.CreateSVG("rect", { width:15, height:15 }, svg);
			lbl = Dom.Create("label", { innerHTML:item.label }, div);

			lbl.setAttribute("for", id);
   
			this.chkBoxes.push(chkBox);

			chkBox.addEventListener("change", this.OnCheckbox_Checked.bind(this));

			icn.setAttribute('fill', `rgb(${item.color.join(",")})`);
	
			this.chkBoxesState.push({ item:item, checkbox:chkBox });
   
			return div;
		}
	}

	/**
	 * Gets the style data from provided legend item
	 * @param {object} legendItem - Object containing the style information 
	 * @retruns - An object containing the legendItem color and value if available
	 */
	static GetStylingFromLegendItem(legendItem) {
		let style = {};

		if (legendItem.color) {
			style.color = legendItem.color;

			if (legendItem.value) {
				style.value = legendItem.value;
			}
		}

		return style;
	}

	/**
	 * Get list of legend style rules (colours and expression values) defined
	 * in the legend config.
	 * @param {array} legendConfig A list of config items defining the legend
	 * @returns A list of style objects containing colours and conditions
	 * needed to paint layers with that colour.
	 */
	static GetListOfStyles(legendConfig) {
		let i, j, legendItem, groupItems;
		let styleCollection = [];

		// Iterate through legendConfig and get styling from each
		if (Array.isArray(legendConfig)) {
			for (i = 0; i < legendConfig.length; i += 1) {
				legendItem = legendConfig[i];
				if (legendItem.group && legendItem.group.items) {
					// If item is a group of items, get styling from all items in group
					groupItems = legendItem.group.items;
					for (j = 0; j < groupItems.length; j += 1) {
						styleCollection.push(this.GetStylingFromLegendItem(groupItems[j]));
					}
				} else {
					styleCollection.push(this.GetStylingFromLegendItem(legendItem));
				}
			}
		}

		return styleCollection;
	}	

	OnCheckbox_Checked(ev) {
		this.Emit("LegendChange", { state:this.chkBoxesState });
	}

	// Template for legend widget
	Template() {        
		return "<div handle='root' class='legend mapboxgl-ctrl'>" +
					"<h2 handle='banner' class='control-label legend-banner'></h2>" +
						"<div>" +
							"<div handle='title' class='control-label'></div>" +
							"<div handle='subtitle' class='control-label legend-subtitle'></div>" +
						"</div>" +
					"<div handle='legend' class='legend-container'></div>" +
				"</div>";
	}
}

/**
 * Mapslist class
 * @class
 */
class MapsList extends Control { 
		
	constructor(options) {	
		super(options);
		
		this._container = this.Node('root');
		
		// If a custom label is provided, update menu label
		if (options.label && typeof(options.label) === 'string') {
			this.Node('maps-header').innerHTML = options.label;
		}

		//this.tooltip = new Tooltip();
		
		for (var id in options.maps) this.AddMapItem(id, options.maps[id]);
	}

	AddMapItem(id, map) {
		var li = Dom.Create('li', { className:"maps-list-item", innerHTML:map.title, tabIndex:0 }, this.Node("ul"));
		
		//li.addEventListener("mousemove", this.OnLiMouseMove_Handler.bind(this, id, map));
		//li.addEventListener("mouseleave", this.OnLiMouseLeave_Handler.bind(this, id, map));
		li.addEventListener("click", this.OnLiClick_Handler.bind(this, id, map));
		li.addEventListener("keydown", this.OnLiKeydown_Handler.bind(this, id, map));
	}
	/*
	OnLiMouseMove_Handler(id, map, ev) {	
		this.tooltip.Node("content").innerHTML = map.description;
		this.tooltip.Show(ev.pageX - window.scrollX + 20, ev.pageY - window.scrollY);
	}
	
	OnLiMouseLeave_Handler(id, map, ev) {
		this.tooltip.Hide();
	}
	*/
	OnLiKeydown_Handler(id, map, ev) {		
		// prevent default event on specifically handled keys
		if (ev.keyCode != 13) return;
		
		ev.preventDefault();
		
		this.Emit("MapSelected", { id:id, map:map });
	}
	
	OnLiClick_Handler(id, map, ev) {		
		this.Emit("MapSelected", { id:id, map:map });
	}
	
	Template() {
		return "<div handle='root' class='maps'>" + 
				  "<div class='maps-header-container'>" + 
					 `<img class='maps-header-icon' src='${Core.root}assets/layers.png'></img>` +
					 "<h2 handle='maps-header' class='maps-header'>Maps</h2>" +
				  "</div>" +
				  "<ul handle='ul' class='maps-list'></ul>" + 
				  // "<div handle='description' class='maps-description'></div>" +
			   "</div>"
	}
}

/**
 * MapsMenu Control class
 * @class
 */
class MapsMenu extends Control { 
		
	constructor(options) {	
		super(options);
		
		this._container = this.Node('root');
		this.maps = options.maps;

		// If a custom label is provided, update menu label
		if (options.label && typeof(options.label) === 'string') {
			this.Node('maps-menu-label').innerHTML = options.label;
			Dom.SetAttribute(this.Node('maps-menu'), 'aria-label', options.label);
		}

		// Update the Maps Select Menu
		this.updateMapsMenu(this.maps);

		// Add event listeners for change events on maps menu
		this.Node('maps-menu').addEventListener('change', this.onMapsMenuSelectorChange_Handler.bind(this));
	}

	/**
	 * Select maps menu value getter
	 * @returns {string} The value of the maps-menu select element
	 */
	get value() {
		return this.Node('maps-menu').value;
	}

	/**
	 * Select maps menu value setter
	 * @param {string} val The value the maps-menu select element should be set to
	 */
	set value(val) {
		let menu = this.Node('maps-menu');
		menu.value = val;
	}

	/**
	 * Update the maps menu with a collection of maps as select menu options.
	 * @param {object} maps a collection of maps
	 * Example of basic maps object structure:
	 * {
	 * 		"mapa": {
	 * 			id: "mapa",
	 * 			title: "Map A",
	 * 			style: "mapbox://styles/<user-name>/<map-style-id>",
	 * 			...	
	 * 		},
	 * 		"mapb": {
	 * 			id: "mapb",
	 * 			title: "Map B",
	 * 			style: "mapbox://styles/<user-name>/<map-style-id>",
	 * 			...
	 * 		},
	 * 		"mapc": {
	 * 			id: "mapc",
	 * 			title: "Map C",
	 * 			style: "mapbox://styles/<user-name>/<map-style-id>",
	 * 			...
	 * 		}
	 * }
	 */
	updateMapsMenu(maps) {
		let mapKeys = Object.keys(maps);

		for (let i = 0; i < mapKeys.length; i += 1) {
			let mapKey = mapKeys[i];
			let map = maps[mapKey];

			let opt = Dom.Create('option', {
				value: map.id,
				innerHTML: map.title
			}, this.Node('maps-menu'));
			opt.setAttribute('handle', 'maps-menu-option');
		}
	}

	/**
	 * Handle maps menu selection changes and emit required map selection details 
	 * @param {Event} ev
	 */
	onMapsMenuSelectorChange_Handler(ev) {
		let mapsMenuSelection = this.Node('maps-menu').value;

		// Emit change event for maps menu
		this.Emit('MapsMenuControlChanged', {
			id: mapsMenuSelection, 
			map: this.maps[mapsMenuSelection]
		});
	}

	/**
	 * HTML Template for Maps Menu Control
	 * @returns {string} Template representing a maps menu control
	 */
	Template() {
		return "<div handle='root' class='maps-menu mapboxgl-ctrl'>" + 
					"<div class='maps-menu-container'>" + 
						"<label handle='maps-menu-label' class='maps-menu-label'>Maps</label>" +
						"<select aria-label='Maps' handle='maps-menu' name='maps-menu' class='maps-menu'></select>" +
					"</div>" +
			   "</div>"
	}
}

/**
 * Menu class
 * @class
 */
class Menu extends Control { 
		
	constructor(options) {	
		super(options);
		
		this._container = this.Node('root');
		
		this.buttons = {};
	}
	
	AddButton(id, icon, title, hClick) {
		if (this.buttons[id]) throw new Error("Button already exists in menu.");
		
		var root = this.Node("root");
		var btn = Dom.Create("button", { "title":title, "aria-label":title, "type":"button", "className":"mapboxgl-ctrl-icon" }, root);
		var img = Dom.Create("img", { "alt":title, "src":icon }, btn);
		
		btn.addEventListener("click", hClick);
		
		this.buttons[id] = { node:btn };
		
		return btn;
	}
	
	AddPopupButton(id, icon, title, widget, container) {
		var popup = new Popup("modal absolute popup-" + id, container);
		
		popup.Content = widget.Node("root");
		
		var button = this.AddButton(id, icon, title, (ev) => { popup.Show(); });
		
		popup.On("Hide", this.OnPopupHide_Handler.bind(this, button));
		
		this.buttons[id].popup = popup;
		
		return popup;
	}
	
	Button(id) {
		return this.buttons[id] || null;
	}
	
	OnPopupHide_Handler(button, ev) {
		button.focus();
	}
	
	Template() {
		return "<div handle='root' class='maps-control mapboxgl-ctrl mapboxgl-ctrl-group'></div>";
	}
}

/**
 * Navigation class
 * @class
 */
class Navigation extends Evented { 
	
	set titleIn(value) { this._n._zoomInButton.title = value; }
	
	set titleOut(value) { this._n._zoomOutButton.title = value; }
		
	constructor(options) {	
		super();
		
		this._n = new maplibregl.NavigationControl({ showCompass:options.showCompass, showZoom:options.showZoom });
		
		this.options = options;
	}
			
	onFullscreenClick_Handler(ev) {		
		if (!this.fullscreen) this.Emit("enterFullscreen", {});
		
		else this.Emit("exitFullscreen", {});
	}
	
	onAdd(map) {		
		this._container = this._n.onAdd(map);
		
		this._n._zoomInButton.removeAttribute("aria-label");
		this._n._zoomOutButton.removeAttribute("aria-label");
		
		this.titleIn = this.options.titleIn; 
		this.titleOut = this.options.titleOut; 
		
        this._map = map;
		
        return this._container;
    }

    onRemove() {
		this._n.onRemove();
		
        this._n._container.parentNode.removeChild(this._n._container);
		
		this._map = undefined;
    }
}

/**
 * Opacity class
 * @class
 */
class Opacity extends Control { 
		
	set label(value) {
		Dom.Node(this._container, ".control-label").innerHTML = value;
	}

	set title(value) {
		this.Node("slider").title = value;
	}
	
	constructor(options) {	
		super(options);
		
		this._container = this.Node('root');
        
		this.opacity = (this.options.opacity == undefined) ? 0.75 : this.options.opacity;
		
		this.Node("slider").value = this.opacity * 100;		
		this.Node('slider').addEventListener("change", this.onSliderChange_Handler.bind(this));
	}
	
	onSliderChange_Handler(ev) {
		this.opacity = this.Node("slider").value / 100;
		
		this.Emit("OpacitySliderChanged", { opacity:this.opacity });
	}
	
	Template() {        
		return "<div handle='root' class='opacity mapboxgl-ctrl'>" +
				  "<label class='control-label'>Opacity</label>" +
				  "<input handle='slider' type='range' min='0' max='100' value='100' class='slider'>" +
			   "</div>";
	}
}

/**
 * Search class
 * @class
 */
class Search extends Control {
		
	constructor(options) {
		super(options);
		
		this._container = this.Node('root');
		
		this.layer = options.layer;
		this.field = options.field;
		this.color = options.color;
		this.items = options.items;

		// TODO : This should probably happen outside of the widget.
		this.Node('typeahead').items = this.Itemize(options.items);
		this.Node('typeahead').placeholder = options.placeholder;
		this.Node('typeahead').title = options.title;
	
		this.Node('typeahead').On('Change', this.onTypeaheadChange_Handler.bind(this));
		this.Node('typeahead').On('Focusin', this.onTypeaheadFocusin_Handler.bind(this));
	}

	/**
	 * Set the search items associated with the current search control
	 * @param {array} items List of search items
	 * Example of required format for search items:
	 * [
	 * 		{
	 * 			'id':'1001'
	 * 			'name':'Foo Bar'
	 * 			'label':'Foo Bar (1001)'
	 * 			'extent':[[54, 45], [55, 46]]
	 * 		},
	 * 		...
	 * ]
	 */
	set searchItems(items) {
		this.items = items;
		this.UpdateSearchItems();
	}

	/**
	 * Get search items associated with the current search control
	 * @returns {array} List of search items
	 */
	get searchItems() {
		return this.items;
	}
	
	/**
	 * Update the available items for the typeahead element
	 */
	UpdateSearchItems() {
		this.Node('typeahead').items = this.Itemize(this.items);
	}

	/**
	 * Itemize the search items for the search control
	 * @param {array} items 
	 * @returns {array} list of sorted items
	 */
	Itemize(items) {		
		return items.sort((a, b) => { return a.label > b.label ? 1 : -1 });
	}

	/**
	 * Event handler for typeahead focusin events
	 * @param {object} ev typeahead focusin change event 
	 */
	 onTypeaheadFocusin_Handler(ev) {
		if (ev.target && ev.target.nodes && ev.target.nodes.input && ev.target.nodes.input.value) {
			// Clear search input
			ev.target.nodes.input.value = "";
		}
	}

	/**
	 * Event handler for typeahead changes
	 * @param {object} ev typeahead change event
	 */
	onTypeaheadChange_Handler(ev) {
		var data = {
			layer : this.layer,
			field : this.field,
			color : this.color,
			item : ev.item
		};
		
		this.Emit('Change', data);
	}
	
	/**
	 * Create a template for the search control
	 * @returns {string} html template for search control
	 */
	Template() {
		return "<div handle='root' class='search-control mapboxgl-ctrl'>" +
				  "<div handle='typeahead' widget='Basic.Components.Typeahead'></div>" +
			   "</div>";
	}
}

/**
 * Table of Contents (TOC) class
 * @class
 */
class Toc extends Control { 
		
	constructor(options) {	
		super(options);

		// If a custom label is provided, update TOC label
		if (options.label && typeof(options.label) === 'string') {
			this.Node('toc-label').innerHTML = options.label;
		}
		
		this._container = this.Node('root');

		this.Reload(options.toc);
	}

	/**
	 * Get the list of TOC items
	 * @returns {array} list of TOC items used for radio button options
	 */
	get items() {
		return this.options.toc;
	}

	/**
	 * Set the list of TOC items
	 * @param {array} tocItems list of TOC items used for radio button options
	 */
	set items(tocItems) {
		this.options.toc = tocItems;
		this.Reload(this.options.toc);
	}

	/**
	 * Checks if the provided layered ID is a TOC radio button items 
	 * @param {string} layerId id of the TOC item
	 * @returns {boolean}
	 */
	HasLayer(layerId) {
		return this.radios.hasOwnProperty(layerId);
	}

	/**
	 * Generate the radio button options for the TOC Control
	 * @param {array} toc list of toc items 
	 */
	Reload(toc) {
		Dom.Empty(this.Node("toc"));
		
        this.radios = {};
		
		if (toc) toc.forEach(i => this.radios[i.id] = this.AddTocItem(i));
	}

	/**
	 * Selects a TOC item
	 * @param {string} layerId id of TOC item
	 */
	SelectItem(layerId) {
		// Uncheck previous TOC Item
		if (this.current && this.HasLayer(this.current)) {
			this.radios[this.current].checked = false;
		}
		
		if (!this.HasLayer(layerId)) return;
		
		this.current = layerId;
		
		this.radios[layerId].checked = true;
	}
	
	/**
	 * Event handler for change events in TOC control
	 * @param {object} item toc item details
	 * Example: 
	 * {
	 * 		id: 1,
	 * 		label: "Item Label",
	 * 		selected: true,
	 *      ...
	 * }
	 * @param {Event} ev
	 */
	onChange_Handler(item, ev) {
		if (this.current) this.radios[this.current].checked = false;
		
		this.current = item.id;
		
		this.Emit('LayerVisibility', { layer:this.current });
	}

	/**
	 * Add a radio button for TOC control item to the TOC control.
	 * @param {object} item toc item details
	 * Example: 
	 * {
	 * 		id: 1,
	 * 		label: "Item Label",
	 * 		selected: true,
	 *      ...
	 * }
	 * @returns DOM radio button input
	 */
	AddTocItem(item) {
		var i = this.Node("toc").children.length + 1;
		var div = Dom.Create("div", { className:"toc-item" }, this.Node("toc"));
		var ipt = Dom.Create("input", { type:"radio", name:"toc", id:`rd-${i}` }, div);
		var lbl = Dom.Create("label", { innerHTML:item.label }, div);

		ipt.setAttribute("aria-describedby", "toc-label");
		lbl.setAttribute("for", `rd-${i}`);
		
		ipt.addEventListener('change', this.onChange_Handler.bind(this, item));
		
		return ipt;
	}
	
	// Create a HTML template for the TOC control
	Template() {        
		return "<div handle='root' class='toc mapboxgl-ctrl'>" +
					"<div id='toc-label' handle='toc-label' class='control-label'>Table of Contents</div>" +
					"<div handle='toc' class='legend-container toc-container'></div>" +
				"</div>";
	}
}

/**
 * Theme control class
 * @class
 * 
 */
class Theme extends Control { 

	constructor(options) {	
		super(options);

		// If a custom label is provided, update groups label
		if (options.groups_label && typeof(options.groups_label) === 'string') {
			this.Node('theme-groups-label').innerHTML = options.groups_label;
			Dom.SetAttribute(this.Node('theme-groups'), 'aria-label', options.groups_label);
		}

		// If a custom label is provided, update themes label
		if (options.themes_label && typeof(options.themes_label) === 'string') {
			this.Node('themes-label').innerHTML = options.themes_label;
			Dom.SetAttribute(this.Node('themes'), 'aria-label', options.themes_label);
		}

		this.themes = options.themes;
		
		this.currentTheme = "";
		this.currentThemeGroup = "";

		this.updateThemeControl(this.themes);

		// Add event listeners for change events on both select menus
		this.Node('theme-groups').addEventListener("change", this.onThemeGroupSelectorChange_Handler.bind(this));
		this.Node('themes').addEventListener("change", this.onThemeSelectorChange_Handler.bind(this));
	}

	/**
	 * Update theme selection menu
	 * @param {object} themes 
	 */
	updateThemeControl(themes) {
		let themeGroups;

		// Set theme control input values before updating
		this.Node('theme-groups').value = this.currentThemeGroup;
		this.Node('themes').value = this.currentTheme;

		// Update themes
		this.themes = themes; 

		// Get theme groups defined in config
		themeGroups = this.getThemeGroups(this.themes);

		if (themeGroups.length) {
			// Add group items if they're defined
			this.updateGroupsMenu(themeGroups);

		} else {
			// If no groups are provided, update themes menu
			this.updateThemesMenu(this.themes);
		}

		// Hide select menu if no options exists
		Dom.ToggleClass(this.Node("groups-menu-container"), "hidden", !themeGroups.length);
		Dom.ToggleClass(this.Node("themes-menu-container"), "hidden", !this.themes);
	}

	/**
	 * Update the group menu options
	 * @param {array} groups list of defined theme groups
	 */
	updateGroupsMenu(groups) {
		let i, group;
		let group_menu_node = 'theme-groups';

		if (!this.isValidGroup(groups, this.currentThemeGroup)) {
			// Empty theme groups selection menu before adding items
			Dom.Empty(this.Node(group_menu_node));

			// Add group items if they're defined
			if (Array.isArray(groups) && groups.length) {
				// Add items to group menu
				for (i = 0; i < groups.length; i += 1) {
					group = groups[i];
					this.addGroupItem(group, group_menu_node);
				}
			
				// Set initial value to first group datalist option
				let firstGroupItem = groups[0];
				this.Node('theme-groups').value = firstGroupItem[Core.locale];

				// Updated current theme group selection
				this.currentThemeGroup = this.Node('theme-groups').value;
			}
		}
		// Dispatch a change event to trigger a group selection change
		this.Node("theme-groups").dispatchEvent(new Event('change', { 'bubbles': true }));
	}

	/**
	 * Update the theme menu options
	 * @param {array} themes list of defined themes
	 */
	updateThemesMenu(themes) {
		let i, theme;
		let themes_menu_node = 'themes';

		if (!this.isValidTheme(themes, this.currentTheme)) {
			// Empty theme selection menu before adding items
			Dom.Empty(this.Node(themes_menu_node));

			// Add updated themes to selection menu
			if (Array.isArray(themes) && themes.length) {
				for (i = 0; i < themes.length; i += 1) {
					theme = themes[i];
					this.addThemeItem(theme, themes_menu_node);
				}

				// Initial selection of first available theme
				this.Node('themes').value = themes[0].id;

				// Update current theme selection
				this.currentTheme = this.Node('themes').value;
			}
		}
		// Dispatch a change event to trigger a theme selection change
		this.Node('themes').dispatchEvent(new Event('change', { 'bubbles': true }));
	}

	/**
	 * Gets a list of theme groups defined in the theme config object
	 * @param {object} themesConfig copy of the theme object
	 */
	getThemeGroups(themesConfig) {
		let groups = [];

		if (Array.isArray(themesConfig) && themesConfig.length) {
			for (let i = 0; i < themesConfig.length; i += 1) {
				let configItem = themesConfig[i];

				if (configItem.group) {
					groups.push(configItem.group);
				}
			}
		}

		return groups;
	}

	/**
	 * Add a menu theme group item to select menu
	 * @param {object} item Details on the option item
	 * @param {string} node Name of the node to add the option to.
	 * @returns Dom element representing select menu option.
	 */
	addGroupItem(item, node) {
		if (item) {
			let opt = Dom.Create("option", {
				value: item[Core.locale], 
				innerHTML: item[Core.locale]
			}, this.Node(node));
			opt.setAttribute('handle', 'theme-option');
		}
	}

	/**
	 * Add a menu item to select menu
	 * @param {object} item Details on the item being added as an option
	 * @param {string} node A string representing the node which will have the option added to.
	 * @returns Dom element representing select menu option.
	 */
	addThemeItem(item, node) {
		if (item && item.id && item.label) {
			let opt = Dom.Create("option", {
				value: item.id,
				innerHTML: item.label[Core.locale]
			}, this.Node(node));

			opt.setAttribute('handle', 'theme-option');
		}
	}

	/**
	 * Get the theme object from a colleciton of themes based on theme id
	 * @param {array} themes list of defined themes
	 * @param {string} groupId id of the group
	 * @returns {object} the selected theme
	 */
	getThemesByGroup(themes, groupId) {
		let groupThemes;

		for (var i = 0; i < themes.length; i += 1) {
			let theme = themes[i];
			if (theme) {
				if (theme.group && theme.items && Array.isArray(theme.items)) {
					if (theme.group[Core.locale] === groupId){ 
						groupThemes = theme.items;
						break;
					}
				}
			}
		}
		return groupThemes;
	}

	/**
	 * Get the theme object from a colleciton of themes based on theme id
	 * @param {array} themes list of defined themes
	 * @param {string} themeId id of the theme
	 * @returns {object} the selected theme
	 */
	getThemeById(themes, themeId) {
		let selectedTheme;

		for (var i = 0; i < themes.length; i += 1) {
			let theme = themes[i];
			if (theme) {
				if (theme.id && theme.id === themeId) {
					selectedTheme = theme;
					break;
				} else if (theme.group && theme.items && Array.isArray(theme.items)) {
					selectedTheme = this.getThemeById(theme.items, themeId);
					if (selectedTheme) {
						break;
					}
				}
			}
		}
		return selectedTheme;
	}

	/**
	 * Checks if the currently selected theme is within the list of theme items
	 * @param {array} themes list of themes
	 * @param {string} currentTheme the name of the currently selected theme
	 * @returns {boolean} 
	 */
	isValidTheme(themes, currentTheme) {
		let theme, i;
		let validTheme = false;

		if (themes && Array.isArray(themes)) {
			for (i = 0; i < themes.length; i += 1) {
				theme = themes[i];
				if (theme && theme.label 
					&& (theme.label[Core.locale] === currentTheme
					|| theme.id === currentTheme)) {
					validTheme = true;
					break;
				}
			}
		}

		return validTheme;
	}

	/**
	 * Checks if the currently selected theme group is within the list of group items
	 * @param {array} groups list of groups of themes
	 * @param {string} currentThemeGroup the name of the currently selected group
	 * @returns {boolean} 
	 */
	isValidGroup(groups, currentThemeGroup) {
		let group, i;
		let validThemeGroup = false;

		if (groups && Array.isArray(groups)) {
			for (i = 0; i < groups.length; i += 1) {
				group = groups[i];
				if (group && group[Core.locale] === currentThemeGroup) {
					validThemeGroup = true;
					break;
				}
			}
		}

		return validThemeGroup;
	}

	/**
	 * Handler for theme-groups selector change event
	 * @param {Event} ev
	 */
	onThemeGroupSelectorChange_Handler(ev) {
		this.currentThemeGroup = this.Node('theme-groups').value;

		// Get theme by the selection Id
		let themes = this.getThemesByGroup(this.themes, this.currentThemeGroup);

		this.updateThemesMenu(themes);
	}

	/**
	 * Handler for theme selector change event
	 * @param {Event} ev
	 */
	onThemeSelectorChange_Handler(ev) {
		this.currentTheme = this.Node('themes').value;

		// Get theme by the selection Id
		let selection = this.getThemeById(this.themes, this.currentTheme);

		this.Emit("ThemeSelectorChange", { theme: selection });
	}
	
	/**
	 * Provides the HTML template for a theme selector control
	 * @returns {string} controller template
	 */
	Template() {
		let template = "<div handle='root' class='theme-selector mapboxgl-ctrl'>" +
				"<div class='groups-menu-container' handle='groups-menu-container'>" +
					"<label handle='theme-groups-label' class='control-label'>Theme Groups</label>" +
					"<select aria-label='Theme groups' handle='theme-groups' name='theme-groups' class='theme-groups'></select>" +
				"</div>"+
				"<div class='themes-menu-container' handle='themes-menu-container'>"+
					"<label handle='themes-label' class='control-label'>Themes</label>" +
					"<select aria-label='Themes' handle='themes' name='themes' class='themes'></select>" +
				"</div>"+
			"</div>";

		return template;
	}
}

/**
 * Theme Datalist control class
 * @class
 * 
 */
class ThemeDatalist extends Theme { 

	constructor(options) {	
		super(options);
		
		this.themes = options.themes;

		this.updateThemeControl(this.themes);

		// Add event listeners for change events on both select menus
		this.Node('theme-groups').addEventListener("change", this.onThemeGroupSelectorChange_Handler.bind(this));
		this.Node('theme-groups').addEventListener("focus", this.onThemeGroupSelectorFocused_Handler.bind(this));
		this.Node('theme-groups').addEventListener("blur", this.onThemeGroupSelectorBlured_Handler.bind(this));
		this.Node('themes').addEventListener("change", this.onThemeSelectorChange_Handler.bind(this));
		this.Node('themes').addEventListener("focus", this.onThemeSelectorFocused_Handler.bind(this));
		this.Node('themes').addEventListener("blur", this.onThemeSelectorBlured_Handler.bind(this));
	}

	/**
	 * Update the group menu options
	 * @param {array} groups list of defined theme groups
	 */
	updateGroupsMenu(groups) {
		let i, group;
		let group_menu_node = 'theme-groups-list';

		if (!this.isValidGroup(groups, this.currentThemeGroup)) {
			// Empty theme groups selection menu before adding items
			Dom.Empty(this.Node(group_menu_node));

			// Add group items if they're defined
			if (Array.isArray(groups) && groups.length) {
				// Add items to group menu
				for (i = 0; i < groups.length; i += 1) {
					group = groups[i];
					this.addGroupItem(group, group_menu_node);
				}

				// Set initial value to first group datalist option
				let firstGroupItem = groups[0];
				this.Node('theme-groups').value = firstGroupItem[Core.locale];

				// Updated current theme group selection
				this.currentThemeGroup = this.Node('theme-groups').value;
			}
		}
		// Dispatch a change event to trigger a group selection change
		this.Node("theme-groups").dispatchEvent(new Event('change', { 'bubbles': true }));
	}

	/**
	 * Add a menu item to select menu
	 * @param {object} item Details on the item being added as an option
	 * @param {string} node A string representing the node which will have the option added to.
	 * @returns Dom element representing select menu option.
	 */
	 addThemeItem(item, node) {
		if (item && item.id && item.label) {
			let opt = Dom.Create("option", {
				value: item.label[Core.locale], 
				innerHTML: item.label[Core.locale]
			}, this.Node(node));
			opt.dataset.themeid = item.id;

			opt.setAttribute('handle', 'theme-option');
		}
	}

	/**
	 * Update the theme menu options
	 * @param {array} themes list of defined themes
	 */
	updateThemesMenu(themes) {
		let i, theme;
		let themes_menu_node = 'themes-list';

		if (!this.isValidTheme(themes, this.currentTheme)) {
			// Empty theme selection menu before adding items
			Dom.Empty(this.Node(themes_menu_node));

			// Add updated themes to selection menu
			if (Array.isArray(themes) && themes.length) {
				for (i = 0; i < themes.length; i += 1) {
					theme = themes[i];
					this.addThemeItem(theme, themes_menu_node);
				}

				// Initial selection of first available theme
				this.Node('themes').value = themes[0].label[Core.locale];
	
				// Update current theme selection
				this.currentTheme = this.Node('themes').value;
			}
		}
		// Dispatch a change event to trigger a theme selection change
		this.Node('themes').dispatchEvent(new Event('change', { 'bubbles': true }));
	}

	/**
	 * Handler for theme-groups selector change event
	 * @param {Event} ev
	 */
	onThemeGroupSelectorChange_Handler(ev) {
		let themes;
		this.currentThemeGroup = this.Node('theme-groups').value;

		// Blur theme group input if input string matches one of the dataset options
		let themeGroupList = this.Node('theme-groups-list').options;
		for (let i = 0; i < themeGroupList.length; i += 1) {
			if (themeGroupList[i].value === this.currentThemeGroup) {
				this.Node('theme-groups').blur();
			}
		}
		// Get themes by the theme group selection Id
		themes = this.getThemesByGroup(this.themes, this.currentThemeGroup);

		// Update Themes selector
		this.updateThemesMenu(themes);
	}
	
	/**
	 * Handler for theme group selector select event when type is datalist
	 * @param {Event} ev
	 */
	onThemeGroupSelectorFocused_Handler(ev) {
		this.currentThemeGroup = this.Node('theme-groups').value;
		this.Node('theme-groups').value = "";
	}
	
	/**
	 * Handler for theme group selector blur event when type is datalist
	 * @param {Event} ev
	 */
	onThemeGroupSelectorBlured_Handler(ev) {
		this.Node('theme-groups').value = this.currentThemeGroup;
	}

	/**
	 * Handler for theme selector change event
	 * @param {Event} ev
	 */
	onThemeSelectorChange_Handler(ev) {
		let datalist, selectionId;
		this.currentTheme = this.Node('themes').value;

		// Get DataList Node
		datalist = this.Node('themes-list');

		for (let i = 0; i < datalist.options.length; i += 1) {
			let dataListItem = datalist.options[i];
			// Check if datalist item value matches input value
			if (dataListItem.value === this.currentTheme) {
				// Get themeid from list item dataset
				if (dataListItem.dataset && dataListItem.dataset.themeid) {
					selectionId = dataListItem.dataset.themeid;
					break;
				}
			}
		}

		// Blur theme input if input string matches one of the dataset options
		let themeList = this.Node('themes-list').options;
		for (let i = 0; i < themeList.length; i += 1) {
			if (themeList[i].value === this.currentTheme) {
				this.Node('themes').blur();
			}
		}
		// Get theme by the selection Id
		let selection = this.getThemeById(this.themes, selectionId);

		this.Emit("ThemeSelectorChange", { theme: selection });
	}
	
	/**
	 * Handler for theme selector select event when type is datalist
	 * @param {Event} ev
	 */
	onThemeSelectorFocused_Handler(ev) {
		this.currentTheme = this.Node('themes').value;
		this.Node('themes').value = "";
	}
	
	/**
	 * Handler for theme selector blur event when type is datalist
	 * @param {Event} ev
	 */
	onThemeSelectorBlured_Handler(ev) {
		this.Node('themes').value = this.currentTheme;
	}

	/**
	 * Provides the HTML template for a theme selector control
	 * @returns {string} controller template
	 */
	Template() {
		let template = "<div handle='root' class='theme-selector mapboxgl-ctrl'>" +
				"<div class='groups-menu-container' handle='groups-menu-container'>" +
					"<label handle='theme-groups-label' class='control-label' for='groups'>Theme Groups</label>" +
					"<input aria-label='Theme groups' handle='theme-groups' list='groups-list' name='groups'>" +
					"<datalist handle='theme-groups-list' id='groups-list' class='theme-groups'></datalist>" +
				"</div>"+
				"<div class='themes-menu-container' handle='themes-menu-container'>" +
					"<label handle='themes-label' class='control-label' for='themes'>Themes</label>" +
					"<input aria-label='Themes' handle='themes' list='themes-list' name='themes'>" +
					"<datalist handle='themes-list' id='themes-list' class='themes'></datalist>" +
				"</div>"+
		   "</div>";
	
		return template;
	}
}

/**
 * The OSM style object represents a predefined map style using OpenStreetMap 
 * Raster Tile layers and the Open Font Glyphs which packages free fonts 
 * (required for symbol labelling). 
 * 
 * OSM: https://www.openstreetmap.org/
 * OSM Licence: OpenStreetMap® is open data, licensed under the Open Data 
 * Commons Open Database License (ODbL) by the OpenStreetMap Foundation (OSMF). 
 * https://www.openstreetmap.org/copyright
 * 
 * Open Font Glyphs: https://github.com/openmaptiles/fonts
 * Open Font Glyphs Licence: All fonts packaged in Open Font Glyphs is licensed
 * under Open File Licence (OFL) or Apache.
 */
const OSM = {
	version: 8,
	glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
	sources: {
		osm: {
			type: 'raster',
			tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
			tileSize: 256,
			attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}
	},
	layers: [
		{
			id: 'osm',
			type: 'raster',
			source: 'osm'
		}
	]
};

/**
 * expression.js
 * 
 * A collection of functions for generating mapbox expressions used for styling.
 * For additional information on mapbox expressions, see the mapbox documentation 
 * at, https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/
 */

/**
 * Converts a list of rgb numbers into an rgb or rgba string
 * @param {array} colourList 
 * @returns {string} rgb or rgba string
 * Examples:
 *   [50,150,250] -> "rgb(50,150,250)"
 *   [50,150,250,0.5] -> "rgba(50,150,250,0.5)"
 */
function colourListToRGBString(colourList) {
	let rgbString;

	if (Array.isArray(colourList) && colourList.length >= 3) {
		if (colourList.length === 3) {
			rgbString = 'rgb(' + colourList.join(',') + ')';

		} else if (colourList.length === 4) {
			rgbString = 'rgba(' + colourList.join(',') + ')';
		}
	}

	return rgbString;
}

/**
 * 
 * Generate a list of opacity values for each legend item based on;
 * the checkbox state, and if the legend item has the property opacity
 * set to a predefined opacity value in the map config file.
 * @param {object} legend current legend object
 * @param {number} storedOpacity the stored opacity value
 */
function generateLegendOpacityValues(legend, storedOpacity) {
	let legendOpacities = [];
	let i, chkBox;

	if (legend && legend.chkBoxesState) {
		for (i = 0; i < legend.chkBoxesState.length; i += 1) {
			chkBox = legend.chkBoxesState[i];

			if (chkBox && chkBox.checkbox && !chkBox.checkbox.checked) {
				legendOpacities.push(0);
			} else if (chkBox && chkBox.item && chkBox.item.opacity && typeof(chkBox.item.opacity) === 'number') {
				// Ensure that opacity value is between 1 and 0. 
				if (chkBox.item.opacity > 1) {
					chkBox.item.opacity = 1;
				} else if (chkBox.item.opacity < 0) {
					chkBox.item.opacity = 0;
				}

				legendOpacities.push(chkBox.item.opacity);
			} else {
				legendOpacities.push(storedOpacity);
			}
		}
	}

	return legendOpacities;
}

/**
 * Generate mapbox expression for fill colours defined in the map config file.
 * @param {object} legend - object containing the legend details stored in
 * the map config file.
 * @retruns A style expression using legend style data.
 * 
 * Example: 
 * ["case", 
 * ["==", ["get","type"],"Hospital"], 
 * "rgba(255,25,167,1)", 
 * ["==", ["get","type"],"School"], 
 * "rgba(50,128,229,1)",
 * "rgba(255,214,10,1)"] 
 */
function generateColourExpression(legend) {
	var styleColor, i, styleItem, defaultColour, legendStyles, expression;

	// Get styling from legend config
	if (legend && legend.config) {
		legendStyles = Legend.GetListOfStyles(legend.config);
	}
	
	// Check that legend items length equals opacity length
	if (Array.isArray(legendStyles) && legendStyles.length > 1) {
		expression = ['case'];
		for (i = 0; i < legendStyles.length; i += 1) {
			styleItem = legendStyles[i];

			if (styleItem) {
				// Define style color
				if (styleItem.color) {
					styleColor = colourListToRGBString(styleItem.color);
				}

				// Add style case and color
				if (styleItem.value && styleColor) {
					// Add mapbox expression value is defined, add it to cases list
					expression.push(styleItem.value);						

					// Add colour to cases list
					expression.push(styleColor);
				} else {
					defaultColour = styleColor;
				}
			}
		}

		// Add default colour as last item in colour cases
		// This is required by mapbox to in sure errors 
		// don't occur when the last item in the legend config
		// is not the default colour (i.e. the one without a 
		// a defined mapbox expression value)
		expression.push(defaultColour);

	} else if (Array.isArray(legendStyles) && legendStyles.length == 1) {
		// If legend only includes 1 item, set style expression to the value of
		// a rgb/rgba color string
		if (legendStyles[0].color) {
			expression = colourListToRGBString(legendStyles[0].color);
		}
	}

	return expression;
}

/**
 * Generate style expression for opacity based on legend status
 * @param {object} legend object containing the legend details stored in
 * the map config file.
 * @param {number} opacity an opacity value between 0 and 1
 * @retruns An style expression using opacity values.
 * 
 * Example: 
 * ["case", 
 * ["==", ["get","type"],"Hospital"], 
 * 0, 
 * ["==", ["get","type"],"School"], 
 * 1,
 * 1] 
 */
function generateOpacityExpression(legend, opacity) {
	var styleOpacity, i, styleItem, defaultOpacity, legendStyles, expression, legendOpacities ;

	// Get styling from legend config
	if (legend && legend.config) {
		legendStyles = Legend.GetListOfStyles(legend.config);
	}

	// Generate legend opacity values based on legend checkbox state
	legendOpacities = generateLegendOpacityValues(legend, opacity);
	
	// Create style expression for opacity values
	if (Array.isArray(legendStyles) && legendStyles.length > 1 && legendOpacities.length > 1) {
		expression = ['case'];
		for (i = 0; i < legendStyles.length; i += 1) {
			styleItem = legendStyles[i];
			styleOpacity = legendOpacities[i];

			// Add style case and color
			if (styleItem.value && styleOpacity >= 0 && styleOpacity <= 1) {
				// Add mapbox expression value is defined, add it to cases list
				expression.push(styleItem.value);						

				// Add opacity to cases list
				expression.push(styleOpacity);
			} else {
				if (styleOpacity >= 0 && styleOpacity <= 1) {
					defaultOpacity = styleOpacity;
				} else {
					defaultOpacity = opacity;
				}
			}
		}

		// Add default colour as last item in expression 
		// This is required by mapbox to in sure errors 
		// don't occur when the last item in the legend config
		// is not the default colour (i.e. the one without a 
		// a defined mapbox expression value)
		expression.push(defaultOpacity);

	} else if (Array.isArray(legendStyles) && legendStyles.length == 1 && legendOpacities.length == 1) {
		// If legend only includes 1 item, set style expression to the only legend opacity value 
		expression = legendOpacities[0];
	}
	
	return expression;
}

/**
 * Convert opacity expression into an expression for symbol opacities
 * @param {array} opacityExpression expression containing cases for styling opacities.
 */
function generateSymbolOpacityExpression(opacityExpression) {
	let expression;

	if (opacityExpression && opacityExpression.length > 1) {
		expression = [];
		for (var i = 0; i < opacityExpression.length; i += 1) {
			if (typeof opacityExpression[i] === 'number') {
				if (opacityExpression[i] > 0) {
					expression.push(1);
				} else {
					expression.push(0);
				}
			} else {
				expression.push(opacityExpression[i]);
			}
		}

	} else if (typeof opacityExpression === 'number') {

		// When a single opacity value represents the expression, the symbol opacity
		// can either be 0 or 1
		if (opacityExpression > 0) {
			expression = 1;
		} else {
			expression = 0;
		}
	}

	return expression;
}

/**
 * Map class
 * @class
 */
class Map extends Evented {
				
	/**
	 * Set the mapbox access token
	 * @param {string} value map box access token
	 */
	static set Token(value) { 
		maplibregl.accessToken = value; 
	}
	
	/**
	 * Get the access token
	 * @returns {string} mapbox access token
	 */
	static get Token() { 
		return maplibregl.accessToken; 
	}
	
	/**
	 * Get the Dom element that is the map container
	 * @return {object} the html element used to contain the map
	 */
	get Container() {
		return this.map._container;
	}
	
	/**
	 * Get the center of the map
	 * @returns {object} the center coordinates of the map
	 * e.g. {lat: 50, lng: -100}
	 */
	get Center() {
		return this.map.getCenter();
	}
	
	/**
	 * Set the center of the map
	 * @param {object} coords The coordinates for the center of the map
	 * E.g. {lat: 50, lng: -100}
	 */
	set Center(coords) {
		this.map.setCenter(coords);
	}
	
	/**
	 * Get the current map zoom level
	 * @returns {number} map zoom level (between 0-22)
	 */ 
	get Zoom() {
		return this.map.getZoom();
	}
	
	/**
	 * Set the map zoom level
	 * @param {number} value map zoom value
	 */
	set Zoom(value) {
		this.map.setZoom(value);
	}
	
	/**
	 * Get the current map style URL
	 * @returns {string} URL to the map style document
	 */
	get Style() {
		return this.style;
	}
	
	constructor(options) {
		super();
		
		this.layers = [];
		
		if (options.style === "osm") {
			options.style = OSM;
		}

		this.style = options.style;

		this.click = this.OnLayerClick_Handler.bind(this);
		
		this.map = new maplibregl.Map(options); 
		
		this.map.once('styledata', this.OnceStyleData_Handler.bind(this));
		
		// this.map.on('click', this.click);
		
		this.WrapEvent('moveend', 'MoveEnd');
		this.WrapEvent('zoomend', 'ZoomEnd');
		this.WrapEvent('load', 'Load');
		this.WrapEvent('sourcedata', 'SourceData');
		
		this.map.once('load', ev => {
			let mapContainer = this.map.getContainer();
			// Fix for improve this map in french
			if (mapContainer && mapContainer.querySelector('.mapbox-improve-map')) {
				mapContainer.querySelector('.mapbox-improve-map').innerHTML = Core.Nls("Mapbox_Improve");
			}
		});
	}
	
	// ------------------------------------------------------------------------
	// Map Properties Methods
	// ------------------------------------------------------------------------
	/**
	 * Set the map bounds for the map.
	 * @param {array} bounds - An array containing coordinate pairs for the map bounds.
	 * @param {object} options - object containing options when fitting the map bounds 
	 */
	FitBounds(bounds, options) {		
		this.map.fitBounds(bounds, options);
	}

	/**
	 * Set the maximum bounds of the map
	 * @param {array} bounds - An array containing coordinate pairs for the map bounds.
	 * e.g. [[x1, y1], [x2, y2]]
	 */
	SetMaxBounds(bounds) {
		this.map.setMaxBounds(bounds);
	}

	/**
	 * Set the maximum zoom level for the map. If the value is null/undefined,
	 * the max zoom level is reset to 22. 
	 * @param {number} zoomLevel A numeric value between 0 and 22. 
	 */
	SetMaxZoom(zoomLevel) {
		this.map.setMaxZoom(zoomLevel);
	}

	/**
	 * Get the map style specification
	 * @returns {object} Style JSON representing the map's style specification
	 */
	GetStyle() {
		return this.map.getStyle();
	}

	/**
	 * Set the map style of the map.
	 * @param {string} style URL of the mapbox map style document
	 */
	SetStyle(style) {
		if (style === "osm") {
			this.style = OSM;
		} else {
			this.style = style;
		}
		
		this.map.once('styledata', this.OnceStyleData_Handler.bind(this));
		
		this.map.setStyle(style);
	}
	
	SetClickableMap(layers) {				
		this.map.on('click', this.click);
	}

	// ------------------------------------------------------------------------
	// Map Control & UI Methods
	// ------------------------------------------------------------------------
	/**
	 * Add a specified map control to the map.
	 * @param {object} control - map control object
	 * @param {string} location - location of the object. e.g. 'top-left'
	 */
	AddControl(control, location) {
		this.map.addControl(control, location);
	}
	
	InfoPopup(lngLat, html) {	
		var popup = new maplibregl.Popup({ closeOnClick: true })
			.setLngLat(lngLat)
			.setHTML(html)
			.addTo(this.map);
					
		popup._closeButton.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
		popup._closeButton.setAttribute('aria-label', Core.Nls('Mapbox_Close_Popup'));
		popup._closeButton.title = Core.Nls('Mapbox_Close_Popup');
	}
	
	SetClickableLayers(layers) {
		layers.forEach(l => this.map.off('click', l, this.click)); 
		
		this.layers = layers;
		
		this.layers.forEach(l => this.map.on('click', l, this.click));
	}
	
	QueryRenderedFeatures(point, layers) {
		return this.map.queryRenderedFeatures(point, { layers: layers });
	}
	
	// ------------------------------------------------------------------------
	// Map Data Source Methods
	// ------------------------------------------------------------------------
	/**
	 * Add a data source to the map
	 * @param {string} name - name of a data source
	 * @param {object} data - object containing the details of the data source
	 * - Data Source Example:
	 * 	{
	 * 		type: "geojson",
	 * 		data: "https://example.org/mydata.json",
	 * 		cluster: true,
	 * 		clusterMaxZoom: 14,
	 * 		clusterRadius: 50
	 * 	}
	 */
	AddSource(name, data) {
		this.map.addSource(name, data);
	}

	// ------------------------------------------------------------------------
	// Map Layer Methods - Collection of methods for working with map layers
	// ------------------------------------------------------------------------
	/**
	 * Add layer to the map
	 * @param {object} layer - object containing the details of the layer
	 *  Layer Example:
	 * 	{
	 * 		id: 'mylayer',
	 * 		source: 'mydatasource',
	 *		type: 'circle',
	 *		paint: {
	 *			circle-color: "#000000",
	 *			circle-radius: 8
	 *		}
	 * 	}
	 */
	AddLayer(layer) {
		if (layer.id && layer.type && !this.GetLayer(layer.id)) {
			this.map.addLayer(layer);
		}
	}
	
	/**
	 * Get a specified layer
	 * @param {string} layerId map layer id. 
	 */
	GetLayer(layerId) {
		return this.map.getLayer(layerId) || null;
	}

	/**
	 * Retrieves the layer type 
	 * @param {string} layerId - id of the map layer
	 */
	GetLayerType(layerId) {
		const layer = this.GetLayer(layerId);
		let layerType;

		if (layer && layer.type) {
			layerType = layer.type;
		}

		return layerType;
	}

	/**
	 * Filter layer content by filter expression
	 * @param {string} layerId - Name of the map layer
	 * @param {array | null | undefined} filter - Expression containing rules to
	 * include/exclude filter. If null/undefined, existing filters is removed.
	 * @param {object} options - Object containing filter options
	 */
	SetFilter(layerId, filter, options) {
		if (!options) {
			options = {};
		}

		if (this.GetLayer(layerId)) {
			this.map.setFilter(layerId, filter, options);
		}
	}

	/**
	 * Method to update a paint property for a layer
	 * @param {string} layerId - Name of the map layer
	 * @param {string} paintProperty - Paint Property of the map layer
	 * @param {array || string} styleRules - Mapbox expression of style rules or a rgba string value.
	 */
	SetPaintProperty(layerId, paintProperty, styleRules) {
		// Check that layer exists in map
		if (this.GetLayer(layerId)) {
			this.map.setPaintProperty(layerId, paintProperty, styleRules);
		}
	}

	/**
	 * Get layout property for a layer
	 * @param {string} layerId - Name of the map layer
	 * @param {string} layoutProperty - Layout property name
	 * @returns The layout property value
	 */
	GetLayoutProperty(layerId, layoutProperty) {
		// Check that layer exists in map and update it
		if (this.GetLayer(layerId)) {
			return this.map.getLayoutProperty(layerId, layoutProperty);
		}
	}

	/**
	 * Set a layout property for a layer
	 * @param {string} layerId - Name of the map layer
	 * @param {string} layoutProperty - Layout property name
	 * @param {array || string} styleRules - Mapbox expression of style rules or a rgba string value.
	 */
	SetLayoutProperty(layerId, layoutProperty, styleRules) {
		// Check that layer exists in map and update it
		if (this.GetLayer(layerId)) {
			this.map.setLayoutProperty(layerId, layoutProperty, styleRules);
		}
	}

	ReorderLayers(layers) {
		layers.forEach(l => this.map.moveLayer(l));
	}
	
	/**
	 * Show a specified layer
	 * @param {string} layerId map layer id. 
	 */
	ShowLayer(layerId) {
		this.SetLayoutProperty(layerId, 'visibility', 'visible');
	}
	
	/**
	 * Hides a specified layer
	 * @param {string} layerId map layer id. 
	 */
	HideLayer(layerId) {
		this.SetLayoutProperty(layerId, 'visibility', 'none');
	}

	/**
	 * Toggle the visibility of a map layer
	 * @param {string} layerID map layer to be hidden/shown
	 */
	ToggleMapLayerVisibility(layerID) {
		if (this.map.getLayoutProperty(layerID, 'visibility') === 'visible'){
			this.HideLayer(layerID);
		} else {
			this.ShowLayer(layerID);
		}
	}

	/**
	 * Apply legend style rules to map layers.
	 * @param {array} layerIDs - a list of layer id
	 * @param {object} legend - reference to the current legend object
	 */
	ApplyLegendStylesToMapLayers(layerIDs, legend) {
		// Generate colour mapbox expression
		let colourExpression = generateColourExpression(legend);

		// Loop through layers and update colour classes
		if (colourExpression) {
			for (let i = 0; i < layerIDs.length; i += 1) {
				// Get Layer Colour Property
				let currentLayerID = layerIDs[i];
				let layerType = this.GetLayerType(currentLayerID);
				if (layerType && layerType !== 'symbol') {
					let layerProperty = layerType + '-color';

					// Update layer colour properties
					if (layerProperty) {
						this.SetPaintProperty(currentLayerID, layerProperty, colourExpression);
					}
				}
			}
		}
	}

	/**
	 * Update Map Layers based on current legend state. Layer styling is
	 * updated by the current state of the legend which updates the opacity
	 * a map features.
	 * @param {array} layerIDs - a list of layer id
	 * @param {object} legend - reference to the current legend object
	 * @param {number} storedOpacity - Locally stored opacity value between 0 - 1.
	 */
	UpdateMapLayersWithLegendState(layerIDs, legend, storedOpacity) {
		let opacity;

		// Define opacity based on provided storedOpacity value; 
		if (storedOpacity >= 0 && storedOpacity <= 1) {
			opacity = storedOpacity;
		} else {
			opacity = 1;
		}

		// Generate opacity expressions
		// All legend layers are based on the legend input checkbox state. If the
		// item has a pre-defined opacity value defined with the opacity property,
		// the opacity is set to that value. Otherwise the opacity is based on the
		// locally stored opacity value. When the legend item is unchecked it's 0,
		var opacityExpression = generateOpacityExpression(legend, opacity);
		var symbolOpacityExpression = generateSymbolOpacityExpression(opacityExpression);

		if ((opacityExpression || opacityExpression === 0) && (symbolOpacityExpression || symbolOpacityExpression === 0)) {
			for (var i = 0; i < layerIDs.length; i += 1) {
				// Get Layer Colour Property
				let currentLayerID = layerIDs[i];
				let layerType = this.GetLayerType(currentLayerID);
				let layerFillProperty = layerType + '-opacity';

				if (layerType) {
					if (layerType !== 'symbol') {
						// Update layer opacity properties
						if (layerFillProperty) {
							this.SetPaintProperty(currentLayerID, layerFillProperty, opacityExpression);

							// If layer type is a circle, update circle stroke opacity to match circle-opacity
							if (layerType === 'circle') {
								this.SetPaintProperty(currentLayerID, 'circle-stroke-opacity', opacityExpression);
							}
						}

					} else {
						// Set opacity of feature labels based on opacity values. 
						// if opacity = 0 for a layer, then the labels are also set to 0.
						this.SetPaintProperty(currentLayerID, 'text-opacity', symbolOpacityExpression);
					}
				}
			}
		}
	}

	// ------------------------------------------------------------------------
	// Map Cluster Methods
	// ------------------------------------------------------------------------
	/**
	 * Add layers for clustering the data.
	 * @param {object} definedOpts - an object containing all of the cluster options
	 * {
	 * 		source: data-source-id, 
	 * 		id: cluster-layer-id,
	 * 		filter: mapbox-expression,
	 * 		circle_paint: object containing the paint properties for the cluster circle,
	 * 		circle_layout: object containing the layout properties for the cluster circle,
	 * 		label_paint: object containing the paint properties for the cluster label,
	 * 		label_layout: object containing the layout properties for the cluster label
	 * }
	 */
	AddClusters(definedOpts) {
		let defaultOpts = {
			filter: ['has', 'point_count'],
			circle_paint: {
				'circle-color': '#728399',
				'circle-radius': ['interpolate', ['exponential', 1], ['get', 'point_count'],1, 12, 1000, 32],
				'circle-stroke-width': 3,
				'circle-stroke-color': 'rgba(114,131,153,0.5)'
			},
			label_paint: {
				'text-color': '#fff',
				'text-halo-color': '#fff',
				'text-halo-width': 0.4
			},
			label_layout: {
				'text-allow-overlap': true,
				'text-field': '{point_count_abbreviated}',
				'text-font': ['Open Sans Regular'],
				'text-size': 12
			}
		};
		
		let options = Util.Mixin(defaultOpts, definedOpts);
		let clusterLayerId = (options.id || options.source) + '_clusters';
		let clusterCountLayerId = (options.id || options.source) + '_clusters-count';

		// Add clusters layer for source
		this.AddLayer({
			id: clusterLayerId,
			type: 'circle',
			source: options.source,
			filter: options.filter, 
			paint: options.circle_paint
		});

		// Add cluster count labels layer
		this.AddLayer({
			id: clusterCountLayerId,
			type: 'symbol',
			source: options.source,
			filter: options.filter,
			layout: options.label_layout,
			paint: options.label_paint 
		});
	}

	// ------------------------------------------------------------------------
	// Map Event Methods
	// ------------------------------------------------------------------------
	OnceStyleData_Handler(ev) {
		this.Emit('StyleChanged', ev);
	}
	
	/**
	 * Event handler for clicking on the map, and emits a 'Click' event.
	 * @param {object} ev - click event object
	 */
	OnLayerClick_Handler(ev) {
		this.Emit('Click', ev);
	}
	/**
	 * Wraps original mapbox event with a new event
	 * @param {string} oEv original mapbox event
	 * @param {string} nEv new event
	 */
	WrapEvent(oEv, nEv) {
		var f = (ev) => this.Emit(nEv, ev);
		
		this.map.on(oEv, f);
	}
}

/**
 * Factory class
 * @class
 */
class Factory {

	/**
	 * A factory method used to create new Map components
	 * @param {object} container DOM reference to the HTML containing the map
	 * @param {string} token mapbox access token (provided by Mapbox)
	 * @param {string} style url to the mapbox map style document
	 * @param {object} center object containing the lat/long coordinates for the center of the map.
	 * @param {number} zoom the map zoom level (between 0-22).
	 * @returns {object} A Map object
	 */
	static Map(container, token, style, center, zoom) {
		Map.Token = token;
		
		return new Map({ container: container, style: style, center: center, zoom: zoom });
	}

	/**
	 * Create map navigation control buttons for zooming in and out of the map, and for
	 * resetting the bearing North
	 * @param {boolean} showCompass indicate if the compass button should be shown (true) or not (false)
	 * @param {boolean} showZoom indicate if zoom buttons should be shown (true) or not (false)
	 * @param {string} titleIn tooltip text that appears when hovering over the zoom in button
	 * @param {string} titleOut tooltip text that appears when hovering over the zoom out button
	 * @returns {object} Navigation control object
	 */
	static NavigationControl(showCompass, showZoom, titleIn, titleOut) {
		return new Navigation({ showCompass:showCompass, showZoom:showZoom, titleIn:titleIn, titleOut:titleOut });
	}
	
	/**
	 * Create a full screen control button that makes the map take up the full screen resolution
	 * @param {string} title tooltip text that appears when hovering over the button
	 * @returns {object} Fullscreen control object
	 */
	static FullscreenControl(title) {
		return new Fullscreen({ title:title });
	}
	
	/**
	 * Creates a geolocate control that when clicked attempts to geo-locate your real world position
	 * and update the map extent to your current location.
	 * @returns {object} a maplibre GeolocateControl object
	 */
	static GeolocateControl() {
		return new maplibregl.GeolocateControl({
			positionOptions: { enableHighAccuracy: true },
			trackUserLocation: true
		});
	}
	
	/**
	 * Create a new scale control that's added to the map component
	 * @param {string} units the unit of measurement used by the scale bar; 'imperial', 'metric', or 'nautical'.
	 * @returns {object} mablibre scalecontrol object
	 */
	static ScaleControl(units) {
		return new maplibregl.ScaleControl({
			maxWidth: 100,
			unit: units
		});
	}
	
	static AttributionControl() {
		return new maplibregl.AttributionControl({ compact: true });
	}
	
	/**
	 * Creates a new Legend control that is added to the map component
	 * @param {object} config Legend configuration
	 * Example:
	 * [
	 * 		{
	 * 			color: [255,0,0],
	 * 			label: "Legend Item A",
	 * 			title: "Toggle Legend Item Visibility",
	 * 			opacity: 1,
	 * 			value: ["==", ["get", "type"], "A"] <- Mapbox expression
	 * 		},
	 * 		...
	 * 		{
	 * 			color: [150,150,150],
	 * 			label: "Other",
	 * 			title: "Toggle Legend Item Visibility"
	 * 		}
	 * ]
	 * @param {string} title Legend title text
	 * @param {string} banner Legend banner text, placed above the legend's title and subtitle.
	 * @param {string} subtitle Legend subtitle text
	 * @returns {object} Legend control object
	 */
	static LegendControl(config, title, banner, subtitle) {
		return new Legend({ config:config, title:title, banner:banner, subtitle:subtitle});
	}

	/**
	 * Builds a Table of Contents Control
	 * @param {object} toc A collection of TOC items
	 * @param {string} label The label to be shown above the TOC options
	 * @returns TOC object
	 */
	static TocControl(toc, label) {
		return new Toc({ toc:toc, label:label });
	}

	/**
	 * Theme map control 
	 * @param {array} themes a list of themes
	 * @param {string} groups_label the groups label
	 * @param {string} themes_label the themes label
	 * @returns an instantiated Theme control object
	 */
	static ThemeControl(themes, groups_label, themes_label) {
		return new Theme(
			{ 
				themes:themes,
				groups_label:groups_label, 
				themes_label:themes_label
			}
		);
	}
	
	/**
	 * Theme Datalist map control 
	 * @param {array} themes a list of themes
	 * @param {string} groups_label the groups label
	 * @param {string} themes_label the themes label
	 * @returns an instantiated Theme control object
	 */
	 static ThemeDatalistControl(themes, groups_label, themes_label) {
		return new ThemeDatalist(
			{ 
				themes:themes,
				groups_label:groups_label,
				themes_label:themes_label
			}
		);
	}
	
	/**
	 * Creates a new Opacity slider control that can be added to the map
	 * @param {number} opacity Number representing the initial opacity value between 0-1.
	 * @returns {object} Opacity control object
	 */
	static OpacityControl(opacity) {
		return new Opacity({ opacity:opacity });
	}
	
	/**
	 * Builds a Download Control
	 * @param {string} link The link URL
	 * @param {string} label The link label text
	 * @returns Download Control object
	 */
	static DownloadControl(link, label) {
		return new Download({ link:link, label:label });
	}
	
	/**
	 * Creates a new MapsList control that can be added to the map, which
	 * provides a utility to switch between map styles.
	 * @param {object} maps Dictionary containing a collection of maps
	 * Example:
	 * {
	 * 		mapa: {
	 * 			id: "mapa",
	 * 			style: "map style url",
	 * 			title: "Map A"
	 * 		},
	 * 		...
	 * }
	 * @param {string} label The label text to be shown as the header of the maps list control
	 * @returns {object} MapsList control object
	 */
	static MapsListControl(maps, label) {
		return new MapsList({ maps:maps, label:label });
	}
	
	/**
	 * Builds a Maps Menu Control
	 * @param {object} maps A collection of keys containing the details on each map 
	 * @param {string} label The label to be shown next to the maps select menu
	 * @returns MapsMenu object
	 */
	static MapsMenuControl(maps, label) {
		return new MapsMenu({ maps:maps, label:label });
	}
	
	/**
	 * Creates a new Bookmarks control that can be added to a map.
	 * The control provides an easy way to navigate the map to predefined
	 * locations.
	 * @param {array} items List of bookmarked location, which includes the
	 * bookmarked location's extent and a label.
	 * Example: 
	 * [
	 * 		{
	 * 			extent: [[-75, 50],[-74, 52]],
	 * 			label: "Location 1"
	 * 		},
	 * 		...,
	 * 		{
	 * 			extent: [[20, 35],[22,36]],
	 * 			label: "Location N"
	 * 		}
	 * ] 
	 * @param {string} label The label text to be shown as the header of the bookmarks control
	 * @param {string} description The description text to be shown at the bottom of the bookmarks control
	 * @returns {object} Bookmarks control object
	 */
	static BookmarksControl(items, label, description) {
		return new Bookmarks({ items:items, label:label, description:description });
	}
	
	static MenuControl(items) {
		return new Menu({ items:items });
	}
	
	/**
	 * Creates a new Search control to add to the application. When a user
	 * selects a search item, the map zooms to that defined location.
	 * @param {array} items A list of search items that can be selected.
	 * Example:
	 * [
	 * 		{
	 * 			extent: [[33,63],[40,65]],
	 * 			id: "12345",
	 * 			label: "Foo Bar (12345)",
	 * 			name: "Foo Bar"
	 * 		},
	 * 		...
	 * ]
	 * @param {string} placeholder The placeholder text shown in the search
	 * input field. 
	 * @param {string} title The title text that's shown when hovering over 
	 * the control.
	 * @returns {object} Search control object
	 */
	static SearchControl(items, placeholder, title) {
		return new Search({ items:items, placeholder:placeholder, title:title });
	}

	/**
	 * Creates a container, which contains a collection of map controls.
	 * @param {object} controls A collection of map controls
	 * Example: 
	 * {
	 * 		opacity: Factory.OpacityControl(1),
	 * 		...
	 * }
	 * @returns {object} Group control object
	 */
	static Group(controls) {
		return new Group({ controls:controls });
	}
	
	/**
	 * Creates a collapsable group container that contains a collection of controls.
	 * @param {object} controls A collection of map controls
	 * Example: 
	 * {
	 * 		opacity: Factory.OpacityControl(1),
	 * 		...
	 * }
	 * @param {string} summaryLabel Text label for collapsable group
	 * @returns {object} Collapsable group control object
	 */
	 static CollapsableGroup(controls, summaryLabel) {
		return new CollapsableGroup(
			{
				controls: controls, 
				summary: summaryLabel
			}
		);
	}
	
	/**
	 * Create a Labels Toggle Control
	 * @param {object} map Web-Mapping-Components Map Object
	 * @param {string} label Control label
	 * @returns A new Labels Toggle control
	 */
	static LabelsToggleControl(map, label) {
		return new LabelsToggle({ map: map, label : label });
	}
}

/**
 * Other class
 * @class
 */
class Other {
	
	static Polish(json, exp, d) {
		// exp is formatted as follows [symbol, property 1, property 2]
		var v1 = json[exp[1]];
		var v2 = json[exp[2]];
		
		var v = null;
		
		if (exp[0] == "+") v = v1 + v2;
		if (exp[0] == "-") v = v1 - v2;
		if (exp[0] == "*") v = v1 * v2;
		if (exp[0] == "/") v = v1 / v2;
		
		return v.toFixed(d);
	}
	
	static HTMLize(json, fields, na) {
        var html = "";
		
		fields.forEach(function(f) {
			var label = f.label;
			var inner = Core.Nls("Gen_Label_Field", [label, json[f.id]]);
			
            html += `<li tabIndex=0><label>${inner}</label></li>`;
		}); 
        
		return `<ul class='popup-inner'>${html}</ul>`;
    }
	
	static LookupProvince(abbr, locale) {
		abbr = abbr.trim();	// Hidden whitespace character at the end, weird.
		
		if (abbr == 'nl') return locale == "en" ? "Newfoundland and Labrador" : "Terre-Neuve-et-Labrador";
		if (abbr == 'pe') return locale == "en" ? "Prince Edward Island" : "Île-du-Prince-Édouard";
		if (abbr == 'ns') return locale == "en" ? "Nova Scotia" : "Nouvelle-Écosse";
		if (abbr == 'nb') return locale == "en" ? "New Brunswick" : "Nouveau-Brunswick";
		if (abbr == 'qc') return locale == "en" ? "Quebec" : "Québec";
		if (abbr == 'on') return locale == "en" ? "Ontario" : "Ontario";
		if (abbr == 'mb') return locale == "en" ? "Manitoba" : "Manitoba";
		if (abbr == 'sk') return locale == "en" ? "Saskatchewan" : "Saskatchewan";
		if (abbr == 'ab') return locale == "en" ? "Alberta" : "Alberta";
		if (abbr == 'bc') return locale == "en" ? "British Columbia" : "Colombie-Britannique";
		if (abbr == 'yt') return locale == "en" ? "Yukon" : "Yukon";
		if (abbr == 'nt') return locale == "en" ? "Northwest Territories" : "Territoires du Nord-Ouest";
		if (abbr == 'nu') return locale == "en" ? "Nunavut" : "Nunavut";
	}
}

export { Bookmarks, CollapsableGroup, Control, Core, Dom, Download, Evented, Factory, Fullscreen, Group, LabelsToggle, Legend, Map, MapsList, MapsMenu, Menu, Navigation, Net, Opacity, Other, Popup, Search, Store, Templated, Theme, ThemeDatalist, Toc, Tooltip, typeahead as Typeahead, Util };
