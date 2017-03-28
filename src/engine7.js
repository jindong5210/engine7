window.Engine7 = (function() {
    'use strict';

    function isNull(str) {
        return str === null || str === "" || str === undefined;
    }

    function ajax(url, method, params, successCB, errorCB) {
        return $.ajax({
            url : url,
            type : method,
            dataType: "json",
            data: params,
            success : successCB,
            error : errorCB
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

        var ATTR_TPL_ID = "data-tpl-id";
        var ATTR_URL = "data-api-url";
        var ATTR_METHOD = "data-api-method";
        var ATTR_PARAMS = "data-api-param";
        var ATTR_CACHED = "data-api-cached";
        var ATTR_REF = "data-tpl-ref";

        function Request(element){
            var req = this;
            this.url;
            this.params;
            this.method = "GET";
            this.tpl;
            this.dom;
            this.context = {};
            this.invoke = function(){

                var urlTemplate = Template7.compile(req.url);
                var url = urlTemplate(req.context);
                var params = {};
                if(!isNull(req.params)){
                    var paramsTemplate = Template7.compile(req.params);
                    params = paramsTemplate(req.context);
                    try {
                        params = eval("(" + params + ")");
                    } catch (e) {
                        console.error(e);
                        throw new Error("Can not parse params to JSON. ["+ req.id + "].");
                    }
                    if(req.method == "GET"){
                        params = encodeJSON(params);
                    }
                }

                ajax(url, req.method, params,
                    function(data, status){
                        data.$context = req.context;
                        if(!isNull(req.tpl)){
                            req.tpl.render(data, req.dom);
                        }
                    },
                    function (xhr, status, error) {
                        console.error(error);
                        throw new Error("Error occurs when invoking request [" + url + "]");

                    }
                )
            }
            this.init = function(){
                var tplId = $(element).attr(ATTR_TPL_ID);
                var method = $(element).attr(ATTR_METHOD);
                if(!isNull(tplId)){
                    req.tpl = engine.templates[tplId];
                    if(isNull(req.tpl)){
                        throw new Error("Undefined template [" + tplId + "].")
                    }
                    $(element).attr(ATTR_REF,tplId);
                }
                if(!isNull(method)){
                    req.method = method;
                }
                req.url = $(element).attr(ATTR_URL);
                req.params = $(element).attr(ATTR_PARAMS);
                req.dom = $(element);

            }
            this.init();
        }

        function Template(element){
            var tpl = this;
            this.id;
            this.src;
            this.requests = [];
            this.render = function (context, dom) {
                var srcTemplate = Template7.compile(tpl.src);
                var html = srcTemplate(context);
                var els = $(html);
                var reqdoms = els.filter("[" + ATTR_URL + "]");
                dom.append(els);

                for(var i = 0; i < tpl.requests.length; i++){
                    tpl.requests[i].context = context;
                    tpl.requests[i].dom = $(reqdoms[i]);
                    tpl.requests[i].invoke();
                }

            }
            this.init = function(){
                tpl.id = $(element).attr("id");
                tpl.src = $(element).html();
                if(isNull(tpl.id)){
                    throw new Error("ID is undefined in template.");
                }
                $(tpl.src).filter("[" + ATTR_URL + "]").each(function () {
                    var req = new Request(this);
                    tpl.requests.push(req);
                })
            }
            this.init();
        }


        this.requests = [];
        this.templates = {};
        this.invokeAll = function(){
            for(var i = 0;i < engine.requests.length; i++){
                var req = engine.requests[i];
                req.invoke();
            }
        }

        this._initTemplates = function(){
            var ATTR_TEMPLATE7 = "text/template7";

            $("script[type='" + ATTR_TEMPLATE7 + "']").each(function(i) {
                var template = new Template(this);
                engine.templates[template.id] = template;
            });

        }
        this._initRequests = function(){

            $("[" + ATTR_URL + "]").each(function() {
                var request = new Request(this);
                engine.requests.push(request);
            })

        }
        this._initTemplates();
        this._initRequests();
        this.invokeAll();
    }

    var e7 = new Engine7();
    return e7;

})();
