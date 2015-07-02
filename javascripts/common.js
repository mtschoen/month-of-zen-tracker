function Elm(type, attributes, children, properties){		//Short for "Element"
	//Create element of type "type"
	var el = document.createElement(type);
	//Set any attributes given by the attributes object
	for(var option in attributes)
		el.setAttribute(option, attributes[option]);
	//Add children from children array.  If the child is text, add it as a text node
	for(var child in children){
		if(typeof(children[child]) == "object")
			el.appendChild(children[child]);
		else
			el.appendChild(document.createTextNode(children[child]));
	}
	//Add any extra properties supplied
	for(var prop in properties){
		el[prop] = properties[prop];
	}
	return el;
}
function TextNode(text){ return document.createTextNode(text); }
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
function Div(attributes, children, properties){
	return Elm("div", attributes, children, properties);
}
function Form(attributes, children, properties){
	return Elm("form", attributes, children, properties);
}
function Input(attributes, children, properties){
	return Elm("input", attributes, children, properties);
}
function Select(attributes, children, properties){
	return Elm("select", attributes, children, properties);
}
//HACK: ho boy. I renamed Option because of an MCE that I never used.... damn it.
function Option(attributes, children, properties){
	return Elm("option", attributes, children, properties);
}
function ELM_Option(attributes, children, properties){
	return Elm("option", attributes, children, properties);
}
function Span(attributes, children, properties){
	return Elm("span", attributes, children, properties);
}
function Img(attributes, children, properties){
	return Elm("img", attributes, children, properties);
}
function Input(attributes, children, properties){
	return Elm("input", attributes, children, properties);
}
function Table(attributes, children, properties){
	return Elm("table", attributes, children, properties);
}
function Tr(attributes, children, properties){
	return Elm("tr", attributes, children, properties);
}
function Td(attributes, children, properties){
	return Elm("td", attributes, children, properties);
}
function H1(attributes, children, properties){
	return Elm("h1", attributes, children, properties);
}
function H2(attributes, children, properties){
	return Elm("h2", attributes, children, properties);
}
function H3(attributes, children, properties){
	return Elm("h3", attributes, children, properties);
}
function A(attributes, children, properties){
	return Elm("a", attributes, children, properties);
}
function Br(){
	return Elm("br");
}