window.Engine7 = (function() {
    'use strict';

    function isNull(str) {
        return str === null || str === "" || str === undefined;
    }

    function getArrayIndex(arr,e) {
        for(var i=0; i<arr.length; i++){
            if(arr[i] == e){
                return i;
            }
        }
        return -1;
    }

    function encodeJSON(json){
        for (var key in json) {
            json[key] = encodeURIComponent(json[key]);
        }
        return json;
    }

    function randomString(len) {
      len = len || 8;
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var maxPos = chars.length;
      var pwd = '';
      for (var i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
      }
      return pwd;
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
        var ATTR_AJAX_FORM = "data-ajax-form";

        this.requests = {};
        this.templates = {};
        this.forms = {};
        this.tasks = 0;
        this.completeCB = null;
        this.events = {
            beforeInvoke : {},
            afterInvoke : {},
            beforeRender : {},
            afterRender : {},
            invokeError : {},
            beforeSubmit : {},
            submitBack : {},
            submitError : {}
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
            this.onBeforeInvoke = null;
            this.onAfterInvoke = null;
            this.onInvokeError = null;

            this.handleSuccess = function(data, status){
                if(!isNull(req.onAfterInvoke)){
                    req.onAfterInvoke(data, status, req);
                }
                data.$context = req.context;
                if(!isNull(req.tpl)){
                    req.tpl.render(data, req.dom);
                }
            };
            this.handleError = function (xhr, status, error) {
                if(!isNull(req.onInvokeError)){
                    req.onInvokeError(xhr, status, error, req);
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
                        throw new Error("Can not parse params to JSON. ["+ req.url + "].");
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

                if(!isNull(req.onBeforeInvoke)){
                  req.onBeforeInvoke(options, req);
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
                if(isNull(id)){
                    req.id = "req-" + randomString();
                }
                req.url = $(element).attr(ATTR_URL);
                req.params = $(element).attr(ATTR_PARAMS);
                req.dom = $(element);

                if(engine.events.beforeInvoke["*"] || engine.events.beforeInvoke[req.id]){
                    req.onBeforeInvoke = engine.events.beforeInvoke;
                }
                if(engine.events.afterInvoke["*"] || engine.events.afterInvoke[req.id]){
                    req.onAfterInvoke = engine.events.afterInvoke;
                }
                if(engine.events.invokeError["*"] || engine.events.invokeError[req.id]){
                    req.onInvokeError = engine.events.invokeError;
                }

            };
            this.init();
        }

        function Template(element){
            var tpl = this;

            this.id = null;
            this.src = null;
            this.onBeforeRender = null;
            this.onAfterRender = null;

            this.render = function (context, dom) {

                var srcTemplate = Template7.compile(tpl.src);

                if(!isNull(tpl.onBeforeRender)){
                  tpl.onBeforeRender(context,tpl);
                }

                var html = srcTemplate(context);
                var els = $(html);
                dom.append(els);

                if(!isNull(tpl.onAfterRender)){
                  tpl.onAfterRender(els,tpl);
                }

                var reqdoms = els.filter("[" + ATTR_URL + "]");
                reqdoms.each(function () {
                    var req = new Request(this);
                    req.context = context;
                    req.invoke();
                    engine.requests[req.id] = req;
                });

                if(engine.tasks === 1 && reqdoms.length === 0){
                    engine.completeCB();
                }

            };
            this.init = function(){
                tpl.id = $(element).attr("id");
                tpl.src = $(element).html();
                if(isNull(tpl.id)){
                    throw new Error("ID is required on template.");
                }

                if(engine.events.beforeRender["*"] || engine.events.beforeRender[tpl.id]){
                    tpl.onBeforeRender = engine.events.beforeRender;
                }
                if(engine.events.afterRender["*"] || engine.events.afterRender[tpl.id]){
                    tpl.onAfterRender = engine.events.afterRender;
                }
            };
            this.init();
        }

        function Form(element) {
            var form = this;
            var INPUT_TYPE = ["text","hidden","password","checkbox","radio"];

            this.id = null;
            this.action = null;
            this.method = "GET";
            this.elements = [];
            this.onBeforeSubmit = null;
            this.onSubmitBack = null;
            this.onSubmitError = null;

            this.putElJSON = function (json, name, value) {
                var arr = name.split(/\./);
                while(arr.length > 1){
                    var node = arr.shift();
                    if(!json[node]){
                        json[node] = {};
                    }
                    json = json[node];
                }
                var last = arr[arr.length - 1];
                if(json[last]){
                    var tmp = [json[last]];
                    tmp.push(value);
                    json[last] = tmp;
                }else{
                    json[last] = value;
                }
            };

            this.toJSON = function () {
                var json = {};
                    for(var i=0; i<form.elements.length; i++){
                    var el = form.elements[i];
                    var tag = el.tagName;
                    var type = $(el).attr("type");
                    var name = $(el).attr("name");
                    var val = $(el).val();
                    if(tag === "INPUT" && (type === "checkbox" || type === "radio")){
                        if(!$(el).is(':checked')) {
                            continue;
                        }
                    }
                    form.putElJSON(json, name, val);
                }
                return json;
            };
            this.handleSuccess = function(data, status){
                if(!isNull(form.onSubmitBack)){
                  form.onSubmitBack(data, status, form);
                }
            };
            this.handleError = function (xhr, status, error) {
                if(!isNull(form.onSubmitError)){
                  form.onSubmitError(xhr, status, error, form);
                }else{
                    console.error(error);
                    throw new Error("Error occurs when submit form [" + form.id + "]");
                }

            };
            this.submit = function () {
                var json = form.toJSON();
                if(!isNull(form.onBeforeSubmit)){
                  form.onBeforeSubmit(json, form);
                }

                var options = {
                    url : form.action,
                    type : form.method,
                    dataType: "json",
                    data : json,
                    success : form.handleSuccess,
                    error : form.handleError
                };

                $.ajax(options).done(function(){
                    $(element).find("input[type='submit']").removeAttr("disabled");
                });
            };
            this.init = function () {
                form.id = $(element).attr("id");
                form.action = $(element).attr("action");

                if(isNull(form.id)){
                    form.id = "form-" + randomString();
                }
                if(isNull(form.action)){
                    throw new Error("Action is required on data-ajax-form.");
                }
                var method = $(element).attr("method");
                if(!isNull(method)){
                    form.method = method;
                }
                $(element).find("input,textarea,select").each(function () {
                    var name = $(this).attr("name");
                    var type = $(this).attr("type");
                    var tag = this.tagName;
                    if(!isNull(name)){
                        if(tag === "INPUT" && getArrayIndex(INPUT_TYPE, type) < 0){//Not supported
                            return true;
                        }
                        form.elements.push(this);
                    }
                });
                $(element).submit(function () {
                    $(element).find("input[type='submit']").attr("disabled","disabled");
                    form.submit();
                    return false;
                });

                if(engine.events.beforeSubmit["*"] || engine.events.beforeSubmit[form.id]){
                    form.onBeforeSubmit = engine.events.beforeSubmit;
                }
                if(engine.events.submitBack["*"] || engine.events.submitBack[form.id]){
                    form.onSubmitBack = engine.events.submitBack;
                }
                if(engine.events.submitError["*"] || engine.events.submitError[form.id]){
                    form.onSubmitError = engine.events.submitError;
                }
            };
            this.init();
        }

        this._invokeAll = function(){
            var count = 0;
            for(var key in engine.requests){
              var req = engine.requests[key];
              req.invoke();
              count ++;
            }
            if(count === 0){
                engine.completeCB();
            }
        };

        this.complete = function(cb){
            engine._init();
            engine.completeCB = function () {
                engine._initForms();
                if(cb){
                    cb();
                }
            };
            engine._invokeAll();
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

        this.onInvokeError = function(reqId, cb){
            engine.events.invokeError[reqId] = cb;
        };

        this.onBeforeSubmit = function (formId, cb) {
            engine.events.beforeSubmit[formId] = cb;
        };

        this.onSubmitBack = function (formId, cb) {
            engine.events.submitBack[formId] = cb;
        };

        this.onSubmitError = function (formId, cb) {
            engine.events.submitError[formId] = cb;
        };

        this._init = function(){
            $("script[type='" + ATTR_TEMPLATE7 + "']").each(function() {
                var template = new Template(this);
                engine.templates[template.id] = template;
            });

            $("[" + ATTR_URL + "]").each(function() {
                var request = new Request(this);
                engine.requests[request.id] = request;
            });
        };

        this._initForms = function () {
            $("[" + ATTR_AJAX_FORM + "]").each(function() {
                var form = new Form(this);
                engine.forms[form.id] = form;
            });
        };

    }

    var e7 = new Engine7();
    return e7;

})();
