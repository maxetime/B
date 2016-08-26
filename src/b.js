/**
 * B v.0.0.1
 *
 * A ES6 proxy based data binding library
 */
(function(){
    window.B = function() {
        var _ = this;
        var prefix = 'b-';
        _.listeners = {};
        _.inputType = ['input','textarea'];
        // abort afterprint beforeprint beforeunload blur canplay canplaythrough change click contextmenu copy cuechange cut dblclick DOMContentLoaded drag dragend dragenter dragleave dragover dragstart drop durationchange emptied ended error focus focusin focusout formchange forminput hashchange input invalid keydown keypress keyup load loadeddata loadedmetadata loadstart message mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup mousewheel offline online pagehide pageshow paste pause play playing popstate progress ratechange readystatechange redo reset resize scroll seeked seeking select show stalled storage submit suspend timeupdate undo unload volumechange waiting
        _.events = {
            capture : [
                'focus',
                'blur'
            ],
            bubble : [
                'click',
                'mousedown',
                'input',
                'keydown'
            ]
        };
        _.handler = {
            listeners : [],

            get : function(target, name, receiver){
        		//console.log('get',target,name,target[name]);
                _h = this;
                switch(name){
                    case 'isProxy' : return true;
                    case 'getListeners': return _h.listeners;
                    case 'addListener': return function(func){
                        _h.listeners.push(func);
                    };
                }
        		if(name in target){
        			return target[name];
        		}
        		return undefined;
        	},
        	set : function(target,name,value,receiver){
                _h = this;
                var isObjOrArr = Object.prototype.toString.call(value) == '[object Object]' || Object.prototype.toString.call(value) == '[object Array]';
        		//console.log('set',_h,target,name,value,Object.prototype.toString.call(value));
                if(target[name] !== value){
                    if(isObjOrArr){
                        for(var vi in value){
                			target[name] = new Proxy({},_.handler);
                			target[name][vi] = value[vi];
                		}
                    }
                    target[name] = value;
                    if(isObjOrArr){
                        //_h.listeners.forEach(function(listener){ listener(value, name); });
                    } else {
                        receiver.getListeners.forEach(function(listener){ listener(value,receiver,name); });
                    }
                }
                return true;
        	},
            deleteProperty: function(target, property){
                // TODO : trigger listener
            }
        };
        _.observe = function(v){
            return buildProxyTree(v);
        };
        _.dotFunction = function(x,i){
            return x && x[i];
        };
        _.setDotPath = function(path,value){
            var parts = path.split('.');
            var last = parts.pop();
            parts.reduce(_.dotFunction,window)[last] = value;
        };
        _.getDotPath = function(path, scope){
            var parts = path.split('.');
            var cur = scope;
            if(typeof cur[parts[0]] === 'undefined'){
                cur[parts[0]] = new Proxy({},_.handler);
            }else if(!cur[parts[0]].isProxy && typeof cur[parts[0]] === 'object'){
                cur[parts[0]] = _.buildProxyTree(cur[parts[0]]);
            }
            var last = parts.pop();
            for(var p in parts){
                if(typeof cur[parts[p]] == 'undefined'){
                    cur[parts[p]] = {};
                }
                cur = cur[parts[p]];
            }
            return {
                obj : cur,
                name : last
            };
        };
        _.buildProxyTree = function(obj){
            if(!obj.isProxy && typeof obj === 'object'){
                var newObj = new Proxy(Array.isArray(obj) ? [] : {},_.handler);
                for(var i in obj){
                    newObj[i] = _.buildProxyTree(obj[i]);
                }
                return newObj;
            }
            return obj;
        };
        _.parse = function(ev){
            var type = ev.type;
            //TODO : ev.path doen't exist in FF
            for(var e in ev.path){
                var el = ev.path[e];
                if(typeof el.getAttribute === 'function'){
                    var attr = el.getAttribute(prefix+type);
                    if(attr){
                        var func = attr.split('.').reduce(_.dotFunction, window);
                        if(typeof func === 'function'){
                            func(el,ev);
                        }
                    }
                    if(el.tagName && _.inputType.indexOf(el.tagName.toLowerCase()) != -1 && el.getAttribute(prefix+'model')){
                        _.setDotPath(el.getAttribute(prefix+'model'),el.value);
                    }
                }
            }
        };
        _.setElValue = function(el,value){
            value = value || '';
            if(el.tagName && _.inputType.indexOf(el.tagName.toLowerCase()) != -1){
                el.setAttribute('b-input','');
                el.value = value;
            }else{
                el.innerHTML = value;
            }
        };
        _.forLoop = function(nodeStart,nodeEnd,node,scopeKey,scope){
            var model = node.getAttribute('b-model');
            while(nodeStart.nextSibling != nodeEnd){
                nodeStart.nextSibling.remove();
            }
            if(model.indexOf(scopeKey) === 0){
                for(var fi in scope){
                    var newNode = node.cloneNode();
                    var forModelPath = _.getDotPath(model.substring(scopeKey.length+1) ,scope[fi]);
                    value = forModelPath.obj[forModelPath.name];
                    if(value){
                        _.setElValue(newNode,value);
                    }
                    newNode.removeAttribute('b-for');
                    nodeStart.parentNode.insertBefore(newNode,nodeEnd);
                }
            }
        };
        _.bindTree = function(node, scope, scopeName, type){
            var scopeKey = '';
            var nodeStart = null;
            var nodeEnd = null;
            if(node.nodeType == 1){ // ELEMENT_NODE
                if(node.hasAttribute('b-for')){
                    var expr = node.getAttribute('b-for');
                    nodeStart = document.createComment("b-for "+expr);
                    nodeEnd = document.createComment("end b-for "+expr);
                    var newnode = node.cloneNode(true);
                    node.parentNode.insertBefore(nodeStart,node);
                    node.parentNode.insertBefore(nodeEnd,node.nextSibling);
                    node.remove();
                    node = newnode;
                    type = 'for';
                    var parts = expr.split(' in ');
                    scopeKey = parts[0];
                    var forPath = _.getDotPath(parts[1] ,scope);
                    scope = forPath.obj;
                    scopeName = forPath.name;
                    if(typeof scope[scopeName] === 'undefined'){
                        scope[scopeName] = {};
                    }
                }
                if(node.hasAttribute('b-model')){
                    if(type == 'for'){
                        _.forLoop(nodeStart,nodeEnd,node,scopeKey,scope[scopeName]);
                        scope[scopeName].addListener(function (newValue,receiver,name){
                            _.forLoop(nodeStart,nodeEnd,node,scopeKey,scope[scopeName]);
                        });
                    }else{
                        var model = node.getAttribute('b-model');
                        var modelPath = _.getDotPath(model, scope);
                        value = modelPath.obj[modelPath.name];
                        if(value){
                            _.setElValue(node,value);
                            modelPath.obj.addListener(function (newValue,receiver,name){
                                if(receiver === modelPath.obj && name == modelPath.name){
                                    _.setElValue(node,newValue);
                                }
                            });
                        }
                    }
                }
                var childNodes = node.childNodes;
                for(var i=0; i<childNodes.length; i++) {
                    _.bindTree(childNodes[i],scope,scopeName,type);
                }
            }
            if(node.nodeType == 3){ // TEXT_NODE
                // parse text ?
            }

        };
        _.bind = function(){
            if(document.body){
                _.bindTree(document.body,window);
            }
            for(var ci in _.events.capture){
                document.addEventListener(_.events.capture[ci],_.parse,true);
            }
            for(var bi in _.events.bubble){
                document.addEventListener(_.events.bubble[bi],_.parse);
            }
        };
        _.bind();
        return {
            observe : _.observe
        };
    }();

})();
