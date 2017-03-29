Engine7
=========

JavaScript template engine based on Template7 with syntax similar to Handlebars. 
* Render a template with JSON API.
* Nested template supported.
* AJAX form submit supported.
* Template7 helper extension.

## Getting Started

* Required [jQuery](http://jquery.com/) and [Template7](http://www.idangero.us/template7/)

* Installation
```
<!DOCTYPE html>
<html lang="en">
<head>
<script type="text/javascript" src="/bower_components/jquery/dist/jquery.min.js"></script>
<script type="text/javascript" src="/bower_components/Template7/dist/template7.min.js"></script>
</head>
<body>
<script type="text/javascript" src="/src/engine7.js"></script>
</body>
</html>
```

* Define templates
```
<script type="text/template7" id="tmpl-skills">
    <table border="1">
        <tr>
            <th>ID</th><th>Name</th>
        </tr>
        {{#each this}}
        <tr>
            <td>{{this.id}}</td><td>{{this.name}}</td>
        </tr>
        {{/each}}
    </table>
</script>
```
```
<script type="text/template7" id="tmpl-user">
    <h3>Name : {{this.name}}</h3>
    <h3>Age : {{this.age}}</h3>
    <h3>Address : {{this.address}}</h3>
    <div data-tpl-id="tmpl-skills" data-api-url="data/skill.json?id={{this.id}}" data-api-param="{'name' : '{{this.name}}'}"></div>
</script>
```

* Define JSON APIs
```
{
	"id" : 1,
	"name" : "Jeffrey",
	"age" : 33,
	"address" : "Dalian Software Park, China",
	"mail" : "jindong05@126.com"
}
```
```
[
	{
		"id" : 1,
		"name" : "javascript"
	},
	{
		"id" : 2,
		"name" : "java"
	}
]
```
* Render in html

```
<div data-tpl-id="tmpl-user" data-api-url="data/user.json"></div>
```


## Reference 

### Attributes

* #### data-tpl-id   
    Define a template. Always be used on a script tag.
   
    ```
    <script type="text/template7" id="tmpl-test">
    ```

* #### data-tpl-ref  
    Auto generated by engine7.

* #### data-api-url  
    Define a JSON API URL.  
    Supported by Template7 expressions.
    
    ```
     <div data-tpl-id="tmpl-user-all" data-api-url="data/test.json?id={{this.id}}"></div>
    ```

* #### data-api-method  
    Define a JSON API METHOD. (POST/GET)
    
    ```
     <div data-tpl-id="tmpl-user-all" data-api-url="data/test.json" data-api-method="POST"></div>
     ```

* #### data-api-param  
    Define API parameters.   
    Requires JSON formats And Supported by Template7 expressions.
    
    ```
    <div data-tpl-id="tmpl-user-all" data-api-url="data/test.json" data-api-param="{'id': '{{this.id}}'}"></div>
    ```

* #### data-ajax-form
    Define a AJAX form. Always be used on a form tag.    
    The form will be submitted with AJAX.
    The form elements will be converted to JSON.
    
    ```
    <form id="form" data-ajax-form action="data/user.json">
    <input name="name" type="text" value="1">
    <input name="name" type="text" value="2">
    <input name="user.test.ckbox" type="checkbox" value="a" checked>
    <input name="user.test.ckbox" type="checkbox" value="b" checked>
    </form>
    ```
    
    The elements of form above will be converted to JSON below before form submitted. 
    ```
    {
        "name" : ["1","2"],
        "user" : {
            test : {
                ckbox : ["a","b"]
            }
        }
    }
    ```

### Methods

 * #### complete
    The startup method of Engine7.
    ```
    Engine7.complete(function(){
    	...
    });
    ```
    
 * #### onBeforeRender
    Before render a template.
    
 * #### onAfterRender
    After render a template.
    
 * #### onBeforeInvoke
    Before invoke a API.
    
 * #### onAfterInvoke
    After invoke a API.
 
 * #### onInvokeError
    Invoke API error.
    
 * #### onBeforeSubmit
    Before form submit.
    
 * #### onSubmitBack
    After form submit.
 
 * #### onSubmitError
    Submit error.
 
### Variables

* #### $context

    Parent data pointer.   
    The example below , "$context.$context" equals the data of 'tmpl-user' . 

```
<script type="text/template7" id="tmpl-test">
    <div>{{$context.$context.name}}</div>
    ...
```

```
<script type="text/template7" id="tmpl-hobby">
    <div data-tpl-id="tmpl-test" data-api-url="data/user.json"></div>
    ...
```

```
<script type="text/template7" id="tmpl-user">
    <div data-tpl-id="tmpl-hobby" data-api-url="data/hobby.json"></div>
    ...
```

```
<div data-tpl-id="tmpl-user" data-api-url="data/user.json"></div>
```

### Helpers