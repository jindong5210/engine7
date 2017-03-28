Engine7
=========

JavaScript template engine based on Template7 with syntax similar to Handlebars. 
* render a template with JSON API.
* nested template supported.
* Rich event supported.

## Getting Started

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
* Run in html

```
<div data-tpl-id="tmpl-user" data-api-url="data/user.json"></div>
```


## Reference 

### Attributes

* [data-tpl-id]("#")
* [data-tpl-ref]("#")
* [data-api-url]("#")
* [data-api-method]("#")
* [data-api-param]("#")


### Events

 * [onBeforeRender]("#")
 * [onAfterRender]("#")
 * [onBeforeSubmit]("#")
 * [onAfterSubmit]("#")


### Methods

 * [ready]("#")
 * [invokeAll]("#")

