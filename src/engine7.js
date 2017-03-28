window.Engine7 = (function() {
	'use strict';
	
	function isNull(str) {
		return str === null || str === "" || str === undefined;
	}

	function ajax(url, method, params) {
		return $.ajax({
			url : url,
			type : method,
			dataType: "json",
			data: params
		})
	}
	
	function getFromTree(tmpls,id){
		for (var key in tmpls) {
			var tmpl = tmpls[key];
			if(tmpl.id == id){
				return tmpl;
			}else{
				return getFromTree(tmpl.children,id);
			}
		}
	}
	
	function getTreeList(tmpls){
		var tree = {};
		for (var key in tmpls) {
			var tmpl = tmpls[key];
			if(tmpl.parent != null){
				var parent = tmpls[tmpl.parent];
				parent.children.push(tmpl);
			}else{
				tree[key] = tmpl;
			}
		}
		return tree;
	}
	
	
	function encodeJSON(json){
		for (var key in json) {
			json[key] = encodeURIComponent(json[key]);
		}
		return json;
	}

	function Engine7(){
		var engine = this;
		this.templates = {};
		this.renderAll = function(){
			for (var key in engine.templates) {
				var tmpl = engine.templates[key];
				tmpl.render()
			}
		}
		this.getTemplate = function(id){
			return getFromTree(engine.templates, id);
		}
		this.render = function(id){
			var tmpl = engine.getTemplate(id);
			tmpl.render();
		}
		this._init = function(){
			var ATTR_ID = "data-tmpl-id";
			var ATTR_URL = "data-tmpl-url";
			var ATTR_METHOD = "data-tmpl-method";
			var ATTR_PARAMS = "data-tmpl-param";
			$("[" + ATTR_ID + "]").each(function() {
				var _each = this;
				var id = $(this).attr(ATTR_ID);
				var url = $(this).attr(ATTR_URL);
				var method = $(this).attr(ATTR_METHOD);
				var params = $(this).attr(ATTR_PARAMS);
				var parent = $(this).parents("[" + ATTR_ID + "]");
				var src = $(this).html();
				if(isNull(url)){
					throw new Error("URL is undefined in template ["+id+"] ");
				}
				if(parent.length == 0){
					parent = null
				}else{
					parent = parent.attr(ATTR_ID);
				}
				if(isNull(method)){
					method = "GET";
				}
				if(isNull(params)){
					params = null;
				}
				var template = {
					id : id,
					url : url,
					src : src,
					context : {},
					children : [],
					parent : parent,
					method : method,
					params : params,
					render : function(){
						var _this = this;
						var params = {};
						var urlTemplate = Template7.compile(this.url);
						if(this.params != null){
							var paramsTemplate = Template7.compile(this.params);
							params = paramsTemplate(this.context);
							try {
								params = eval("(" + params + ")");
							} catch (e) {
								throw new Error("Can not parse params to JSON in template ["+ this.id + "].");
							}
							if(method == "GET"){
								params = encodeJSON(params);
							}
						}
						var url = urlTemplate(this.context);
						ajax(url, this.method, params).then(function(data){
							data.$parent = _this.context;
							
							console.log(_this.src)
							
							//var src = $(_this.src).find(":not(["+ATTR_ID+"])")
							
							//var srcTemplate = Template7.compile(_this.src);
							//var html = srcTemplate(data);
							for (var i = 0; i < _this.children.length; i++) {
								_this.children[i].context.$parent = data;
								_this.children[i].render();
							}
						})
					}
				}
				engine.templates[id] = template;
			})
			engine.templates = getTreeList(engine.templates);
		}
		this._init();
		this.renderAll();
	}
	
	var e7 = new Engine7();
	return e7;
	
})();
