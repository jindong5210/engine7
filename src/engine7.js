window.Engine7 = (function() {
    'use strict';

    function isNull(str) {
        return str === null || str === "" || str === undefined;
    }

    function encodeJSON(json){
        for (var key in json) {
            json[key] = encodeURIComponent(json[key]);
        }
        return json;
    }


    function Engine7(){
        var engine = this;

        var ATTR_TEMPLATE7 = "text/template7";
        var ATTR_ID = "id";
        var ATTR_TPL_ID = "data-tpl-id";
        var ATTR_URL = "data-api-url";
        var ATTR_METHOD = "data-api-method";
        var ATTR_PARAMS = "data-api-param";
        var ATTR_REF = "data-tpl-ref";

        this.requests = [];
        this.templates = {};
        this.tasks = 0;
        this.complete = null;
        this.events = {
            beforeInvoke : {},
            afterInvoke : {},
            beforeRender : {},
            afterRender : {},
            error : {}
        };

        function Request(element){
            var req = this;
            this.id = null;
            this.url = null;
            this.params = null;
            this.method = "GET";
            this.tpl = null;
            this.dom = null;
            this.context = {};
            this.handleSuccess = function(data, status){
                if(!isNull(req.id)){
                    var afterInvokeEventCB = engine.events.afterInvoke[req.id];
                    if(!isNull(afterInvokeEventCB)){
                        afterInvokeEventCB(data, status, req);
                    }
                }
                data.$context = req.context;
                if(!isNull(req.tpl)){
                    req.tpl.render(data, req.dom);
                }
            };
            this.handleError = function (xhr, status, error) {
                if(!isNull(req.id) && !isNull(engine.events.error[req.id])){
                    var errorEventCB = engine.events.error[req.id];
                    if(!isNull(errorEventCB)){
                        errorEventCB(xhr, status, error, req);
                    }
                }else{
                    console.error(error);
                    throw new Error("Error occurs when invoking request [" + req.url + "]");
                }

            };
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
                var options = {
                    url : url,
                    type : req.method,
                    dataType: "json",
                    data : params,
                    success : req.handleSuccess,
                    error : req.handleError
                };
                if(!isNull(req.id)){
                    var beforeInvokeEventCB = engine.events.beforeInvoke[req.id];
                    if(!isNull(beforeInvokeEventCB)){
                        beforeInvokeEventCB(options, req);
                    }
                }

                $.ajax(options).done(function(){
                    engine.tasks--;
                });
                engine.tasks ++;
            };
            this.init = function(){
                var tplId = $(element).attr(ATTR_TPL_ID);
                var method = $(element).attr(ATTR_METHOD);
                var id = $(element).attr(ATTR_ID);
                if(!isNull(tplId)){
                    req.tpl = engine.templates[tplId];
                    if(isNull(req.tpl)){
                        throw new Error("Undefined template [" + tplId + "].");
                    }
                    $(element).attr(ATTR_REF,tplId);
                }
                if(!isNull(method)){
                    req.method = method;
                }
                if(!isNull(id)){
                    req.id = id;
                }
                req.url = $(element).attr(ATTR_URL);
                req.params = $(element).attr(ATTR_PARAMS);
                req.dom = $(element);

            };
            this.init();
        }

        function Template(element){
            var tpl = this;
            this.id = null;
            this.src = null;


            this.render = function (context, dom) {

                var srcTemplate = Template7.compile(tpl.src);

                var beforeRenderEventCB = engine.events.beforeRender[tpl.id];
                if(!isNull(beforeRenderEventCB)){
                    beforeRenderEventCB(context,tpl);
                }

                var html = srcTemplate(context);
                var els = $(html);
                dom.append(els);

                var afterRenderEventCB = engine.events.afterRender[tpl.id];
                if(!isNull(afterRenderEventCB)){
                    afterRenderEventCB(els,tpl);
                }

                var reqdoms = els.filter("[" + ATTR_URL + "]");
                reqdoms.each(function () {
                    var req = new Request(this);
                    req.context = context;
                    req.invoke();
                });

                if(engine.tasks === 1 && reqdoms.length === 0){
                    engine.complete();
                }

            };
            this.init = function(){
                tpl.id = $(element).attr("id");
                tpl.src = $(element).html();
                if(isNull(tpl.id)){
                    throw new Error("ID is undefined in template.");
                }
            };
            this.init();
        }

        this.invokeAll = function(){
            for(var i = 0;i < engine.requests.length; i++){
                var req = engine.requests[i];
                req.invoke();
            }
        };

        this.complete = function(cb){
            engine.invokeAll();
            engine.complete = cb;
        };

        this.onBeforeRender = function(tplId, cb){
            engine.events.beforeRender[tplId] = cb;
        };

        this.onAfterRender = function(tplId, cb){
            engine.events.afterRender[tplId] = cb;
        };

        this.onBeforeInvoke = function(reqId, cb){
            engine.events.beforeInvoke[reqId] = cb;
        };

        this.onAfterInvoke = function(reqId, cb){
            engine.events.afterInvoke[reqId] = cb;
        };

        this.onError = function(reqId, cb){
            engine.events.error[reqId] = cb;
        };

        this._init = function(){

            $("script[type='" + ATTR_TEMPLATE7 + "']").each(function(i) {
                var template = new Template(this);
                engine.templates[template.id] = template;
            });

            $("[" + ATTR_URL + "]").each(function() {
                var request = new Request(this);
                engine.requests.push(request);
            });
        };

        this._init();

    }

    var e7 = new Engine7();
    return e7;

})();
