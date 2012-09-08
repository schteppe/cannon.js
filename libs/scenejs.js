/*
 * SceneJS WebGL Scene Graph Library for JavaScript
 * http://scenejs.org/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://scenejs.org/license
  * Copyright 2010, Lindsay Kay
 *
 * Includes WebGLTrace
 * Various functions for helping debug WebGL apps.
 * http://github.com/jackpal/webgltrace
 * Copyright (c) 2009 The Chromium Authors. All rights reserved.
 *
 * Includes WebGL-Debug
 * Various functions for helping debug WebGL apps.
 * http://khronos.org/webgl/wiki/Debugging
 * Copyright (c) 2009 The Chromium Authors. All rights reserved. 
 */
/** Generic map of IDs to items - can generate own IDs or accept given IDs.
 * Given IDs should be strings in order to not clash with internally generated IDs, which are numbers.
 */
var SceneJS_Map = function() {
    this.items = [];
    this.lastUniqueId = 0;

    this.addItem = function() {
        var item;
        if (arguments.length == 2) {
            var id = arguments[0];
            item = arguments[1];
            if (this.items[id]) { // Won't happen if given ID is string
                throw SceneJS_errorModule.fatalError(SceneJS.errors.ID_CLASH, "ID clash: '" + id + "'");
            }
            this.items[id] = item;
            return id;
        } else {
            while (true) {
                item = arguments[0];
                var findId = this.lastUniqueId++ ;
                if (!this.items[findId]) {
                    this.items[findId] = item;
                    return findId;
                }
            }
        }
    };

    this.removeItem = function(id) {
        this.items[id] = null;
    };
};


/**
 * @class SceneJS
 * SceneJS name space
 * @singleton
 */
var SceneJS = {

    /** Version of this release
     */
    VERSION: '2.0.0',

    /** Names of supported WebGL canvas contexts
     */
    SUPPORTED_WEBGL_CONTEXT_NAMES:["webgl", "experimental-webgl", "webkit-3d", "moz-webgl", "moz-glweb20"],

    /**
     * Node classes
     * @private
     */
    _nodeTypes: {},

    /**
     * Map of existing scene nodes
     */
    _scenes: {},

    /** Extension point to create a new node type.
     *
     * @param {string} type Name of new subtype
     * @param {string} superType Optional name of super-type - {@link SceneJS_node} by default
     * @return {class} New node class
     */
    createNodeType : function(type, superType) {
        if (!type) {
            throw SceneJS_errorModule.fatalError("createNodeType param 'type' is null or undefined");
        }
        if (typeof type != "string") {
            throw SceneJS_errorModule.fatalError("createNodeType param 'type' should be a string");
        }
        if (this._nodeTypes[type]) {
            throw SceneJS_errorModule.fatalError("createNodeType node of param 'type' already defined: '" + superType + "'");
        }
        var supa = this._nodeTypes[superType];
        if (!supa) {
            supa = SceneJS._Node;
        }
        var nodeType = function() {                  // Create class
            supa.apply(this, arguments);
            this.attr.type = type;
        };
        SceneJS._inherit(nodeType, supa);
        this._nodeTypes[type] = nodeType;
        return nodeType;
    },

    _registerNode : function(type, nodeClass) {
        this._nodeTypes[type] = nodeClass;
    },

    /**
     * Factory function to create a "scene" node
     */
    createScene : function(json) {
        if (!json) {
            throw SceneJS_errorModule.fatalError("createScene param 'json' is null or undefined");
        }
        json.type = "scene";
        if (!json.id) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "createScene 'id' is mandatory for 'scene' node");
        }
        if (this._scenes[json.id]) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "createScene - scene id '" + json.id + "' already taken by another scene");
        }
        var newNode = this._parseNodeJSON(json, undefined); // Scene references itself as the owner scene
        this._scenes[json.id] = newNode;
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.NODE_CREATED, { nodeId : newNode.attr.id, json: json });
        return SceneJS._selectNode(newNode);
    },

    /** Returns true if the "scene" node with the given ID exists
     */
    sceneExists : function(sceneId) {
        return this._scenes[sceneId] ? true : false;
    },

    /** Select a "scene" node
     */
    scene : function(sceneId) {
        var scene = this._scenes[sceneId];
        if (!scene) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "withScene scene not found: '" + sceneId + "'");
        }
        return SceneJS._selectNode(scene);
    },

    _parseNodeJSON : function(json, scene) {
        var newNode = this._createNode(json, scene);
        scene = scene || newNode;
        newNode.scene = scene;
        if (json.nodes) {
            var len = json.nodes.length;
            for (var i = 0; i < len; i++) {
                newNode.addNode(SceneJS._parseNodeJSON(json.nodes[i], scene));
            }
        }
        return newNode;
    },


    _createNode : function(json, scene) {
        json.type = json.type || "node";
        var nodeType;
        if (json.type == "node") {
            nodeType = SceneJS._Node;
        } else {
            nodeType = this._nodeTypes[json.type];
            if (!nodeType) {
                throw SceneJS_errorModule.fatalError("Scene node type not supported in SceneJS " + SceneJS.VERSION + ": '" + json.type + "'");
            }
        }
        return new nodeType(json, scene);
    },

    /**
     * Shallow copy of JSON node configs, filters out JSON-specific properties like "nodes"
     * @private
     */
    _copyCfg : function (cfg) {
        var cfg2 = {};
        for (var key in cfg) {
            if (cfg.hasOwnProperty(key) && key != "nodes") {
                cfg2[key] = cfg[key];
            }
        }
        return cfg2;
    },

    /** Nodes that are scheduled to be destroyed. When a node is destroyed it is added here, then at the end of each
     * render traversal, each node in here is popped and has {@link SceneJS_node#destroy} called.
     *  @private
     */
    _destroyedNodes : [],

    /** Action the scheduled destruction of nodes
     * @private
     */
    _actionNodeDestroys : function() {
        if (this._destroyedNodes.length > 0) {
            var node;
            for (var i = this._destroyedNodes.length - 1; i >= 0; i--) {
                node = this._destroyedNodes[i];
                node._doDestroy();
                SceneJS_eventModule.fireEvent(SceneJS_eventModule.NODE_DESTROYED, { nodeId : node.attr.id });
            }
            this._destroyedNodes = [];
        }
    },

    /*----------------------------------------------------------------------------------------------------------------
     * Messaging System
     *
     *
     *--------------------------------------------------------------------------------------------------------------*/

    Message : new (function() {

        /** Sends a message to SceneJS - docs at http://scenejs.wikispaces.com/SceneJS+Messaging+System
         *
         * @param message
         */
        this.sendMessage = function (message) {
            if (!message) {
                throw SceneJS_errorModule.fatalError("sendMessage param 'message' null or undefined");
            }
            var commandId = message.command;
            if (!commandId) {
                throw SceneJS_errorModule.fatalError("Message element expected: 'command'");
            }
            var commandService = SceneJS.Services.getService(SceneJS.Services.COMMAND_SERVICE_ID);
            var command = commandService.getCommand(commandId);

            if (!command) {
                throw SceneJS_errorModule.fatalError("Message command not supported: '" + commandId + "' - perhaps this command needs to be added to the SceneJS Command Service?");
            }
            var ctx = {};
            command.execute(ctx, message);
        };
    })(),

    /**
     * @private
     */
    _inherit : function(DerivedClassName, BaseClassName) {
        DerivedClassName.prototype = new BaseClassName();
        DerivedClassName.prototype.constructor = DerivedClassName;
    },

    /** Creates a namespace
     * @private
     */
    _namespace : function() {
        var a = arguments, o = null, i, j, d, rt;
        for (i = 0; i < a.length; ++i) {
            d = a[i].split(".");
            rt = d[0];
            eval('if (typeof ' + rt + ' == "undefined"){' + rt + ' = {};} o = ' + rt + ';');
            for (j = 1; j < d.length; ++j) {
                o[d[j]] = o[d[j]] || {};
                o = o[d[j]];
            }
        }
    },

    /**
     * Returns a key for a vacant slot in the given map
     * @private
     */
    // Add a new function that returns a unique map key.
    _last_unique_id: 0,
    _createKeyForMap : function(keyMap, prefix) {
        while (true) {
            var key = prefix ? prefix + SceneJS._last_unique_id++ : SceneJS._last_unique_id++;
            if (!keyMap[key]) {
                return key;
            }
        }
    },

    /** Stolen from GLGE:https://github.com/supereggbert/GLGE/blob/master/glge-compiled.js#L1656
     */
    _createUUID:function() {
        var data = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
        var data2 = ["8","9","A","B"];
        var uuid = [];
        for (var i = 0; i < 38; i++) {
            switch (i) {
                case 8:uuid.push("-");
                    break;
                case 13:uuid.push("-");
                    break;
                case 18:uuid.push("-");
                    break;
                case 14:uuid.push("4");
                    break;
                case 19:uuid.push(data2[Math.round(Math.random() * 3)]);
                    break;
                default:uuid.push(data[Math.round(Math.random() * 15)]);
                    break;
            }
        }
        return uuid.join("");
    },

    _getBaseURL : function(url) {
        var i = url.lastIndexOf("/");
        if (i == 0 || i == -1) {
            return "";
        }
        return url.substr(0, i + 1);
    },

    /**
     * Returns true if object is an array
     * @private
     */
    _isArray : function(testObject) {
        return testObject && !(testObject.propertyIsEnumerable('length'))
                && typeof testObject === 'object' && typeof testObject.length === 'number';
    },

    _shallowClone : function(o) {
        var o2 = {};
        for (var name in o) {
            if (o.hasOwnProperty(name)) {
                o2[name] = o[name];
            }
        }
        return o2;
    } ,

    /** Add properties of o to o2 where undefined or null on o2
     */
    _applyIf : function(o, o2) {
        for (var name in o) {
            if (o.hasOwnProperty(name)) {
                if (o2[name] == undefined || o2[name] == null) {
                    o2[name] = o[name];
                }
            }
        }
        return o2;
    },

    /** Add properties of o to o2, overwriting them on o2 if already there.
     * The optional clear flag causes properties on o2 to be cleared first
     */
    _apply : function(o, o2, clear) {
        var name;
        if (clear) {
            for (name in o2) {
                if (o2.hasOwnProperty(name)) {
                    delete o2[name];
                }
            }
        }
        for (name in o) {
            if (o.hasOwnProperty(name)) {
                o2[name] = o[name];
            }
        }
        return o2;
    },

    /** Lazy-bound state resources published by "suppliers"
     */
    _compilationStates : new (function() {
        var suppliers = {};
        this.setSupplier = function(type, supplier) {
            suppliers[type] = supplier;
        };
        this.getState = function(type, sceneId, id) {
            var s = suppliers[type];
            if (!s) {
                throw SceneJS_errorModule.fatalError("Internal error - Compilation state supplier not found: '" + type + "'");
            }
            return s.get(sceneId, id);
        };
    })()
};
/**
 * @class The basic scene node type
 */
SceneJS._Node = function(cfg, scene) {

    /* Public properties are stored on the _attr map
     */
    this.attr = {};
    this.attr.type = "node";
    this.attr.sid = null;
    this.attr.data = {};

    if (cfg) {
        this.attr.id = cfg.id;
        this.attr.type = cfg.type || "node";
        this.attr.data = cfg.data;
        this.attr.enabled = cfg.enabled === false ? false : true;
        this.attr.sid = cfg.sid;
        this.attr.info = cfg.info;
        this.scene = scene || this;
    }


    /* Child nodes
     */
    this.children = [];
    this.parent = null;
    this.listeners = {};
    this.numListeners = 0; // Useful for quick check whether node observes any events

    /* When compiled, a node increments this each time it discovers that it can cache more state, so that it
     * knows not to recompute that state when next compiled. Since internal state is usually dependent on the
     * states of higher nodes, this is reset whenever the node is attached to a new parent.
     */
    this._compileMemoLevel = 0;

    /* Deregister default ID
     */
    if (this.attr.id) {
        //   SceneJS_sceneNodeMaps.removeItem(this.attr.id);
    }

    /* Register again by whatever ID we now have
     */
    if (this.scene && this.scene.nodeMap) {
        if (this.attr.id) {
            this.scene.nodeMap.addItem(this.attr.id, this);
        } else {
            this.attr.id = this.scene.nodeMap.addItem(this);
        }
    }

    if (cfg) {
        this._createCore(cfg.coreId || cfg.resource);
        this.setTags(cfg.tags || {});
        if (this._init) {
            this._init(cfg);
        }
    }
};

SceneJS._Node.prototype.constructor = SceneJS._Node;

SceneJS._Node.prototype._cores = {};

SceneJS._Node.prototype._createCore = function(coreId) {
    var sceneId = this.scene.attr.id;
    var sceneCores = this._cores[sceneId];
    if (!sceneCores) {
        sceneCores = this._cores[sceneId] = {};
    }
    var nodeCores = sceneCores[this.attr.type];
    if (!nodeCores) {
        nodeCores = sceneCores[this.attr.type] = {};
    }
    if (coreId) {

        /* Attempt to reuse a core
         */
        this.core = nodeCores[coreId];
        if (this.core) {
            this.core._nodeCount++;
        }
    } else {
        coreId = SceneJS._createUUID();
    }
    if (!this.core) {
        this.core = nodeCores[coreId] = {
            _coreId: coreId,
            _nodeCount : 1
        };
    }
//    this.state = new SceneJS_State({
//        core: this.core
//    });
    return this.core;
};

/**
 * Returns the ID of this node's core
 */
SceneJS._Node.prototype.getCoreId = function() {
    return this.core._coreId;
};

/**
 * Backwards compatibility
 */
SceneJS._Node.prototype.getResource = SceneJS._Node.prototype.getCoreId;


SceneJS._Node.prototype._tags = {};

SceneJS._Node.prototype.setTags = function(tags) {

};

/**
 * Dumps anything that was memoized on this node to reduce recompilation work
 */
SceneJS._Node.prototype._resetCompilationMemos = function() {
    this._compileMemoLevel = 0;
};

/**
 * Same as _resetCompilationMemos, also called on sub-nodes
 */
SceneJS._Node.prototype._resetTreeCompilationMemos = function() {
    this._resetCompilationMemos();
    for (var i = 0; i < this.children.length; i++) {
        this.children[i]._resetTreeCompilationMemos();
    }
};

SceneJS._Node.prototype._flagDirty = function() {
    this._compileMemoLevel = 0;
    //    if (this.attr._childStates && this.attr._dirty) {
    //        this._flagDirtyState(this.attr);
    //    }
};

//SceneJS._Node.prototype._flagDirtyState = function(attr) {
//    attr._dirty = true;
//    if (attr._childStates) {
//        for (var i = 0, len = attr._childStates.length; i < len; i++) {
//            if (!attr._childStates[i]._dirty) {
//                this._flagDirtyState(attr._childStates[i]);
//            }
//        }
//    }
//};

/** @private */
SceneJS._Node.prototype._compile = function() {
    this._compileNodes();
};

/** @private
 *
 * Recursively renders a node's child list.
 */
SceneJS._Node.prototype._compileNodes = function() { // Selected children - useful for Selector node

    if (this.listeners["rendered"]) {
        SceneJS_nodeEventsModule.preVisitNode(this);
    }

    var children = this.children;  // Set of child nodes we'll be rendering
    var numChildren = children.length;
    var child;
    var i;

    if (numChildren > 0) {
        for (i = 0; i < numChildren; i++) {
            child = children[i];

            if (SceneJS_compileModule.preVisitNode(child)) {
                child._compile();
            }
            SceneJS_compileModule.postVisitNode(child);
        }
    }
    
    if (this.listeners["rendered"]) {
        SceneJS_nodeEventsModule.postVisitNode(this);
    }
};

//
///**
// * Wraps _compile to fire built-in events either side of rendering.
// * @private */
//SceneJS._Node.prototype._compileWithEvents = function() {
//
//    /* As scene is traversed, SceneJS_sceneStatusModule will track the counts
//     * of nodes that are still initialising
//     *
//     * If we are listening to "loading-status" events on this node, then we'll
//     * get a snapshot of those stats, then report the difference from that
//     * via the event once we have rendered this node.
//     */
////    var loadStatusSnapshot;
////    if (this.listeners["loading-status"]) {
////        loadStatusSnapshot = SceneJS_sceneStatusModule.getStatusSnapshot();
////    }
//    this._compile();
////    if (this.listeners["loading-status"]) { // Report diff of loading stats that occurred while rending this tree
////        this._fireEvent("loading-status", SceneJS_sceneStatusModule.diffStatus(loadStatusSnapshot));
////    }
//
//};

/**
 * Returns the SceneJS-assigned ID of the node.
 * @returns {string} Node's ID
 */
SceneJS._Node.prototype.getID = function() {
    return this.attr.id;
};

/**
 * Alias for {@link #getID()} to assist resolution of the ID by JSON query API
 * @returns {string} Node's ID
 */
SceneJS._Node.prototype.getId = SceneJS._Node.prototype.getID;

/**
 * Returns the type ID of the node. For the Node base class, it is "node",
 * which is overriden in sub-classes.
 * @returns {string} Type ID
 */
SceneJS._Node.prototype.getType = function() {
    return this.attr.type;
};

/**
 * Returns the data object attached to this node.
 * @returns {Object} data object
 */
SceneJS._Node.prototype.getData = function() {
    return this.attr.data;
};

/**
 * Sets a data object on this node.
 * @param {Object} data Data object
 */
SceneJS._Node.prototype.setData = function(data) {
    this.attr.data = data;
    return this;
};

/**
 * Returns the node's optional subidentifier, which must be unique within the scope
 * of the parent node.
 * @returns {string} Node SID
 *  @deprecated
 */
SceneJS._Node.prototype.getSID = function() {
    return this.attr.sid;
};

/** Returns the SceneJS.Scene to which this node belongs.
 * Returns node if this is a SceneJS_scene.
 * @returns {SceneJS.Scene} Scene node
 */
SceneJS._Node.prototype.getScene = function() {
    return this.scene;
};

/**
 * Returns the number of child nodes
 * @returns {int} Number of child nodes
 */
SceneJS._Node.prototype.getNumNodes = function() {
    return this.children.length;
};

/** Returns child nodes
 * @returns {Array} Child nodes
 */
SceneJS._Node.prototype.getNodes = function() {
    var list = new Array(this.children.length);
    var len = this.children.length;
    for (var i = 0; i < len; i++) {
        list[i] = this.children[i];
    }
    return list;
};

/** Returns child node at given index. Returns null if no node at that index.
 * @param {Number} index The child index
 * @returns {Node} Child node, or null if not found
 */
SceneJS._Node.prototype.getNodeAt = function(index) {
    if (index < 0 || index >= this.children.length) {
        return null;
    }
    return this.children[index];
};

/** Returns first child node. Returns null if no child nodes.
 * @returns {Node} First child node, or null if not found
 */
SceneJS._Node.prototype.getFirstNode = function() {
    if (this.children.length == 0) {
        return null;
    }
    return this.children[0];
};

/** Returns last child node. Returns null if no child nodes.
 * @returns {Node} Last child node, or null if not found
 */
SceneJS._Node.prototype.getLastNode = function() {
    if (this.children.length == 0) {
        return null;
    }
    return this.children[this.children.length - 1];
};

/** Returns child node with the given ID.
 * Returns null if no such child node found.
 * @param {String} sid The child's SID
 * @returns {Node} Child node, or null if not found
 */
SceneJS._Node.prototype.getNode = function(id) {
    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].attr.id == id) {
            return this.children[i];
        }
    }
    return null;
};

/** Disconnects the child node at the given index from its parent node
 * @param {int} index Child node index
 * @returns {Node} The disconnected child node if located, else null
 */
SceneJS._Node.prototype.disconnectNodeAt = function(index) {
    var r = this.children.splice(index, 1);
    this._resetCompilationMemos();
    if (r.length > 0) {
        r[0].parent = null;
        return r[0];
    } else {
        return null;
    }
};

/** Disconnects the child node from its parent, given as a node object
 * @param {String | Node} id The target child node, or its ID
 * @returns {Node} The removed child node if located
 */
SceneJS._Node.prototype.disconnect = function() {
    if (this.parent) {
        for (var i = 0; i < this.parent.children.length; i++) {
            if (this.parent.children[i] === this) {
                return this.parent.disconnectNodeAt(i);
            }
        }
    }
};

/** Removes the child node at the given index
 * @param {int} index Child node index
 */
SceneJS._Node.prototype.removeNodeAt = function(index) {
    var child = this.disconnectNodeAt(index);
    if (child) {
        child.destroy();
    }
};

/** Removes the child node, given as either a node object or an ID string.
 * @param {String | Node} id The target child node, or its ID
 * @returns {Node} The removed child node if located
 */
SceneJS._Node.prototype.removeNode = function(node) {
    if (!node) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#removeNode - node argument undefined");
    }
    if (!node._compile) {
        if (typeof node == "string") {
            var gotNode = this.scene.nodeMap.items[node];
            if (!gotNode) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.NODE_NOT_FOUND,
                        "Node#removeNode - node not found anywhere: '" + node + "'");
            }
            node = gotNode;
        }
    }
    if (node._compile) { //  instance of node
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] === node) {
                //this._resetCompilationMemos(); (removeNodeAt already does this)
                return this.removeNodeAt(i);
            }
        }
    }
    throw SceneJS_errorModule.fatalError(
            SceneJS.errors.NODE_NOT_FOUND,
            "Node#removeNode - child node not found: " + (node._compile ? ": " + node.attr.id : node));
};

/** Disconnects all child nodes from their parent node and returns them in an array.
 * @returns {Array[Node]} The disconnected child nodes
 */
SceneJS._Node.prototype.disconnectNodes = function() {
    for (var i = 0; i < this.children.length; i++) {  // Unlink children from this
        this.children[i].parent = null;
    }
    var children = this.children;
    this.children = [];
    this._resetCompilationMemos();
    return children;
};

/** Removes all child nodes and returns them in an array.
 * @returns {Array[Node]} The removed child nodes
 */
SceneJS._Node.prototype.removeNodes = function() {
    var children = this.disconnectNodes();
    for (var i = 0; i < children.length; i++) {
        this.children[i].destroy();
    }

};

/** Destroys node and moves children up to parent, inserting them where this node resided.
 * @returns {Node} The parent
 */
SceneJS._Node.prototype.splice = function() {

    var i, len;

    if (this.parent == null) {
        return null;
    }
    var parent = this.parent;
    var children = this.disconnectNodes();
    for (i = 0, len = children.length; i < len; i++) {  // Link this node's children to new parent
        children[i].parent = this.parent;
    }
    for (i = 0, len = parent.children.length; i < len; i++) { // Replace node on parent's children with this node's children
        if (parent.children[i] === this) {
            parent.children.splice.apply(parent.children, [i, 1].concat(children));
            this.parent = null;
            this.destroy();
            parent._resetTreeCompilationMemos();
            SceneJS_compileModule.nodeUpdated(parent);
            return parent;
        }
    }
};

/** Appends multiple child nodes
 * @param {Array[Node]} nodes Array of nodes
 * @return {Node} This node
 */
SceneJS._Node.prototype.addNodes = function(nodes) {
    if (!nodes) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#addNodes - nodes argument is undefined");
    }
    for (var i = nodes.length - 1; i >= 0; i--) {
        this.addNode(nodes[i]);
    }
    this._resetCompilationMemos();
    return this;
};

/** Appends a child node
 * @param {Node} node Child node
 * @return {Node} The child node
 */
SceneJS._Node.prototype.addNode = function(node) {
    if (!node) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#addNode - node argument is undefined");
    }
    if (!node._compile) {
        if (typeof node == "string") {
            var gotNode = this.scene.nodeMap.items[node];
            if (!gotNode) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.ILLEGAL_NODE_CONFIG,
                        "Node#addNode - node not found: '" + node + "'");
            }
            node = gotNode;
        } else {
            node = SceneJS._parseNodeJSON(node, this.scene);
        }
    }
    if (!node._compile) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#addNode - node argument is not a Node or subclass!");
    }
    if (node.parent != null) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#addNode - node argument is still attached to another parent!");
    }
    this.children.push(node);
    node.parent = this;
    node._resetTreeCompilationMemos();
    return node;
};

/** Inserts a subgraph into child nodes
 * @param {Node} node Child node
 * @param {int} i Index for new child node
 * @return {Node} The child node
 */
SceneJS._Node.prototype.insertNode = function(node, i) {
    if (!node) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#insertNode - node argument is undefined");
    }
    if (!node._compile) {
        node = SceneJS._parseNodeJSON(node, this.scene);
    }
    if (!node._compile) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#insertNode - node argument is not a Node or subclass!");
    }
    if (node.parent != null) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#insertNode - node argument is still attached to another parent!");
    }

    if (i == undefined || i == null) {

        /* Insert node above children when no index given
         */
        var children = this.disconnectNodes();

        /* Move children to right-most leaf of inserted graph
         */
        var leaf = node;
        while (leaf.getNumNodes() > 0) {
            leaf = leaf.getLastNode();
        }
        leaf.addNodes(children);
        this.addNode(node);

    } else if (i < 0) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "Node#insertNode - node index out of range: -1");

    } else if (i >= this.children.length) {
        this.children.push(node);

    } else {
        this.children.splice(i, 0, node);
    }
    node.parent = this;
    node._resetTreeCompilationMemos();
    return node;
};

/** Calls the given function on each node in the subgraph rooted by this node, including this node.
 * The callback takes each node as it's sole argument and traversal stops as soon as the function returns
 * true and returns the node.
 * @param {function(Node)} func The function
 */
SceneJS._Node.prototype.mapNodes = function(func) {
    if (func(this)) {
        return this;
    }
    var result;
    for (var i = 0; i < this.children.length; i++) {
        result = this.children[i].mapNodes(func);
        if (result) {
            return result;
        }
    }
    return null;
};

/**
 * Registers a listener for a given event on this node. If the event type
 * is not supported by this node type, then the listener will never be called.
 * <p><b>Example:</b>
 * <pre><code>
 * var node = new Node();
 *
 * node.addListener(
 *
 *              // eventName
 *              "some-event",
 *
 *              // handler
 *              function(node,      // Node we are listening to
 *                       params) {  // Whatever params accompany the event type
 *
 *                     // ...
 *              }
 * );
 *
 *
 * </code></pre>
 *
 * @param {String} eventName One of the event types supported by this node
 * @param {Function} fn - Handler function that be called as specified
 * @param options - Optional options for the handler as specified
 * @return {Node} this
 */
SceneJS._Node.prototype.addListener = function(eventName, fn, options) {
    var list = this.listeners[eventName];
    if (!list) {
        list = [];
        this.listeners[eventName] = list;
    }
    list.push({
        eventName : eventName,
        fn: fn,
        options : options || {}
    });
    this.numListeners++;
    this._resetCompilationMemos();  // Need re-render - potentially more state changes
    return this;
};

/**
 * Destroys this node. It is marked for destruction; when the next scene traversal begins (or the current one ends)
 * it will be destroyed and removed from it's parent.
 * @return {Node} this
 */
SceneJS._Node.prototype.destroy = function() {
    if (!this._destroyed) {
        this._destroyed = true;
        this._scheduleNodeDestroy();
    }
    SceneJS_compileModule.nodeUpdated(this, "destroyed"); // Compile again to rebuild display        
    return this;
};

/** Schedule the destruction of this node
 */
SceneJS._Node.prototype._scheduleNodeDestroy = function() {
    this.disconnect();
    this.scene.nodeMap.removeItem(this.attr.id);
    if (this.children.length > 0) {
        var children = this.children.slice(0);      // destruction will modify this.children
        for (var i = 0; i < children.length; i++) {
            children[i]._scheduleNodeDestroy();
        }
    }
    SceneJS._destroyedNodes.push(this);
};

/**
 * Performs the actual destruction of this node, calling the node's optional template destroy method
 */
SceneJS._Node.prototype._doDestroy = function() {
    if (this._destroy) {
        this._destroy();
    }
    if (--this.core._nodeCount <= 0) {
        this._cores[this.scene.attr.id][this.attr.type][this.core._coreId] = null;
    }
    return this;
};


/**
 * Fires an event at this node, immediately calling listeners registered for the event
 * @param {String} eventName Event name
 * @param {Object} params Event parameters
 * @param {Object} options Event options
 */
SceneJS._Node.prototype._fireEvent = function(eventName, params, options) {
    var list = this.listeners[eventName];
    if (list) {
        if (!params) {
            params = {};
        }
        var event = {
            name: eventName,
            params : params,
            options: options || {}
        };
        var listener;
        for (var i = 0, len = list.length; i < len; i++) {
            listener = list[i];
            if (listener.options.scope) {
                listener.fn.call(listener.options.scope, event);
            } else {
                listener.fn.call(this, event);
            }
        }
    }
};

/**
 * Removes a handler that is registered for the given event on this node.
 * Does nothing if no such handler registered.
 *
 * @param {String} eventName Event type that handler is registered for
 * @param {function} fn - Handler function that is registered for the event
 * @return {function} The handler, or null if not registered
 */
SceneJS._Node.prototype.removeListener = function(eventName, fn) {
    var list = this.listeners[eventName];
    if (!list) {
        return null;
    }
    for (var i = 0; i < list.length; i++) {
        if (list[i].fn == fn) {
            list.splice(i, 1);
            return fn;
        }
    }
    this.numListeners--;
    return null;
};

/**
 * Returns true if this node has any listeners for the given event .
 *
 * @param {String} eventName Event type
 * @return {boolean} True if listener present
 */
SceneJS._Node.prototype.hasListener = function(eventName) {
    return this.listeners[eventName];
};

/**
 * Returns true if this node has any listeners at all.
 *
 * @return {boolean} True if any listener present
 */
SceneJS._Node.prototype.hasListeners = function() {
    return (this.numListeners > 0);
};

/** Removes all listeners registered on this node.
 * @return {Node} this
 */
SceneJS._Node.prototype.removeListeners = function() {
    this.listeners = {};
    this.numListeners = 0;
    return this;
};

/** Returns the parent node
 * @return {Node} The parent node
 */
SceneJS._Node.prototype.getParent = function() {
    return this.parent;
};

/** Returns either all child or all sub-nodes of the given type, depending on whether search is recursive or not.
 * @param {string} type Node type
 * @param {boolean} [recursive=false] When true, will return all matching nodes in subgraph, otherwise returns just children (default)
 * @return {SceneJS.node[]} Array of matching nodes
 */
SceneJS._Node.prototype.findNodesByType = function(type, recursive) {
    return this._findNodesByType(type, [], recursive);
};

/** @private */
SceneJS._Node.prototype._findNodesByType = function(type, list, recursive) {

    var i;

    for (i = 0; i < this.children; i++) {
        var node = this.children[i];
        if (node.type == type) {
            list.add(node);
        }
    }
    if (recursive) {
        for (i = 0; i < this.children; i++) {
            this.children[i]._findNodesByType(type, list, recursive);
        }
    }
    return list;
};

/**
 * Returns an object containing the attributes that were given when creating the node. Obviously, the map will have
 * the current values, plus any attributes that were later added through set/add methods on the node
 *
 */
SceneJS._Node.prototype.getJSON = function() {
    return this.attr;
};

var SceneJS_State = function(cfg) {
    this.core = cfg.core || {};
    this.state = cfg.state || {};
    if (cfg.parent) {
        cfg.parent.addChild(this);
    }
    this.children = [];
    this.dirty = true;
    this._cleanFunc = cfg.cleanFunc;
};

SceneJS_State.prototype.addChild = function(state) {
    state.parent = this;
    this.children.push(state);
};

SceneJS_State.prototype.setDirty = function() {
    if (this.dirty) {
        return;
    }
    this.dirty = true;
    if (this.children.length > 0) {
        var child;
        for (var i = 0, len = this.children.length; i < len; i++) {
            child = this.children[i];
            if (!child.dirty) {
                child.setDirty();
            }
        }
    }
};

SceneJS_State.prototype._cleanStack = [];
SceneJS_State.prototype._cleanStackLen = 0;

SceneJS_State.prototype.setClean = function() {
    if (!this.dirty) {
        return;
    }
    if (!this._cleanFunc) {
        return;
    }
    if (!this.parent) {
        this._cleanFunc(this.parent ? this.parent : null, this);
        this.dirty = false;
        return;
    }

    this._cleanStackLen = 0;

    /* Stack dirty states on path to root
     */
    var state = this;
    while (state && state.dirty) {
        this._cleanStack[this._cleanStackLen++] = state;
        state = state.parent;
    }

    /* Stack last clean state if existing
     */
    if (state && state.parent) {
        this._cleanStack[this._cleanStackLen++] = state.parent;
    }

    /* Clean states down the path
     */
    var parentState;
    for (var i = this._cleanStackLen - 1; i > 0; i--) {
        parentState = this._cleanStack[i - 1];
        state = this._cleanStack[i];
        this._cleanFunc(parentState, state);
        parentState.dirty = false;
        state.dirty = false;
    }
};

SceneJS_State.prototype.reset = function() {
    this.children = [];
    this.dirty = true;
};
/**
 * SceneJS IOC service container
 */

SceneJS.Services = new (function() {

    this.NODE_LOADER_SERVICE_ID = "node-loader";

    this.GEO_LOADER_SERVICE_ID = "geo-loader";

    this.MORPH_GEO_LOADER_SERVICE_ID = "morph-geo-loader";

    this.COMMAND_SERVICE_ID = "command";

    this._services = {};

    this.addService = function(name, service) {
        this._services[name] = service;
    };

    this.hasService = function(name) {
        var service = this._services[name];
        return (service != null && service != undefined);
    };

    this.getService = function(name) {
        return this._services[name];
    };

    /*----------------------------------------------------
     * Install stub services
     *---------------------------------------------------*/

    this.addService(this.NODE_LOADER_SERVICE_ID, {

        /** Loads node and attaches to parent          
         */
        loadNode: function(parentId, nodeId) {
        }
    });

    this.addService(this.GEO_LOADER_SERVICE_ID, {
        loadGeometry: function (id, params, cb) {
            throw SceneJS_errorModule.fatalError("SceneJS.Services service not installed: SceneJS.Services.GEO_LOADER_SERVICE_ID");
        }
    });

    this.addService(this.MORPH_GEO_LOADER_SERVICE_ID, {
        loadMorphGeometry: function (id, params, cb) {
            throw SceneJS_errorModule.fatalError("SceneJS.Services service not installed: SceneJS.Services.MORPH_GEO_LOADER_SERVICE_ID");
        }
    });
})();
(function() {

    var NodeSelector = function(node) {
        this._targetNode = node;
        this._methods = {
        };
    };

    SceneJS._selectNode = function(node) {
        if (!node.__selector) {
            node.__selector = new NodeSelector(node);
        }
        return node.__selector;
    };

    /** Selects the parent of the selected node
     */
    NodeSelector.prototype.parent = function() {
        var parent = this._targetNode.parent;
        if (!parent) {
            return null;
        }
        return SceneJS._selectNode(parent);
    };

    /** Selects a child node matching given ID or index
     * @param {Number|String} node Child node index or ID
     */
    NodeSelector.prototype.node = function(node) {
        if (node === null || node === undefined) {
            throw SceneJS_errorModule.fatalError("node param 'node' is null or undefined");
        }
        var type = typeof node;
        var nodeGot;
        if (type == "number") {
            nodeGot = this._targetNode.getNodeAt(node);
        } else if (type == "string") {
            nodeGot = this._targetNode.getNode(node);
        } else {
            throw SceneJS_errorModule.fatalError("node param 'node' should be either an index number or an ID string");
        }
        if (!nodeGot) {
            throw "node not found: '" + node + "'";
        }
        return SceneJS._selectNode(nodeGot);
    };

    NodeSelector.prototype.findNode = function (nodeId) {
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("findNode attempted on node that is not a \"scene\" type: '" + this._targetNode.attr.id + "'");
        }
        return this._targetNode.findNode(nodeId);
    };

    /** Find nodes in scene that have IDs matching the given regular expression
     *
     */
    NodeSelector.prototype.findNodes = function (nodeIdRegex) {
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("findNode attempted on node that is not a \"scene\" type: '" + this._targetNode.attr.id + "'");
        }
        return this._targetNode.findNodes(nodeIdRegex);
    };


    /** Returns the scene to which the node belongs
     */
    NodeSelector.prototype.scene = function() {
        return SceneJS._selectNode(this._targetNode.scene);
    };

    /** Returns true if a child node matching given ID or index existis on the selected node
     * @param {Number|String} node Child node index or ID
     */
    NodeSelector.prototype.hasNode = function(node) {
        if (node === null || typeof(node) === "undefined") {
            throw SceneJS_errorModule.fatalError("hasNode param 'node' is null or undefined");
        }
        var type = typeof node;
        var nodeGot;
        if (type == "number") {
            nodeGot = this._targetNode.getNodeAt(node);
        } else if (type == "string") {
            nodeGot = this._targetNode.getNode(node);
        } else {
            throw SceneJS_errorModule.fatalError("hasNode param 'node' should be either an index number or an ID string");
        }
        return (nodeGot != undefined && nodeGot != null);
    };

    /**
     * Iterates over parent nodes on the path from the selected node to the root, executing a function
     * for each.
     * If the function returns true at any node, then traversal stops and a selector is
     * returned for that node.
     * @param {Function(node, index)} fn Function to execute on each instance node
     * @return {Object} Selector for selected node, if any
     */
    NodeSelector.prototype.eachParent = function(fn) {
        if (!fn) {
            throw SceneJS_errorModule.fatalError("eachParent param 'fn' is null or undefined");
        }
        var selector;
        var count = 0;
        var node = this._targetNode;
        while (node.parent) {
            selector = SceneJS._selectNode(node.parent);
            if (fn.call(selector, count++) === true) {
                return selector;
            }
            node = node.parent;
        }
        return undefined;
    };

    /**
     * Iterates over sub-nodes of the selected node, executing a function
     * for each. With the optional options object we can configure is depth-first or breadth-first order.
     * If neither, then only the child nodes are iterated.
     * If the function returns true at any node, then traversal stops and a selector is
     * returned for that node.
     * @param {Function(index, node)} fn Function to execute on each child node
     * @return {Object} Selector for selected node, if any
     */
    NodeSelector.prototype.eachNode = function(fn, options) {
        if (!fn) {
            throw SceneJS_errorModule.fatalError("eachNode param 'fn' is null or undefined");
        }
        if (typeof fn != "function") {
            throw SceneJS_errorModule.fatalError("eachNode param 'fn' should be a function");
        }
        var stoppedNode;
        options = options || {};
        var count = 0;
        if (options.andSelf) {
            if (fn.call(this, count++) === true) {
                return this;
            }
        }
        if (!options.depthFirst && !options.breadthFirst) {
            stoppedNode = this._iterateEachNode(fn, this._targetNode, count);
        } else if (options.depthFirst) {
            stoppedNode = this._iterateEachNodeDepthFirst(fn, this._targetNode, count, false); // Not below root yet
        } else {
            // TODO: breadth-first
        }
        if (stoppedNode) {
            return stoppedNode;
        }
        return undefined; // IDE happy now
    };

    NodeSelector.prototype.numNodes = function() {
        return this._targetNode.children.length;
    };

    /** Sets an attribute of the selected node
     */
    NodeSelector.prototype.set = function(attr, value) {
        if (!attr) {
            throw SceneJS_errorModule.fatalError("set param 'attr' null or undefined");
        }
        if (typeof attr == "string") {
            this._callNodeMethod("set", attr, value, this._targetNode);
        } else {
            this._callNodeMethods("set", attr, this._targetNode);
        }
        return this;
    };

    /** Adds an attribute to the selected node
     */
    NodeSelector.prototype.add = function(attr, value) {
        if (!attr) {
            throw SceneJS_errorModule.fatalError("add param 'attr' null or undefined");
        }
        if (typeof attr == "string") {
            this._callNodeMethod("add", attr, value, this._targetNode);
        } else {
            this._callNodeMethods("add", attr, this._targetNode);
        }
        return this;
    };

    /** Increments an attribute to the selected node
     */
    NodeSelector.prototype.inc = function(attr, value) {
        if (!attr) {
            throw SceneJS_errorModule.fatalError("inc param 'attr' null or undefined");
        }
        if (typeof attr == "string") {
            this._callNodeMethod("inc", attr, value, this._targetNode);
        } else {
            this._callNodeMethods("inc", attr, this._targetNode);
        }
        return this;
    };

    /** Inserts an attribute or child node into the selected node
     */
    NodeSelector.prototype.insert = function(attr, value) {
        if (!attr) {
            throw SceneJS_errorModule.fatalError("insert param 'attr' null or undefined");
        }
        if (typeof attr == "string") {
            this._callNodeMethod("insert", attr, value, this._targetNode);
        } else {
            this._callNodeMethods("insert", attr, this._targetNode);
        }
        return this;
    };

    /** Removes an attribute from the selected node
     */
    NodeSelector.prototype.remove = function(attr, value) {
        if (!attr) {
            throw SceneJS_errorModule.fatalError("remove param 'attr' null or undefined");
        }
        if (typeof attr == "string") {
            this._callNodeMethod("remove", attr, value, this._targetNode);
        } else {
            this._callNodeMethods("remove", attr, this._targetNode);
        }
        return this;
    };

    /** Returns the value of an attribute of the selected node
     */
    NodeSelector.prototype.get = function(attr) {
        if (!attr) {
            return this._targetNode.getJSON();
        }
        var funcName = "get" + attr.substr(0, 1).toUpperCase() + attr.substr(1);
        var func = this._targetNode[funcName];
        if (!func) {
            throw SceneJS_errorModule.fatalError("Attribute '" + attr + "' not found on node '" + this._targetNode.attr.id + "'");
        }
        return func.call(this._targetNode);
    };

    /** Binds a listener to an event on the selected node
     *
     * @param {String} name Event name
     * @param {Function} handler Event handler
     */
    NodeSelector.prototype.bind = function(name, handler) {
        if (!name) {
            throw SceneJS_errorModule.fatalError("bind param 'name' null or undefined");
        }
        if (typeof name != "string") {
            throw SceneJS_errorModule.fatalError("bind param 'name' should be a string");
        }
        if (!handler) {
            throw SceneJS_errorModule.fatalError("bind param 'handler' null or undefined");
        }
        if (typeof handler != "function") {
            throw SceneJS_errorModule.fatalError("bind param 'handler' should be a function");
        } else {
            this._targetNode.addListener(name, handler, { scope: this });
            SceneJS_compileModule.nodeUpdated(this._targetNode, "bind", name);
        }
        //else {
        //        var commandService = SceneJS.Services.getService(SceneJS.Services.COMMAND_SERVICE_ID);
        //        if (!handler.target) {
        //            handler.target = this._targetNode.attr.id;
        //        }
        //        this._targetNode.addListener(
        //                name,
        //                function(params) {
        //                    commandService.executeCommand(handler);
        //                }, { scope: this });
        //    }
        return this;
    };

    /** Unbinds a listener for an event on the selected node
     *
     * @param {String} name Event name
     * @param {Function} handler Event handler
     */
    NodeSelector.prototype.unbind = function(name, handler) {
        if (!name) {
            throw SceneJS_errorModule.fatalError("bind param 'name' null or undefined");
        }
        if (typeof name != "string") {
            throw SceneJS_errorModule.fatalError("bind param 'name' should be a string");
        }
        if (!handler) {
            throw SceneJS_errorModule.fatalError("bind param 'handler' null or undefined");
        }
        if (typeof handler != "function") {
            throw SceneJS_errorModule.fatalError("bind param 'handler' should be a function");
        } else {
            this._targetNode.removeListener(name, handler);
            // SceneJS_compileModule.nodeUpdated(this._targetNode);
            SceneJS_compileModule.nodeUpdated(this._targetNode, "unbind", name);
        }
        return this;
    };

    /**
     * Performs pick on the selected scene node, which must be a scene.
     * @param offsetX Canvas X-coordinate
     * @param offsetY Canvas Y-coordinate
     */
    NodeSelector.prototype.pick = function(offsetX, offsetY, options) {
        if (!offsetX) {
            throw SceneJS_errorModule.fatalError("pick param 'offsetX' null or undefined");
        }
        if (typeof offsetX != "number") {
            throw SceneJS_errorModule.fatalError("pick param 'offsetX' should be a number");
        }
        if (!offsetY) {
            throw SceneJS_errorModule.fatalError("pick param 'offsetY' null or undefined");
        }
        if (typeof offsetY != "number") {
            throw SceneJS_errorModule.fatalError("pick param 'offsetY' should be a number");
        }
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("pick attempted on node that is not a \"scene\" type: '" + this._targetNode.attr.id + "'");
        }
        return this._targetNode.pick(offsetX, offsetY, options);
    };

    /**
     * Either render frame on selected scene if pending (ie update compilations pending), or
     * force a new frame to be rendered.
     *
     * Returns true if frame was rendered.
     *
     * Render if pending:
     *
     * var wasRendered = SceneJS.scene("my-scene").renderFrame()
     *
     * Force a new frame, returns true:
     *
     * SceneJS.scene("my-scene").renderFrame({ force: true })
     */
    NodeSelector.prototype.renderFrame = function (params) {
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("renderFrame attempted on node that is not a \"scene\" type: '" + this._targetNode.attr.id + "'");
        }
        return this._targetNode.renderFrame(params);
    };


    /**
     * Starts the selected scene node, which must be a scene.
     */
    NodeSelector.prototype.start = function (cfg) {
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("start attempted on node that is not a \"scene\" type: '" + this._targetNode.attr.id + "'");
        }
        cfg = cfg || {};
        var self = this;

        // Wrap callbacks to call on selector as scope

        if (cfg.idleFunc) {
            var idleFunc = cfg.idleFunc;
            cfg.idleFunc = function(params) {
                idleFunc.call(self, params);
            };
        }
        if (cfg.frameFunc) {
            var frameFunc = cfg.frameFunc;
            cfg.frameFunc = function() {
                frameFunc.call(self);
            };
        }
        if (cfg.sleepFunc) {
            var sleepFunc = cfg.sleepFunc;
            cfg.sleepFunc = function() {
                sleepFunc.call(self);
            };
        }
        this._targetNode.start(cfg);
        return this;
    };

    /**
     * Stops the selected scene node, which must be a scene.
     */
    NodeSelector.prototype.stop = function () {
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("stop attempted on node that is not a \"scene\" '" + this._targetNode.attr.id + "'");
        }
        this._targetNode.stop();
        return this;
    };

    /**
     * Stops the selected scene node, which must be a scene.
     */
    NodeSelector.prototype.pause = function (doPause) {
        if (this._targetNode.attr.type != "scene") {
            throw SceneJS_errorModule.fatalError("pause attempted on node that is not a \"scene\" '" + this._targetNode.attr.id + "'");
        }
        this._targetNode.pause(doPause);
        return this;
    };

    /**
     * Splices the selected scene node - replaces itself on its parent with its child nodes
     */
    NodeSelector.prototype.splice = function() {
        this._targetNode.splice();
        return this;
    };

    /**
     * Destroys the selected scene node
     */
    NodeSelector.prototype.destroy = function() {
        this._targetNode.destroy();
        return this;
    };

    /** Allows us to get or set data of any type on the scene node.
     *  Modifying data does not trigger rendering.
     */
    NodeSelector.prototype.data = function(data, value) {
        if (!data) {
            return this._targetNode.attr.data;
        }
        this._targetNode.attr.data = this._targetNode.attr.data || {};
        if (typeof data == "string") {
            if (value != undefined) {
                this._targetNode.attr.data[data] = value;
                return this;
            } else {
                return this._targetNode.attr.data[data];
            }
        } else {
            if (value != undefined) {
                this._targetNode.attr.data = value;
                return this;
            } else {
                return this._targetNode.attr.data;
            }
        }
    };

    NodeSelector.prototype._iterateEachNode = function(fn, node, count) {
        var len = node.children.length;
        var selector;
        for (var i = 0; i < len; i++) {
            selector = SceneJS._selectNode(node.children[i]);
            if (fn.call(selector, count++) == true) {
                return selector;
            }
        }
        return undefined;
    };

    NodeSelector.prototype._iterateEachNodeDepthFirst = function(fn, node, count, belowRoot) {
        var selector;
        if (belowRoot) {

            /* Visit this node - if we are below root, because entry point visits the root
             */
            selector = SceneJS._selectNode(node);
            if (fn.call(selector, count++) == true) {
                return selector;
            }
        }
        belowRoot = true;

        /* Iterate children
         */
        var len = node.children.length;
        for (var i = 0; i < len; i++) {
            selector = this._iterateEachNodeDepthFirst(fn, node.children[i], count, belowRoot);
            if (selector) {
                return selector;
            }
        }
        return undefined;

    };

    NodeSelector.prototype._callNodeMethod = function(prefix, attr, value, targetNode) {
        var methods = this._methods[prefix];
        if (!methods) {
            methods = this._methods[prefix] = {};
        }
        var func = methods[attr];
        if (!func) {
            attr = attr.replace(/^\s*/, "").replace(/\s*$/, "");    // trim
            var funcName = prefix + attr.substr(0, 1).toUpperCase() + attr.substr(1);
            func = targetNode[funcName];
            if (!func) {
                throw SceneJS_errorModule.fatalError("Attribute '" + attr + "' not found on node '" + targetNode.attr.id + "' for " + prefix);
            }
            methods[attr] = func;
        }
        //func.call(targetNode, this._parseAttr(attr, value));
        func.call(targetNode, value);

        /* TODO: optimise - dont fire unless listener exists
         */
        var params = {};
        params[attr] = value;
        SceneJS_compileModule.nodeUpdated(targetNode, prefix, attr, value);

        /* TODO: event should be queued and consumed to avoid many of these events accumulating
         */
        targetNode._fireEvent("updated", params);
    };

    NodeSelector.prototype._callNodeMethods = function(prefix, attr, targetNode) {
        var methods = this._methods[prefix];
        if (!methods) {
            methods = this._methods[prefix] = {};
        }
        for (var key in attr) {
            if (attr.hasOwnProperty(key)) {
                var func = methods[key];
                if (!func) {
                    key = key.replace(/^\s*/, "").replace(/\s*$/, "");    // trim
                    var funcName = prefix + key.substr(0, 1).toUpperCase() + key.substr(1);
                    func = targetNode[funcName];
                    if (!func) {
                        throw SceneJS_errorModule.fatalError("Attribute '" + key + "' not found on node '" + targetNode.attr.id + "' for " + prefix);
                    }
                    methods[key] = func;
                }
                //func.call(targetNode, this._parseAttr(key, attr[key]));
                func.call(targetNode, attr[key]);
                SceneJS_compileModule.nodeUpdated(targetNode, prefix, key, attr[key]);
            }
        }

        /* TODO: optimise - dont fire unless listener exists
         */
        /* TODO: event should be queued and consumed to avoid many of these events accumulating
         */
        targetNode._fireEvent("updated", { attr: attr });
    };

    /** Given an attribute name of the form "alpha.beta" and a value, returns this sort of thing:
     *
     * {
     *     "alpha": {
     *         "beta": value
     *     }
     * }
     *
     */
    NodeSelector.prototype._parseAttr = function(attr, value) {
        var tokens = attr.split(".");
        if (tokens.length <= 1) {
            return value;
        }
        var obj = {};
        var root = obj;
        var name;
        var i = 0;
        var len = tokens.length - 1;

        while (i < len) {
            obj[tokens[i++]] = value;
        }
        obj = obj[name] = {};

        return root;
    };

})();
SceneJS.Services.addService(
        SceneJS.Services.COMMAND_SERVICE_ID,
        (function() {
            var commands = {};
            return {

                addCommand: function(commandId, command) {
                    if (!command.execute) {
                        throw  SceneJS_errorModule.fatalError("SceneJS Command Service (ID '"
                                + SceneJS.Services.COMMAND_SERVICE_ID
                                + ") requires an 'execute' method on your '" + commandId + " command implementation");
                    }
                    commands[commandId] = command;
                },

                hasCommand: function(commandId) {
                    var command = commands[commandId];
                    return (command != null && command != undefined);
                },

                getCommand: function(commandId) {
                    return commands[commandId];
                },

                executeCommand : function (ctx, params) {
                    if (!params) {
                        throw  SceneJS_errorModule.fatalError("sendMessage param 'message' null or undefined");
                    }
                    var commandId = params.command;
                    if (!commandId) {
                        throw  SceneJS_errorModule.fatalError("Message element expected: 'command'");
                    }
                    var commandService = SceneJS.Services.getService(SceneJS.Services.COMMAND_SERVICE_ID);
                    var command = commandService.getCommand(commandId);

                    if (!command) {
                        throw  SceneJS_errorModule.fatalError("Message command not supported: '" + commandId + "' - perhaps this command needs to be added to the SceneJS Command Service?");
                    }
                    command.execute(ctx, params);
                }
            };
        })());


(function() {
    var commandService = SceneJS.Services.getService(SceneJS.Services.COMMAND_SERVICE_ID);

    function createNodes(scene, target, nodes) {
        var node;
        var targetNode;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (target) {
                targetNode = scene.findNode(target);
                if (!targetNode) {
                    continue;
                }
                targetNode.add("node", nodes[i]);
            } else {
                scene.addNode(nodes[i]);
            }
        }
    }

    commandService.addCommand("create",
            (function() {
                return {
                    execute: function(ctx, params) {
                        var nodes = params.nodes;

                        if (nodes) {

                            var target = params.target;
                            var scenes;
                            var scene;

                            if (ctx.scenes) {
                                scenes = ctx.scenes;
                                for (var i = 0, len = scenes.length; i < len; i++) {
                                    scene = scenes[i];
                                    if (scene) { // Scene might have been blown away by some other command
                                        createNodes(scene, target, nodes);
                                    }
                                }

                            } else {
                                scenes = SceneJS._scenes;
                                for (var sceneId in scenes) {
                                    if (scenes.hasOwnProperty(sceneId)) {
                                        scene = scenes[sceneId];
                                        if (scene) { // Scene might have been blown away by some other command
                                            createNodes(scene, target, nodes);
                                        }
                                    }
                                }
                            }

                        }
                    }
                };
            })());

    function updateNode(scene, target, params) {
        var targetNode = scene.findNode(target);
        if (!targetNode) { // Node might have been blown away by some other command
            return;
        }
        var sett = params["set"];
        if (sett) {
            callNodeMethods("set", sett, targetNode);
        }
        if (params.insert) {
            callNodeMethods("insert", params.insert, targetNode);
        }
        if (params.inc) {
            callNodeMethods("inc", params.inc, targetNode);
        }
        if (params.dec) {
            callNodeMethods("dec", params.dec, targetNode);
        }
        if (params.add) {
            callNodeMethods("add", params.add, targetNode);
        }
        if (params.remove) {
            callNodeMethods("remove", params.remove, targetNode);
        }
    }

    commandService.addCommand("update", {
        execute: function(ctx, params) {

            var i, len;
            var scenes;
            var target = params.target;
            var scene;

            if (ctx.scenes) {
                scenes = ctx.scenes;
                for (i = 0, len = scenes.length; i < len; i++) {
                    scene = scenes[i];
                    if (scene) { // Scene might have been blown away by some other command
                        updateNode(scene, target, params);
                    }
                }

            } else {

                scenes = SceneJS._scenes;
                for (var sceneId in scenes) {
                    if (scenes.hasOwnProperty(sceneId)) {
                        scene = scenes[sceneId];
                        if (scene) { // Scene might have been blown away by some other command
                            updateNode(scene, target, params);
                        }
                    }
                }
            }

            /* Further messages
             */
            var messages = params.messages;
            if (messages && messages.length > 0) {
                for (i = 0; i < messages.length; i++) {
                    commandService.executeCommand(ctx, messages[i]);
                }
            }
        }
    });

    commandService.addCommand("selectScenes", {
        execute: function(ctx, params) {

            var i, len;
            var scenes = params.scenes;
            if (scenes) {

                /* Filter out the scenes that actually exist so sub-commands don't have to check
                 */
                var existingScenes = [];
                var sceneId;
                var scene;
                for (i = 0, len = scenes.length; i < len; i++) {
                    sceneId = scenes[i];
                    if (SceneJS._scenes[sceneId]) {
                        existingScenes.push(SceneJS.scene(sceneId));
                    }
                }
                ctx = SceneJS._shallowClone(ctx);   // Feed scenes into command context for sub-messages
                ctx.scenes = existingScenes;
            }

            /* Further messages
             */
            var messages = params.messages;
            if (messages) {
                for (i = 0; i < messages.length; i++) {
                    commandService.executeCommand(ctx, messages[i]);
                }
            }
        }
    });

    function callNodeMethods(prefix, attr, targetNode) {
        for (var key in attr) {
            if (attr.hasOwnProperty(key)) {
                targetNode[prefix](attr);
            }
        }
    }
})();

/**
 * Backend that manages configurations.
 *
 * @private
 */
var SceneJS_debugModule = new (function() {

    this.configs = {};

    this.getConfigs = function(path) {
        if (!path) {
            return this.configs;
        } else {
            var cfg = this.configs;
            var parts = path.split(".");
            for (var i = 0; cfg && i < parts.length; i++) {
                cfg = cfg[parts[i]];
            }
            return cfg || {};
        }
    };

    this.setConfigs = function(path, data) {
        if (!path) {
            this.configs = data;
        } else {
            var parts = path.split(".");
            var cfg = this.configs;
            var subCfg;
            var name;
            for (var i = 0; i < parts.length - 1; i++) {
                name = parts[i];
                subCfg = cfg[name];
                if (!subCfg) {
                    subCfg = cfg[name] = {};
                }
                cfg = subCfg;
            }
            cfg[parts.length - 1] = data;
        }
    };

})();

/** Sets configurations.
 */
SceneJS.setConfigs = SceneJS.setDebugConfigs = function () {
    if (arguments.length == 1) {
        SceneJS_debugModule.setConfigs(null, arguments[0]);
    } else if (arguments.length == 2) {
        SceneJS_debugModule.setConfigs(arguments[0], arguments[1]);
    } else {
        throw SceneJS_errorModule.fatalError("Illegal arguments given to SceneJS.setDebugs - should be either ({String}:name, {Object}:cfg) or ({Object}:cfg)");
    }
};

/** Gets configurations
 */
SceneJS.getConfigs = SceneJS.getDebugConfigs = function (path) {
    return SceneJS_debugModule.getConfigs(path);
};

SceneJS.errors = {};

SceneJS.errors.ERROR = 0;
SceneJS.errors.WEBGL_NOT_SUPPORTED = 1;
SceneJS.errors.NODE_CONFIG_EXPECTED = 2;
SceneJS.errors.ILLEGAL_NODE_CONFIG = 3;
SceneJS.errors.SHADER_COMPILATION_FAILURE = 4;
SceneJS.errors.SHADER_LINK_FAILURE = 5;
SceneJS.errors.CANVAS_NOT_FOUND = 6;
SceneJS.errors.OUT_OF_VRAM = 7;
SceneJS.errors.WEBGL_UNSUPPORTED_NODE_CONFIG = 8;
SceneJS.errors.INSTANCE_TARGET_NOT_FOUND = 9;
SceneJS.errors.INSTANCE_CYCLE = 10;
SceneJS.errors.NODE_NOT_FOUND = 11;
SceneJS.errors.NODE_ILLEGAL_STATE = 12;
SceneJS.errors.ID_CLASH = 13;
SceneJS.errors.ILLEGAL_MESSAGE = 14;
SceneJS.errors.SCENE_ILLEGAL_UPDATE = 15;


SceneJS.errors._getErrorName = function(code) {
    for (var key in SceneJS.errors) {
        if (SceneJS.errors.hasOwnProperty(key) && SceneJS.errors[key] == code) {
            return key;
        }
    }
    return null;
}


/* 
 * Optimizations made based on glMatrix by Brandon Jones
 */

/*
 * Copyright (c) 2010 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */


/**
 * @param u vec3
 * @param v vec3
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_divVec3 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] / v[0];
    dest[1] = u[1] / v[1];
    dest[2] = u[2] / v[2];

    return dest;
};

/**
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_negateVector4 = function(v, dest) {
    if (!dest) {
        dest = v;
    }
    dest[0] = -v[0];
    dest[1] = -v[1];
    dest[2] = -v[2];
    dest[3] = -v[3];

    return dest;
};

/**
 * @param u vec4
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_addVec4 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] + v[0];
    dest[1] = u[1] + v[1];
    dest[2] = u[2] + v[2];
    dest[3] = u[3] + v[3];

    return dest;
};


/**
 * @param v vec4
 * @param s scalar
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_addVec4s = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] + s;
    dest[1] = v[1] + s;
    dest[2] = v[2] + s;
    dest[3] = v[3] + s;

    return dest;
};

/**
 * @param u vec3
 * @param v vec3
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_addVec3 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] + v[0];
    dest[1] = u[1] + v[1];
    dest[2] = u[2] + v[2];

    return dest;
};

/**
 * @param v vec3
 * @param s scalar
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_addVec3s = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] + s;
    dest[1] = v[1] + s;
    dest[2] = v[2] + s;

    return dest;
};

/** @private */
var SceneJS_math_addScalarVec4 = function(s, v, dest) {
    return SceneJS_math_addVec4s(v, s, dest);
};

/**
 * @param u vec4
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_subVec4 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] - v[0];
    dest[1] = u[1] - v[1];
    dest[2] = u[2] - v[2];
    dest[3] = u[3] - v[3];

    return dest;
};

/**
 * @param u vec3
 * @param v vec3
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_subVec3 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] - v[0];
    dest[1] = u[1] - v[1];
    dest[2] = u[2] - v[2];

    return dest;
};

var SceneJS_math_lerpVec3 = function(t, t1, t2, p1, p2) {
    var f2 = (t - t1) / (t2 - t1);
    var f1 = 1.0 - f2;
    return  {
        x: p1.x * f1 + p2.x * f2,
        y: p1.y * f1 + p2.y * f2,
        z: p1.z * f1 + p2.z * f2
    };
};


/**
 * @param u vec2
 * @param v vec2
 * @param dest vec2 - optional destination
 * @return {vec2} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_subVec2 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] - v[0];
    dest[1] = u[1] - v[1];

    return dest;
};

/**
 * @param v vec4
 * @param s scalar
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_subVec4Scalar = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] - s;
    dest[1] = v[1] - s;
    dest[2] = v[2] - s;
    dest[3] = v[3] - s;

    return dest;
};

/**
 * @param v vec4
 * @param s scalar
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_subScalarVec4 = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = s - v[0];
    dest[1] = s - v[1];
    dest[2] = s - v[2];
    dest[3] = s - v[3];

    return dest;
};

/**
 * @param u vec4
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_mulVec4 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] * v[0];
    dest[1] = u[1] * v[1];
    dest[2] = u[2] * v[2];
    dest[3] = u[3] * v[3];

    return dest;
};

/**
 * @param v vec4
 * @param s scalar
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_mulVec4Scalar = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] * s;
    dest[1] = v[1] * s;
    dest[2] = v[2] * s;
    dest[3] = v[3] * s;

    return dest;
};


/**
 * @param v vec3
 * @param s scalar
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_mulVec3Scalar = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] * s;
    dest[1] = v[1] * s;
    dest[2] = v[2] * s;

    return dest;
};

/**
 * @param v vec2
 * @param s scalar
 * @param dest vec2 - optional destination
 * @return {vec2} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_mulVec2Scalar = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] * s;
    dest[1] = v[1] * s;

    return dest;
};


/**
 * @param u vec4
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_divVec4 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    dest[0] = u[0] / v[0];
    dest[1] = u[1] / v[1];
    dest[2] = u[2] / v[2];
    dest[3] = u[3] / v[3];

    return dest;
};

/**
 * @param v vec3
 * @param s scalar
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_divScalarVec3 = function(s, v, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = s / v[0];
    dest[1] = s / v[1];
    dest[2] = s / v[2];

    return dest;
};

/**
 * @param v vec3
 * @param s scalar
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_divVec3s = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] / s;
    dest[1] = v[1] / s;
    dest[2] = v[2] / s;

    return dest;
};

/**
 * @param v vec4
 * @param s scalar
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_divVec4s = function(v, s, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = v[0] / s;
    dest[1] = v[1] / s;
    dest[2] = v[2] / s;
    dest[3] = v[3] / s;

    return dest;
};


/**
 * @param s scalar
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_divScalarVec4 = function(s, v, dest) {
    if (!dest) {
        dest = v;
    }

    dest[0] = s / v[0];
    dest[1] = s / v[1];
    dest[2] = s / v[2];
    dest[3] = s / v[3];

    return dest;
};


/** @private */
var SceneJS_math_dotVector4 = function(u, v) {
    return (u[0] * v[0] + u[1] * v[1] + u[2] * v[2] + u[3] * v[3]);
};

/** @private */
var SceneJS_math_cross3Vec4 = function(u, v) {
    var u0 = u[0], u1 = u[1], u2 = u[2];
    var v0 = v[0], v1 = v[1], v2 = v[2];
    return [
        u1 * v2 - u2 * v1,
        u2 * v0 - u0 * v2,
        u0 * v1 - u1 * v0,
        0.0];
};

/**
 * @param u vec3
 * @param v vec3
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, u otherwise
 * @private
 */
var SceneJS_math_cross3Vec3 = function(u, v, dest) {
    if (!dest) {
        dest = u;
    }

    var x = u[0], y = u[1], z = u[2];
    var x2 = v[0], y2 = v[1], z2 = v[2];

    dest[0] = y * z2 - z * y2;
    dest[1] = z * x2 - x * z2;
    dest[2] = x * y2 - y * x2;

    return dest;
};

/** @private */
var SceneJS_math_sqLenVec4 = function(v) {
    return SceneJS_math_dotVector4(v, v);
};

/** @private */
var SceneJS_math_lenVec4 = function(v) {
    return Math.sqrt(SceneJS_math_sqLenVec4(v));
};

/** @private */
var SceneJS_math_dotVector3 = function(u, v) {
    return (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]);
};

/** @private */
var SceneJS_math_dotVector2 = function(u, v) {
    return (u[0] * v[0] + u[1] * v[1]);
};

/** @private */
var SceneJS_math_sqLenVec3 = function(v) {
    return SceneJS_math_dotVector3(v, v);
};

/** @private */
var SceneJS_math_sqLenVec2 = function(v) {
    return SceneJS_math_dotVector2(v, v);
};

/** @private */
var SceneJS_math_lenVec3 = function(v) {
    return Math.sqrt(SceneJS_math_sqLenVec3(v));
};

/** @private */
var SceneJS_math_lenVec2 = function(v) {
    return Math.sqrt(SceneJS_math_sqLenVec2(v));
};

/**
 * @param v vec3
 * @param dest vec3 - optional destination
 * @return {vec3} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_rcpVec3 = function(v, dest) {
    return SceneJS_math_divScalarVec3(1.0, v, dest);
};

/**
 * @param v vec4
 * @param dest vec4 - optional destination
 * @return {vec4} dest if specified, v otherwise
 * @private
 */
var SceneJS_math_normalizeVec4 = function(v, dest) {
    var f = 1.0 / SceneJS_math_lenVec4(v);
    return SceneJS_math_mulVec4Scalar(v, f, dest);
};

/** @private */
var SceneJS_math_normalizeVec3 = function(v, dest) {
    var f = 1.0 / SceneJS_math_lenVec3(v);
    return SceneJS_math_mulVec3Scalar(v, f, dest);
};

// @private
var SceneJS_math_normalizeVec2 = function(v, dest) {
    var f = 1.0 / SceneJS_math_lenVec2(v);
    return SceneJS_math_mulVec2Scalar(v, f, dest);
};

/** @private */
var SceneJS_math_mat4 = function() {
    return new Array(16);
};

/** @private */
var SceneJS_math_dupMat4 = function(m) {
    return m.slice(0, 16);
};

/** @private */
var SceneJS_math_getCellMat4 = function(m, row, col) {
    return m[row + col * 4];
};

/** @private */
var SceneJS_math_setCellMat4 = function(m, row, col, s) {
    m[row + col * 4] = s;
};

/** @private */
var SceneJS_math_getRowMat4 = function(m, r) {
    return [m[r], m[r + 4], m[r + 8], m[r + 12]];
};

/** @private */
var SceneJS_math_setRowMat4 = function(m, r, v) {
    m[r] = v[0];
    m[r + 4] = v[1];
    m[r + 8] = v[2];
    m[r + 12] = v[3];
};

/** @private */
var SceneJS_math_setRowMat4c = function(m, r, x, y, z, w) {
    SceneJS_math_setRowMat4(m, r, [x,y,z,w]);
};

/** @private */
var SceneJS_math_setRowMat4s = function(m, r, s) {
    SceneJS_math_setRowMat4c(m, r, s, s, s, s);
};

/** @private */
var SceneJS_math_getColMat4 = function(m, c) {
    var i = c * 4;
    return [m[i], m[i + 1],m[i + 2],m[i + 3]];
};

/** @private */
var SceneJS_math_setColMat4v = function(m, c, v) {
    var i = c * 4;
    m[i] = v[0];
    m[i + 1] = v[1];
    m[i + 2] = v[2];
    m[i + 3] = v[3];
};

/** @private */
var SceneJS_math_setColMat4c = function(m, c, x, y, z, w) {
    SceneJS_math_setColMat4v(m, c, [x,y,z,w]);
};

/** @private */
var SceneJS_math_setColMat4Scalar = function(m, c, s) {
    SceneJS_math_setColMat4c(m, c, s, s, s, s);
};

/** @private */
var SceneJS_math_mat4To3 = function(m) {
    return [
        m[0],m[1],m[2],
        m[4],m[5],m[6],
        m[8],m[9],m[10]
    ];
};

/** @private */
var SceneJS_math_m4s = function(s) {
    return [
        s,s,s,s,
        s,s,s,s,
        s,s,s,s,
        s,s,s,s
    ];
};

/** @private */
var SceneJS_math_setMat4ToZeroes = function() {
    return SceneJS_math_m4s(0.0);
};

/** @private */
var SceneJS_math_setMat4ToOnes = function() {
    return SceneJS_math_m4s(1.0);
};

/** @private */
var SceneJS_math_diagonalMat4v = function(v) {
    return [
        v[0], 0.0, 0.0, 0.0,
        0.0,v[1], 0.0, 0.0,
        0.0, 0.0, v[2],0.0,
        0.0, 0.0, 0.0, v[3]
    ];
};

/** @private */
var SceneJS_math_diagonalMat4c = function(x, y, z, w) {
    return SceneJS_math_diagonalMat4v([x,y,z,w]);
};

/** @private */
var SceneJS_math_diagonalMat4s = function(s) {
    return SceneJS_math_diagonalMat4c(s, s, s, s);
};

/** @private */
var SceneJS_math_identityMat4 = function() {
    return SceneJS_math_diagonalMat4v([1.0,1.0,1.0,1.0]);
};

/** @private */
var SceneJS_math_isIdentityMat4 = function(m) {
    if (m[0] !== 1.0 || m[1] !== 0.0 || m[2] !== 0.0 || m[3] !== 0.0 ||
        m[4] !== 0.0 || m[5] !== 1.0 || m[6] !== 0.0 || m[7] !== 0.0 ||
        m[8] !== 0.0 || m[9] !== 0.0 || m[10] !== 1.0 || m[11] !== 0.0 ||
        m[12] !== 0.0 || m[13] !== 0.0 || m[14] !== 0.0 || m[15] !== 1.0)
    {
        return false;
    }

    return true;
};

/**
 * @param m mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, m otherwise
 * @private
 */
var SceneJS_math_negateMat4 = function(m, dest) {
    if (!dest) {
        dest = m;
    }

    dest[0] = -m[0];
    dest[1] = -m[1];
    dest[2] = -m[2];
    dest[3] = -m[3];
    dest[4] = -m[4];
    dest[5] = -m[5];
    dest[6] = -m[6];
    dest[7] = -m[7];
    dest[8] = -m[8];
    dest[9] = -m[9];
    dest[10] = -m[10];
    dest[11] = -m[11];
    dest[12] = -m[12];
    dest[13] = -m[13];
    dest[14] = -m[14];
    dest[15] = -m[15];

    return dest;
};

/**
 * @param a mat4
 * @param b mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, a otherwise
 * @private
 */
var SceneJS_math_addMat4 = function(a, b, dest) {
    if (!dest) {
        dest = a;
    }

    dest[0] = a[0] + b[0];
    dest[1] = a[1] + b[1];
    dest[2] = a[2] + b[2];
    dest[3] = a[3] + b[3];
    dest[4] = a[4] + b[4];
    dest[5] = a[5] + b[5];
    dest[6] = a[6] + b[6];
    dest[7] = a[7] + b[7];
    dest[8] = a[8] + b[8];
    dest[9] = a[9] + b[9];
    dest[10] = a[10] + b[10];
    dest[11] = a[11] + b[11];
    dest[12] = a[12] + b[12];
    dest[13] = a[13] + b[13];
    dest[14] = a[14] + b[14];
    dest[15] = a[15] + b[15];

    return dest;
};

/**
 * @param m mat4
 * @param s scalar
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, m otherwise
 * @private
 */
var SceneJS_math_addMat4Scalar = function(m, s, dest) {
    if (!dest) {
        dest = m;
    }

    dest[0] = m[0] + s;
    dest[1] = m[1] + s;
    dest[2] = m[2] + s;
    dest[3] = m[3] + s;
    dest[4] = m[4] + s;
    dest[5] = m[5] + s;
    dest[6] = m[6] + s;
    dest[7] = m[7] + s;
    dest[8] = m[8] + s;
    dest[9] = m[9] + s;
    dest[10] = m[10] + s;
    dest[11] = m[11] + s;
    dest[12] = m[12] + s;
    dest[13] = m[13] + s;
    dest[14] = m[14] + s;
    dest[15] = m[15] + s;

    return dest;
};

/** @private */
var SceneJS_math_addScalarMat4 = function(s, m, dest) {
    return SceneJS_math_addMat4Scalar(m, s, dest);
};

/**
 * @param a mat4
 * @param b mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, a otherwise
 * @private
 */
var SceneJS_math_subMat4 = function(a, b, dest) {
    if (!dest) {
        dest = a;
    }

    dest[0] = a[0] - b[0];
    dest[1] = a[1] - b[1];
    dest[2] = a[2] - b[2];
    dest[3] = a[3] - b[3];
    dest[4] = a[4] - b[4];
    dest[5] = a[5] - b[5];
    dest[6] = a[6] - b[6];
    dest[7] = a[7] - b[7];
    dest[8] = a[8] - b[8];
    dest[9] = a[9] - b[9];
    dest[10] = a[10] - b[10];
    dest[11] = a[11] - b[11];
    dest[12] = a[12] - b[12];
    dest[13] = a[13] - b[13];
    dest[14] = a[14] - b[14];
    dest[15] = a[15] - b[15];

    return dest;
};

/**
 * @param m mat4
 * @param s scalar
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, m otherwise
 * @private
 */
var SceneJS_math_subMat4Scalar = function(m, s, dest) {
    if (!dest) {
        dest = m;
    }

    dest[0] = m[0] - s;
    dest[1] = m[1] - s;
    dest[2] = m[2] - s;
    dest[3] = m[3] - s;
    dest[4] = m[4] - s;
    dest[5] = m[5] - s;
    dest[6] = m[6] - s;
    dest[7] = m[7] - s;
    dest[8] = m[8] - s;
    dest[9] = m[9] - s;
    dest[10] = m[10] - s;
    dest[11] = m[11] - s;
    dest[12] = m[12] - s;
    dest[13] = m[13] - s;
    dest[14] = m[14] - s;
    dest[15] = m[15] - s;

    return dest;
};

/**
 * @param s scalar
 * @param m mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, m otherwise
 * @private
 */
var SceneJS_math_subScalarMat4 = function(s, m, dest) {
    if (!dest) {
        dest = m;
    }

    dest[0] = s - m[0];
    dest[1] = s - m[1];
    dest[2] = s - m[2];
    dest[3] = s - m[3];
    dest[4] = s - m[4];
    dest[5] = s - m[5];
    dest[6] = s - m[6];
    dest[7] = s - m[7];
    dest[8] = s - m[8];
    dest[9] = s - m[9];
    dest[10] = s - m[10];
    dest[11] = s - m[11];
    dest[12] = s - m[12];
    dest[13] = s - m[13];
    dest[14] = s - m[14];
    dest[15] = s - m[15];

    return dest;
};

/**
 * @param a mat4
 * @param b mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, a otherwise
 * @private
 */
var SceneJS_math_mulMat4 = function(a, b, dest) {
    if (!dest) {
        dest = a;
    }

    // Cache the matrix values (makes for huge speed increases!)
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    var b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    var b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    var b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    var b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    dest[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    dest[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    dest[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    dest[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    dest[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    dest[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    dest[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    dest[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    dest[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    dest[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    dest[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    dest[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    dest[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    dest[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    dest[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    dest[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return dest;
};

/**
 * @param m mat4
 * @param s scalar
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, m otherwise
 * @private
 */
var SceneJS_math_mulMat4s = function(m, s, dest)
{
    if (!dest) {
        dest = m;
    }

    dest[0] = m[0] * s;
    dest[1] = m[1] * s;
    dest[2] = m[2] * s;
    dest[3] = m[3] * s;
    dest[4] = m[4] * s;
    dest[5] = m[5] * s;
    dest[6] = m[6] * s;
    dest[7] = m[7] * s;
    dest[8] = m[8] * s;
    dest[9] = m[9] * s;
    dest[10] = m[10] * s;
    dest[11] = m[11] * s;
    dest[12] = m[12] * s;
    dest[13] = m[13] * s;
    dest[14] = m[14] * s;
    dest[15] = m[15] * s;

    return dest;
};

/**
 * @param m mat4
 * @param v vec4
 * @return {vec4}
 * @private
 */
var SceneJS_math_mulMat4v4 = function(m, v) {
    var v0 = v[0], v1 = v[1], v2 = v[2], v3 = v[3];

    return [
        m[0] * v0 + m[4] * v1 + m[8] * v2 + m[12] * v3,
        m[1] * v0 + m[5] * v1 + m[9] * v2 + m[13] * v3,
        m[2] * v0 + m[6] * v1 + m[10] * v2 + m[14] * v3,
        m[3] * v0 + m[7] * v1 + m[11] * v2 + m[15] * v3
    ];
};

/**
 * @param mat mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, mat otherwise
 * @private
 */
var SceneJS_math_transposeMat4 = function(mat, dest) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    var m4 = mat[4], m14 = mat[14], m8 = mat[8];
    var m13 = mat[13], m12 = mat[12], m9 = mat[9];
    if (!dest || mat == dest) {
        var a01 = mat[1], a02 = mat[2], a03 = mat[3];
        var a12 = mat[6], a13 = mat[7];
        var a23 = mat[11];

        mat[1] = m4;
        mat[2] = m8;
        mat[3] = m12;
        mat[4] = a01;
        mat[6] = m9;
        mat[7] = m13;
        mat[8] = a02;
        mat[9] = a12;
        mat[11] = m14;
        mat[12] = a03;
        mat[13] = a13;
        mat[14] = a23;
        return mat;
    }

    dest[0] = mat[0];
    dest[1] = m4;
    dest[2] = m8;
    dest[3] = m12;
    dest[4] = mat[1];
    dest[5] = mat[5];
    dest[6] = m9;
    dest[7] = m13;
    dest[8] = mat[2];
    dest[9] = mat[6];
    dest[10] = mat[10];
    dest[11] = m14;
    dest[12] = mat[3];
    dest[13] = mat[7];
    dest[14] = mat[11];
    dest[15] = mat[15];
    return dest;
};

/** @private */
var SceneJS_math_determinantMat4 = function(mat) {
    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
    var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
    var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
    var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

    return a30 * a21 * a12 * a03 - a20 * a31 * a12 * a03 - a30 * a11 * a22 * a03 + a10 * a31 * a22 * a03 +
           a20 * a11 * a32 * a03 - a10 * a21 * a32 * a03 - a30 * a21 * a02 * a13 + a20 * a31 * a02 * a13 +
           a30 * a01 * a22 * a13 - a00 * a31 * a22 * a13 - a20 * a01 * a32 * a13 + a00 * a21 * a32 * a13 +
           a30 * a11 * a02 * a23 - a10 * a31 * a02 * a23 - a30 * a01 * a12 * a23 + a00 * a31 * a12 * a23 +
           a10 * a01 * a32 * a23 - a00 * a11 * a32 * a23 - a20 * a11 * a02 * a33 + a10 * a21 * a02 * a33 +
           a20 * a01 * a12 * a33 - a00 * a21 * a12 * a33 - a10 * a01 * a22 * a33 + a00 * a11 * a22 * a33;
};

/**
 * @param mat mat4
 * @param dest mat4 - optional destination
 * @return {mat4} dest if specified, mat otherwise
 * @private
 */
var SceneJS_math_inverseMat4 = function(mat, dest) {
    if (!dest) {
        dest = mat;
    }

    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
    var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
    var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
    var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant (inlined to avoid double-caching)
    var invDet = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

    dest[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
    dest[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
    dest[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
    dest[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
    dest[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
    dest[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
    dest[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
    dest[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
    dest[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
    dest[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
    dest[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
    dest[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
    dest[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
    dest[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
    dest[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
    dest[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

    return dest;
};

/** @private */
var SceneJS_math_traceMat4 = function(m) {
    return (m[0] + m[5] + m[10] + m[15]);
};

/** @private */
var SceneJS_math_translationMat4v = function(v) {
    var m = SceneJS_math_identityMat4();
    m[12] = v[0];
    m[13] = v[1];
    m[14] = v[2];
    return m;
};

/** @private */
var SceneJS_math_translationMat4c = function(x, y, z) {
    return SceneJS_math_translationMat4v([x,y,z]);
};

/** @private */
var SceneJS_math_translationMat4s = function(s) {
    return SceneJS_math_translationMat4c(s, s, s);
};

/** @private */
var SceneJS_math_rotationMat4v = function(anglerad, axis) {
    var ax = SceneJS_math_normalizeVec4([axis[0],axis[1],axis[2],0.0]);
    var s = Math.sin(anglerad);
    var c = Math.cos(anglerad);
    var q = 1.0 - c;

    var x = ax[0];
    var y = ax[1];
    var z = ax[2];

    var xy,yz,zx,xs,ys,zs;

    //xx = x * x; used once
    //yy = y * y; used once
    //zz = z * z; used once
    xy = x * y;
    yz = y * z;
    zx = z * x;
    xs = x * s;
    ys = y * s;
    zs = z * s;

    var m = SceneJS_math_mat4();

    m[0] = (q * x * x) + c;
    m[1] = (q * xy) + zs;
    m[2] = (q * zx) - ys;
    m[3] = 0.0;

    m[4] = (q * xy) - zs;
    m[5] = (q * y * y) + c;
    m[6] = (q * yz) + xs;
    m[7] = 0.0;

    m[8] = (q * zx) + ys;
    m[9] = (q * yz) - xs;
    m[10] = (q * z * z) + c;
    m[11] = 0.0;

    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = 0.0;
    m[15] = 1.0;

    return m;
};

/** @private */
var SceneJS_math_rotationMat4c = function(anglerad, x, y, z) {
    return SceneJS_math_rotationMat4v(anglerad, [x,y,z]);
};

/** @private */
var SceneJS_math_scalingMat4v = function(v) {
    var m = SceneJS_math_identityMat4();
    m[0] = v[0];
    m[5] = v[1];
    m[10] = v[2];
    return m;
};

/** @private */
var SceneJS_math_scalingMat4c = function(x, y, z) {
    return SceneJS_math_scalingMat4v([x,y,z]);
};

/** @private */
var SceneJS_math_scalingMat4s = function(s) {
    return SceneJS_math_scalingMat4c(s, s, s);
};

/**
 * Default lookat properties - eye at 0,0,1, looking at 0,0,0, up vector pointing up Y-axis
 */
var SceneJS_math_LOOKAT_OBJ = {
    eye:    {x: 0, y:0, z:1.0 },
    look:   {x:0, y:0, z:0.0 },
    up:     {x:0, y:1, z:0.0 }
};

/**
 * Default lookat properties in array form - eye at 0,0,1, looking at 0,0,0, up vector pointing up Y-axis
 */
var SceneJS_math_LOOKAT_ARRAYS = {
    eye:    [0, 0, 1.0],
    look:   [0, 0, 0.0 ],
    up:     [0, 1, 0.0 ]
};

/**
 * Default orthographic projection properties
 */
var SceneJS_math_ORTHO_OBJ = {
    left: -1.0,
    right: 1.0,
    bottom: -1.0,
    near: 0.1,
    top: 1.0,
    far: 5000.0
};

/**
 * @param pos vec3 position of the viewer
 * @param target vec3 point the viewer is looking at
 * @param up vec3 pointing "up"
 * @param dest mat4 Optional, mat4 frustum matrix will be written into
 *
 * @return {mat4} dest if specified, a new mat4 otherwise
 */
var SceneJS_math_lookAtMat4v = function(pos, target, up, dest) {
    if (!dest) {
        dest = SceneJS_math_mat4();
    }

    var posx = pos[0],
            posy = pos[1],
            posz = pos[2],
            upx = up[0],
            upy = up[1],
            upz = up[2],
            targetx = target[0],
            targety = target[1],
            targetz = target[2];

    if (posx == targetx && posy == targety && posz == targetz) {
        return SceneJS_math_identityMat4();
    }

    var z0,z1,z2,x0,x1,x2,y0,y1,y2,len;

    //vec3.direction(eye, center, z);
    z0 = posx - targetx;
    z1 = posy - targety;
    z2 = posz - targetz;

    // normalize (no check needed for 0 because of early return)
    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    //vec3.normalize(vec3.cross(up, z, x));
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    //vec3.normalize(vec3.cross(z, x, y));
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    dest[0] = x0;
    dest[1] = y0;
    dest[2] = z0;
    dest[3] = 0;
    dest[4] = x1;
    dest[5] = y1;
    dest[6] = z1;
    dest[7] = 0;
    dest[8] = x2;
    dest[9] = y2;
    dest[10] = z2;
    dest[11] = 0;
    dest[12] = -(x0 * posx + x1 * posy + x2 * posz);
    dest[13] = -(y0 * posx + y1 * posy + y2 * posz);
    dest[14] = -(z0 * posx + z1 * posy + z2 * posz);
    dest[15] = 1;

    return dest;
};

/** @private */
var SceneJS_math_lookAtMat4c = function(posx, posy, posz, targetx, targety, targetz, upx, upy, upz) {
    return SceneJS_math_lookAtMat4v([posx,posy,posz], [targetx,targety,targetz], [upx,upy,upz]);
};

/** @private */
var SceneJS_math_orthoMat4c = function(left, right, bottom, top, near, far, dest) {
    if (!dest) {
        dest = SceneJS_math_mat4();
    }
    var rl = (right - left);
    var tb = (top - bottom);
    var fn = (far - near);

    dest[0] = 2.0 / rl;
    dest[1] = 0.0;
    dest[2] = 0.0;
    dest[3] = 0.0;

    dest[4] = 0.0;
    dest[5] = 2.0 / tb;
    dest[6] = 0.0;
    dest[7] = 0.0;

    dest[8] = 0.0;
    dest[9] = 0.0;
    dest[10] = -2.0 / fn;
    dest[11] = 0.0;

    dest[12] = -(left + right) / rl;
    dest[13] = -(top + bottom) / tb;
    dest[14] = -(far + near) / fn;
    dest[15] = 1.0;

    return dest;
};

/** @private */
var SceneJS_math_frustumMat4v = function(fmin, fmax) {
    var fmin4 = [fmin[0],fmin[1],fmin[2],0.0];
    var fmax4 = [fmax[0],fmax[1],fmax[2],0.0];
    var vsum = SceneJS_math_mat4();
    SceneJS_math_addVec4(fmax4, fmin4, vsum);
    var vdif = SceneJS_math_mat4();
    SceneJS_math_subVec4(fmax4, fmin4, vdif);
    var t = 2.0 * fmin4[2];

    var m = SceneJS_math_mat4();
    var vdif0 = vdif[0], vdif1 = vdif[1], vdif2 = vdif[2];

    m[0] = t / vdif0;
    m[1] = 0.0;
    m[2] = 0.0;
    m[3] = 0.0;

    m[4] = 0.0;
    m[5] = t / vdif1;
    m[6] = 0.0;
    m[7] = 0.0;

    m[8] = vsum[0] / vdif0;
    m[9] = vsum[1] / vdif1;
    m[10] = -vsum[2] / vdif2;
    m[11] = -1.0;

    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = -t * fmax4[2] / vdif2;
    m[15] = 0.0;

    return m;
};

/** @private */
var SceneJS_math_frustumMatrix4 = function(left, right, bottom, top, near, far, dest) {
    if (!dest) {
        dest = SceneJS_math_mat4();
    }
    var rl = (right - left);
    var tb = (top - bottom);
    var fn = (far - near);
    dest[0] = (near * 2) / rl;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = (near * 2) / tb;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = (right + left) / rl;
    dest[9] = (top + bottom) / tb;
    dest[10] = -(far + near) / fn;
    dest[11] = -1;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = -(far * near * 2) / fn;
    dest[15] = 0;
    return dest;
};


/** @private */
var SceneJS_math_perspectiveMatrix4 = function(fovyrad, aspectratio, znear, zfar) {
    var pmin = new Array(4);
    var pmax = new Array(4);

    pmin[2] = znear;
    pmax[2] = zfar;

    pmax[1] = pmin[2] * Math.tan(fovyrad / 2.0);
    pmin[1] = -pmax[1];

    pmax[0] = pmax[1] * aspectratio;
    pmin[0] = -pmax[0];

    return SceneJS_math_frustumMat4v(pmin, pmax);
};

/** @private */
var SceneJS_math_transformPoint3 = function(m, p) {
    var p0 = p[0], p1 = p[1], p2 = p[2];
    return [
        (m[0] * p0) + (m[4] * p1) + (m[8] * p2) + m[12],
        (m[1] * p0) + (m[5] * p1) + (m[9] * p2) + m[13],
        (m[2] * p0) + (m[6] * p1) + (m[10] * p2) + m[14],
        (m[3] * p0) + (m[7] * p1) + (m[11] * p2) + m[15]
    ];
};


/** @private */
var SceneJS_math_transformPoints3 = function(m, points) {
    var result = new Array(points.length);
    var len = points.length;
    var p0, p1, p2;
    var pi;

    // cache values
    var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
    var m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7];
    var m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];
    var m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15];

    for (var i = 0; i < len; ++i) {
        // cache values
        pi = points[i];
        p0 = pi[0];
        p1 = pi[1];
        p2 = pi[2];

        result[i] = [
            (m0 * p0) + (m4 * p1) + (m8 * p2) + m12,
            (m1 * p0) + (m5 * p1) + (m9 * p2) + m13,
            (m2 * p0) + (m6 * p1) + (m10 * p2) + m14,
            (m3 * p0) + (m7 * p1) + (m11 * p2) + m15
        ];
    }

    return result;
};

/** @private */
var SceneJS_math_transformVector3 = function(m, v) {
    var v0 = v[0], v1 = v[1], v2 = v[2];
    return [
        (m[0] * v0) + (m[4] * v1) + (m[8] * v2),
        (m[1] * v0) + (m[5] * v1) + (m[9] * v2),
        (m[2] * v0) + (m[6] * v1) + (m[10] * v2)
    ];
};

var SceneJS_math_transformVector4 = function(m, v) {
    var v0 = v[0], v1 = v[1], v2 = v[2], v3 = v[3];
    return [
        m[ 0] * v0 + m[ 4] * v1 + m[ 8] * v2 + m[12] * v3,
        m[ 1] * v0 + m[ 5] * v1 + m[ 9] * v2 + m[13] * v3,
        m[ 2] * v0 + m[ 6] * v1 + m[10] * v2 + m[14] * v3,
        m[ 3] * v0 + m[ 7] * v1 + m[11] * v2 + m[15] * v3
    ];
};

/** @private */
var SceneJS_math_projectVec4 = function(v) {
    var f = 1.0 / v[3];
    return [v[0] * f, v[1] * f, v[2] * f, 1.0];
};


/** @private */
var SceneJS_math_Plane3 = function (normal, offset, normalize) {
    this.normal = [0.0, 0.0, 1.0 ];

    this.offset = 0.0;
    if (normal && offset) {
        var normal0 = normal[0], normal1 = normal[1], normal2 = normal[2];
        this.offset = offset;

        if (normalize) {
            var s = Math.sqrt(
                    normal0 * normal0 +
                    normal1 * normal1 +
                    normal2 * normal2
                    );
            if (s > 0.0) {
                s = 1.0 / s;
                this.normal[0] = normal0 * s;
                this.normal[1] = normal1 * s;
                this.normal[2] = normal2 * s;
                this.offset *= s;
            }
        }
    }
};

/** @private */
var SceneJS_math_MAX_DOUBLE = Number.POSITIVE_INFINITY;
/** @private */
var SceneJS_math_MIN_DOUBLE = Number.NEGATIVE_INFINITY;

/** @private
 *
 */
var SceneJS_math_Box3 = function(min, max) {
    this.min = min || [ SceneJS_math_MAX_DOUBLE,SceneJS_math_MAX_DOUBLE,SceneJS_math_MAX_DOUBLE ];
    this.max = max || [ SceneJS_math_MIN_DOUBLE,SceneJS_math_MIN_DOUBLE,SceneJS_math_MIN_DOUBLE ];

    /** @private */
    this.init = function(min, max) {
        this.min[0] = min[0];
        this.min[1] = min[1];
        this.min[2] = min[2];
        this.max[0] = max[0];
        this.max[1] = max[1];
        this.max[2] = max[2];
        return this;
    };

    /** @private */
    this.fromPoints = function(points) {
        var pointsLength = points.length;

        for (var i = 0; i < pointsLength; ++i) {
            var points_i3 = points[i][3];
            var pDiv0 = points[i][0] / points_i3;
            var pDiv1 = points[i][1] / points_i3;
            var pDiv2 = points[i][2] / points_i3;

            if (pDiv0 < this.min[0]) {
                this.min[0] = pDiv0;
            }
            if (pDiv1 < this.min[1]) {
                this.min[1] = pDiv1;
            }
            if (pDiv2 < this.min[2]) {
                this.min[2] = pDiv2;
            }

            if (pDiv0 > this.max[0]) {
                this.max[0] = pDiv0;
            }
            if (pDiv1 > this.max[1]) {
                this.max[1] = pDiv1;
            }
            if (pDiv2 > this.max[2]) {
                this.max[2] = pDiv2;
            }
        }
        return this;
    };

    /** @private */
    this.isEmpty = function() {
        return (
                (this.min[0] >= this.max[0]) &&
                (this.min[1] >= this.max[1]) &&
                (this.min[2] >= this.max[2])
                );
    };

    /** @private */
    this.getCenter = function() {
        return [
            (this.max[0] + this.min[0]) / 2.0,
            (this.max[1] + this.min[1]) / 2.0,
            (this.max[2] + this.min[2]) / 2.0
        ];
    };

    /** @private */
    this.getSize = function() {
        return [
            (this.max[0] - this.min[0]),
            (this.max[1] - this.min[1]),
            (this.max[2] - this.min[2])
        ];
    };

    /** @private */
    this.getFacesAreas = function() {
        var s = this.size;
        return [
            (s[1] * s[2]),
            (s[0] * s[2]),
            (s[0] * s[1])
        ];
    };

    /** @private */
    this.getSurfaceArea = function() {
        var a = this.getFacesAreas();
        return ((a[0] + a[1] + a[2]) * 2.0);
    };

    /** @private */
    this.getVolume = function() {
        var s = this.size;
        return (s[0] * s[1] * s[2]);
    };

    /** @private */
    this.getOffset = function(half_delta) {
        this.min[0] -= half_delta;
        this.min[1] -= half_delta;
        this.min[2] -= half_delta;
        this.max[0] += half_delta;
        this.max[1] += half_delta;
        this.max[2] += half_delta;
        return this;
    };
};

/** @private
 *
 * @param min
 * @param max
 */
var SceneJS_math_AxisBox3 = function(min, max) {
    var min0 = min[0], min1 = min[1], min2 = min[2];
    var max0 = max[0], max1 = max[1], max2 = max[2];

    this.verts = [
        [min0, min1, min2],
        [max0, min1, min2],
        [max0, max1, min2],
        [min0, max1, min2],

        [min0, min1, max2],
        [max0, min1, max2],
        [max0, max1, max2],
        [min0, max1, max2]
    ];

    /** @private */
    this.toBox3 = function() {
        var box = new SceneJS_math_Box3();
        for (var i = 0; i < 8; ++i) {
            var v = this.verts[i];
            for (var j = 0; j < 3; ++j) {
                if (v[j] < box.min[j]) {
                    box.min[j] = v[j];
                }
                if (v[j] > box.max[j]) {
                    box.max[j] = v[j];
                }
            }
        }
    };
};

/** @private
 *
 * @param center
 * @param radius
 */
var SceneJS_math_Sphere3 = function(center, radius) {
    this.center = [center[0], center[1], center[2] ];
    this.radius = radius;

    /** @private */
    this.isEmpty = function() {
        return (this.radius === 0.0);
    };

    /** @private */
    this.surfaceArea = function() {
        return (4.0 * Math.PI * this.radius * this.radius);
    };

    /** @private */
    this.getVolume = function() {
        var thisRadius = this.radius;
        return ((4.0 / 3.0) * Math.PI * thisRadius * thisRadius * thisRadius);
    };
};

/** Creates billboard matrix from given view matrix
 * @private
 */
var SceneJS_math_billboardMat = function(viewMatrix) {
    var rotVec = [
        SceneJS_math_getColMat4(viewMatrix, 0),
        SceneJS_math_getColMat4(viewMatrix, 1),
        SceneJS_math_getColMat4(viewMatrix, 2)
    ];

    var scaleVec = [
        SceneJS_math_lenVec4(rotVec[0]),
        SceneJS_math_lenVec4(rotVec[1]),
        SceneJS_math_lenVec4(rotVec[2])
    ];

    var scaleVecRcp = SceneJS_math_mat4();
    SceneJS_math_rcpVec3(scaleVec, scaleVecRcp);
    var sMat = SceneJS_math_scalingMat4v(scaleVec);
    //var sMatInv = SceneJS_math_scalingMat4v(scaleVecRcp);

    SceneJS_math_mulVec4Scalar(rotVec[0], scaleVecRcp[0]);
    SceneJS_math_mulVec4Scalar(rotVec[1], scaleVecRcp[1]);
    SceneJS_math_mulVec4Scalar(rotVec[2], scaleVecRcp[2]);

    var rotMatInverse = SceneJS_math_identityMat4();

    SceneJS_math_setRowMat4(rotMatInverse, 0, rotVec[0]);
    SceneJS_math_setRowMat4(rotMatInverse, 1, rotVec[1]);
    SceneJS_math_setRowMat4(rotMatInverse, 2, rotVec[2]);

    //return rotMatInverse;
    //return SceneJS_math_mulMat4(sMatInv, SceneJS_math_mulMat4(rotMatInverse, sMat));
    return SceneJS_math_mulMat4(rotMatInverse, sMat);
    // return SceneJS_math_mulMat4(sMat, SceneJS_math_mulMat4(rotMatInverse, sMat));
    //return SceneJS_math_mulMat4(sMatInv, SceneJS_math_mulMat4(rotMatInverse, sMat));
};

/** @private */
var SceneJS_math_FrustumPlane = function(nx, ny, nz, offset) {
    var s = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    this.normal = [nx * s, ny * s, nz * s];
    this.offset = offset * s;
    this.testVertex = [
        (this.normal[0] >= 0.0) ? (1) : (0),
        (this.normal[1] >= 0.0) ? (1) : (0),
        (this.normal[2] >= 0.0) ? (1) : (0)];
};

/** @private */
var SceneJS_math_OUTSIDE_FRUSTUM = 3;
/** @private */
var SceneJS_math_INTERSECT_FRUSTUM = 4;
/** @private */
var SceneJS_math_INSIDE_FRUSTUM = 5;

/** @private */
var SceneJS_math_Frustum = function(viewMatrix, projectionMatrix, viewport) {
    var m = SceneJS_math_mat4();
    SceneJS_math_mulMat4(projectionMatrix, viewMatrix, m);

    // cache m indexes
    var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
    var m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7];
    var m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];
    var m12 = m[12], m13 = m[13], m14 = m[14], m15 = m[15];

    //var q = [ m[3], m[7], m[11] ]; just reuse m indexes instead of making new var
    var planes = [
        new SceneJS_math_FrustumPlane(m3 - m0, m7 - m4, m11 - m8, m15 - m12),
        new SceneJS_math_FrustumPlane(m3 + m0, m7 + m4, m11 + m8, m15 + m12),
        new SceneJS_math_FrustumPlane(m3 - m1, m7 - m5, m11 - m9, m15 - m13),
        new SceneJS_math_FrustumPlane(m3 + m1, m7 + m5, m11 + m9, m15 + m13),
        new SceneJS_math_FrustumPlane(m3 - m2, m7 - m6, m11 - m10, m15 - m14),
        new SceneJS_math_FrustumPlane(m3 + m2, m7 + m6, m11 + m10, m15 + m14)
    ];

    /* Resources for LOD
     */
    var rotVec = [
        SceneJS_math_getColMat4(viewMatrix, 0),
        SceneJS_math_getColMat4(viewMatrix, 1),
        SceneJS_math_getColMat4(viewMatrix, 2)
    ];

    var scaleVec = [
        SceneJS_math_lenVec4(rotVec[0]),
        SceneJS_math_lenVec4(rotVec[1]),
        SceneJS_math_lenVec4(rotVec[2])
    ];

    var scaleVecRcp = SceneJS_math_rcpVec3(scaleVec);
    var sMat = SceneJS_math_scalingMat4v(scaleVec);
    var sMatInv = SceneJS_math_scalingMat4v(scaleVecRcp);

    SceneJS_math_mulVec4Scalar(rotVec[0], scaleVecRcp[0]);
    SceneJS_math_mulVec4Scalar(rotVec[1], scaleVecRcp[1]);
    SceneJS_math_mulVec4Scalar(rotVec[2], scaleVecRcp[2]);

    var rotMatInverse = SceneJS_math_identityMat4();

    SceneJS_math_setRowMat4(rotMatInverse, 0, rotVec[0]);
    SceneJS_math_setRowMat4(rotMatInverse, 1, rotVec[1]);
    SceneJS_math_setRowMat4(rotMatInverse, 2, rotVec[2]);

    if (!this.matrix) {
        this.matrix = SceneJS_math_mat4();
    }
    SceneJS_math_mulMat4(projectionMatrix, viewMatrix, this.matrix);
    if (!this.billboardMatrix) {
        this.billboardMatrix = SceneJS_math_mat4();
    }
    SceneJS_math_mulMat4(sMatInv, SceneJS_math_mulMat4(rotMatInverse, sMat), this.billboardMatrix);
    this.viewport = viewport.slice(0, 4);

    /** @private */
    this.textAxisBoxIntersection = function(box) {
        var ret = SceneJS_math_INSIDE_FRUSTUM;
        var bminmax = [ box.min, box.max ];
        var plane = null;

        for (var i = 0; i < 6; ++i) {
            plane = planes[i];
            if (((plane.normal[0] * bminmax[plane.testVertex[0]][0]) +
                 (plane.normal[1] * bminmax[plane.testVertex[1]][1]) +
                 (plane.normal[2] * bminmax[plane.testVertex[2]][2]) +
                 (plane.offset)) < 0.0) {
                return SceneJS_math_OUTSIDE_FRUSTUM;
            }
            if (((plane.normal[0] * bminmax[1 - plane.testVertex[0]][0]) +
                 (plane.normal[1] * bminmax[1 - plane.testVertex[1]][1]) +
                 (plane.normal[2] * bminmax[1 - plane.testVertex[2]][2]) +
                 (plane.offset)) < 0.0) {
                ret = SceneJS_math_INTERSECT_FRUSTUM;
            }
        }
        return ret;
    };

    /** @private */
    this.getProjectedSize = function(box) {
        var diagVec = SceneJS_math_mat4();
        SceneJS_math_subVec3(box.max, box.min, diagVec);

        var diagSize = SceneJS_math_lenVec3(diagVec);

        var size = Math.abs(diagSize);

        var p0 = [
            (box.min[0] + box.max[0]) * 0.5,
            (box.min[1] + box.max[1]) * 0.5,
            (box.min[2] + box.max[2]) * 0.5,
            0.0];

        var halfSize = size * 0.5;
        var p1 = [ -halfSize, 0.0, 0.0, 1.0 ];
        var p2 = [  halfSize, 0.0, 0.0, 1.0 ];

        p1 = SceneJS_math_mulMat4v4(this.billboardMatrix, p1);
        p1 = SceneJS_math_addVec4(p1, p0);
        p1 = SceneJS_math_projectVec4(SceneJS_math_mulMat4v4(this.matrix, p1));

        p2 = SceneJS_math_mulMat4v4(this.billboardMatrix, p2);
        p2 = SceneJS_math_addVec4(p2, p0);
        p2 = SceneJS_math_projectVec4(SceneJS_math_mulMat4v4(this.matrix, p2));

        return viewport[2] * Math.abs(p2[0] - p1[0]);
    };


    this.getProjectedState = function(modelCoords) {
        var viewCoords = SceneJS_math_transformPoints3(this.matrix, modelCoords);

        //var canvasBox = {
        //    min: [10000000, 10000000 ],
        //    max: [-10000000, -10000000]
        //};
        // separate variables instead of indexing an array
        var canvasBoxMin0 = 10000000, canvasBoxMin1 = 10000000;
        var canvasBoxMax0 = -10000000, canvasBoxMax1 = -10000000;

        var v, x, y;

        var arrLen = viewCoords.length;
        for (var i = 0; i < arrLen; ++i) {
            v = SceneJS_math_projectVec4(viewCoords[i]);
            x = v[0];
            y = v[1];

            if (x < -0.5) {
                x = -0.5;
            }

            if (y < -0.5) {
                y = -0.5;
            }

            if (x > 0.5) {
                x = 0.5;
            }

            if (y > 0.5) {
                y = 0.5;
            }


            if (x < canvasBoxMin0) {
                canvasBoxMin0 = x;
            }
            if (y < canvasBoxMin1) {
                canvasBoxMin1 = y;
            }

            if (x > canvasBoxMax0) {
                canvasBoxMax0 = x;
            }
            if (y > canvasBoxMax1) {
                canvasBoxMax1 = y;
            }
        }

        canvasBoxMin0 += 0.5;
        canvasBoxMin1 += 0.5;
        canvasBoxMax0 += 0.5;
        canvasBoxMax1 += 0.5;

        // cache viewport indexes
        var viewport2 = viewport[2], viewport3 = viewport[3];

        canvasBoxMin0 = (canvasBoxMin0 * (viewport2 + 15));
        canvasBoxMin1 = (canvasBoxMin1 * (viewport3 + 15));
        canvasBoxMax0 = (canvasBoxMax0 * (viewport2 + 15));
        canvasBoxMax1 = (canvasBoxMax1 * (viewport3 + 15));

        var diagCanvasBoxVec = SceneJS_math_mat4();
        SceneJS_math_subVec2([canvasBoxMax0, canvasBoxMax1],
                [canvasBoxMin0, canvasBoxMin1],
                diagCanvasBoxVec);
        var diagCanvasBoxSize = SceneJS_math_lenVec2(diagCanvasBoxVec);

        if (canvasBoxMin0 < 0) {
            canvasBoxMin0 = 0;
        }
        if (canvasBoxMax0 > viewport2) {
            canvasBoxMax0 = viewport2;
        }

        if (canvasBoxMin1 < 0) {
            canvasBoxMin1 = 0;
        }
        if (canvasBoxMax1 > viewport3) {
            canvasBoxMax1 = viewport3;
        }
        return {
            canvasBox:  {
                min: [canvasBoxMin0, canvasBoxMin1 ],
                max: [canvasBoxMax0, canvasBoxMax1 ]
            },
            canvasSize: diagCanvasBoxSize
        };
    };
};

var SceneJS_math_identityQuaternion = function() {
    return [ 0.0, 0.0, 0.0, 1.0 ];
};

var SceneJS_math_angleAxisQuaternion = function(x, y, z, degrees) {
    var angleRad = (degrees / 180.0) * Math.PI;
    var halfAngle = angleRad / 2.0;
    var fsin = Math.sin(halfAngle);
    return [
        fsin * x,
        fsin * y,
        fsin * z,
        Math.cos(halfAngle)
    ];
};

var SceneJS_math_mulQuaternions = function(p, q) {
    var p0 = p[0], p1 = p[1], p2 = p[2], p3 = p[3];
    var q0 = q[0], q1 = q[1], q2 = q[2], q3 = q[3];
    return [
        p3 * q0 + p0 * q3 + p1 * q2 - p2 * q1,
        p3 * q1 + p1 * q3 + p2 * q0 - p0 * q2,
        p3 * q2 + p2 * q3 + p0 * q1 - p1 * q0,
        p3 * q3 - p0 * q0 - p1 * q1 - p2 * q2
    ];
};

var SceneJS_math_newMat4FromQuaternion = function(q) {
    var q0 = q[0], q1 = q[1], q2 = q[2], q3 = q[3];
    var tx = 2.0 * q0;
    var ty = 2.0 * q1;
    var tz = 2.0 * q2;
    var twx = tx * q3;
    var twy = ty * q3;
    var twz = tz * q3;
    var txx = tx * q0;
    var txy = ty * q0;
    var txz = tz * q0;
    var tyy = ty * q1;
    var tyz = tz * q1;
    var tzz = tz * q2;
    var m = SceneJS_math_identityMat4();
    SceneJS_math_setCellMat4(m, 0, 0, 1.0 - (tyy + tzz));
    SceneJS_math_setCellMat4(m, 0, 1, txy - twz);
    SceneJS_math_setCellMat4(m, 0, 2, txz + twy);
    SceneJS_math_setCellMat4(m, 1, 0, txy + twz);
    SceneJS_math_setCellMat4(m, 1, 1, 1.0 - (txx + tzz));
    SceneJS_math_setCellMat4(m, 1, 2, tyz - twx);
    SceneJS_math_setCellMat4(m, 2, 0, txz - twy);
    SceneJS_math_setCellMat4(m, 2, 1, tyz + twx);
    SceneJS_math_setCellMat4(m, 2, 2, 1.0 - (txx + tyy));
    return m;
};


//var SceneJS_math_slerp(t, q1, q2) {
//    var result = SceneJS_math_identityQuaternion();
//    var cosHalfAngle = q1[3] * q2[3] + q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2];
//    if (Math.abs(cosHalfAngle) >= 1) {
//        return [ q1[0],q1[1], q1[2], q1[3] ];
//    } else {
//        var halfAngle = Math.acos(cosHalfAngle);
//        var sinHalfAngle = Math.sqrt(1 - cosHalfAngle * cosHalfAngle);
//        if (Math.abs(sinHalfAngle) < 0.001) {
//            return [
//                q1[0] * 0.5 + q2[0] * 0.5,
//                q1[1] * 0.5 + q2[1] * 0.5,
//                q1[2] * 0.5 + q2[2] * 0.5,
//                q1[3] * 0.5 + q2[3] * 0.5
//            ];
//        } else {
//            var a = Math.sin((1 - t) * halfAngle) / sinHalfAngle;
//            var b = Math.sin(t * halfAngle) / sinHalfAngle;
//            return [
//                q1[0] * a + q2[0] * b,
//                q1[1] * a + q2[1] * b,
//                q1[2] * a + q2[2] * b,
//                q1[3] * a + q2[3] * b
//            ];
//        }
//    }
//}

var SceneJS_math_slerp = function(t, q1, q2) {
    //var result = SceneJS_math_identityQuaternion();
    var q13 = q1[3] * 0.0174532925;
    var q23 = q2[3] * 0.0174532925;
    var cosHalfAngle = q13 * q23 + q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2];
    if (Math.abs(cosHalfAngle) >= 1) {
        return [ q1[0],q1[1], q1[2], q1[3] ];
    } else {
        var halfAngle = Math.acos(cosHalfAngle);
        var sinHalfAngle = Math.sqrt(1 - cosHalfAngle * cosHalfAngle);
        if (Math.abs(sinHalfAngle) < 0.001) {
            return [
                q1[0] * 0.5 + q2[0] * 0.5,
                q1[1] * 0.5 + q2[1] * 0.5,
                q1[2] * 0.5 + q2[2] * 0.5,
                q1[3] * 0.5 + q2[3] * 0.5
            ];
        } else {
            var a = Math.sin((1 - t) * halfAngle) / sinHalfAngle;
            var b = Math.sin(t * halfAngle) / sinHalfAngle;
            return [
                q1[0] * a + q2[0] * b,
                q1[1] * a + q2[1] * b,
                q1[2] * a + q2[2] * b,
                (q13 * a + q23 * b) * 57.295779579
            ];
        }
    }
};

var SceneJS_math_normalizeQuaternion = function(q) {
    var len = SceneJS_math_lenVec4([q[0], q[1], q[2], q[3]]);
    return [ q[0] / len, q[1] / len, q[2] / len, q[3] / len ];
};

var SceneJS_math_conjugateQuaternion = function(q) {
    return[-q[0],-q[1],-q[2],q[3]];
};

var SceneJS_math_angleAxisFromQuaternion = function(q) {
    q = SceneJS_math_normalizeQuaternion(q);
    var q3 = q[3];
    var angle = 2 * Math.acos(q3);
    var s = Math.sqrt(1 - q3 * q3);
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
        return {
            x : q[0],
            y : q[1],
            z : q[2],
            angle: angle * 57.295779579
        };
    } else {
        return {
            x : q[0] / s,
            y : q[1] / s,
            z : q[2] / s,
            angle: angle * 57.295779579
        };
    }
};
/** Maps SceneJS node parameter names to WebGL enum names
 * @private
 */
var SceneJS_webgl_enumMap = {
    funcAdd: "FUNC_ADD",
    funcSubtract: "FUNC_SUBTRACT",
    funcReverseSubtract: "FUNC_REVERSE_SUBTRACT",
    zero : "ZERO",
    one : "ONE",
    srcColor:"SRC_COLOR",
    oneMinusSrcColor:"ONE_MINUS_SRC_COLOR",
    dstColor:"DST_COLOR",
    oneMinusDstColor:"ONE_MINUS_DST_COLOR",
    srcAlpha:"SRC_ALPHA",
    oneMinusSrcAlpha:"ONE_MINUS_SRC_ALPHA",
    dstAlpha:"DST_ALPHA",
    oneMinusDstAlpha:"ONE_MINUS_DST_ALPHA",
    contantColor:"CONSTANT_COLOR",
    oneMinusConstantColor:"ONE_MINUS_CONSTANT_COLOR",
    constantAlpha:"CONSTANT_ALPHA",
    oneMinusConstantAlpha:"ONE_MINUS_CONSTANT_ALPHA",
    srcAlphaSaturate:"SRC_ALPHA_SATURATE",
    front: "FRONT",
    back: "BACK",
    frontAndBack: "FRONT_AND_BACK",
    never:"NEVER",
    less:"LESS",
    equal:"EQUAL",
    lequal:"LEQUAL",
    greater:"GREATER",
    notequal:"NOTEQUAL",
    gequal:"GEQUAL",
    always:"ALWAYS",
    cw:"CW",
    ccw:"CCW",
    linear: "LINEAR",
    nearest: "NEAREST",
    linearMipMapNearest : "LINEAR_MIPMAP_NEAREST",
    nearestMipMapNearest : "NEAREST_MIPMAP_NEAREST",
    nearestMipMapLinear: "NEAREST_MIPMAP_LINEAR",
    linearMipMapLinear: "LINEAR_MIPMAP_LINEAR",
    repeat: "REPEAT",
    clampToEdge: "CLAMP_TO_EDGE",
    mirroredRepeat: "MIRRORED_REPEAT",
    alpha:"ALPHA",
    rgb:"RGB",
    rgba:"RGBA",
    luminance:"LUMINANCE",
    luminanceAlpha:"LUMINANCE_ALPHA",
    textureBinding2D:"TEXTURE_BINDING_2D",
    textureBindingCubeMap:"TEXTURE_BINDING_CUBE_MAP",
    compareRToTexture:"COMPARE_R_TO_TEXTURE", // Hardware Shadowing Z-depth,
    unsignedByte: "UNSIGNED_BYTE"
};

var SceneJS_webgl_ProgramUniform = function(context, program, name, type, size, location, logging) {

    var func = null;
    if (type == context.BOOL) {
        func = function (v) {
            context.uniform1i(location, v);
        };
    } else if (type == context.BOOL_VEC2) {
        func = function (v) {
            context.uniform2iv(location, v);
        };
    } else if (type == context.BOOL_VEC3) {
        func = function (v) {
            context.uniform3iv(location, v);
        };
    } else if (type == context.BOOL_VEC4) {
        func = function (v) {
            context.uniform4iv(location, v);
        };
    } else if (type == context.INT) {
        func = function (v) {
            context.uniform1iv(location, v);
        };
    } else if (type == context.INT_VEC2) {
        func = function (v) {
            context.uniform2iv(location, v);
        };
    } else if (type == context.INT_VEC3) {
        func = function (v) {
            context.uniform3iv(location, v);
        };
    } else if (type == context.INT_VEC4) {
        func = function (v) {
            context.uniform4iv(location, v);
        };
    } else if (type == context.FLOAT) {
        func = function (v) {
            context.uniform1f(location, v);
        };
    } else if (type == context.FLOAT_VEC2) {
        func = function (v) {
            context.uniform2fv(location, v);
        };
    } else if (type == context.FLOAT_VEC3) {
        func = function (v) {
            context.uniform3fv(location, v);
        };
    } else if (type == context.FLOAT_VEC4) {
        func = function (v) {
            context.uniform4fv(location, v);
        };
    } else if (type == context.FLOAT_MAT2) {
        func = function (v) {
            context.uniformMatrix2fv(location, context.FALSE, v);
        };
    } else if (type == context.FLOAT_MAT3) {
        func = function (v) {
            context.uniformMatrix3fv(location, context.FALSE, v);
        };
    } else if (type == context.FLOAT_MAT4) {
        func = function (v) {
            context.uniformMatrix4fv(location, context.FALSE, v);
        };
    } else {
        throw "Unsupported shader uniform type: " + type;
    }

    this.setValue = func;


    this.getValue = function() {
        return context.getUniform(program, location);
    };

    this.getLocation = function() {
        return location;
    };
};

var SceneJS_webgl_ProgramSampler = function(context, program, name, type, size, location) {
    this.bindTexture = function(texture, unit) {
        if (texture.bind(unit)) {
            context.uniform1i(location, unit);
            return true;
        }
        return false;
    };
};

/** An attribute within a shader
 */
var SceneJS_webgl_ProgramAttribute = function(context, program, name, type, size, location) {
    // logging.debug("Program attribute found in shader: " + name);
    this.bindFloatArrayBuffer = function(buffer) {
        buffer.bind();
        context.enableVertexAttribArray(location);
        context.vertexAttribPointer(location, buffer.itemSize, context.FLOAT, false, 0, 0);   // Vertices are not homogeneous - no w-element
    };

};

/**
 * A vertex/fragment shader in a program
 *
 * @private
 * @param context WebGL context
 * @param gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
 * @param source Source code for shader
 * @param logging Shader will write logging's debug channel as it compiles
 */
var SceneJS_webgl_Shader = function(context, type, source, logging) {
    this.handle = context.createShader(type);

    //  logging.debug("Creating " + ((type == context.VERTEX_SHADER) ? "vertex" : "fragment") + " shader");
    this.valid = true;

    context.shaderSource(this.handle, source);
    context.compileShader(this.handle);

    if (context.getShaderParameter(this.handle, context.COMPILE_STATUS) != 0) {
        //    logging.debug("Shader compile succeeded:" + context.getShaderInfoLog(this.handle));
    }
    else {
        this.valid = false;
        logging.error("Shader compile failed:" + context.getShaderInfoLog(this.handle));
    }
    if (!this.valid) {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.SHADER_COMPILATION_FAILURE, "Shader program failed to compile");
    }
};

/**
 * A program on an active WebGL context
 *
 * @private
 * @param hash SceneJS-managed ID for program
 * @param context WebGL context
 * @param vertexSources Source codes for vertex shaders
 * @param fragmentSources Source codes for fragment shaders
 * @param logging Program and shaders will write to logging's debug channel as they compile and link
 */
var SceneJS_webgl_Program = function(hash, context, vertexSources, fragmentSources, logging) {
    
    var a, i, u, u_name, location, shader;
    
    this.hash = hash;

    /* Create shaders from sources
     */
    var shaders = [];
    for (i = 0; i < vertexSources.length; i++) {
        shaders.push(new SceneJS_webgl_Shader(context, context.VERTEX_SHADER, vertexSources[i], logging));
    }
    for (i = 0; i < fragmentSources.length; i++) {
        shaders.push(new SceneJS_webgl_Shader(context, context.FRAGMENT_SHADER, fragmentSources[i], logging));
    }

    /* Create program, attach shaders, link and validate program
     */
    var handle = context.createProgram();

    for (i = 0; i < shaders.length; i++) {
        shader = shaders[i];
        if (shader.valid) {
            context.attachShader(handle, shader.handle);
        }
    }
    context.linkProgram(handle);

    this.valid = true;

    this.valid = this.valid && (context.getProgramParameter(handle, context.LINK_STATUS) != 0);

    var debugCfg = SceneJS_debugModule.getConfigs("shading");
    if (debugCfg.validate !== false) {
        context.validateProgram(handle);

        this.valid = this.valid && (context.getProgramParameter(handle, context.VALIDATE_STATUS) != 0);
    }

    if (!this.valid) {
        logging.debug("Program link failed: " + context.getProgramInfoLog(handle));
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.SHADER_LINK_FAILURE, "Shader program failed to link");
    }

    /* Discover active uniforms and samplers
     */
    var uniforms = {};
    var samplers = {};

    var numUniforms = context.getProgramParameter(handle, context.ACTIVE_UNIFORMS);

    /* Patch for http://code.google.com/p/chromium/issues/detail?id=40175)  where
     * gl.getActiveUniform was producing uniform names that had a trailing NUL in Chrome 6.0.466.0 dev
     * Issue ticket at: https://xeolabs.lighthouseapp.com/projects/50643/tickets/124-076-live-examples-blank-canvas-in-chrome-5037599
     */
    for (i = 0; i < numUniforms; ++i) {
        u = context.getActiveUniform(handle, i);
        if (u) {
            u_name = u.name;
            if (u_name[u_name.length - 1] == "\u0000") {
                u_name = u_name.substr(0, u_name.length - 1);
            }
            location = context.getUniformLocation(handle, u_name);
            if ((u.type == context.SAMPLER_2D) || (u.type == context.SAMPLER_CUBE) || (u.type == 35682)) {

                samplers[u_name] = new SceneJS_webgl_ProgramSampler(
                        context,
                        handle,
                        u_name,
                        u.type,
                        u.size,
                        location,
                        logging);
            } else {
                uniforms[u_name] = new SceneJS_webgl_ProgramUniform(
                        context,
                        handle,
                        u_name,
                        u.type,
                        u.size,
                        location,
                        logging);
            }
        }
    }

    /* Discover attributes
     */
    var attributes = {};

    var numAttribs = context.getProgramParameter(handle, context.ACTIVE_ATTRIBUTES);
    for (i = 0; i < numAttribs; i++) {
        a = context.getActiveAttrib(handle, i);
        if (a) {
            location = context.getAttribLocation(handle, a.name);
            attributes[a.name] = new SceneJS_webgl_ProgramAttribute(
                    context,
                    handle,
                    a.name,
                    a.type,
                    a.size,
                    location,
                    logging);
        }
    }

    this.setProfile = function(profile) {
        this._profile = profile;
    };

    this.bind = function() {
        context.useProgram(handle);
        if (this._profile) {
            this._profile.program++;
        }
    };

    this.getUniformLocation = function(name) {
        var u = uniforms[name];
        if (u) {
            return u.getLocation();
        } else {
            // SceneJS_loggingModule.warn("Uniform not found in shader : " + name);
        }
    };

    this.getUniform = function(name) {
        var u = uniforms[name];
        if (u) {
            return u;
        } else {
            //      SceneJS_loggingModule.warn("Shader uniform load failed - uniform not found in shader : " + name);
        }
    };

    this.setUniform = function(name, value) {
        var u = uniforms[name];
        if (u) {
            u.setValue(value);
            if (this._profile) {
                this._profile.uniform++;
            }
        } else {
            //      SceneJS_loggingModule.warn("Shader uniform load failed - uniform not found in shader : " + name);
        }
    };

    this.getAttribute = function(name) {
        var attr = attributes[name];
        if (attr) {
            return attr;
        } else {
            //  logging.warn("Shader attribute bind failed - attribute not found in shader : " + name);
        }
    };

    this.bindFloatArrayBuffer = function(name, buffer) {
        var attr = attributes[name];
        if (attr) {
            attr.bindFloatArrayBuffer(buffer);
            if (this._profile) {
                this._profile.varying++;
            }
        } else {
            //  logging.warn("Shader attribute bind failed - attribute not found in shader : " + name);
        }
    };

    this.bindTexture = function(name, texture, unit) {
        var sampler = samplers[name];
        if (sampler) {
            if (this._profile) {
                this._profile.texture++;
            }
            return sampler.bindTexture(texture, unit);
        } else {
            return false;
        }
    };

    this.unbind = function() {
        //     context.useProgram(0);
    };

    this.destroy = function() {
        if (this.valid) {
            //   logging.debug("Destroying shader program: '" + hash + "'");
            context.deleteProgram(handle);
            for (var s in shaders) {
                context.deleteShader(shaders[s].handle);
            }
            attributes = null;
            uniforms = null;
            samplers = null;
            this.valid = false;
        }
    };
};

var SceneJS_webgl_Texture2D = function(context, cfg, onComplete) {

    this._init = function(image) {
        image = SceneJS_webgl_ensureImageSizePowerOfTwo(image);
        this.canvas = cfg.canvas;
        this.textureId = cfg.textureId;
        this.handle = context.createTexture();
        this.target = context.TEXTURE_2D;
        this.minFilter = cfg.minFilter;
        this.magFilter = cfg.magFilter;
        this.wrapS = cfg.wrapS;
        this.wrapT = cfg.wrapT;
        this.update = cfg.update;  // For dynamically-sourcing textures (ie movies etc)
        context.bindTexture(this.target, this.handle);
        try {
            context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image); // New API change
        } catch (e) {
            //            context.texImage2D(context.TEXTURE_2D, 0, image, cfg.flipY); // Fallback for old browser
            context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image, null);
        }
        this.format = context.RGBA;
        this.width = image.width;
        this.height = image.height;
        this.isDepth = false;
        this.depthMode = 0;
        this.depthCompareMode = 0;
        this.depthCompareFunc = 0;
        if (cfg.minFilter) {
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, cfg.minFilter);
        }
        if (cfg.magFilter) {
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, cfg.magFilter);
        }
        if (cfg.wrapS) {
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, cfg.wrapS);
        }
        if (cfg.wrapT) {
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, cfg.wrapT);
        }
        if (cfg.minFilter == context.NEAREST_MIPMAP_NEAREST ||
            cfg.minFilter == context.LINEAR_MIPMAP_NEAREST ||
            cfg.minFilter == context.NEAREST_MIPMAP_LINEAR ||
            cfg.minFilter == context.LINEAR_MIPMAP_LINEAR) {
            context.generateMipmap(context.TEXTURE_2D);
        }
        context.bindTexture(this.target, null);
        if (onComplete) {
            onComplete(this);
        }
    };

    if (cfg.image) {
        this._init(cfg.image);
    } else {
        if (!cfg.url) {
            throw "texture 'image' or 'url' expected";
        }
        var self = this;
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            self._init(img);
        };
        img.src = cfg.url;
    }

    this.bind = function(unit) {
        if (this.handle) {
            context.activeTexture(context["TEXTURE" + unit]);
            context.bindTexture(this.target, this.handle);
            if (this.update) {
                this.update(context);
            }
            return true;
        }
        return false;
    };

    this.unbind = function(unit) {
        if (this.handle) {
            context.activeTexture(context["TEXTURE" + unit]);
            context.bindTexture(this.target, null);
        }
    };

    this.generateMipmap = function() {
        if (this.handle) {
            context.generateMipmap(context.TEXTURE_2D);
        }
    };

    this.destroy = function() {
        if (this.handle) {
            context.deleteTexture(this.handle);
            this.handle = null;
        }
    };
};

function SceneJS_webgl_ensureImageSizePowerOfTwo(image) {
    if (!SceneJS_webgl_isPowerOfTwo(image.width) || !SceneJS_webgl_isPowerOfTwo(image.height)) {
        var canvas = document.createElement("canvas");
        canvas.width = SceneJS_webgl_nextHighestPowerOfTwo(image.width);
        canvas.height = SceneJS_webgl_nextHighestPowerOfTwo(image.height);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image,
                0, 0, image.width, image.height,
                0, 0, canvas.width, canvas.height);
        image = canvas;
    }
    return image;
}

function SceneJS_webgl_isPowerOfTwo(x) {
    return (x & (x - 1)) == 0;
}

function SceneJS_webgl_nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}

/** Buffer for vertices and indices
 *
 * @private
 * @param context  WebGL context
 * @param type     Eg. ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER
 * @param values   WebGL array wrapper
 * @param numItems Count of items in array wrapper
 * @param itemSize Size of each item
 * @param usage    Eg. STATIC_DRAW
 */

var SceneJS_webgl_ArrayBuffer;
(function() {
    var bufMap = new SceneJS_Map();
    SceneJS_webgl_ArrayBuffer = function(context, type, values, numItems, itemSize, usage) {
        this.handle = context.createBuffer();
        this.id = bufMap.addItem(this);
        context.bindBuffer(type, this.handle);
        context.bufferData(type, values, usage);
        this.handle.numItems = numItems;
        this.handle.itemSize = itemSize;
        context.bindBuffer(type, null);

        this.type = type;
        this.numItems = numItems;
        this.itemSize = itemSize;

        this.bind = function() {
            context.bindBuffer(type, this.handle);
        };

        this.setData = function(data, offset) {
            if (offset || offset === 0) {
                context.bufferSubData(type, offset, new Float32Array(data));
            } else {
                context.bufferData(type, new Float32Array(data));
            }
        };

        this.unbind = function() {
            context.bindBuffer(type, null);
        };

        this.destroy = function() {
            context.deleteBuffer(this.handle);
            bufMap.removeItem(this.id);
        };
    };
})();


var SceneJS_webgl_VertexBuffer;
(function() {
    var bufMap = new SceneJS_Map();
    SceneJS_webgl_VertexBuffer = function(context, values) {
        this.handle = context.createBuffer();
        this.id = bufMap.addItem(this);
        context.bindBuffer(context.ARRAY_BUFFER, this.handle);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array(values), context.STATIC_DRAW);
        context.bindBuffer(context.ARRAY_BUFFER, null);

        this.bind = function() {
            context.bindBuffer(context.ARRAY_BUFFER, this.handle);
        };

        this.setData = function(data, offset) {
            if (offset) {
                context.bufferSubData(context.ARRAY_BUFFER, offset, new Float32Array(data));
            } else {
                context.bufferData(context.ARRAY_BUFFER, new Float32Array(data));
            }

            //             gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementVBO);
            //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
        };

        this.unbind = function() {
            context.bindBuffer(context.ARRAY_BUFFER, null);
        };

        this.destroy = function() {
            context.deleteBuffer(this.handle);
            bufMap.removeItem(this.id);
        };
    };
})();
//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

var WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Map of valid enum function argument positions.
 */

var glValidEnumContexts = {

       // Generic setters and getters

       'enable': { 0:true },
       'disable': { 0:true },
       'getParameter': { 0:true },

       // Rendering

       'drawArrays': { 0:true },
       'drawElements': { 0:true, 2:true },

       // Shaders

       'createShader': { 0:true },
       'getShaderParameter': { 1:true },
       'getProgramParameter': { 1:true },

       // Vertex attributes

       'getVertexAttrib': { 1:true },
       'vertexAttribPointer': { 2:true },

       // Textures

       'bindTexture': { 0:true },
       'activeTexture': { 0:true },
       'getTexParameter': { 0:true, 1:true },
       'texParameterf': { 0:true, 1:true },
       'texParameteri': { 0:true, 1:true, 2:true },
       'texImage2D': { 0:true, 2:true, 6:true, 7:true },
       'texSubImage2D': { 0:true, 6:true, 7:true },
       'copyTexImage2D': { 0:true, 2:true },
       'copyTexSubImage2D': { 0:true },
       'generateMipmap': { 0:true },

       // Buffer objects

       'bindBuffer': { 0:true },
       'bufferData': { 0:true, 2:true },
       'bufferSubData': { 0:true },
       'getBufferParameter': { 0:true, 1:true },

       // Renderbuffers and framebuffers

       'pixelStorei': { 0:true, 1:true },
       'readPixels': { 4:true, 5:true },
       'bindRenderbuffer': { 0:true },
       'bindFramebuffer': { 0:true },
       'checkFramebufferStatus': { 0:true },
       'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
       'framebufferTexture2D': { 0:true, 1:true, 2:true },
       'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
       'getRenderbufferParameter': { 0:true, 1:true },
       'renderbufferStorage': { 0:true, 1:true },

       // Frame buffer operations (clear, blend, depth test, stencil)

       'clear': { 0:true },
       'depthFunc': { 0:true },
       'blendFunc': { 0:true, 1:true },
       'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
       'blendEquation': { 0:true },
       'blendEquationSeparate': { 0:true, 1:true },
       'stencilFunc': { 0:true },
       'stencilFuncSeparate': { 0:true, 1:true },
       'stencilMaskSeparate': { 0:true },
       'stencilOp': { 0:true, 1:true, 2:true },
       'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

       // Culling

       'cullFace': { 0:true },
       'frontFace': { 0:true }
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums == null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Returns true if 'value' matches any WebGL enum, and the i'th parameter
 * of the WebGL function 'fname' is expected to be (any) enum. Does not
 * check that 'value' is actually a valid i'th parameter to 'fname', as
 * that will be checked by the WebGL implementation itself.
 *
 * @param {string} fname the GL function to use for screening the enum
 * @param {integer} i the parameter index to use for screening the enum
 * @param {any} value the value to check for being a valid i'th parameter to 'fname'
 * @return {boolean} true if value matches one of the defined WebGL enums,
 *         and the i'th parameter to 'fname' is expected to be an enum
 *
 * @author Tomi Aarnio
 */
function mightBeValidEnum(fname, i, value) {
       if (!mightBeEnum(value)) return false;
       return (fname in glValidEnumContexts) && (i in glValidEnumContexts[fname]);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
function makeDebugContext(ctx, opt_onErrorFunc) {
  init(ctx);
  function formatFunctionCall(functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii == 0) ? '' : ', ') +
              (mightBeEnum(args[ii]) ? glEnumToString(args[ii]) : args[ii]);
        }
        return functionName +  "(" + argStr + ")";
      }

  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        alert("WebGL error "+ glEnumToString(err) + " in "+
            formatFunctionCall(functionName, args));
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  var tracing = false;

  ctx.setTracing = function (newTracing) {
      if (!tracing && newTracing) {
        log('gl.setTracing(' + newTracing + ');');
      }
      tracing = newTracing;
  };

  var escapeDict = {
    '\'' : '\\\'',
    '\"' : '\\\"',
    '\\' : '\\\\',
    '\b' : '\\b',
    '\f' : '\\f',
    '\n' : '\\n',
    '\r' : '\\r',
    '\t' : '\\t'
  };

  function quote(s) {
    var q = '\'';
    var l = s.length;
    for (var i = 0; i < l; i++) {
        var c = s.charAt(i);
        var d = s.charCodeAt(i);
        var e = escapeDict[c];
        if ( e != undefined ) {
            q += e;
        } else if ( d < 32 || d >= 128 ) {
            var h = '000' + d.toString(16);
            q += '\\u' + h.substring(h.length - 4);
        } else {
            q += s.charAt(i);
        }
    }
    q += '\'';
    return q;
  }

  function genSymMaker(name) {
      var counter = 0;
      return function() {
          var sym = name + counter;
          counter++;
          return sym;
      };
  }

  var constructorDict = {
    "createBuffer" : genSymMaker("buffer"),
    "createFrameBuffer": genSymMaker("frameBuffer"),
    "createProgram": genSymMaker("program"),
    "createRenderbuffer": genSymMaker("renderBuffer"),
    "createShader": genSymMaker("shader"),
    "createTexture": genSymMaker("texture"),
    "getUniformLocation": genSymMaker("uniformLocation"),
    "readPixels": genSymMaker("pixels")
  };

  var objectNameProperty = '__webgl_trace_name__';

  var arrayTypeDict = {
    "[object WebGLByteArray]" : "WebGLByteArray",
    "[object WebGLUnsignedByteArray]" : "WebGLUnsignedByteArray",
    "[object WebGLShortArray]" : "WebGLShortArray",
    "[object Uint16Array]" : "Uint16Array",
    "[object WebGLIntArray]" : "WebGLIntArray",
    "[object WebGLUnsignedIntArray]" : "WebGLUnsignedIntArray",
    "[object Float32Array]" : "Float32Array"
  };

  function asWebGLArray(a) {
    var arrayType = arrayTypeDict[a];
    if (arrayType === undefined) {
        return undefined;
    }
    var buf = 'new ' + arrayType + '( [';
    // for (var i = 0; i < a.length; i++) {
    //     if (i > 0 ) {
    //         buf += ', ';
    //     }
    //     buf += a.get(i);
    // }
    buf += '] )';
    return buf;
  }

  function traceFunctionCall(functionName, args) {
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
            var arg = args[ii];
            if ( ii > 0 ) {
                argStr += ', ';
            }
            var objectName;
            try {
            if (arg !== null && arg !== undefined) {
                objectName = arg[objectNameProperty];
            }
            } catch (e) {
                alert(functionName);
                throw e;
            }
            var webGLArray = asWebGLArray(arg);
            if (objectName != undefined ) {
                argStr += objectName;
            } else if (webGLArray != undefined) {
                argStr += webGLArray;
            }else if (typeof(arg) == "string") {
                argStr += quote(arg);
            } else if ( mightBeValidEnum(functionName, ii, arg) ) {
                argStr += 'gl.' + glEnumToString(arg);
            } else {
                argStr += arg;
            }
        }
        return "gl." + functionName +  "(" + argStr + ");";
  }

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      var resultName;
      if (tracing) {
          var prefix = '';
          // Should we remember the result for later?
          var objectNamer = constructorDict[functionName];
          if (objectNamer != undefined) {
              resultName = objectNamer();
              prefix = 'var ' + resultName + ' = ';
          }
          log(prefix + traceFunctionCall(functionName, arguments));
      }

      var result = ctx[functionName].apply(ctx, arguments);

      if (tracing && resultName != undefined) {
          result[objectNameProperty] = resultName;
      }

      var err = ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
      wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       wrapper[propertyName] = ctx[propertyName];
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

return {
  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
   *            funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   */
  'makeDebugContext': makeDebugContext
};

}();
/**
 * Backend module that defines SceneJS events and provides an interface on the backend context through which
 * backend modules can fire and subscribe to them.
 *
 * Events are actually somewhat more like commands; they are always synchronous, and are often used to decouple the
 * transfer of data between backends, request events in response, and generally trigger some immediate action.
 *
 * Event subscription can optionally be prioritised, to control the order in which the subscriber will be notified of
 * a given event relative to other suscribers. This is useful, for example, when a backend must be the first to handle
 * an INIT, or the last to handle a RESET.
 *
 * @private
 */
var SceneJS_eventModule = new (function() {

    this.ERROR = 0;
    this.INIT = 1;                          // SceneJS framework initialised
    this.RESET = 2;                         // SceneJS framework reset
    this.TIME_UPDATED = 3;                  // System time updated
    this.SCENE_CREATED = 4;                 // Scene has just been created
    this.SCENE_IDLE = 5;                    // Scene maybe about to be compiled and redrawn
    this.SCENE_COMPILING = 6;               // Scene about to be compiled and drawn
    this.SCENE_COMPILED = 7;                // Scene just been completely traversed
    this.SCENE_DESTROYED = 8;               // Scene just been destroyed
    this.RENDERER_UPDATED = 9;              // Current WebGL context has been updated to the given state
    this.RENDERER_EXPORTED = 10;            // Export of the current WebGL context state
    this.CANVAS_DEACTIVATED = 11;
    this.GEOMETRY_UPDATED = 13;
    this.GEOMETRY_EXPORTED = 14;
    this.MODEL_TRANSFORM_UPDATED = 15;
    this.MODEL_TRANSFORM_EXPORTED = 16;
    this.PROJECTION_TRANSFORM_UPDATED = 17;
    this.PROJECTION_TRANSFORM_EXPORTED = 18;
    this.VIEW_TRANSFORM_UPDATED = 19;
    this.VIEW_TRANSFORM_EXPORTED = 20;
    this.LIGHTS_UPDATED = 21;
    this.LIGHTS_EXPORTED = 22;
    this.MATERIAL_UPDATED = 23;
    this.MATERIAL_EXPORTED = 24;
    this.TEXTURES_UPDATED = 25;
    this.TEXTURES_EXPORTED = 26;
    this.SHADER_ACTIVATE = 27;
    this.SHADER_ACTIVATED = 28;
    this.SCENE_RENDERING = 29;
    this.LOGGING_ELEMENT_ACTIVATED = 37;
    this.PICK_COLOR_EXPORTED = 38;
    this.NODE_CREATED = 39;
    this.NODE_UPDATED = 40;
    this.NODE_DESTROYED = 41;




    /* Priority queue for each type of event
     */
    var events = new Array(37);

    /**
     * Registers a handler for the given event
     *
     * The handler can be registered with an optional priority number which specifies the order it is
     * called among the other handler already registered for the event.
     *
     * So, with n being the number of commands registered for the given event:
     *
     * (priority <= 0)      - command will be the first called
     * (priority >= n)      - command will be the last called
     * (0 < priority < n)   - command will be called at the order given by the priority
     * @private
     * @param type Event type - one of the values in SceneJS_eventModule
     * @param command - Handler function that will accept whatever parameter object accompanies the event
     * @param priority - Optional priority number (see above)
     */
    this.addListener = function(type, command, priority) {
        var list = events[type];
        if (!list) {
            list = [];
            events[type] = list;
        }
        var handler = {
            command: command,
            priority : (priority == undefined) ? list.length : priority
        };
        for (var i = 0; i < list.length; i++) {
            if (list[i].priority > handler.priority) {
                list.splice(i, 0, handler);
                return;
            }
        }
        list.push(handler);
    };

    /**
     * @private
     */
    this.fireEvent = function(type, params) {
        var list = events[type];
        if (list) {
            if (!params) {
                params = {};
            }
            for (var i = 0; i < list.length; i++) {
                list[i].command(params);
            }
        }
    };
})();


SceneJS.bind = function(name, func) {
    switch (name) {

        /**
         * @event error
         * Fires when the data cache has changed in a bulk manner (e.g., it has been sorted, filtered, etc.) and a
         * widget that is using this Store as a Record cache should refresh its view.
         * @param {Store} this
         */
        case "error" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.ERROR,
                function(params) {
                    func({
                        code: params.code,
                        errorName: params.errorName,
                        exception: params.exception,
                        fatal: params.fatal
                    });
                });
            break;

        case "reset" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.RESET,
                function() {
                    func();
                });
            break;

        case "scene-created" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.SCENE_CREATED,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        case "node-created" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.NODE_CREATED,
                function(params) {
                    func({
                        nodeId : params.nodeId,
                        json: params.json
                    });
                });
            break;

        case "node-updated" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.NODE_UPDATED,
                function(params) {
                    func({
                        nodeId : params.nodeId
                    });
                });
            break;

        case "node-destroyed" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.NODE_DESTROYED,
                function(params) {
                    func({
                        nodeId : params.nodeId
                    });
                });
            break;

        case "scene-rendering" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.SCENE_COMPILING,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;       

        case "scene-rendered" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.SCENE_COMPILED,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        case "scene-destroyed" : SceneJS_eventModule.addListener(
                SceneJS_eventModule.SCENE_DESTROYED,
                function(params) {
                    func({
                        sceneId : params.sceneId
                    });
                });
            break;

        default:
            throw SceneJS_errorModule.fatalError("SceneJS.bind - this event type not supported: '" + name + "'");
    }
};

SceneJS.addListener = SceneJS.onEvent = SceneJS.bind;
var SceneJS_compileCfg = new (function() {

    /*-----------------------------------------------------------------------------------------------------------------
     * CONFIGURATION
     *
     *----------------------------------------------------------------------------------------------------------------*/

    /* Compilation levels - these are also the priorities in which the
     * compilations are queued (when queuing is applicable).
     */
    this.COMPILE_NOTHING = -2;  // Do nothing
    this.REDRAW = -1;           // Compile nothing and redraw the display list
    this.COMPILE_SCENE = 0;     // Compile entire scene graph
    this.COMPILE_BRANCH = 1;    // Compile node, plus path to root, plus subnodes
    this.COMPILE_PATH = 2;      // Compile node plus path to root
    this.RESORT = 3;            // Resort display list and redraw

    /* Level names for logging
     */
    this.levelNameStrings = ["COMPILE_SCENE","COMPILE_BRANCH","COMPILE_SUBTREE", "COMPILE_PATH","COMPILE_NODE"];

    /**
     * Configures recompilation behaviour on a per-node basis
     *
     *      Default is always COMPILE_SCENE
     *
     *      Configs for base node type overrides configs for subtypes
     *
     *      COMPILE_SCENE for structure updates
     *
     *      DOCS: http://scenejs.wikispaces.com/Scene+Graph+Compilation
     */
    this.config = {

        /* Configs for base node type overrides configs for subtypes
         */
        "node": {

            "add" : {
                attr: {
                    "node": {
                        level: this.COMPILE_SCENE
                    },

                    "nodes": {
                        level: this.COMPILE_SCENE
                    }
                },

                level: this.COMPILE_SCENE
            },

            "remove" : {
                attr: {
                    "node" : {
                        level: this.RESORT
                    },
                    "nodes" : {
                        level: this.RESORT
                    }
                },
                level: this.COMPILE_SCENE
            },

            "insert" : {
                attr: {
                    "node" : {
                        level: this.COMPILE_SCENE
                    }
                },
                level: this.COMPILE_SCENE
            },

            "bind": {
                attr: {
                    "rendered": {
                        level: this.COMPILE_SCENE
                    }
                }
            },

            "unbind": {
                attr: {
                    "rendered": {
                        level: this.COMPILE_SCENE
                    }
                }
            },

            "destroyed": {
                level: this.COMPILE_SCENE
            }
        },

        "billboard": {
            alwaysCompile: true
        },

        "clip": {
            set: {
                level: this.COMPILE_BRANCH
            },
            inc: {
                level: this.COMPILE_BRANCH
            }
        },

        "colortrans": {
            set: {
                level: this.REDRAW
            },
            inc: {
                level: this.REDRAW
            },
            mul: {
                level: this.REDRAW
            }
        },               

        "layer": {
            "set" : {
                attr: {
                    "priority": {
                        level: this.RESORT
                    },
                    "enabled": {
                        level: this.RESORT
                    }
                }
            }
        },

        "lights": {
        },

        "scene" : {
            "created" : {
                level: this.COMPILE_SCENE
            },
            "start" : {
                level: this.COMPILE_SCENE
            },
            set: {
                attr: {
                    "tagMask": {

                        /* Enabling/disabling nodes will change the sequence of states
                         * in draw list, so draw list resort needed
                         */
                        level: this.RESORT
                    }
                }
            }
        },

        "scale": {
            set: {
                level: this.COMPILE_BRANCH
            },
            inc: {
                level: this.COMPILE_BRANCH
            }
        },

        "stationary": {
            alwaysCompile: true
        },

        "tag" : {
            set: {
                attr: {
                    "tag": {

                        /* Enabling/disabling nodes will change the sequence of states
                         * in draw list, so draw list resort needed
                         */
                        level: this.RESORT
                    }
                }
            }
        },

        "rotate": {
            set: {
                level: this.COMPILE_BRANCH
            },
            inc: {
                level: this.COMPILE_BRANCH
            }
        },

        "translate": {
            set: {
                level: this.COMPILE_BRANCH
            },
            inc: {
                level: this.COMPILE_BRANCH
            }
        },

        "quaternion": {
            set: {
                level: this.COMPILE_BRANCH
            },
            add: {
                level: this.COMPILE_BRANCH
            }
        },

        "matrix": {
            set: {
                level: this.COMPILE_BRANCH
            }
        },

        "xform": {
            set: {
                level: this.REDRAW
            }
        },

        "material": {
            set: {
                level: this.REDRAW
            }
        },

        "lookAt": {
            set: {
                level: this.COMPILE_PATH
            },
            inc: {
                level: this.COMPILE_PATH
            }
        },

        "camera": {
            set: {
                level: this.COMPILE_PATH
            },
            inc: {
                level: this.COMPILE_PATH
            }
        },

        "morphGeometry": {
            set: {
                level: this.REDRAW
            },
            "loaded": {
                level: this.REDRAW
            }
        },

        "texture": {
            set: {
                attr: {
                    layers: {
                        level: this.REDRAW
                    }
                }
            },
            "loaded" : {
                level: this.REDRAW
            }
        },

        "geometry": {
            set: {
                attr: {
                    positions: {
                        level: this.REDRAW
                    },
                    normals: {
                        level: this.REDRAW
                    },
                    uv: {
                        level: this.REDRAW
                    },
                    uv2: {
                        level: this.REDRAW
                    },
                    indices: {
                        level: this.REDRAW
                    }
                }
            },

            "loaded": {
                level: this.COMPILE_SCENE
            }
        },

        /* Recompile texture node once it has loaded
         */
        "text": {

            "loadedImage": {
                level: this.COMPILE_BRANCH
            }
        },

        "shader": {
            set: {
                attr: {
                    params: {
                        level: this.REDRAW
                    }
                }
            }
        },

        "shaderParams": {
            set: {
                attr: {
                    params: {
                        level: this.REDRAW
                    }
                }
            }
        },

        "flags": {
            "set" : {
                attr: {
                    "flags": {

                        /* Enabling/disabling nodes will change the sequence of states
                         * in draw list, so draw list resort needed
                         */
                        level: this.RESORT
                    }
                }
            },

            "add" : {
                attr: {

                    /* "add" op is used to overwrite flags
                     */
                    "flags": {

                        attr: {

                            level: this.RESORT
                        }
                    }
                }
            }
        }
    };

    /**
     * Gets the level of compilation required after an update of the given type
     * to an attribute of the given node type.
     *
     * @param {String} nodeType Type of node - eg. "rotate", "lookAt" etc.
     * @param {String} op Type of update (optional) - eg. "set", "get", "inc"
     * @param {String} name Name of updated attribute (optional) - eg. "angle", "eye", "baseColor"
     * @param {{String:Object}} value Value for the attribute (optional) - when a map, the lowest compilation level among the keys will be returned
     * @return {Number} Number from [0..5] indicating level of compilation required
     */
    this.getCompileLevel = function(nodeType, op, name, value) {
        var config = this.config[nodeType];
        if (config) {

            /*-------------------------------------------------------------
             * Got config for node
             *-----------------------------------------------------------*/

            if (op) {
                var opConfig = config[op];
                if (opConfig) {

                    /*-------------------------------------------------------------
                     * Got config for [node, op]
                     *-----------------------------------------------------------*/

                    if (opConfig.attr) {
                        if (name) {
                            var attrConfig = opConfig.attr[name];
                            if (attrConfig) {

                                /*-------------------------------------------------------------
                                 * Got config for [node, op, attribute]
                                 *-----------------------------------------------------------*/

                                if (value) {
                                    if (typeof (value) == "object") {
                                        var subAttrConfig = attrConfig.attr;
                                        if (subAttrConfig) {

                                            /*-------------------------------------------------------------
                                             * Got config for [node, op, attribute, sub-attributes]
                                             *
                                             * Try to find the most general (lowest) compilation level
                                             * among the levels for sub-attributes.
                                             *-----------------------------------------------------------*/


                                            var lowestLevel;
                                            var valueConfig;
                                            for (var subAttrName in value) {
                                                if (value.hasOwnProperty(subAttrName)) {
                                                    valueConfig = subAttrConfig[subAttrName];
                                                    if (valueConfig) {
                                                        if (valueConfig.level != undefined) {
                                                            if (lowestLevel == undefined || (valueConfig.level < lowestLevel)) {
                                                                lowestLevel = valueConfig.level;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            if (lowestLevel) {
                                                return lowestLevel;
                                            }
                                        }
                                    }
                                }

                                /*-------------------------------------------------------------
                                 * Try fall back to [node, op, attribute]
                                 *-----------------------------------------------------------*/

                                if (attrConfig.level != undefined) {  // Level found for attribute
                                    return attrConfig.level;
                                }
                            }
                        }
                    }

                    /*-------------------------------------------------------------
                     * Try fall back to [node, op]
                     *-----------------------------------------------------------*/

                    if (opConfig.level != undefined) {
                        return opConfig.level;
                    }
                }
            }

            /*-------------------------------------------------------------
             * Try fall back to [node]
             *-----------------------------------------------------------*/

            if (config.level != undefined) {
                return config.level;
            }
        }

        /*-------------------------------------------------------------
         * No config found for node
         *-----------------------------------------------------------*/

        return undefined;
    };

})();
/*----------------------------------------------------------------------------------------------------------------

 * Scene Compilation
 *
 * DOCS: http://scenejs.wikispaces.com/Scene+Graph+Compilation
 *
 *--------------------------------------------------------------------------------------------------------------*/

var SceneJS_compileModule = new (function() {

    this._debugCfg = null;

    /* Compile enabled by default
     */
    this._enableCompiler = true;

    /** Tracks compilation states for each scene
     */
    this._scenes = {};
    this._scene = null;


    /* Stack to track nodes during scene traversal.
     */
    this._nodeStack = [];
    this._stackLen = 0;

    /*-----------------------------------------------------------------------------------------------------------------
     * Priority queue of compilations, optimised for minimal garbage collection and implicit sort. Each entry has 
     * a scene graph node and a compilation level. Entries are ordered in descending order of compilation level.
     *---------------------------------------------------------------------------------------------------------------*/

    var CompilationQueue = function() {
        this._bins = [];
        this.size = 0;

        this.insert = function(level, node) {
            var bin = this._bins[level];
            if (!bin) {
                bin = this._bins[level] = [];
                bin.numNodes = 0;
            }
            var compilation = bin[bin.numNodes];
            if (!compilation) {
                compilation = bin[bin.numNodes] = {};
            }
            compilation.node = node;
            compilation.level = level;
            bin.numNodes++;
            this.size++;
        };

        this.remove = function() {
            var bin;
            for (var level = SceneJS_compileCfg.COMPILE_NOTHING; level <= SceneJS_compileCfg.RESORT; level++) {
                bin = this._bins[level];
                if (bin && bin.numNodes > 0) {
                    this.size--;
                    return bin[--bin.numNodes];
                }
            }
            return null;
        };

        this.clear = function() {
            var bin;
            for (var level = SceneJS_compileCfg.COMPILE_NOTHING; level <= SceneJS_compileCfg.RESORT; level++) {
                bin = this._bins[level];
                if (bin) {
                    this._bins[level].numNodes = 0;
                }
            }
            this.size = 0;
        };
    };

    var self = this;
    SceneJS_eventModule.addListener(
            SceneJS_eventModule.INIT,
            function() {
                self._debugCfg = SceneJS_debugModule.getConfigs("compilation");
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_CREATED,
            function(params) {
                self._scenes[params.sceneId] = {
                    flagSceneCompile: false,
                    dirtyNodes: {},
                    dirtyNodesWithinBranches : {},

                    /* Incremented when we traverse into a node that is flagged for
                     * entire subtree compilation, decremented on return
                     */
                    countTraversedSubtreesToCompile : 0,
                    compilationQueue : new CompilationQueue(),

                    /**
                     * Tracks highest compilation level selected for each node that compiler receives update notification on.
                     * Is emptied after compilation. A notification that would result in lower compilation level than already stored
                     * for each node are ignored.
                     * Array eleared on exit from scheduleCompilations
                     */
                    nodeCompilationLevels : {},

                    /* Flag for each node indicating if it must always be recompiled
                     */
                    nodeAlwaysCompile : {},

                    stats: {
                        nodes: 0
                    }
                };
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_DESTROYED,
            function(params) {
                self._scenes[params.sceneId] = null;
            });

    /*-----------------------------------------------------------------------------------------------------------------
     * NOTIFICATION
     *
     *----------------------------------------------------------------------------------------------------------------*/

    /**
     * Notifies compilation module that a redraw of the given scene is required
     */
    this.redraw = function(sceneId) {
        if (!this._enableCompiler) {
            return;
        }
        var compileScene = this._scenes[sceneId];
        if (compileScene.compilingScene) {
            return;
        }
        compileScene.redraw = true;
    };

    /**
     * Notifies compilation module that a node has been modified
     *
     * This function references compileConfig to find the level as
     * configured there. It falls back on default levels as configured,
     * falling back on a complete re-compile when no configs can be found.
     *
     * @param {String} nodeType Type of node - eg. "rotate", "lookAt" etc.
     * @param {String} op Type of update (optional) - eg. "set", "get", "inc"
     * @param {String} attrName Name of updated attribute (optional) - eg. "angle", "eye", "baseColor"
     * @param {{String:Object}} value Value for the attribute (optional) - when a map, the lowest compilation level among the keys will be returned
     */
    this.nodeUpdated = function(node, op, attrName, value) {

        if (!this._enableCompiler) {
            return;
        }
        var nodeScene = node.scene;
        var compileScene = this._scenes[nodeScene.attr.id];

        if (compileScene.compilingScene) {
            return;
        }

        var nodeType = node.attr.type;
        var nodeId = node.attr.id;
        var level;

        /* Compilation configs for base node type overrides configs for subtypes
         */
        if (nodeType != "node") {
            level = SceneJS_compileCfg.getCompileLevel("node", op, attrName, value);
        }

        /* When no config found for base type then find for subtype
         */
        if (level === undefined) {
            level = SceneJS_compileCfg.getCompileLevel(nodeType, op, attrName, value);
        }

        if (level == SceneJS_compileCfg.REDRAW) {
            compileScene.redraw = true;
            return;
        }

        if (level == SceneJS_compileCfg.COMPILE_NOTHING) {
            return;
        }

        if (level === undefined) {
            level = SceneJS_compileCfg.COMPILE_SCENE;
        }

        if (level == SceneJS_compileCfg.COMPILE_SCENE) {
            compileScene.compilingScene = true;
            compileScene.compilationQueue.clear();
            return;
        }

        /* Only reschedule compilation for node if new level is more general.
         */
        if (compileScene.nodeCompilationLevels[nodeId] <= level) {
            return;
        }
        compileScene.nodeCompilationLevels[nodeId] = level;
        compileScene.compilationQueue.insert(level, node);
    };


    /*-----------------------------------------------------------------------------------------------------------------
     * SHEDULING
     *
     *----------------------------------------------------------------------------------------------------------------*/

    this.COMPILE_NOTHING = 0;       // No recompilations
    this.REDRAW = 1;                // Redraw display list, resolves render-time node dependencies like texture->frameBuf
    this.COMPILE_PARTIAL = 2;       // Recompile some nodes back into display list
    this.COMPILE_EVERYTHING = 3;    // Recompile all nodes, rebuilding the entire display list

    /**
     * Flush compilation queue to set all the flags that will direct the next compilation traversal
     */
    this.beginSceneCompile = function(sceneId) {
        var compileScene = this._scenes[sceneId];
        this._scene = compileScene;

        this._stackLen = 0;
        compileScene.countTraversedSubtreesToCompile = 0;

        if (!this._enableCompiler) {
            return { level: this.COMPILE_EVERYTHING };
        }

        compileScene.nodeCompilationLevels = {};

        if (compileScene.compilingScene) {
            compileScene.flagSceneCompile = true;
            compileScene.compilingScene = false;
            return { level: this.COMPILE_EVERYTHING };
        }

        var compilationQueue = compileScene.compilationQueue;
        if (compilationQueue.size == 0) {
            if (compileScene.redraw) {
                compileScene.redraw = false;
                return { level: this.REDRAW };
            }
            return { level: this.COMPILE_NOTHING };
        }

        var compilation;
        var node;
        var nodeId;
        var level;

        compileScene.stats = {
            scene: 0,
            branch: 0,
            path: 0,
            subtree: 0,
            nodes: 0
        };
        var stats = compileScene.stats;

        //        if (this._debugCfg.logTrace) {
        //            SceneJS_loggingModule.info("-------------------------------------------------------------------");
        //            SceneJS_loggingModule.info("COMPILING ...");
        //            SceneJS_loggingModule.info("");
        //        }

        var result = {
            level: this.REDRAW,     // Just flag display redraw until we know we need any node recompilations
            resort: false           // Don't know if we'll need to sort display list yet
        };

        while (compilationQueue.size > 0) {

            compilation = compilationQueue.remove();

            level = compilation.level;
            node = compilation.node;
            nodeId = node.attr.id;

            //            if (this._debugCfg.logTrace) {
            //                var logLevels = this._debugCfg.logTrace.levels || {};
            //                var minLevel = logLevels.min || SceneJS_compileCfg.COMPILE_SCENE;
            //                var maxLevel = (logLevels.max == undefined || logLevels.max == null) ? SceneJS_compileCfg.COMPILE_NODE : logLevels.max;
            //                if (minLevel <= level && level <= maxLevel) {
            //                    SceneJS_loggingModule.info("Compiling - level: "
            //                            + SceneJS_compileCfg.levelNameStrings[compilation.level] + ", node: "
            //                            + compilation.node.attr.type + ", node ID: " + compilation.node.attr.id + ", op: "
            //                            + compilation.op + ", attr: "
            //                            + compilation.attrName);
            //                }
            //            }

            if (level == SceneJS_compileCfg.COMPILE_BRANCH) {          // Compile node, nodes on path to root and nodes in subtree
                this._flagCompilePath(compileScene, node);                      // Compile nodes on path
                compileScene.dirtyNodesWithinBranches[nodeId] = true;        // Ensures that traversal descends into subnodes
                //    stats.branch++;
                result.level = this.COMPILE_PARTIAL;

            } else if (level == SceneJS_compileCfg.COMPILE_PATH) {            // Compile node plus nodes on path to root
                this._flagCompilePath(compileScene, node);                      // Traversal will not descend below the node
                // stats.path++;
                result.level = this.COMPILE_PARTIAL;

            } else if (level == SceneJS_compileCfg.RESORT) {
                result.resort = true;
            }
        }

        //        if (this._debugCfg.logTrace) {
        //            SceneJS_loggingModule.info("-------------------------------------------------------------------");
        //        }

        return result;
    };

    /** Flags node and all nodes on path to root for recompilation
     */
    this._flagCompilePath = function(compileScene, targetNode) {
        var dirtyNodes = compileScene.dirtyNodes;
        var id;
        var node = targetNode;
        while (node) {
            id = node.attr.id;

            // TODO: why do these two lines break compilation within instanced subtrees?
            if (dirtyNodes[id]) { // Node on path already marked, along with all instances of it
                return;
            }
            if (compileScene.dirtyNodesWithinBranches[id]) { // Node on path already marked, along with all instances of it
                return;
            }
            dirtyNodes[id] = true;
            node = node.parent;
        }
    };

    /**
     * Returns true if the given node requires compilation during this traversal.
     *
     * This called when about to visit the node, to determine if that node should
     * be visited.
     *
     * Will always return true if scene compilation was previously forced with
     * a call to setForceSceneCompile.
     *
     */
    this.preVisitNode = function(node) {

        /* Compile indiscriminately if scheduler disabled
         */
        if (!this._enableCompiler) {
            return true;
        }

        var compileScene = this._scene;
        var config = SceneJS_compileCfg.config[node.attr.type];
        var nodeId = node.attr.id;

        compileScene.stats.nodes++;

        /* When doing complete indescriminate scene compile, take this opportunity
         * to flag paths to nodes that must always be compiled
         */
        if (compileScene.flagSceneCompile) {
            compileScene.nodeAlwaysCompile[nodeId] = false;
            if (config && config.alwaysCompile) {
                this._alwaysCompilePath(compileScene, node);
            }
        }

        /* Track compilation path into scene graph
         */
        this._nodeStack[this._stackLen++] = node;


        /* Compile entire subtree when within a subtree flagged for complete compile,
         * or when within a node that must always be compiled
         */

        if (compileScene.dirtyNodesWithinBranches[nodeId] === true || (config && config.alwaysCompile)) {
            compileScene.countTraversedSubtreesToCompile++;
        }

        /* Compile every node when doing indiscriminate scene compile
         */
        if (compileScene.flagSceneCompile) {
            return true;
        }

        /* Compile every node flagged for indiscriminate compilation
         */
        if (compileScene.nodeAlwaysCompile[nodeId]) {
            return true;
        }

        /* Compile every node
         */
        if (compileScene.countTraversedSubtreesToCompile > 0) {
            return true;
        }

        if (compileScene.dirtyNodes[nodeId] === true) {
            return true;
        }

        compileScene.stats.nodes--;

        return false;
    };

    this._alwaysCompilePath = function(compileScene, targetNode) {
        var id;
        var node = targetNode;
        if (compileScene.nodeAlwaysCompile[node.attr.id]) {
            return;
        }
        while (node) {
            id = node.attr.id;
            compileScene.nodeAlwaysCompile[id] = true;
            node = node.parent;
        }
    };

    this.postVisitNode = function(node) {
        if (this._stackLen > 0) {
            var compileScene = this._scene;
            var nodeId = node.attr.id;
            var peekNode = this._nodeStack[this._stackLen - 1];
            if (peekNode.attr.id == nodeId) {
                this._stackLen--;
                var config = SceneJS_compileCfg.config[node.attr.type];
                if (compileScene.dirtyNodesWithinBranches[nodeId] === true || (config && config.alwaysCompile)) {
                    compileScene.countTraversedSubtreesToCompile--;
                }
            }
            compileScene.dirtyNodes[nodeId] = false;
            compileScene.dirtyNodesWithinBranches[nodeId] = false;
        }
    };

    this.finishSceneCompile = function() {
        this._scene.flagSceneCompile = false;
    };

})();
/**
 * Backend module to provide logging that is aware of the current location of scene traversal.
 *
 * There are three "channels" of log message: error, warning, info and debug.
 *
 * Provides an interface on the backend context through which other backends may log messages.
 *
 * Provides an interface to scene nodes to allow them to log messages, as well as set and get the function
 * that actually processes messages on each channel. Those getters and setters are used by the SceneJS.logging node,
 * which may be distributed throughout a scene graph to cause messages to be processed in particular ways for different
 * parts of the graph.
 *
 * Messages are queued. Initially, each channel has no function set for it and will queue messages until a function is
 * set, at which point the queue flushes.  If the function is unset, subsequent messages will queue, then flush when a
 * function is set again. This allows messages to be logged before any SceneJS.logging node is visited.
 *
 * This backend is always the last to handle a RESET
 *
 *  @private
 *
 */
var SceneJS_loggingModule = new (function() {

    var activeSceneId;
    var funcs = null;
    var queues = {};
    var indent = 0;
    var indentStr = "";

    /**
     * @private
     */
    function log(channel, message) {
        if (SceneJS._isArray(message)) {
            _logHTML(channel, arrayToHTML(message));
            for (var i = 0; i < message.length; i++) {
                _logToConsole(message[i]);
            }
        } else {
            _logHTML(channel, message);
            _logToConsole(message);
        }
    }

    function _logHTML(channel, message) {
        message = activeSceneId
                ? indentStr + activeSceneId + ": " + message
                : indentStr + message;
        var func = funcs ? funcs[channel] : null;
        if (func) {
            func(message);
        } else {
            var queue = queues[channel];
            if (!queue) {
                queue = queues[channel] = [];
            }
            queue.push(message);
        }
    }

    function _logToConsole(message) {
        if (typeof console == "object") {
            message = activeSceneId
                    ? indentStr + activeSceneId + ": " + message
                    : indentStr + message;
            console.log(message);
        }
    }

    function arrayToHTML(array) {
        var array2 = [];
        for (var i = 0; i < array.length; i++) {
            var padding = (i < 10) ? "&nbsp;&nbsp;&nbsp;" : ((i < 100) ? "&nbsp;&nbsp;" : (i < 1000 ? "&nbsp;" : ""));
            array2.push(i + padding + ": " + array[i]);
        }
        return array2.join("<br/>");
    }


    function logScript(src) {
        for (var i = 0; i < src.length; i++) {
            _logToConsole(src[i]);
        }
    }

    /**
     * @private
     */
    function flush(channel) {
        var queue = queues[channel];
        if (queue) {
            var func = funcs ? funcs[channel] : null;
            if (func) {
                for (var i = 0; i < queue.length; i++) {
                    func(queue[i]);
                }
                queues[channel] = [];
            }
        }
    }

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.LOGGING_ELEMENT_ACTIVATED,
            function(params) {
                var element = params.loggingElement;
                if (element) {
                    funcs = {
                        warn : function log(msg) {
                            element.innerHTML += "<p style=\"color:orange;\">" + msg + "</p>";
                        },
                        error : function log(msg) {
                            element.innerHTML += "<p style=\"color:darkred;\">" + msg + "</p>";
                        },
                        debug : function log(msg) {
                            element.innerHTML += "<p style=\"color:darkblue;\">" + msg + "</p>";
                        },
                        info : function log(msg) {
                            element.innerHTML += "<p style=\"color:darkgreen;\">" + msg + "</p>";
                        }
                    };
                } else {
                    funcs = null;
                }
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING, // Set default logging for scene root
            function(params) {
                activeSceneId = params.sceneId;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.RESET,
            function() {
                queues = {};
                funcs = null;
            },
            100000);  // Really low priority - must be reset last


    // @private
    this.setIndent = function(_indent) {
        indent = _indent;
        var indentArray = [];
        for (var i = 0; i < indent; i++) {
            indentArray.push("----");
        }
        indentStr = indentArray.join("");
    };

    // @private
    this.error = function(msg) {
        log("error", msg);
    };

    // @private
    this.warn = function(msg) {
        log("warn", msg);
    };

    // @private
    this.info = function(msg) {
        log("info", msg);
    };

    // @private
    this.debug = function(msg) {
        log("debug", msg);
    };

    // @private
    this.getFuncs = function() {
        return funcs;
    };

    // @private
    this.setFuncs = function(l) {
        if (l) {
            funcs = l;
            for (var channel in queues) {
                flush(channel);
            }
        }
    };
})();
/**
 * Backend module that provides single point through which exceptions may be raised
 *
 * @private
 */
var SceneJS_errorModule = new (function() {   

    this.fatalError = function(code, message) {
        if (typeof code == "string") {
            message = code;
            code = SceneJS.errors.ERROR;
        }
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.ERROR, {
            errorName: SceneJS.errors._getErrorName(code) || "ERROR",
            code: code,
            exception: message,
            fatal: true
        });
        return message;
    };

    this.error = function(code, message) {
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.ERROR, {
            errorName: SceneJS.errors._getErrorName(code) || "ERROR",
            code: code,
            exception: message,
            fatal: false
        });
    };
})();
(function() {

    this.DEFAULT_LAYER_NAME = "___default";

    var layerStack = [];
    var idStack = [];
    var stackLen = 0;

    var dirty = true;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setLayer(idStack[stackLen - 1], layerStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setLayer();
                    }
                    dirty = false;
                }
            });

    var Layer = SceneJS.createNodeType("layer");

    Layer.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node defines the resource
            this.core.priority = params.priority || 0;
            this.core.enabled = params.enabled !== false; 
        }
    };

    Layer.prototype.setPriority = function(priority) {
        this.core.priority = priority;
    };

    Layer.prototype.getPriority = function() {
        return this.core.priority;
    };

    Layer.prototype.setEnabled = function(enabled) {
        this.core.enabled = enabled;
    };

    Layer.prototype.getEnabled = function() {
        return this.core.enabled;
    };

    Layer.prototype._compile = function() {
        layerStack[stackLen] = this.core;
        idStack[stackLen] = this.attr.id;
        stackLen++;

        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };
})();

(function() {    
    var Library = SceneJS.createNodeType("library");
    Library.prototype._compile = function() { // Bypass child nodes
    };

})();
new (function() {

    var initialised = false; // True as soon as first scene registered
    var scenes = {};
    var nScenes = 0;

    var Scene = SceneJS.createNodeType("scene");

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.RESET,
            function() {
                scenes = {};
                nScenes = 0;
            });

    function findLoggingElement(loggingElementId) {
        var element;
        if (!loggingElementId) {
            element = document.getElementById(Scene.DEFAULT_LOGGING_ELEMENT_ID);
            if (!element) {
                SceneJS_loggingModule.info("SceneJS.Scene config 'loggingElementId' omitted and failed to find default logging element with ID '"
                        + Scene.DEFAULT_LOGGING_ELEMENT_ID + "' - that's OK, logging to browser console instead");
            }
        } else {
            element = document.getElementById(loggingElementId);
            if (!element) {
                element = document.getElementById(Scene.DEFAULT_LOGGING_ELEMENT_ID);
                if (!element) {
                    SceneJS_loggingModule.info("SceneJS.Scene config 'loggingElementId' unresolved and failed to find default logging element with ID '"
                            + Scene.DEFAULT_LOGGING_ELEMENT_ID + "' - that's OK, logging to browser console instead");
                } else {
                    SceneJS_loggingModule.info("SceneJS.Scene config 'loggingElementId' unresolved - found default logging element with ID '"
                            + Scene.DEFAULT_LOGGING_ELEMENT_ID + "' - logging to browser console also");
                }
            } else {
                SceneJS_loggingModule.info("SceneJS.Scene logging to element with ID '"
                        + loggingElementId + "' - logging to browser console also");
            }
        }
        return element;
    }

    /** Locates canvas in DOM, finds WebGL context on it, sets some default state on the context, then returns
     *  canvas, canvas ID and context wrapped up in an object.
     *
     * If canvasId is null, will fall back on Scene.DEFAULT_CANVAS_ID
     */
    function findCanvas(canvasId, contextAttr) {
        var canvas;
        if (!canvasId) {
            SceneJS_loggingModule.info("Scene attribute 'canvasId' omitted - looking for default canvas with ID '"
                    + Scene.DEFAULT_CANVAS_ID + "'");
            canvasId = Scene.DEFAULT_CANVAS_ID;
            canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.CANVAS_NOT_FOUND,
                        "Scene failed to find default canvas with ID '"
                                + Scene.DEFAULT_CANVAS_ID + "'");
            }
        } else {
            canvas = document.getElementById(canvasId);
            if (!canvas) {
                SceneJS_loggingModule.warn("Scene config 'canvasId' unresolved - looking for default canvas with " +
                                           "ID '" + Scene.DEFAULT_CANVAS_ID + "'");
                canvasId = Scene.DEFAULT_CANVAS_ID;
                canvas = document.getElementById(canvasId);
                if (!canvas) {
                    throw SceneJS_errorModule.fatalError(SceneJS.errors.CANVAS_NOT_FOUND,
                            "Scene attribute 'canvasId' does not match any elements in the page and no " +
                            "default canvas found with ID '" + Scene.DEFAULT_CANVAS_ID + "'");
                }
            }
        }

        // If the canvas uses css styles to specify the sizes make sure the basic
        // width and height attributes match or the WebGL context will use 300 x 150
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        var context;
        var contextNames = SceneJS.SUPPORTED_WEBGL_CONTEXT_NAMES;
        for (var i = 0; (!context) && i < contextNames.length; i++) {
            try {
                if (SceneJS_debugModule.getConfigs("webgl.logTrace") == true) {
                    context = canvas.getContext(contextNames[i] /*, { antialias: true} */, contextAttr);
                    if (context) {
                        context = WebGLDebugUtils.makeDebugContext(
                                context,
                                function(err, functionName, args) {
                                    SceneJS_loggingModule.error(
                                            "WebGL error calling " + functionName +
                                            " on WebGL canvas context - see console log for details");
                                });
                        context.setTracing(true);
                    }
                } else {
                    context = canvas.getContext(contextNames[i], contextAttr);
                }
            } catch (e) {
            }
        }
        if (!context) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.WEBGL_NOT_SUPPORTED,
                    'Canvas document element with ID \''
                            + canvasId
                            + '\' failed to provide a supported WebGL context');
        }

        try {
            context.clearColor(0.0, 0.0, 0.0, 1.0);
            context.clearDepth(1.0);
            context.enable(context.DEPTH_TEST);
            context.disable(context.CULL_FACE);
            context.depthRange(0, 1);
            context.disable(context.SCISSOR_TEST);
        } catch (e) {
            throw SceneJS_errorModule.fatalError(// Just in case we get a context but can't get any functionson it
                    SceneJS.errors.WEBGL_NOT_SUPPORTED,
                    'Canvas document element with ID \''
                            + canvasId
                            + '\' provided a supported WebGL context, but functions appear to be missing');
        }
        return {
            canvas: canvas,
            context: context,
            canvasId : canvasId
        };
    }

    function getAllScenes() {
        var list = [];
        for (var id in scenes) {
            var scene = scenes[id];
            if (scene) {
                list.push(scene.scene);
            }
        }
        return list;
    }

    function deactivateScene() {

    }

    Scene.prototype._init = function(params) {

        if (!params.canvasId) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.ILLEGAL_NODE_CONFIG, "Scene canvasId expected");
        }

        this._loggingElementId = params.loggingElementId;
        this._destroyed = false;
        this.scene = this;
        this.nodeMap = new SceneJS_Map(); // Can auto-generate IDs when not supplied

        if (params.tagMask) {
            this.setTagMask(params.tagMask);
        }

        this.canvas = findCanvas(params.canvasId, params.contextAttr); // canvasId can be null

        var sceneId = this.attr.id;
        scenes[sceneId] = {
            sceneId: sceneId,
            scene: this,
            canvas: this.canvas,
            loggingElement: findLoggingElement(this._loggingElementId) // loggingElementId can be null
        };
        nScenes++;

        if (!initialised) {
            SceneJS_loggingModule.info("SceneJS V" + SceneJS.VERSION + " initialised");
            SceneJS_eventModule.fireEvent(SceneJS_eventModule.INIT);
            initialised = true;
        }

        SceneJS_eventModule.fireEvent(SceneJS_eventModule.SCENE_CREATED, { sceneId : sceneId, canvas: this.canvas });
        SceneJS_loggingModule.info("Scene defined: " + sceneId);
        SceneJS_compileModule.nodeUpdated(this, "created");
    };

    /** ID of canvas SceneJS looks for when {@link Scene} node does not supply one
     */
    Scene.DEFAULT_CANVAS_ID = "_scenejs-default-canvas";

    /** ID ("_scenejs-default-logging") of default element to which {@link Scene} node will log to, if found.
     */
    Scene.DEFAULT_LOGGING_ELEMENT_ID = "_scenejs-default-logging";

    /** Returns the Z-buffer depth in bits of the webgl context that this scene is to bound to.
     */
    Scene.prototype.getZBufferDepth = function() {
        if (this._destroyed) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.NODE_ILLEGAL_STATE, "Scene has been destroyed");
        }
        var context = this.canvas.context;
        return context.getParameter(context.DEPTH_BITS);
    };

    if (! self.Int32Array) {

        self.Int32Array = Array;
        self.Float32Array = Array;

    }

    // Ripped off from THREE.js - https://github.com/mrdoob/three.js/blob/master/src/Three.js
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                    || window[vendors[x] + 'RequestCancelAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                },
                        timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    /** Sets regular expression to select "tag" nodes to included in render passes
     */
    Scene.prototype.setTagMask = function(tagMask) {
        if (!this.tagSelector) {
            this.tagSelector = {};
        }
        this.tagSelector.mask = tagMask;
        this.tagSelector.regex = tagMask ? new RegExp(tagMask) : null;
    };

    /** Gets regular expression that selects "tag" nodes to include in render passes
     */
    Scene.prototype.getTagMask = function() {
        return this.tagSelector ? this.tagSelector.mask : null;
    };

    /**
     * Perform any scheduled scene compilations and return true if the scene needs a redraw
     */
    Scene.prototype._compileScene = function() {
        var compileFlags = SceneJS_compileModule.beginSceneCompile(this.attr.id);
        if (compileFlags.level != SceneJS_compileModule.COMPILE_NOTHING) {          // level could be REDRAW
            SceneJS_DrawList.bindScene({ sceneId: this.attr.id }, {
                compileMode: compileFlags.level == SceneJS_compileModule.COMPILE_EVERYTHING ?
                             SceneJS_DrawList.COMPILE_SCENE : SceneJS_DrawList.COMPILE_NODES,
                resort: compileFlags.resort });
            this._compile();
            SceneJS_compileModule.finishSceneCompile();
            return true; // Redraw needed
        }
        return false; // No redraw needed
    };

    /**
     * Render a single frame if new frame pending, or force a new frame
     * Returns true if frame rendered
     */
    Scene.prototype.renderFrame = function(params) {
        if (this._compileScene()) {         // Try doing pending compile/redraw
            SceneJS_DrawList.renderFrame({
                tagSelector: this.tagSelector
            });
            return true;
        }
        if (params && params.force) {
            SceneJS_DrawList.bindScene({    //  Else force redraw
                sceneId: this.attr.id
            }, {
                compileMode: SceneJS_DrawList.COMPILE_NODES,
                resort: false
            });
            SceneJS_DrawList.renderFrame({
                tagSelector: this.tagSelector
            });
            return true;
        }
        return false;
    };

    /**
     * Starts the render loop for this scene
     */
    Scene.prototype.start = function(cfg) {
        if (this._destroyed) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.NODE_ILLEGAL_STATE, "Scene has been destroyed");
        }

        var getFPS = this._setupFps();

        if (!this._running) {
            cfg = cfg || {};

            this._running = true;
            this._paused = false;

            var self = this;
            var fnName = "__scenejs_sceneLoop" + this.attr.id;

            var sleeping = false;

            SceneJS_compileModule.nodeUpdated(this, "start");

            var sceneId = self.attr.id;

            window[fnName] = function() {
                if (self._running && !self._paused) {  // idleFunc may have paused scene
                    if (cfg.idleFunc) {
                        cfg.idleFunc();
                    }
                    if (!self._running) { // idleFunc may have destroyed scene
                        return;
                    }
                    SceneJS_eventModule.fireEvent(SceneJS_eventModule.SCENE_IDLE, {
                        sceneId: sceneId
                    });
                    if (self._compileScene()) {         // Attempt pending compile and redraw
                        sleeping = false;
                        SceneJS_DrawList.renderFrame({
                            profileFunc: cfg.profileFunc,
                            tagSelector: self.tagSelector
                        });
                        if (cfg.frameFunc) {
                            cfg.frameFunc({
                                fps: getFPS()
                            });
                        }
                        window.requestAnimationFrame(window[fnName]);
                    } else {
                        if (!sleeping && cfg.sleepFunc) {
                            cfg.sleepFunc();
                        }
                        sleeping = true;
                        window.requestAnimationFrame(window[fnName]);
                    }
                } else {
                    window.requestAnimationFrame(window[fnName]);
                }
            };
            this._startCfg = cfg;
            window.requestAnimationFrame(window[fnName]); // Push one frame immediately
        }
    };

    Scene.prototype._setupFps = function() {
        var lastTime = new Date();
        var hits = 0;
        var fps = 0;
        return function() {
            hits++;
            var nowTime = new Date();
            if ((nowTime.getTime() - lastTime.getTime()) > 1000) {
                var dt = nowTime.getTime() - lastTime.getTime();
                fps = Math.round(hits * 1000 / dt);
                hits = 0;
                lastTime = nowTime;
            }
            return fps;
        };
    };

    /** Pauses/unpauses current render loop that was started with {@link #start}. After this, {@link #isRunning} will return false.
     */
    Scene.prototype.pause = function(doPause) {
        if (this._destroyed) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.NODE_ILLEGAL_STATE, "Scene has been destroyed");
        }
        this._paused = doPause;
    };

    /** Returns true if the scene is currently rendering repeatedly in a loop after being started with {@link #start}.
     */
    Scene.prototype.isRunning = function() {
        return this._running;
    };

    /**
     * Picks whatever geometry will be rendered at the given canvas coordinates.
     */
    Scene.prototype.pick = function(canvasX, canvasY, options) {
        if (this._destroyed) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.NODE_ILLEGAL_STATE, "Scene has been destroyed");
        }
        options = options || {};
        this._compileScene();                   // Do any pending scene recompilations
        var hit = SceneJS_DrawList.pick({
            sceneId: this.attr.id,
            canvasX : canvasX,
            canvasY : canvasY,
            rayPick: options.rayPick,
            tagSelector: this.tagSelector
        });
        if (hit) {
            hit.canvasX = canvasX;
            hit.canvasY = canvasY;
        }
        return hit;
    };

    Scene.prototype._compile = function() {
        SceneJS._actionNodeDestroys();                          // Do first to avoid clobbering allocations by node compiles

        var sceneId = this.attr.id;
        var scene = scenes[sceneId];

        SceneJS_eventModule.fireEvent(SceneJS_eventModule.LOGGING_ELEMENT_ACTIVATED, { loggingElement: scene.loggingElement });
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.SCENE_COMPILING, { sceneId: sceneId, nodeId: sceneId, canvas : scene.canvas });

        if (SceneJS_compileModule.preVisitNode(this)) {
            this._compileNodes();
        }
        SceneJS_compileModule.postVisitNode(this);
        deactivateScene();
    };

    /**
     * Scene node's destroy handler, called by {@link SceneJS_node#destroy}
     * @private
     */
    Scene.prototype.destroy = function() {
        if (!this._destroyed) {
            this.stop();
            this._destroyed = true;

            this._scheduleNodeDestroy();    // Schedule all scene nodes for destruction
            SceneJS._actionNodeDestroys();  // Action the schedule immediately

            var sceneId = this.attr.id;
            scenes[sceneId] = null;
            nScenes--;

            SceneJS_eventModule.fireEvent(SceneJS_eventModule.SCENE_DESTROYED, {sceneId : sceneId });
            SceneJS_loggingModule.info("Scene destroyed: " + sceneId);

            if (nScenes == 0) {
                SceneJS_loggingModule.info("SceneJS reset");
                SceneJS_eventModule.fireEvent(SceneJS_eventModule.RESET);
            }
        }
    };

    /** Returns true if scene active, ie. not destroyed. A destroyed scene becomes active again
     * when you render it.
     */
    Scene.prototype.isActive = function() {
        return !this._destroyed;
    };

    /** Stops current render loop that was started with {@link #start}. After this, {@link #isRunning} will return false.
     */
    Scene.prototype.stop = function() {
        if (this._destroyed) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.NODE_ILLEGAL_STATE, "Scene has been destroyed");
        }
        if (this._running) {
            this._running = false;
            window["__scenejs_sceneLoop" + this.attr.id] = null;
        }
    };

    /** Determines if node exists in this scene
     */
    Scene.prototype.containsNode = function(nodeId) {
        if (this._destroyed) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.NODE_ILLEGAL_STATE, "Scene has been destroyed");
        }
        var node = this.nodeMap.items[nodeId];
        return (node) ? true : false;
    };

    /** Finds nodes in this scene that have nodes IDs matching the given regular expression
     */
    Scene.prototype.findNodes = function(nodeIdRegex) {
        var regex = new RegExp(nodeIdRegex);
        var nodes = [];
        var nodeMap = this.nodeMap.items;
        for (var nodeId in nodeMap) {
            if (nodeMap.hasOwnProperty(nodeId)) {
                if (regex.test(nodeId)) {
                    nodes.push(nodeMap[nodeId]);
                }
            }
        }
        return nodes;
    };

    Scene.prototype.findNode = function(nodeId) {
        //    if (!this._created) {
        //        throw SceneJS_errorModule.fatalError(
        //                SceneJS.errors.NODE_ILLEGAL_STATE,
        //                "Scene has been destroyed");
        //    }
        var node = this.nodeMap.items[nodeId];
        //    if (!node) {
        //        throw SceneJS_errorModule.fatalError(
        //                SceneJS.errors.NODE_ILLEGAL_STATE,
        //                "Node '" + nodeId + "' not found in scene '" + this.attr.id + "'");
        //    }
        return node ? SceneJS._selectNode(node) : null;
    };

    /**
     * Returns the current status of this scene.
     *
     * When the scene has been destroyed, the returned status will be a map like this:
     *
     * {
     *      destroyed: true
     * }
     *
     * Otherwise, the status will be:
     *
     * {
     *      numLoading: Number // Number of asset loads (eg. texture, geometry stream etc.) currently in progress
     * }
     *
     */
    Scene.prototype.getStatus = function() {
        return (this._destroyed)
                ? { destroyed: true }
                : SceneJS._shallowClone(SceneJS_sceneStatusModule.sceneStatus[this.attr.id]);
    };


    SceneJS.reset = function() {
        var scenes = getAllScenes();
        var temp = [];
        for (var i = 0; i < scenes.length; i++) {
            temp.push(scenes[i]);
        }
        while (temp.length > 0) {

            /* Destroy each scene individually so it they can mark itself as destroyed.
             * A RESET command will be fired after the last one is destroyed.
             */
            temp.pop().destroy();
        }
    };
})();
var SceneJS_PickBuffer = function(cfg) {

    var canvas = cfg.canvas;
    var gl = canvas.context;

    var pickBuf;
    this.bound = false;

    this._touch = function() {

        var width = canvas.canvas.width;
        var height = canvas.canvas.height;

        if (pickBuf) { // Currently have a pick buffer
            if (pickBuf.width == width && pickBuf.height == height) { // Canvas size unchanged, buffer still good
                return;
            } else { // Buffer needs reallocation for new canvas size

                gl.deleteTexture(pickBuf.texture);
                gl.deleteFramebuffer(pickBuf.frameBuf);
                gl.deleteRenderbuffer(pickBuf.renderBuf);
            }
        }

        pickBuf = {
            frameBuf : gl.createFramebuffer(),
            renderBuf : gl.createRenderbuffer(),
            texture : gl.createTexture(),
            width: width,
            height: height
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuf.frameBuf);

        gl.bindTexture(gl.TEXTURE_2D, pickBuf.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        try {
            // Do it the way the spec requires
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        } catch (exception) {
            // Workaround for what appears to be a Minefield bug.
            var textureStorage = new WebGLUnsignedByteArray(width * height * 3);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureStorage);
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, pickBuf.renderBuf);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickBuf.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pickBuf.renderBuf);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        /* Verify framebuffer is OK
         */
        gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuf.frameBuf);
        if (!gl.isFramebuffer(pickBuf.frameBuf)) {
            throw  SceneJS_errorModule.fatalError("Invalid framebuffer");
        }
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw  SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw  SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw  SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw  SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
            default:
                throw  SceneJS_errorModule.fatalError("Incomplete framebuffer: " + status);
        }

        this.bound = false;
    };

    this.bind = function() {
        this._touch();
        if (this.bound) {
            return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuf.frameBuf);
        this.bound = true;
    };

    this.clear = function() {
        if (!this.bound) {
            throw "Pick buffer not bound";
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.BLEND);
    };


    /** Reads pick buffer pixel at given coordinates, returns index of associated object else (-1)
     */
    this.read = function(pickX, pickY) {
        var x = pickX;
        var y = canvas.canvas.height - pickY;
        var pix = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pix);
        return pix;
    };

    this.unbind = function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.bound = false;
    };
};
/**
 * This module encapsulates the rendering backend behind an event API.
 *
 * It's job is to collect the textures, lights, materials etc. as they are exported during scene
 * traversal by the other modules, then when traversal is finished, sort them into a sequence of
 * that would involve minimal WebGL state changes, then apply the sequence to WebGL.
 */
var SceneJS_DrawList = new (function() {

    /*
     */
    this.SORT_ORDER_TEXTURE = 0;
    this.SORT_ORDER_VBO = 1;

    this._sortOrder = [this.SORT_ORDER_TEXTURE, this.SORT_ORDER_VBO];

    /*----------------------------------------------------------------------
     * ID for each state type
     *--------------------------------------------------------------------*/

    this._GEO = 0;
    this._CLIPS = 1;
    this._COLORTRANS = 2;
    this._FLAGS = 3;
    this._LAYER = 4;
    this._FRAMEBUF = 5;
    this._LIGHTS = 6;
    this._MATERIAL = 7;
    this._MORPH = 8;
    this._PICKCOLOR = 9;
    this._TEXTURE = 10;
    this._RENDERER = 11;
    this._MODEL_TRANSFORM = 12;
    this._PROJ_TRANSFORM = 13;
    this._VIEW_TRANSFORM = 14;
    this._PICK_LISTENERS = 15;
    this._NAME = 16;
    this._TAG = 17;
    this._RENDER_LISTENERS = 18;
    this._SHADER = 19;
    this._SHADER_PARAMS = 20;

    /*----------------------------------------------------------------------
     * Default state values
     *--------------------------------------------------------------------*/

    var createState = (function() {
        var stateId = -1;
        return function(data) {
            data._id = stateId;
            data._stateId = stateId--;
            data._nodeCount = 0;
            data._default = true;
            return data;
        };
    })();

    /* Default transform matrices
     */
    this._DEFAULT_MAT = new Float32Array(SceneJS_math_identityMat4());

    this._DEFAULT_NORMAL_MAT = new Float32Array(
            SceneJS_math_transposeMat4(
                    SceneJS_math_inverseMat4(
                            SceneJS_math_identityMat4(),
                            SceneJS_math_mat4())));

    this._DEFAULT_CLIP_STATE = createState({
        clips: [],
        hash: ""
    });

    this._DEFAULT_COLORTRANS_STATE = createState({
        core : null,
        hash :"f"
    });

    this._DEFAULT_FLAGS_STATE = createState({
        flags : {
            colortrans : true,      // Effect of colortrans enabled
            picking : true,         // Picking enabled
            clipping : true,        // User-defined clipping enabled
            enabled : true,         // Node not culled from traversal
            transparent: false,     // Node transparent - works in conjunction with matarial alpha properties
            backfaces: true,        // Show backfaces
            frontface: "ccw"        // Default vertex winding for front face
        }
    });

    this._DEFAULT_LAYER_STATE = createState({
        core: {
            priority : 0,
            enabled: true
        }
    });

    this._DEFAULT_FRAMEBUF_STATE = createState({
        frameBuf: null
    });

    this._DEFAULT_LIGHTS_STATE = createState({
        lights: [],
        hash: ""
    });

    this._DEFAULT_MATERIAL_STATE = createState({
        material: {
            baseColor :  [ 0.0, 0.0, 0.0 ],
            specularColor :  [ 0.0,  0.0,  0.0 ],
            specular : 1.0,
            shine :  10.0,
            reflect :  0.8,
            alpha :  1.0,
            emit :  0.0
        }
    });

    this._DEFAULT_MORPH_STATE = createState({
        morph: null,
        hash: ""
    });

    this._DEFAULT_PICK_COLOR_STATE = createState({
        pickColor: null,
        hash: ""
    });

    this._DEFAULT_PICK_LISTENERS_STATE = createState({
        listeners : []
    });

    this._DEFAULT_NAME_STATE = createState({
        core : null
    });

    this._DEFAULT_TAG_STATE = createState({
        core : null
    });

    this._DEFAULT_TEXTURE_STATE = createState({
        hash: ""
    });

    this._DEFAULT_RENDERER_STATE = createState({
        props: null
    });

    this._DEFAULT_MODEL_TRANSFORM_STATE = createState({
        mat : this._DEFAULT_MAT,
        normalMat : this._DEFAULT_NORMAL_MAT
    });

    this._DEFAULT_PROJ_TRANSFORM_STATE = createState({
        mat: new Float32Array(
                SceneJS_math_orthoMat4c(
                        SceneJS_math_ORTHO_OBJ.left,
                        SceneJS_math_ORTHO_OBJ.right,
                        SceneJS_math_ORTHO_OBJ.bottom,
                        SceneJS_math_ORTHO_OBJ.top,
                        SceneJS_math_ORTHO_OBJ.near,
                        SceneJS_math_ORTHO_OBJ.far)),
        optics: SceneJS_math_ORTHO_OBJ
    });

    this._DEFAULT_VIEW_TRANSFORM_STATE = createState({
        mat : this._DEFAULT_MAT,
        normalMat : this._DEFAULT_NORMAL_MAT,
        lookAt:SceneJS_math_LOOKAT_ARRAYS
    });

    this._DEFAULT_RENDER_LISTENERS_STATE = createState({
        listeners : []
    });

    this._DEFAULT_SHADER_STATE = createState({
        shader : {},
        hash: ""
    });

    this._DEFAULT_SHADER_PARAMS_STATE = createState({
        params: null
    });

    /** Shader programs currently allocated on all canvases
     */
    this._programs = {};

    var debugCfg;                       // Debugging configuration for this module

    /* A state set for each scene
     */
    this._sceneStates = {};

    /*----------------------------------------------------------------------
     *
     *--------------------------------------------------------------------*/

    this._states = null;
    this._nodeMap = null;
    this._stateMap = null;
    var nextStateId;

    var nextProgramId = 0;

    this.COMPILE_SCENE = 0;     // When we set a state update, rebuilding entire scene from scratch
    this.COMPILE_BRANCH = 1;   //
    this.COMPILE_NODES = 2;   //

    this.compileMode = null; // DOCS: http://scenejs.wikispaces.com/Scene+Graph+Compilation

    var picking; // True when picking

    /* Currently exported states
     */
    var flagsState;
    var layerState;
    var rendererState;
    var lightState;
    var colortransState;
    var materialState;
    var texState;
    var geoState;
    var modelXFormState;
    var viewXFormState;
    var projXFormState;
    var pickColorState;
    var frameBufState;
    var clipState;
    var morphState;
    var nameState;
    var tagState;
    var renderListenersState;
    var shaderState;
    var shaderParamsState;

    /** Current scene state hash
     */
    this._stateHash = null;

    var transparentBin = [];  // Temp buffer for transparent nodes, used when rendering

    /*----------------------------------------------------------------------
     *
     *--------------------------------------------------------------------*/

    var self = this;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.INIT,
            function() {
                debugCfg = SceneJS_debugModule.getConfigs("shading");
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.RESET,
            function() {
                var programs = self._programs;
                var program;
                for (var programId in programs) {  // Just free allocated programs
                    if (programs.hasOwnProperty(programId)) {
                        program = programs[programId];
                        program.pick.destroy();
                        program.render.destroy();
                    }
                }
                self._programs = {};
                nextProgramId = 0;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_CREATED,
            function(params) {
                var sceneId = params.sceneId;

                if (!self._sceneStates[sceneId]) {

                    self._sceneStates[sceneId] = {
                        sceneId: sceneId,

                        canvas: params.canvas,

                        nodeRenderer: new SceneJS_DrawListRenderer({
                            canvas: params.canvas.canvas,
                            context: params.canvas.context
                        }),

                        bin: [],                 // Draw list - state sorting happens here
                        lenBin: 0,

                        visibleCacheBin: [],    // Cached draw list containing enabled nodes
                        lenVisibleCacheBin: 0,

                        nodeMap: {},
                        geoNodesMap : {},        // Display list nodes findable by their geometry scene nodes
                        stateMap: {},

                        pickCallListDirty: true,
                        pickBufDirty : true
                    };
                }
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_DESTROYED,
            function(params) {

            });

    /**
     * Sets the number of frames after each complete display list rebuild
     * at which GL state is re-sorted. To enable sort, set this to a positive
     * number like 5, to prevent continuous re-sort when display list is
     * often rebuilt.
     *
     * +n - lazy-sort after n frames
     *  0 - continuously re-sort.
     * -1 - never sort.
     * Undefined - select default.
     *
     * @param stateSortDelay
     */
    this.setStateSortDelay = function(stateSortDelay) {
        stateSortDelay = typeof stateSortDelay == "number" ? stateSortDelay == undefined : this._DEFAULT_STATE_SORT_DELAY;
    };

    /**
     * Prepares renderer for new scene graph compilation pass
     */
    this.bindScene = function(params, options) {

        options = options || {};

        /* Activate states for scene
         */
        this._states = this._sceneStates[params.sceneId];
        this._nodeMap = this._states.nodeMap;
        this._stateMap = this._states.stateMap;

        this._stateHash = null;

        if (options.compileMode == SceneJS_DrawList.COMPILE_SCENE               // Rebuild from whole scene
                || options.compileMode == SceneJS_DrawList.COMPILE_BRANCH) {    // Rebuild from branch(es)

            /* Default state soup
             */

            clipState = this._DEFAULT_CLIP_STATE;
            colortransState = this._DEFAULT_COLORTRANS_STATE;
            flagsState = this._DEFAULT_FLAGS_STATE;
            layerState = this._DEFAULT_LAYER_STATE;
            frameBufState = this._DEFAULT_FRAMEBUF_STATE;
            lightState = this._DEFAULT_LIGHTS_STATE;
            materialState = this._DEFAULT_MATERIAL_STATE;
            morphState = this._DEFAULT_MORPH_STATE;
            pickColorState = this._DEFAULT_PICK_COLOR_STATE;
            rendererState = this._DEFAULT_RENDERER_STATE;
            texState = this._DEFAULT_TEXTURE_STATE;
            modelXFormState = this._DEFAULT_MODEL_TRANSFORM_STATE;
            projXFormState = this._DEFAULT_PROJ_TRANSFORM_STATE;
            viewXFormState = this._DEFAULT_VIEW_TRANSFORM_STATE;
            nameState = this._DEFAULT_NAME_STATE;
            tagState = this._DEFAULT_TAG_STATE;
            renderListenersState = this._DEFAULT_RENDER_LISTENERS_STATE;
            shaderState = this._DEFAULT_SHADER_STATE;
            shaderParamsState = this._DEFAULT_SHADER_PARAMS_STATE;

            this._forceStateSort(true);             // Sort display list with orders re-built from layer orders

            if (options.compileMode == SceneJS_DrawList.COMPILE_SCENE) {
                this._states.lenBin = 0;

                nextStateId = 0;                                // All new states
                //  nextProgramId = 0;                              // All new programs

                this._nodeMap = this._states.nodeMap = {};
                this._stateMap = this._states.stateMap = {};
            }
        }


        if (options.compileMode == SceneJS_DrawList.COMPILE_NODES) {   // Rebuild display list for subtree

            /* Going to overwrite selected state graph nodes
             * as we partially recompile portions of the scene graph.
             *
             * We'll preserve the state graph and shaders.
             */
            this._nodeMap = this._states.nodeMap;
            this._stateMap = this._states.stateMap;

            if (options.resort) {
                this._forceStateSort(true);         // Sort display list with orders re-built from layer orders
            }
        }

        this.compileMode = options.compileMode;

        picking = false;
    };


    this.marshallStates = function() {
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.SCENE_RENDERING, { fullCompile : this.compileMode === SceneJS_DrawList.COMPILE_SCENE });
    };

    /*-----------------------------------------------------------------------------------------------------------------
     * State setting/updating
     *----------------------------------------------------------------------------------------------------------------*/

    /** Find or create a new state of the given state type and node ID
     * @param stateType ID of the type of state, eg.  this._TEXTURE etc
     * @param id ID of scene graph node that is setting this state
     */
    this._getState = function(stateType, id) {
        var state;
        var typeMap = this._stateMap[stateType];
        if (!typeMap) {
            typeMap = this._stateMap[stateType] = {};
        }
        if (this.compileMode != SceneJS_DrawList.COMPILE_SCENE) {
            state = typeMap[id];
            if (!state) {
                state = {
                    _id: id,
                    _stateId : nextStateId++,
                    _stateType: stateType,
                    _nodeCount: 0
                };
                typeMap[id] = state;
            }
        } else { // Recompiling whole scene
            state = {
                _id: id,
                _stateId : nextStateId++,
                _stateType: stateType,
                _nodeCount: 0
            };
            if (id) {
                typeMap[id] = state;
            }
        }

        return state;
    };

    /**
     * Release a state after detach from display node. Destroys node if usage count is then zero.
     */
    this._releaseState = function(state) {
        if (state._stateType == undefined) {
            return;
        }
        if (state._nodeCount <= 0) {
            return;
        }
        if (--state._nodeCount == 0) {
            var typeMap = this._stateMap[state._stateType];
            if (typeMap) {
                delete typeMap[state.id];
            }
        }
    };

    this.setClips = function(id, clips) {
        if (!id) {
            clipState = this._DEFAULT_CLIP_STATE;
            this._stateHash = null;
            return;
        }
        clipState = this._getState(this._CLIPS, id);
        clips = clips || [];
        if (true && this.compileMode == SceneJS_DrawList.COMPILE_SCENE) {   // Only make hash for full recompile
            if (clips.length > 0) {
                var hash = [];
                for (var i = 0; i < clips.length; i++) {
                    var clip = clips[i];
                    hash.push(clip.mode);
                }
                clipState.hash = hash.join("");
            } else {
                clipState.hash = "";
            }
            this._stateHash = null;
        }
        clipState.clips = clips;
    };

    this.setColortrans = function(id, core) {
        if (!id) {
            colortransState = this._DEFAULT_COLORTRANS_STATE;
            this._stateHash = null;
            return;
        }
        colortransState = this._getState(this._COLORTRANS, id, true);
        colortransState.core = core;
        if (true && this.compileMode == SceneJS_DrawList.COMPILE_SCENE) {   // Only make hash for full recompile
            colortransState.hash = core ? "t" : "f";
            this._stateHash = null;
        }
    };

    this.setFlags = function(id, flags) {
        if (arguments.length == 0) {
            flagsState = this._DEFAULT_FLAGS_STATE;
            return;
        }
        flagsState = this._getState(this._FLAGS, id);
        flags = flags || this._DEFAULT_FLAGS_STATE.flags;
        flagsState.flags = flags || this._DEFAULT_FLAGS_STATE.flags;
        // this._states.lenEnabledBin = 0;
    };

    this.setLayer = function(id, core) {
        if (arguments.length == 0) {
            layerState = this._DEFAULT_LAYER_STATE;
            return;
        }
        layerState = this._getState(this._LAYER, id);
        layerState.core = core;
        //    this._states.lenEnabledBin = 0;
    };

    this.setFrameBuf = function(id, frameBuf) {
        if (arguments.length == 0) {
            frameBufState = this._DEFAULT_FRAMEBUF_STATE;
            return;
        }
        frameBufState = this._getState(this._FRAMEBUF, id);
        frameBufState.frameBuf = frameBuf;
    };

    this.setLights = function(id, lights) {
        if (arguments.length == 0) {
            lightState = this._DEFAULT_LIGHTS_STATE;
            this._stateHash = null;
            return;
        }
        lightState = this._getState(this._LIGHTS, id);
        lights = lights || [];
        if (true && this.compileMode == SceneJS_DrawList.COMPILE_SCENE) {   // Only make hash for full recompile
            var hash = [];
            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                hash.push(light.mode);
                if (light.specular) {
                    hash.push("s");
                }
                if (light.diffuse) {
                    hash.push("d");
                }
            }
            lightState.hash = hash.join("");
            this._stateHash = null;
        }
        lightState.lights = lights;
    };

    this.setMaterial = function(id, material) {
        if (arguments.length == 0) {
            materialState = this._DEFAULT_MATERIAL_STATE;
            return;
        }
        materialState = this._getState(this._MATERIAL, id, true);
        materialState.material = material || this._DEFAULT_MATERIAL_STATE.material;
    };

    this.setMorph = function(id, morph) {
        if (arguments.length == 0) {
            morphState = this._DEFAULT_MORPH_STATE;
            this._stateHash = null;
            return;
        }
        morphState = this._getState(this._MORPH, id);
        if (true && this.compileMode == SceneJS_DrawList.COMPILE_SCENE) {   // Only make hash for full recompile
            if (morph) {
                var target0 = morph.targets[0];  // All targets have same arrays
                morphState.hash = ([
                    target0.vertexBuf ? "t" : "f",
                    target0.normalBuf ? "t" : "f",
                    target0.uvBuf ? "t" : "f",
                    target0.uvBuf2 ? "t" : "f"]).join("")
            } else {
                morphState.hash = "";
            }
            this._stateHash = null;
        }
        morphState.morph = morph;
    };

    this.setTexture = function(id, core) {
        if (arguments.length == 0) {
            texState = this._DEFAULT_TEXTURE_STATE;
            this._stateHash = null;
            return;
        }
        texState = this._getState(this._TEXTURE, id);
        if (true && this.compileMode == SceneJS_DrawList.COMPILE_SCENE) {   // Only make hash for full recompile
            var hashStr;
            if (core && core.layers.length > 0) {
                var layers = core.layers;
                var hash = [];
                for (var i = 0, len = layers.length; i < len; i++) {
                    var layer = layers[i];
                    hash.push("/");
                    hash.push(layer.applyFrom);
                    hash.push("/");
                    hash.push(layer.applyTo);
                    hash.push("/");
                    hash.push(layer.blendMode);
                    if (layer.matrix) {
                        hash.push("/anim");
                    }
                }
                hashStr = hash.join("");
            } else {
                hashStr = "__scenejs_no_tex";
            }
            texState.hash = hashStr;
            this._stateHash = null;
        }
        texState.core = core;
    };

    this.setRenderer = function(id, props) {
        if (arguments.length == 0) {
            rendererState = this._DEFAULT_RENDERER_STATE;
            return;
        }
        rendererState = this._getState(this._RENDERER, id);
        rendererState.props = props;
        this._stateHash = null;
    };

    this.setModelTransform = function(id, mat, normalMat) {
        if (arguments.length == 0) {
            modelXFormState = this._DEFAULT_MODEL_TRANSFORM_STATE;
            return;
        }
        modelXFormState = this._getState(this._MODEL_TRANSFORM, id);
        modelXFormState.mat = mat || this._DEFAULT_MAT;
        modelXFormState.normalMat = normalMat || this._DEFAULT_NORMAL_MAT;
    };

    this.setProjectionTransform = function(id, transform) {
        if (arguments.length == 0) {
            projXFormState = this._DEFAULT_PROJ_TRANSFORM_STATE;
            return;
        }
        projXFormState = this._getState(this._PROJ_TRANSFORM, id);
        projXFormState.mat = transform.matrixAsArray || this._DEFAULT_PROJ_TRANSFORM_STATE.mat;
        projXFormState.optics = transform.optics || this._DEFAULT_PROJ_TRANSFORM_STATE.optics;
    };

    this.setViewTransform = function(id, mat, normalMat, lookAt) {
        if (arguments.length == 0) {
            viewXFormState = this._DEFAULT_VIEW_TRANSFORM_STATE;
            return;
        }
        viewXFormState = this._getState(this._VIEW_TRANSFORM, id);
        viewXFormState.mat = mat || this._DEFAULT_MAT;
        viewXFormState.normalMat = normalMat || this._DEFAULT_NORMAL_MAT;
        viewXFormState.lookAt = lookAt || SceneJS_math_LOOKAT_ARRAYS;
    };

    this.setName = function(id, name) {
        if (arguments.length == 0) {
            nameState = this._DEFAULT_NAME_STATE;
            return;
        }
        nameState = this._getState(this._NAME, id);
        nameState.name = name;             // Can be null
    };

    this.setTag = function(id, core) {
        if (arguments.length == 0) {
            tagState = this._DEFAULT_TAG_STATE;
            return;
        }
        tagState = this._getState(this._TAG, id);
        tagState.core = core;             // Can be null
    };


    this.setRenderListeners = function(id, listeners) {
        if (arguments.length == 0) {
            renderListenersState = this._DEFAULT_RENDER_LISTENERS_STATE;
            return;
        }
        renderListenersState = this._getState(this._RENDER_LISTENERS, id);
        renderListenersState.listeners = listeners || [];
    };

    this.setShader = function(id, shader) {
        if (arguments.length == 0) {
            shaderState = this._DEFAULT_SHADER_STATE;
            this._stateHash = null;
            return;
        }
        shaderState = this._getState(this._SHADER, id);
        shaderState.shader = shader || {};
        shaderState.hash = shader.hash;
        this._stateHash = null;
    };

    this.setShaderParams = function(id, paramsStack) {
        if (arguments.length == 0) {
            shaderParamsState = this._DEFAULT_SHADER_PARAMS_STATE;
            return;
        }
        shaderParamsState = this._getState(this._SHADER_PARAMS, id);
        shaderParamsState.paramsStack = paramsStack;
    };

    /**
     * Add a geometry and link it to currently active resources (states)
     *
     * Geometry is automatically exported when a scene graph geometry node
     * is rendered.
     *
     * Geometry is the central element of a state graph node, so now we
     * will create a state graph node with pointers to the elements currently
     * in the state soup.
     *
     * But first we need to ensure that the state soup is up to date. Other kinds of state
     * are not automatically exported by scene traversal, where their modules
     * require us to notify them that we'll be rendering something (the geometry) and
     * need an up-to-date set state soup. If they havent yet exported their state
     * (textures, material and so on) for this scene traversal, they'll do so.
     *
     * Next, we'll build a program hash code by concatenating the hashes on
     * the state soup elements, then use that to create (or re-use) a shader program
     * that is equipped to render the current state soup elements.
     *
     * Then we create the state graph node, which has the program and pointers to
     * the current state soup elements.
     *
     */
    this.setGeometry = function(id, geo) {

        /* Pull in dirty states from other modules
         */
        this.marshallStates();

        var node;

        if (this.compileMode != SceneJS_DrawList.COMPILE_SCENE) {

            /* Dynamic state reattachment for scene branch compilation.
             *
             * Attach new states that have been generated for this display node during scene
             * graph branch recompilation. The only kinds of states can be regenerated in this
             * way are those that can be created/destroyed on any node type, such as flags and
             * listeners. Other state types do not apply because they are bound to particular
             * node types, and any change to those would have resulted in a complete scene graph
             * recompilation.
             *
             * A reference count is incremented on newly attached states, and decremented on
             * previously attached states as they are detached. Those states are then destroyed
             * if their reference count has dropped to zero.
             *
             */
            node = this._nodeMap[id];
            if (node.renderListenersState._stateId != renderListenersState._stateId) {
                this._releaseState(node.renderListenersState);
                node.renderListenersState = renderListenersState;
                renderListenersState._nodeCount++;
            }
            if (node.flagsState._stateId != flagsState._stateId) {
                this._releaseState(node.flagsState);
                node.flagsState = flagsState;
                flagsState._nodeCount++;
            }
            return;
        }

        /*
         */

        geoState = this._getState(this._GEO, id);
        geoState.geo = geo;
        geoState.hash = ([                           // Safe to build geometry hash here - geometry is immutable
            geo.normalBuf ? "t" : "f",
            geo.uvBuf ? "t" : "f",
            geo.uvBuf2 ? "t" : "f",
            geo.colorBuf ? "t" : "f",
            geo.primitive
        ]).join("");

        /* Identify what GLSL is required for the current state soup elements
         */
        if (!this._stateHash) {
            this._stateHash = this._getSceneHash();
        }

        /* Create or re-use a program
         */
        var program = this._getProgram(this._stateHash);    // Touches for LRU cache

        geoState._nodeCount++;
        flagsState._nodeCount++;
        layerState._nodeCount++;
        rendererState._nodeCount++;
        lightState._nodeCount++;
        colortransState._nodeCount++;
        materialState._nodeCount++;
        modelXFormState._nodeCount++;
        viewXFormState._nodeCount++;
        projXFormState._nodeCount++;
        texState._nodeCount++;
        pickColorState._nodeCount++;
        frameBufState._nodeCount++;
        clipState._nodeCount++;
        morphState._nodeCount++;
        nameState._nodeCount++;
        tagState._nodeCount++;
        renderListenersState._nodeCount++;
        shaderState._nodeCount++;
        shaderParamsState._nodeCount++;

        node = {
            id: id,

            sortId: 0,  // Lazy-create later

            stateHash : this._stateHash,

            program : program,

            geoState:               geoState,
            layerState:             layerState,
            flagsState:             flagsState,
            rendererState:          rendererState,
            lightState:             lightState,
            colortransState :       colortransState,
            materialState:          materialState,
            modelXFormState:        modelXFormState,
            viewXFormState:         viewXFormState,
            projXFormState:         projXFormState,
            texState:               texState,
            pickColorState :        pickColorState,
            frameBufState :         frameBufState,
            clipState :             clipState,
            morphState :            morphState,
            nameState:              nameState,
            tagState:              tagState,
            renderListenersState:   renderListenersState,
            shaderState:            shaderState,
            shaderParamsState:        shaderParamsState
        };

        this._states.nodeMap[id] = node;

        this._states.bin[this._states.lenBin++] = node;

        /* Make the display list node findable by its geometry scene node
         */
        var geoNodesMap = this._states.geoNodesMap[id];
        if (!geoNodesMap) {
            geoNodesMap = this._states.geoNodesMap[id] = [];
        }
        geoNodesMap.push(node);
    };

    this._attachState = function(node, stateName, soupState) {
        var state = node[stateName];
        if (state && state._stateId != soupState._stateId) {
            this._releaseState(state);
        }
        node[stateName] = soupState;
        soupState._nodeCount++;
        return soupState;
    };

    /**
     * Removes a geometry, which deletes the associated display list node. Linked states then get their reference
     * counts decremented. States whose reference count becomes zero are deleted.
     *
     * This may be done outside of a render pass.
     */
    this.removeGeometry = function(sceneId, id) {
        var sceneState = this._sceneStates[sceneId];
        var geoNodesMap = sceneState.geoNodesMap;
        var nodes = geoNodesMap[id];
        if (!nodes) {
            return;
        }
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            node.destroyed = true;  // Differ node destruction to bin render time, when we'll know it's bin index
            this._releaseProgram(node.program);
            this._releaseState(node.geoState);
            this._releaseState(node.flagsState);
            this._releaseState(node.layerState);
            this._releaseState(node.rendererState);
            this._releaseState(node.lightState);
            this._releaseState(node.colortransState);
            this._releaseState(node.materialState);
            this._releaseState(node.modelXFormState);
            this._releaseState(node.viewXFormState);
            this._releaseState(node.projXFormState);
            this._releaseState(node.texState);
            this._releaseState(node.pickColorState);
            this._releaseState(node.frameBufState);
            this._releaseState(node.clipState);
            this._releaseState(node.morphState);
            this._releaseState(node.nameState);
            this._releaseState(node.tagState);
            this._releaseState(node.renderListenersState);
            this._releaseState(node.shaderState);
            this._releaseState(node.shaderParamsState);
        }
        geoNodesMap[id] = null;
        sceneState.lenVisibleCacheBin = 0;
    };


    /*-----------------------------------------------------------------------------------------------------------------
     * Bin pre-sorting
     *----------------------------------------------------------------------------------------------------------------*/

    this._createStateStateSortIDs = function(bin) {
        if (this._states.stateSortIDsDirty) {
            var node;
            for (var i = 0, len = bin.length; i < len; i++) {
                node = bin[i];
                node.sortId = (node.layerState.core.priority * 100000) + node.program.id;
            }
            this._states.stateSortIDsDirty = false;
        }
    };

    this._createStateStateSortIDsNew = function(bin) {
        if (this._states.stateSortIDsDirty) {
            var node;

            var lastProgramId;
            var lastTextureId;
            var lastGeometryId;

            var numPrograms = 0;
            var numTextures = 0;
            var numGeometries = 0;

            var i = bin.length;
            while (i--) {
                node = bin[i];

                if (node.program.id != lastProgramId) {
                    node.program._sortId = numPrograms;
                    lastProgramId = node.program.id;
                    numPrograms++;
                }

                if (node.texState._stateId != lastTextureId) {
                    node.texState._sortId = numTextures;
                    lastTextureId = node.texState._stateId;
                    numTextures++;
                }

                if (node.geoState._stateId != lastGeometryId) {
                    node.geoState._sortId = numGeometries;
                    lastGeometryId = node.geoState._stateId;
                    numGeometries++;
                }
            }

            i = bin.length;
            while (i--) {
                node = bin[i];
                node.sortId = (node.layerState.core.priority * numPrograms * numTextures)   // Layer
                        + (node.program.id * numTextures)                                   // Shader
                        + node.texState._sortId * numGeometries                            // Texture
                        + node.geoState._sortId;                                           // Geometry
            }

            this._states.stateSortIDsDirty = false;
        }
    };

    this._forceStateSort = function(rebuildSortIDs) {
        if (rebuildSortIDs) {
            this._states.stateSortIDsDirty = rebuildSortIDs;
        }
        this._states.stateSortDirty = true;
    };

    /**
     * Presorts bins by shader program, layer - shader switches are most
     * pathological because they force all other state switches.
     */
    this._stateSortBins = function() {
        var states = this._states;
        if (states.stateSortIDsDirty) {
            this._createStateStateSortIDs(states.bin);
        }
        states.bin.length = states.lenBin;
        states.bin.sort(this._stateSortNodes);
        states.lenVisibleCacheBin = 0;
    };

    this._stateSortNodes = function(a, b) {
        return a.sortId - b.sortId;
    };

    /*-----------------------------------------------------------------------------------------------------------------
     * Rendering
     *----------------------------------------------------------------------------------------------------------------*/

    this.renderFrame = function(params) {

        var states = this._states;

        if (!states) {
            throw  SceneJS_errorModule.fatalError("No scene bound");
        }

        states.pickBufDirty = true;   // Pick buff will now need rendering on next pick

        params = params || {};

        var sorted = false;

        if (states.stateSortDirty) {
            this._stateSortBins();
            states.stateSortDirty = false;
            sorted = true;
        }

        var drawCallListDirty = sorted                          // Call list dirty when draw list resorted or scene recompiled
                || this.compileMode == SceneJS_DrawList.COMPILE_SCENE
                || this.compileMode == SceneJS_DrawList.COMPILE_BRANCH;

        // Call funcs dirty when scene recompiled
        var drawCallFuncsDirty = this.compileMode == SceneJS_DrawList.COMPILE_SCENE;

        if (drawCallListDirty) {
            states.pickCallListDirty = drawCallListDirty;           // If draw call list dirty, then so is pick call list
        }

        if (drawCallListDirty) {
            states.pickCallFuncsDirty = drawCallFuncsDirty;
        }

        var doProfile = params.profileFunc ? true : false;

        var nodeRenderer = states.nodeRenderer;

        nodeRenderer.init({
            doProfile: doProfile,                               // Initialise renderer
            pciking: false,                                     // Drawing mode
            callListDirty: drawCallListDirty,                   // Rebuild draw call list?
            callFuncsDirty: drawCallFuncsDirty                  // Regenerate draw call funcs?
        });

        this._renderDrawList(// Render draw list
                states,
                false, // Not picking
                params.tagSelector);

        nodeRenderer.cleanup();

        if (doProfile) {
            params.profileFunc(nodeRenderer.profile);
        }

        this._states = null; // Unbind scene
    };

    /*===================================================================================================================
     *
     * PICK
     *
     *==================================================================================================================*/

    this.pick = function(params) {

        var states = this._sceneStates[params.sceneId];
        if (!states) {
            throw "No drawList found for scene '" + params.sceneId + "'";
        }

        var canvas = states.canvas.canvas;

        var hit = null;

        var canvasX = params.canvasX;
        var canvasY = params.canvasY;

        /*-------------------------------------------------------------
         * Pick object using normal GPU colour-indexed pick
         *-----------------------------------------------------------*/

        var pickBuf = states.pickBuf;                                                   // Lazy-create pick buffer
        if (!pickBuf) {
            pickBuf = states.pickBuf = new SceneJS_PickBuffer({ canvas: states.canvas });
            states.pickBufDirty = true;                                                 // Freshly-created pick buffer is dirty
        }

        var nodeRenderer = states.nodeRenderer;

        pickBuf.bind();                                                                 // Bind pick buffer

        //  if (states.pickCallListDirty || states.pickBufDirty) {                          // Render pick buffer

        pickBuf.clear();

        nodeRenderer.init({
            picking: true,
            callListDirty: states.pickCallListDirty,                                // (Re)create call list if dirty
            callFuncsDirty: states.pickCallFuncsDirty                               // (Re)generate functions if dirty
        });

        this._renderDrawList(states, true, params.tagSelector);

        nodeRenderer.cleanup();                                                     // Flush render

        states.pickCallListDirty = false;                                           // Pick call list up to date
        states.pickCallFuncsDirty = false;                                          // Pick function cache up to date

        states.pickBufDirty = false;                                                // Pick buffer up to date
        //  }

        var pix = pickBuf.read(canvasX, canvasY);                                       // Read pick buffer
        var pickedNodeIndex = pix[0] + pix[1] * 256 + pix[2] * 65536;
        var pickIndex = (pickedNodeIndex >= 1) ? pickedNodeIndex - 1 : -1;

        pickBuf.unbind();                                                               // Unbind pick buffer

        var pickNameState = nodeRenderer.pickNameStates[pickIndex];                     // Map pixel to name

        if (pickNameState) {

            hit = {
                name: pickNameState.name
            };

            /*-------------------------------------------------------------
             * Ray pick to find 3D pick position
             *-----------------------------------------------------------*/

            if (params.rayPick) {

                var rayPickBuf = states.rayPickBuf;             // Lazy-create Z-pick buffer
                if (!rayPickBuf) {
                    rayPickBuf = states.rayPickBuf = new SceneJS_PickBuffer({ canvas: states.canvas });
                }

                rayPickBuf.bind();
                rayPickBuf.clear();

                nodeRenderer.init({                             // Initialise renderer
                    pick:           false,
                    rayPick:          true,
                    callListDirty:  false,                      // Pick calls clean from pick pass
                    callFuncsDirty: false                       // Call funcs clean from pick pass
                });

                var visibleCacheBin = states.visibleCacheBin;   // Render visible object cache
                var lenVisibleCacheBin = states.lenVisibleCacheBin;
                var node;
                var flags;

                for (var i = 0; i < lenVisibleCacheBin; i++) {  // Need to render all nodes for pick
                    node = visibleCacheBin[i];                  // due to frameBuf effects etc.
                    flags = node.flagsState.flags;
                    if (flags.picking === false) {
                        continue;
                    }
                    nodeRenderer.renderNode(node);
                }

                nodeRenderer.cleanup();

                pix = rayPickBuf.read(canvasX, canvasY);

                rayPickBuf.unbind();

                /* Read normalised device Z coordinate, which will be
                 * in range of [0..1] with z=0 at front
                 */
                var screenZ = this._unpackDepth(pix);

                var w = canvas.width;
                var h = canvas.height;

                /* Calculate clip space coordinates, which will be in range
                 * of x=[-1..1] and y=[-1..1], with y=(+1) at top
                 */
                var x = (canvasX - w / 2) / (w / 2) ;           // Calculate clip space coordinates
                var y = -(canvasY - h / 2) / (h / 2) ;

                var viewMat = node.viewXFormState.mat;
                var projMat = node.projXFormState.mat;

                var pvMat = SceneJS_math_mulMat4(projMat, viewMat, []);
                var pvMatInverse = SceneJS_math_inverseMat4(pvMat, []);

                var world1 = SceneJS_math_transformVector4(pvMatInverse, [x,y,-1,1]);
                world1 = SceneJS_math_mulVec4Scalar(world1, 1 / world1[3]);

                var world2 = SceneJS_math_transformVector4(pvMatInverse, [x,y,1,1]);
                world2 = SceneJS_math_mulVec4Scalar(world2, 1 / world2[3]);

                var dir = SceneJS_math_subVec3(world2, world1, []);

                var eye = node.viewXFormState.lookAt.eye;

                 var vWorld = SceneJS_math_addVec4(world1, SceneJS_math_mulVec4Scalar(dir, screenZ, []), []);

                hit.canvasPos = [canvasX, canvasY];
                hit.worldPos = vWorld;
            }
        }

        return hit;
    };


    this._unpackDepth = function(depthZ) {
        var vec = [depthZ[0] / 256.0, depthZ[1] / 256.0, depthZ[2] / 256.0, depthZ[3] / 256.0];
        var bitShift = [1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0];
        return SceneJS_math_dotVector4(vec, bitShift);
    };


    this._renderDrawList = function(states, picking, tagSelector) {

        var context = states.canvas.context;

        var visibleCacheBin = states.visibleCacheBin;
        var lenVisibleCacheBin = states.lenVisibleCacheBin;
        var nodeRenderer = states.nodeRenderer;
        var nTransparent = 0;
        var _transparentBin = transparentBin;

        if (lenVisibleCacheBin > 0) {

            /*-------------------------------------------------------------
             * Render visible cache bin
             *  - build transparent bin
             *-----------------------------------------------------------*/

            for (var i = 0; i < lenVisibleCacheBin; i++) {
                node = visibleCacheBin[i];
                flags = node.flagsState.flags;
                if (picking && flags.picking === false) {           // When picking, skip unpickable node
                    continue;
                }
                if (!picking && flags.transparent === true) {       // Buffer transparent node when not picking
                    _transparentBin[nTransparent++] = node;

                } else {
                    nodeRenderer.renderNode(node);                  // Render node if opaque or in picking mode
                }
            }
        } else {

            /*-------------------------------------------------------------
             *  Render main node bin
             *      - build visible cache bin
             *      - build transparent bin
             *-----------------------------------------------------------*/

            var bin = states.bin;

            var node;
            var countDestroyed = 0;
            var flags;
            var tagCore;
            var _picking = picking;   // For optimised lookup

            /* Tag matching
             */
            var tagMask;
            var tagRegex;
            if (tagSelector) {
                tagMask = tagSelector.mask;
                tagRegex = tagSelector.regex;
            }

            /* Render opaque nodes while buffering transparent nodes.
             * Layer order is preserved independently within opaque and transparent bins.
             * At each node that is marked destroyed, we'll just slice it out of the bin array instead.
             */
            for (var i = 0, len = states.lenBin; i < len; i++) {
                node = bin[i];

                if (node.destroyed) {
                    if (i < len) {
                        countDestroyed++;
                        bin[i] = bin[i + countDestroyed];
                    }
                    continue;
                }

                if (countDestroyed > 0) {
                    bin[i] = bin[i + countDestroyed];
                }

                flags = node.flagsState.flags;

                if (flags.enabled === false) {                              // Skip disabled node
                    continue;
                }

                /* Skip unmatched tags. Visible node caching helps prevent this being done on every frame.
                 */
                if (tagMask) {
                    tagCore = node.tagState.core;
                    if (tagCore) {
                        if (tagCore.mask != tagMask) { // Scene tag mask was updated since last render
                            tagCore.mask = tagMask;
                            tagCore.matches = tagRegex.test(tagCore.tag);
                        }
                        if (!tagCore.matches) {
                            continue;
                        }
                    }
                }

                if (!node.layerState.core.enabled) {                        // Skip disabled layers
                    continue;
                }

                if (_picking && flags.picking === false) {                  // When picking, skip unpickable node
                    continue;
                }

                if (!_picking && flags.transparent === true) {              // Buffer transparent node when not picking
                    _transparentBin[nTransparent++] = node;

                } else {
                    nodeRenderer.renderNode(node);                          // Render node if opaque or in picking mode
                }

                visibleCacheBin[states.lenVisibleCacheBin++] = node;        // Cache visible node
            }

            if (countDestroyed > 0) {
                bin.length -= countDestroyed;  // TODO: tidy this up
                states.lenBin = bin.length;
                len = bin.length;
            }
        }

        /*-------------------------------------------------------------
         * Render transparent bin
         *  - blending enabled
         *-----------------------------------------------------------*/

        if (nTransparent > 0) {
            context.enable(context.BLEND);
            context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);  // Default - may be overridden by flags
            for (i = 0,len = nTransparent; i < len; i++) {
                nodeRenderer.renderNode(transparentBin[i]);
            }
            context.disable(context.BLEND);
        }
    };


    /*===================================================================================================================
     *
     * SHADERS
     *
     *==================================================================================================================*/

    this._getSceneHash = function() {
        return ([                           // Same hash for both render and pick shaders
            this._states.canvas.canvasId,
            clipState.hash,
            colortransState.hash,
            lightState.hash,
            morphState.hash,
            texState.hash,
            shaderState.hash,
            rendererState.hash,
            geoState.hash
        ]).join(";");
    };

    this._getProgram = function(stateHash) {
        var program = this._programs[stateHash];
        if (!program) {
            if (debugCfg.logScripts === true) {
                SceneJS_loggingModule.info("Creating render and pick shaders: '" + stateHash + "'");
            }
            program = this._programs[stateHash] = {
                id: nextProgramId++,

                render: this._createShader(this._composeRenderingVertexShader(), this._composeRenderingFragmentShader()),
                pick: this._createShader(this._composePickingVertexShader(), this._composePickingFragmentShader()),

                //                rayPick: this._createShader(this._rayPickVertexShader(), this._rayPickFragmentShader()),

                stateHash: stateHash,
                refCount: 0
            };
        }
        program.refCount++;
        return program;
    };

    this._releaseProgram = function(program) {
        if (--program.refCount <= 0) {
            //            program.render.destroy();
            //            program.pick.destroy();
            //            this._programs[program.stateHash] = null;
        }
    };

    this._createShader = function(vertexShaderSrc, fragmentShaderSrc) {
        try {
            return new SceneJS_webgl_Program(
                    this._stateHash,
                    this._states.canvas.context,
                    [vertexShaderSrc.join("\n")],
                    [fragmentShaderSrc.join("\n")],
                    SceneJS_loggingModule);

        } catch (e) {
            console.error("-----------------------------------------------------------------------------------------:");
            console.error("Failed to create SceneJS Shader");
            console.error("SceneJS Version: " + SceneJS.VERSION);
            console.error("Error message: " + e);
            console.error("");
            console.error("Vertex shader:");
            console.error("");
            this._logShaderLoggingSource(vertexShaderSrc);
            console.error("");
            console.error("Fragment shader:");
            this._logShaderLoggingSource(fragmentShaderSrc);
            console.error("-----------------------------------------------------------------------------------------:");
            throw SceneJS_errorModule.fatalError(SceneJS.errors.ERROR, "Failed to create SceneJS Shader: " + e);
        }
    };

    this._logShaderLoggingSource = function(src) {
        for (var i = 0, len = src.length; i < len; i++) {
            console.error(src[i]);
        }
    };

    this._writeHooks = function(src, varName, hookName, hooks, returns) {
        for (var i = 0, len = hooks.length; i < len; i++) {
            if (returns) {
                src.push(varName + "=" + hookName + "(" + varName + ");");
            } else {
                src.push(hookName + "(" + varName + ");");
            }
        }
    };

    this._composePickingVertexShader = function() {

        var customShaders = shaderState.shader.shaders || {};

        var customVertexShader = customShaders.vertex || {};
        var vertexHooks = customVertexShader.hooks || {};

        var customFragmentShader = customShaders.fragment || {};
        var fragmentHooks = customFragmentShader.hooks || {};

        var clipping = clipState.clips.length > 0;
        var morphing = morphState.morph && true;
        var normals = this._hasNormals();

        var src = [
            "precision mediump float;",
            "attribute vec3 SCENEJS_aVertex;",
            "attribute vec3 SCENEJS_aNormal;",

            "uniform mat4 SCENEJS_uMMatrix;",
            "uniform mat4 SCENEJS_uMNMatrix;",
            "uniform mat4 SCENEJS_uVMatrix;",
            "uniform mat4 SCENEJS_uVNMatrix;",
            "uniform mat4 SCENEJS_uPMatrix;"
        ];

        if (normals && (fragmentHooks.worldNormal || fragmentHooks.viewNormal)) {
            src.push("varying   vec3 SCENEJS_vWorldNormal;");   // Output world-space vertex normal
            src.push("varying   vec3 SCENEJS_vViewNormal;");   // Output world-space vertex normal
        }

        src.push("varying vec4 SCENEJS_vModelVertex;");

        // if (clipping || fragmentHooks.worldPosClip) {
        src.push("varying vec4 SCENEJS_vWorldVertex;");
        // }


        src.push("varying vec4 SCENEJS_vViewVertex;\n");
        src.push("varying vec4 SCENEJS_vProjVertex;\n");

        src.push("uniform vec3 SCENEJS_uEye;");                     // World-space eye position
        src.push("varying vec3 SCENEJS_vEyeVec;");

        if (customVertexShader.code) {
            src.push("\n" + customVertexShader.code + "\n");
        }

        if (morphing) {
            src.push("uniform float SCENEJS_uMorphFactor;");       // LERP factor for morph
            if (morphState.morph.targets[0].vertexBuf) {      // target2 has these arrays also
                src.push("attribute vec3 SCENEJS_aMorphVertex;");
            }
        }

        src.push("void main(void) {");
        src.push("   vec4 tmpVertex=vec4(SCENEJS_aVertex, 1.0); ");

        if (normals) {
            src.push("  vec4 modelNormal = vec4(SCENEJS_aNormal, 0.0); ");
        }

        src.push("  SCENEJS_vModelVertex = tmpVertex; ");

        if (vertexHooks.modelPos) {
            src.push("tmpVertex=" + vertexHooks.modelPos + "(tmpVertex);");
        }

        if (morphing) {
            if (morphState.morph.targets[0].vertexBuf) {
                src.push("  vec4 vMorphVertex = vec4(SCENEJS_aMorphVertex, 1.0); ");

                if (vertexHooks.modelPos) {
                    src.push("vMorphVertex=" + vertexHooks.modelPos + "(vMorphVertex);");
                }

                src.push("  tmpVertex = vec4(mix(tmpVertex.xyz, vMorphVertex.xyz, SCENEJS_uMorphFactor), 1.0); ");
            }
        }


        src.push("  tmpVertex = SCENEJS_uMMatrix * tmpVertex; ");

        if (vertexHooks.worldPos) {
            src.push("tmpVertex=" + vertexHooks.worldPos + "(tmpVertex);");
        }

        // if (clipping || fragmentHooks.worldPosClip) {
        src.push("  SCENEJS_vWorldVertex = tmpVertex; ");
        //    }

        src.push("SCENEJS_vEyeVec = normalize(SCENEJS_uEye - tmpVertex.xyz);");

        src.push("  tmpVertex = SCENEJS_uVMatrix * tmpVertex; ");

        if (vertexHooks.viewPos) {
            src.push("tmpVertex=" + vertexHooks.viewPos + "(tmpVertex);");
        }

        src.push("  SCENEJS_vViewVertex = tmpVertex;");

        if (normals && (fragmentHooks.worldNormal || fragmentHooks.viewNormal)) {
            src.push("  vec3 worldNormal = normalize((SCENEJS_uMNMatrix * modelNormal).xyz); ");
            src.push("  SCENEJS_vWorldNormal = worldNormal;");
            src.push("  SCENEJS_vViewNormal = (SCENEJS_uVNMatrix * vec4(worldNormal, 1.0)).xyz;");
        }

        src.push("  SCENEJS_vProjVertex = SCENEJS_uPMatrix * tmpVertex;");


        src.push("  gl_Position = SCENEJS_vProjVertex;");
        src.push("}");

        if (debugCfg.logScripts == true) {
            SceneJS_loggingModule.info(src);
        }
        return src;
    };

    /**
     * Composes a fragment shader script for rendering mode in current scene state
     * @private
     */
    this._composePickingFragmentShader = function() {

        var customShaders = shaderState.shader.shaders || {};
        var customFragmentShader = customShaders.fragment || {};
        var fragmentHooks = customFragmentShader.hooks || {};

        var clipping = clipState && clipState.clips.length > 0;

        var normals = this._hasNormals();

        var src = [
            "precision mediump float;"
        ];

        src.push("vec4 packDepth(const in float depth) {");
        src.push("  const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);");
        src.push("  const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);");
        src.push("  vec4 res = fract(depth * bitShift);");
        src.push("  res -= res.xxyz * bitMask;");
        src.push("  return res;");
        src.push("}");

        src.push("varying vec4 SCENEJS_vModelVertex;");
        src.push("varying vec4 SCENEJS_vWorldVertex;");
        src.push("varying vec4 SCENEJS_vViewVertex;");                  // View-space vertex
        src.push("varying vec4 SCENEJS_vProjVertex;");

        src.push("uniform bool SCENEJS_uRayPickMode;");                   // Z-pick mode when true else colour-pick

        src.push("uniform vec3 SCENEJS_uPickColor;");                   // Used in colour-pick mode

        src.push("uniform float SCENEJS_uZNear;");                      // Used in Z-pick mode
        src.push("uniform float SCENEJS_uZFar;");                       // Used in Z-pick mode

        src.push("varying vec3 SCENEJS_vEyeVec;");                          // Direction of view-space vertex from eye

        if (normals && (fragmentHooks.worldNormal || fragmentHooks.viewNormal)) {

            src.push("varying vec3 SCENEJS_vWorldNormal;");                  // World-space normal            
            src.push("varying vec3 SCENEJS_vViewNormal;");                   // View-space normal
        }
        /*-----------------------------------------------------------------------------------
         * Variables - Clipping
         *----------------------------------------------------------------------------------*/

        if (clipping) {
            for (var i = 0; i < clipState.clips.length; i++) {
                src.push("uniform float SCENEJS_uClipMode" + i + ";");
                src.push("uniform vec4  SCENEJS_uClipNormalAndDist" + i + ";");
            }
        }

        /*-----------------------------------------------------------------------------------
         * Custom GLSL
         *----------------------------------------------------------------------------------*/

        if (customFragmentShader.code) {
            src.push("\n" + customFragmentShader.code + "\n");
        }

        src.push("void main(void) {");

        if (fragmentHooks.worldPosClip) {
            src.push("if (" + fragmentHooks.worldPosClip + "(SCENEJS_vWorldVertex) == false) { discard; };");
        }
        if (fragmentHooks.viewPosClip) {
            src.push("if (!" + fragmentHooks.viewPosClip + "(SCENEJS_vViewVertex) == false) { discard; };");
        }

        if (clipping) {
            src.push("  float   dist;");
            for (var i = 0; i < clipState.clips.length; i++) {
                src.push("    if (SCENEJS_uClipMode" + i + " != 0.0) {");
                src.push("        dist = dot(SCENEJS_vWorldVertex.xyz, SCENEJS_uClipNormalAndDist" + i + ".xyz) - SCENEJS_uClipNormalAndDist" + i + ".w;");
                src.push("        if (SCENEJS_uClipMode" + i + " == 1.0) {");
                src.push("            if (dist < 0.0) { discard; }");
                src.push("        }");
                src.push("        if (SCENEJS_uClipMode" + i + " == 2.0) {");
                src.push("            if (dist > 0.0) { discard; }");
                src.push("        }");
                src.push("    }");
            }
        }

        if (fragmentHooks.worldPos) {
            src.push(fragmentHooks.worldPos + "(SCENEJS_vWorldVertex);");
        }

        if (fragmentHooks.viewPos) {
            src.push(fragmentHooks.viewPos + "(SCENEJS_vViewVertex);");
        }

        if (fragmentHooks.worldEyeVec) {
            src.push(fragmentHooks.worldEyeVec + "(SCENEJS_vEyeVec);");
        }

        if (normals && fragmentHooks.worldNormal) {
            src.push(fragmentHooks.worldNormal + "(SCENEJS_vWorldNormal);");
        }

        if (normals && fragmentHooks.viewNormal) {
            src.push(fragmentHooks.viewNormal + "(SCENEJS_vViewNormal);");
        }

        src.push("    if (SCENEJS_uRayPickMode) {");        
        src.push("          float zNormalizedDepth = abs((SCENEJS_uZNear + SCENEJS_vViewVertex.z) / (SCENEJS_uZFar - SCENEJS_uZNear));");
        src.push("          gl_FragColor = packDepth(zNormalizedDepth); ");

        src.push("    } else {");
        src.push("          gl_FragColor = vec4(SCENEJS_uPickColor.rgb, 1.0);  ");
        src.push("    }");
        src.push("}");


        if (debugCfg.logScripts == true) {
            SceneJS_loggingModule.info(src);
        }
        return src;
    };


    /*===================================================================================================================
     *
     * Rendering vertex shader
     *
     *==================================================================================================================*/

    this._isTexturing = function() {
        if (texState.core && texState.core.layers.length > 0) {
            if (geoState.geo.uvBuf || geoState.geo.uvBuf2) {
                return true;
            }
            if (morphState.morph && (morphState.morph.targets[0].uvBuf || morphState.morph.targets[0].uvBuf2)) {
                return true;
            }
        }
        return false;
    };

    this._hasNormals = function() {
        if (geoState.geo.normalBuf) {
            return true;
        }
        if (morphState.morph && morphState.morph.targets[0].normalBuf) {
            return true;
        }
        return false;
    };

    this._composeRenderingVertexShader = function() {

        var customShaders = shaderState.shader.shaders || {};

        /* Do a full custom shader replacement if code supplied without hooks
         */
        if (customShaders.vertex && customShaders.vertex.code && !customShaders.vertex.hooks) {
            return customShaders.vertex.code;
        }

        var customVertexShader = customShaders.vertex || {};
        var vertexHooks = customVertexShader.hooks || {};

        var customFragmentShader = customShaders.fragment || {};
        var fragmentHooks = customFragmentShader.hooks || {};

        var texturing = this._isTexturing();
        var normals = this._hasNormals();
        var clipping = clipState.clips.length > 0;
        var morphing = morphState.morph && true;

        var src = [
            "precision mediump float;",
        ];

        src.push("attribute vec3 SCENEJS_aVertex;");                // Model coordinates

        src.push("uniform vec3 SCENEJS_uEye;");                     // World-space eye position
        src.push("varying vec3 SCENEJS_vEyeVec;");                  // Output world-space eye vector

        /*-----------------------------------------------------------------------------------
         * Variables - normals
         *----------------------------------------------------------------------------------*/

        if (normals) {

            src.push("attribute vec3 SCENEJS_aNormal;");        // Normal vectors
            src.push("uniform   mat4 SCENEJS_uMNMatrix;");      // Model normal matrix
            src.push("uniform   mat4 SCENEJS_uVNMatrix;");      // View normal matrix

            src.push("varying   vec3 SCENEJS_vWorldNormal;");   // Output world-space vertex normal
            src.push("varying   vec3 SCENEJS_vViewNormal;");    // Output view-space vertex normal

            for (var i = 0; i < lightState.lights.length; i++) {
                var light = lightState.lights[i];
                if (light.mode == "dir") {
                    src.push("uniform vec3 SCENEJS_uLightDir" + i + ";");
                }
                if (light.mode == "point") {
                    src.push("uniform vec4 SCENEJS_uLightPos" + i + ";");
                }
                if (light.mode == "spot") {
                    src.push("uniform vec4 SCENEJS_uLightPos" + i + ";");
                }

                /* Vector from vertex to light, packaged with the pre-computed length of that vector
                 */
                src.push("varying vec4 SCENEJS_vLightVecAndDist" + i + ";");    // varying for fragment lighting
            }
        }

        if (texturing) {
            if (geoState.geo.uvBuf) {
                src.push("attribute vec2 SCENEJS_aUVCoord;");      // UV coords
            }
            if (geoState.geo.uvBuf2) {
                src.push("attribute vec2 SCENEJS_aUVCoord2;");     // UV2 coords
            }
        }

        /* Vertex color variables
         */
        if (geoState.geo.colorBuf) {
            src.push("attribute vec4 SCENEJS_aVertexColor;");       // UV2 coords
            src.push("varying vec4 SCENEJS_vColor;");               // Varying for fragment texturing
        }

        src.push("uniform mat4 SCENEJS_uMMatrix;");                 // Model matrix
        src.push("uniform mat4 SCENEJS_uVMatrix;");                 // View matrix
        src.push("uniform mat4 SCENEJS_uPMatrix;");                 // Projection matrix

        if (clipping || fragmentHooks.worldPos) {
            src.push("varying vec4 SCENEJS_vWorldVertex;");         // Varying for fragment clip or world pos hook
        }

        if (fragmentHooks.viewPos) {
            src.push("varying vec4 SCENEJS_vViewVertex;");          // Varying for fragment view clip hook
        }

        if (texturing) {                                            // Varyings for fragment texturing
            if (geoState.geo.uvBuf) {
                src.push("varying vec2 SCENEJS_vUVCoord;");
            }
            if (geoState.geo.uvBuf2) {
                src.push("varying vec2 SCENEJS_vUVCoord2;");
            }
        }

        /*-----------------------------------------------------------------------------------
         * Variables - Morphing
         *----------------------------------------------------------------------------------*/

        if (morphing) {
            src.push("uniform float SCENEJS_uMorphFactor;");       // LERP factor for morph
            if (morphState.morph.targets[0].vertexBuf) {      // target2 has these arrays also
                src.push("attribute vec3 SCENEJS_aMorphVertex;");
            }
            if (normals) {
                if (morphState.morph.targets[0].normalBuf) {
                    src.push("attribute vec3 SCENEJS_aMorphNormal;");
                }
            }
        }

        if (customVertexShader.code) {
            src.push("\n" + customVertexShader.code + "\n");
        }

        src.push("void main(void) {");
        src.push("vec4 tmpVertex=vec4(SCENEJS_aVertex, 1.0); ");

        if (vertexHooks.modelPos) {
            src.push("tmpVertex=" + vertexHooks.modelPos + "(tmpVertex);");
        }

        src.push("  vec4 modelVertex = tmpVertex; ");
        if (normals) {
            src.push("  vec4 modelNormal = vec4(SCENEJS_aNormal, 0.0); ");
        }

        /*
         * Morphing - morph targets are in same model space as the geometry
         */
        if (morphing) {
            if (morphState.morph.targets[0].vertexBuf) {
                src.push("  vec4 vMorphVertex = vec4(SCENEJS_aMorphVertex, 1.0); ");
                src.push("  modelVertex = vec4(mix(modelVertex.xyz, vMorphVertex.xyz, SCENEJS_uMorphFactor), 1.0); ");
            }
            if (normals) {
                if (morphState.morph.targets[0].normalBuf) {
                    src.push("  vec4 vMorphNormal = vec4(SCENEJS_aMorphNormal, 1.0); ");
                    src.push("  modelNormal = vec4( mix(modelNormal.xyz, vMorphNormal.xyz, 0.0), 1.0); ");
                }
            }
        }

        src.push("  vec4 worldVertex = SCENEJS_uMMatrix * modelVertex; ");

        if (vertexHooks.worldPos) {
            src.push("worldVertex=" + vertexHooks.worldPos + "(worldVertex);");
        }

        if (vertexHooks.viewMatrix) {
            src.push("vec4 viewVertex = " + vertexHooks.viewMatrix + "(SCENEJS_uVMatrix) * worldVertex;");
        } else {
            src.push("vec4 viewVertex  = SCENEJS_uVMatrix * worldVertex; ");
        }


        if (vertexHooks.viewPos) {
            src.push("viewVertex=" + vertexHooks.viewPos + "(viewVertex);");    // Vertex hook function
        }

        if (normals) {
            src.push("  vec3 worldNormal = normalize((SCENEJS_uMNMatrix * modelNormal).xyz); ");
            src.push("  SCENEJS_vWorldNormal = worldNormal;");
            src.push("  SCENEJS_vViewNormal = (SCENEJS_uVNMatrix * vec4(worldNormal, 1.0)).xyz;");
        }

        if (clipping || fragmentHooks.worldPos) {
            src.push("  SCENEJS_vWorldVertex = worldVertex;");                  // Varying for fragment world clip or hooks
        }

        if (fragmentHooks.viewPos) {
            src.push("  SCENEJS_vViewVertex = viewVertex;");                    // Varying for fragment hooks
        }

        if (vertexHooks.projMatrix) {
            src.push("gl_Position = " + vertexHooks.projMatrix + "(SCENEJS_uPMatrix) * viewVertex;");
        } else {
            src.push("  gl_Position = SCENEJS_uPMatrix * viewVertex;");
        }

        /*-----------------------------------------------------------------------------------
         * Logic - normals
         *
         * Transform the world-space lights into view space
         *----------------------------------------------------------------------------------*/

        src.push("  vec3 tmpVec3;");
        if (normals) {
            for (var i = 0; i < lightState.lights.length; i++) {
                light = lightState.lights[i];
                if (light.mode == "dir") {
                    src.push("SCENEJS_vLightVecAndDist" + i + " = vec4(-normalize(SCENEJS_uLightDir" + i + "), 0.0);");
                }
                if (light.mode == "point") {
                    src.push("tmpVec3 = (SCENEJS_uLightPos" + i + ".xyz - worldVertex.xyz);");
                    src.push("SCENEJS_vLightVecAndDist" + i + " = vec4(normalize(tmpVec3), length(tmpVec3));");
                }
                if (light.mode == "spot") {

                }
            }
        }

        src.push("SCENEJS_vEyeVec = normalize(SCENEJS_uEye - worldVertex.xyz);");

        if (texturing) {                                                        // varyings for fragment texturing
            if (geoState.geo.uvBuf) {
                src.push("SCENEJS_vUVCoord = SCENEJS_aUVCoord;");
            }
            if (geoState.geo.uvBuf2) {
                src.push("SCENEJS_vUVCoord2 = SCENEJS_aUVCoord2;");
            }
        }

        if (geoState.geo.colorBuf) {
            src.push("SCENEJS_vColor = SCENEJS_aVertexColor;");                 // Varyings for fragment interpolated vertex coloring
        }
        src.push("}");


        if (debugCfg.logScripts === true) {
            SceneJS_loggingModule.info(src);
        }
        return src;
    };

    /*-----------------------------------------------------------------------------------------------------------------
     * Rendering Fragment shader
     *---------------------------------------------------------------------------------------------------------------*/

    this._composeRenderingFragmentShader = function() {

        var customShaders = shaderState.shader.shaders || {};

        /* Do a full custom shader replacement if code supplied without hooks
         */
        if (customShaders.fragment && customShaders.fragment.code && !customShaders.fragment.hooks) {
            return customShaders.fragment.code;
        }

        var customFragmentShader = customShaders.fragment || {};
        var fragmentHooks = customFragmentShader.hooks || {};

        var texturing = this._isTexturing();
        var normals = this._hasNormals();
        var clipping = clipState && clipState.clips.length > 0;
        var colortrans = colortransState && colortransState.core;

        var src = ["\n"];

        src.push("precision mediump float;");


        if (clipping || fragmentHooks.worldPos) {
            src.push("varying vec4 SCENEJS_vWorldVertex;");             // World-space vertex
        }

        if (fragmentHooks.viewPos) {
            src.push("varying vec4 SCENEJS_vViewVertex;");              // View-space vertex
        }

        /*-----------------------------------------------------------------------------------
         * Variables - Clipping
         *----------------------------------------------------------------------------------*/

        if (clipping) {
            for (var i = 0; i < clipState.clips.length; i++) {
                src.push("uniform float SCENEJS_uClipMode" + i + ";");
                src.push("uniform vec4  SCENEJS_uClipNormalAndDist" + i + ";");
            }
        }

        if (texturing) {
            if (geoState.geo.uvBuf) {
                src.push("varying vec2 SCENEJS_vUVCoord;");
            }
            if (geoState.geo.uvBuf2) {
                src.push("varying vec2 SCENEJS_vUVCoord2;");
            }
            var layer;
            for (var i = 0, len = texState.core.layers.length; i < len; i++) {
                layer = texState.core.layers[i];
                src.push("uniform sampler2D SCENEJS_uSampler" + i + ";");
                if (layer.matrix) {
                    src.push("uniform mat4 SCENEJS_uLayer" + i + "Matrix;");
                }
                src.push("uniform float SCENEJS_uLayer" + i + "BlendFactor;");
            }
        }

        /* True when lighting
         */
        src.push("uniform bool  SCENEJS_uBackfaceTexturing;");
        src.push("uniform bool  SCENEJS_uBackfaceLighting;");

        src.push("uniform bool  SCENEJS_uSpecularLighting;");

        /* True when rendering transparency
         */
        src.push("uniform bool  SCENEJS_uTransparent;");

        /* Vertex color variable
         */
        if (geoState.geo.colorBuf) {
            src.push("varying vec4 SCENEJS_vColor;");
        }

        src.push("uniform vec3  SCENEJS_uAmbient;");                         // Scene ambient colour - taken from clear colour

        src.push("uniform vec3  SCENEJS_uMaterialBaseColor;");
        src.push("uniform float SCENEJS_uMaterialAlpha;");
        src.push("uniform float SCENEJS_uMaterialEmit;");
        src.push("uniform vec3  SCENEJS_uMaterialSpecularColor;");
        src.push("uniform float SCENEJS_uMaterialSpecular;");
        src.push("uniform float SCENEJS_uMaterialShine;");

        src.push("  vec3    ambientValue=SCENEJS_uAmbient;");
        src.push("  float   emit    = SCENEJS_uMaterialEmit;");

        src.push("varying vec3 SCENEJS_vEyeVec;");                          // Direction of view-space vertex from eye

        if (normals) {

            src.push("varying vec3 SCENEJS_vWorldNormal;");                  // World-space normal
            src.push("varying vec3 SCENEJS_vViewNormal;");                   // View-space normal

            var light;
            for (var i = 0; i < lightState.lights.length; i++) {
                light = lightState.lights[i];
                src.push("uniform vec3  SCENEJS_uLightColor" + i + ";");
                if (light.mode == "point") {
                    src.push("uniform vec3  SCENEJS_uLightAttenuation" + i + ";");
                }
                src.push("varying vec4  SCENEJS_vLightVecAndDist" + i + ";");         // Vector from light to vertex
            }
        }

        if (colortrans) {
            src.push("uniform float  SCENEJS_uColorTransMode ;");
            src.push("uniform vec4   SCENEJS_uColorTransAdd;");
            src.push("uniform vec4   SCENEJS_uColorTransScale;");
            src.push("uniform float  SCENEJS_uColorTransSaturation;");
        }

        if (customFragmentShader.code) {
            src.push("\n" + customFragmentShader.code + "\n");
        }

        src.push("void main(void) {");

        /*-----------------------------------------------------------------------------------
         * Logic - Clipping
         *----------------------------------------------------------------------------------*/

        if (clipping) {
            src.push("  float   dist;");
            for (var i = 0; i < clipState.clips.length; i++) {
                src.push("    if (SCENEJS_uClipMode" + i + " != 0.0) {");
                src.push("        dist = dot(SCENEJS_vWorldVertex.xyz, SCENEJS_uClipNormalAndDist" + i + ".xyz) - SCENEJS_uClipNormalAndDist" + i + ".w;");
                src.push("        if (SCENEJS_uClipMode" + i + " == 1.0) {");
                src.push("            if (dist < 0.0) { discard; }");
                src.push("        }");
                src.push("        if (SCENEJS_uClipMode" + i + " == 2.0) {");
                src.push("            if (dist > 0.0) { discard; }");
                src.push("        }");
                src.push("    }");
            }
        }

        if (fragmentHooks.worldPos) {
            src.push(fragmentHooks.worldPos + "(SCENEJS_vWorldVertex);");
        }

        if (fragmentHooks.viewPos) {
            src.push(fragmentHooks.viewPos + "(SCENEJS_vViewVertex);");
        }

        if (fragmentHooks.worldEyeVec) {
            src.push(fragmentHooks.worldEyeVec + "(SCENEJS_vEyeVec);");
        }

        if (normals && fragmentHooks.worldNormal) {
            src.push(fragmentHooks.worldNormal + "(SCENEJS_vWorldNormal);");
        }

        if (normals && fragmentHooks.viewNormal) {
            src.push(fragmentHooks.viewNormal + "(SCENEJS_vViewNormal);");
        }

        if (geoState.geo.colorBuf) {
            src.push("  vec3    color   = SCENEJS_vColor.rgb;");
        } else {
            src.push("  vec3    color   = SCENEJS_uMaterialBaseColor;")
        }

        src.push("  float alpha         = SCENEJS_uMaterialAlpha;");
        src.push("  float emit          = SCENEJS_uMaterialEmit;");
        src.push("  float specular      = SCENEJS_uMaterialSpecular;");
        src.push("  vec3  specularColor = SCENEJS_uMaterialSpecularColor;");
        src.push("  float shine         = SCENEJS_uMaterialShine;");

        if (fragmentHooks.materialBaseColor) {
            src.push("color=" + fragmentHooks.materialBaseColor + "(color);");
        }
        if (fragmentHooks.materialAlpha) {
            src.push("alpha=" + fragmentHooks.materialAlpha + "(alpha);");
        }
        if (fragmentHooks.materialEmit) {
            src.push("emit=" + fragmentHooks.materialEmit + "(emit);");
        }
        if (fragmentHooks.materialSpecular) {
            src.push("specular=" + fragmentHooks.materialSpecular + "(specular);");
        }
        if (fragmentHooks.materialSpecularColor) {
            src.push("specularColor=" + fragmentHooks.materialSpecularColor + "(specularColor);");
        }
        if (fragmentHooks.materialShine) {
            src.push("shine=" + fragmentHooks.materialShine + "(shine);");
        }

        if (normals) {
            src.push("  float   attenuation = 1.0;");
            src.push("  vec3    normalVec=SCENEJS_vWorldNormal;");
        }

        var layer;
        if (texturing) {

            if (normals) {
                src.push("if (SCENEJS_uBackfaceTexturing || dot(SCENEJS_vWorldNormal, SCENEJS_vEyeVec) > 0.0) {");
            }

            src.push("  vec4    texturePos;");
            src.push("  vec2    textureCoord=vec2(0.0,0.0);");

            for (var i = 0, len = texState.core.layers.length; i < len; i++) {
                layer = texState.core.layers[i];

                /* Texture input
                 */
                if (layer.applyFrom == "normal" && normals) {
                    if (geoState.geo.normalBuf) {
                        src.push("texturePos=vec4(normalVec.xyz, 1.0);");
                    } else {
                        SceneJS_loggingModule.warn("Texture layer applyFrom='normal' but geo has no normal vectors");
                        continue;
                    }
                }
                if (layer.applyFrom == "uv") {
                    if (geoState.geo.uvBuf) {
                        src.push("texturePos = vec4(SCENEJS_vUVCoord.s, SCENEJS_vUVCoord.t, 1.0, 1.0);");
                    } else {
                        SceneJS_loggingModule.warn("Texture layer applyTo='uv' but geometry has no UV coordinates");
                        continue;
                    }
                }
                if (layer.applyFrom == "uv2") {
                    if (geoState.geo.uvBuf2) {
                        src.push("texturePos = vec4(SCENEJS_vUVCoord2.s, SCENEJS_vUVCoord2.t, 1.0, 1.0);");
                    } else {
                        SceneJS_loggingModule.warn("Texture layer applyTo='uv2' but geometry has no UV2 coordinates");
                        continue;
                    }
                }

                /* Texture matrix
                 */
                if (layer.matrix) {
                    src.push("textureCoord=(SCENEJS_uLayer" + i + "Matrix * texturePos).xy;");
                } else {
                    src.push("textureCoord=texturePos.xy;");
                }

                /* Alpha from Texture
                 * */
                if (layer.applyTo == "alpha") {
                    if (layer.blendMode == "multiply") {
                        src.push("alpha = alpha * (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).b);");
                    } else if (layer.blendMode == "add") {
                        src.push("alpha = ((1.0 - SCENEJS_uLayer" + i + "BlendFactor) * alpha) + (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).b);");
                    }
                }

                /* Texture output
                 */
                if (layer.applyTo == "baseColor") {
                    if (layer.blendMode == "multiply") {
                        src.push("color = color * (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).rgb);");
                    } else {
                        src.push("color = ((1.0 - SCENEJS_uLayer" + i + "BlendFactor) * color) + (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).rgb);");
                    }
                }

                if (layer.applyTo == "emit") {
                    if (layer.blendMode == "multiply") {
                        src.push("emit  = emit * (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).r);");
                    } else {
                        src.push("emit = ((1.0 - SCENEJS_uLayer" + i + "BlendFactor) * emit) + (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).r);");
                    }
                }


                if (layer.applyTo == "specular" && normals) {
                    if (layer.blendMode == "multiply") {
                        src.push("specular  = specular * (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).r);");
                    } else {
                        src.push("specular = ((1.0 - SCENEJS_uLayer" + i + "BlendFactor) * specular) + (SCENEJS_uLayer" + i + "BlendFactor * texture2D(SCENEJS_uSampler" + i + ", vec2(textureCoord.x, 1.0 - textureCoord.y)).r);");
                    }
                }

                if (layer.applyTo == "normals" && normals) {
                    src.push("vec3 bump = normalize(texture2D(SCENEJS_uSampler" + i + ", textureCoord).xyz * 2.0 - 1.0);");
                    src.push("normalVec *= -bump;");
                }
            }
            if (normals) {
                src.push("}");
            }
        }

        src.push("  vec4    fragColor;");

        if (normals) {

            src.push("if (SCENEJS_uBackfaceLighting || dot(SCENEJS_vWorldNormal, SCENEJS_vEyeVec) > 0.0) {");

            src.push("  vec3    lightValue      = SCENEJS_uAmbient;");
            src.push("  vec3    specularValue   = vec3(0.0, 0.0, 0.0);");
            src.push("  vec3    lightVec;");
            src.push("  float   dotN;");
            src.push("  float   lightDist;");

            var light;
            for (var i = 0; i < lightState.lights.length; i++) {
                light = lightState.lights[i];
                src.push("lightVec = SCENEJS_vLightVecAndDist" + i + ".xyz;");

                if (light.mode == "point") {
                    src.push("dotN = max(dot(normalVec, lightVec) ,0.0);");
                    //src.push("if (dotN > 0.0) {");
                    src.push("lightDist = SCENEJS_vLightVecAndDist" + i + ".w;");
                    src.push("  attenuation = 1.0 / (" +
                             "  SCENEJS_uLightAttenuation" + i + "[0] + " +
                             "  SCENEJS_uLightAttenuation" + i + "[1] * lightDist + " +
                             "  SCENEJS_uLightAttenuation" + i + "[2] * lightDist * lightDist);");
                    if (light.diffuse) {
                        src.push("  lightValue += dotN *  SCENEJS_uLightColor" + i + " * attenuation;");
                    }
                    if (light.specular) {
                        src.push("if (SCENEJS_uSpecularLighting) specularValue += attenuation * specularColor * SCENEJS_uLightColor" + i +
                                 " * specular  * pow(max(dot(reflect(lightVec, normalVec), SCENEJS_vEyeVec),0.0), shine);");
                    }
                    //src.push("}");
                }

                if (light.mode == "dir") {
                    src.push("dotN = max(dot(normalVec,lightVec),0.0);");
                    //src.push("if (dotN > 0.0) {");
                    if (light.diffuse) {
                        src.push("lightValue += dotN * SCENEJS_uLightColor" + i + ";");
                    }
                    if (light.specular) {
                        src.push("if (SCENEJS_uSpecularLighting) specularValue += specularColor * SCENEJS_uLightColor" + i +
                                 " * specular  * pow(max(dot(reflect(lightVec, normalVec),SCENEJS_vEyeVec),0.0), shine);");
                    }
                    // src.push("}");
                }
            }

            src.push("      fragColor = vec4((specularValue.rgb + color.rgb * lightValue.rgb) + (emit * color.rgb), alpha);");
            src.push("   } else {");
            src.push("      fragColor = vec4(color.rgb + (emit * color.rgb), alpha);");
            src.push("   }");

        } else { // No normals
            src.push("fragColor = vec4((emit * color.rgb) + (emit * color.rgb), alpha);");
        }

        /* Color transformations
         */
        if (colortrans) {
            //            src.push("    if (SCENEJS_uColorTransMode != 0.0) {");     // Not disabled
            //            src.push("        if (SCENEJS_uColorTransSaturation < 0.0) {");
            //            src.push("            float intensity = 0.3 * fragColor.r + 0.59 * fragColor.g + 0.11 * fragColor.b;");
            //            src.push("            fragColor = vec4((intensity * -SCENEJS_uColorTransSaturation) + fragColor.rgb * (1.0 + SCENEJS_uColorTransSaturation), 1.0);");
            //            src.push("        }");
            //            src.push("        fragColor = (fragColor * SCENEJS_uColorTransScale) + SCENEJS_uColorTransAdd;");
            //            src.push("    }");
        }

        if (fragmentHooks.pixelColor) {
            src.push("fragColor=" + fragmentHooks.pixelColor + "(fragColor);");
        }

        if (debugCfg.whitewash == true) {
            src.push("    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);");
        } else {
            src.push("    gl_FragColor = fragColor;");
        }
        src.push("}");


        if (debugCfg.logScripts == true) {
            SceneJS_loggingModule.info(src);
        }
        return src;
    };
})();
/**
 * State node renderer
 */
var SceneJS_DrawListRenderer = function(cfg) {

    this._canvas = cfg.canvas;
    this._context = cfg.context;

    this.pickNameStates = [];

    this._callCtx = {};                                   // State retained within a single iteration of the call list

    /** Facade to support node state queries while node rendering
     */

    var self = this;

    this._queryFacade = {

        _node: null,

        _setNode: function(node) {
            this._node = node;
            this._mem = {};
        },

        getCameraMatrix : function() {
            return this._mem.camMat ? this._mem.camMat : this._mem.camMat = this._node.projXFormState.mat.slice(0);
        },

        getViewMatrix : function() {
            return this._mem.viewMat ? this._mem.viewMat : this._mem.viewMat = this._node.viewXFormState.mat.slice(0);
        },

        getModelMatrix : function() {
            return this._mem.modelMat ? this._mem.modelMat : this._mem.modelMat = this._node.modelXFormState.mat.slice(0);
        },

        getCanvasPos : function(offset) {

            this.getProjPos(offset);

            if (!this._mem.canvasWidth) {
                this._mem.canvasWidth = self._canvas.width;
                this._mem.canvasHeight = self._canvas.height;
            }

            /* Projection division and map to canvas
             */
            var pc = this._mem.pc;

            var x = (pc[0] / pc[3]) * this._mem.canvasWidth * 0.5;
            var y = (pc[1] / pc[3]) * this._mem.canvasHeight * 0.5;

            return this._mem.canvasPos = {
                x: x + (self._canvas.width * 0.5),
                y: this._mem.canvasHeight - y - (this._mem.canvasHeight * 0.5)
            };
        },

        getCameraPos : function(offset) {
            this.getProjPos(offset);
            this._mem.camPos = SceneJS_math_normalizeVec3(this._mem.pc, [0,0,0]);
            return { x: this._mem.camPos[0], y: this._mem.camPos[1], z: this._mem.camPos[2] };
        },

        getProjPos : function(offset) {
            this.getViewPos(offset);
            this._mem.pc = SceneJS_math_transformPoint3(this._node.projXFormState.mat, this._mem.vc);
            return { x: this._mem.pc[0], y: this._mem.pc[1], z: this._mem.pc[2],  w: this._mem.pc[3] };
        },

        getViewPos : function(offset) {
            this.getWorldPos(offset);
            this._mem.vc = SceneJS_math_transformPoint3(this._node.viewXFormState.mat, this._mem.wc);
            return { x: this._mem.vc[0], y: this._mem.vc[1], z: this._mem.vc[2],  w: this._mem.vc[3] };
        },

        getWorldPos : function(offset) {
            this._mem.wc = SceneJS_math_transformPoint3(this._node.modelXFormState.mat, offset || [0,0,0]);
            return { x: this._mem.wc[0], y: this._mem.wc[1], z: this._mem.wc[2],  w: this._mem.wc[3] };
        }
    };


    /**
     * Called before we render all state nodes for a frame.
     * Forgets any program that was used for the last node rendered, which causes it
     * to forget all states for that node.
     */
    this.init = function(params) {
        params = params || {};
        this._picking = params.picking;
        this._rayPicking = params.rayPick;

        this._callListDirty = params.callListDirty;
        this._callFuncsDirty = params.callFuncsDirty;

        this._program = null;
        this._lastFramebuf = null;
        this._lastFlagsState = null;
        this._lastRendererState = null;
        this._lastRenderListenersState = null;

        this._pickIndex = 0;

        /* Initialialise call context
         */
        this._callCtx.picking = this._picking;
        this._callCtx.rayPicking = this._rayPicking;
        this._callCtx.lastFrameBuf = null;
        this._callCtx.lastRendererProps = null;
        this._callCtx.lastFlagsState = null;

        this.stateSortProfile = {
            numTextures: 0,
            numGeometries: 0
        };
    };

    this.createCall = function(fn) {
        if (this._picking) {
            this._node.__pickCallList[this._node.__pickCallListLen++] = fn;
        } else {
            this._node.__drawCallList[this._node.__drawCallListLen++] = fn;
        }
        fn();
    };

    /**
     * Renders a state node. Makes state changes only where the node's states have different IDs
     * than the states of the last node. If the node has a different program than the last node
     * rendered, Renderer forgets all states for the previous node and makes a fresh set of transitions
     * into all states for this node.
     */
    this.renderNode = function(node) {

        var i, len, k;

        if (this._picking || this._rayPicking) {                      // Picking mode - same calls for pick and Z-pick

            if (!(this._callListDirty || this._callFuncsDirty)) {   // Call list and function cache still good
                var pickList = node.__pickCallList;                 // Execute call list and return
                for (i = 0,len = node.__pickCallListLen; i < len; i++) {
                    pickList[i]();
                }
                return;
            }

            /* Call list or function cache dirty
             */

            if (!node.__pickCallList) {                             // Lazy-allocate call list and function caches
                node._pickCallFuncs = node._pickCallFuncs || {};
                node.__pickCallList = [];
            }

            node.__pickCallListLen = 0;                             // (Re)building call list

            if (this._callFuncsDirty) {
                node._pickCallFuncs = {};                           // (Re)building function cache
            }

        } else {                                                    // Drawing mode

            this._queryFacade._setNode(node);                       // Activate query facade for render listeners

            if (!(this._callListDirty || this._callFuncsDirty)) {   // Call list and function cache still good
                var drawList = node.__drawCallList;                 // Execute pick call list and return
                for (i = 0,len = node.__drawCallListLen; i < len; i++) {
                    drawList[i]();
                }
                return;
            }

            if (!node.__drawCallList) {                             // Lazy-allocate call list and function caches
                node._drawCallFuncs = node._drawCallFuncs || {};
                node.__drawCallList = [];
            }

            node.__drawCallListLen = 0;                             // (Re)building call list

            if (this._callFuncsDirty) {                             // (Re)building function cache
                node._drawCallFuncs = {};
            }
        }

        this._node = node;

        this._callFuncs = this._picking                             // Draw list is built once for colour pick and z-pick
                ? node._pickCallFuncs                               // Activate cache of WebGL call functions for pick or draw
                : node._drawCallFuncs;

        /* Cache some often-used node states for fast access
         */
        var nodeFlagsState = node.flagsState;
        var nodeGeoState = node.geoState;

        /* Bind program if none bound, or if node uses different program
         * to that currently bound.
         *
         * Also flag all buffers as needing to be bound.
         */
        if ((!this._program) || (node.program.id != this._lastProgramId)) {

            if (this._picking) {
                this._program = node.program.pick;

            } else {
                this._program = node.program.render;
            }

            if (this.stateSortProfile) {
                this._program.setProfile(this.profile);
            }

            /*----------------------------------------------------------------------------------------------------------
             * Program for render or pick
             *--------------------------------------------------------------------------------------------------------*/

            if (this._picking) {

                this.createCall(
                        this._callFuncs["pickShader"]
                                || (this._callFuncs["pickShader"] =

                                    (function() {

                                        var program = node.program.pick;

                                        var context = self._context;

                                        var callCtx = self._callCtx;

                                        var rayPickModeLocation;

                                        return function() {

                                            if (callCtx.program) {
                                                callCtx.program.unbind();
                                            }

                                            program.bind();

                                            if (!rayPickModeLocation) {
                                                rayPickModeLocation = program.getUniformLocation("SCENEJS_uRayPickMode");
                                            }
                                            context.uniform1i(rayPickModeLocation, !!callCtx.rayPicking);

                                            callCtx.program = program;
                                        };
                                    })()));
            } else {

                this.createCall(
                        this._callFuncs["renderShader"]
                                || (this._callFuncs["renderShader"] =
                                    (function() {

                                        var program = node.program.render;

                                        var callCtx = self._callCtx;

                                        return function() {

                                            if (callCtx.program) {
                                                callCtx.program.unbind();
                                            }

                                            program.bind();

                                            callCtx.program = program;
                                        };
                                    })()));
            }

            /** Track IDs of bound states as we build call list
             */
            this._lastProgramId = node.program.id;
            this._lastShaderStateId = -1;
            this._lastShaderParamsStateId = -1;
            this._lastGeoStateId = -1;
            this._lastFlagsStateId = -1;
            this._lastColortransStateId = -1;
            this._lastLightStateId = -1;
            this._lastClipStateId = -1;
            this._lastMorphStateId = -1;
            this._lastTexStateId = -1;
            this._lastMaterialStateId = -1;
            this._lastViewXFormStateId = -1;
            this._lastModelXFormStateId = -1;
            this._lastProjXFormStateId = -1;
            this._lastPickStateId = -1;
            this._lastFramebufStateId = -1;
            this._lastRenderListenersStateId = -1;

            /*----------------------------------------------------------------------------------------------------------
             * shader node
             *--------------------------------------------------------------------------------------------------------*/

            if (node.shaderState.shader &&
                node.shaderState.shader.paramsStack) { // Custom shader - set any params we have

                if (this._lastShaderStateId != node.shaderState._stateId) {

                    /*--------------------------------------------------------------------------------------------------
                     * A call list node.
                     *
                     * Each WebGL call is wrapped by function that is created by a higher-order function which prepares
                     * the arguments and caches them in a closure.
                     *------------------------------------------------------------------------------------------------*/

                    this.createCall(
                            this._callFuncs["shader"]
                                    || (this._callFuncs["shader"] =
                                        (function() {

                                            /*-------------------------------------------------------------------------
                                             * Code within the closure should be independent of state on any other
                                             * draw list node, in the assumption that the draw list may reorder, or
                                             * that other nodes may disappear from the draw list. It may however
                                             * safely depend on other previous executions of calls belonging to this
                                             * draw list node.
                                             *-----------------------------------------------------------------------*/

                                            var program = self._program;

                                            /* Cache param uniform locations and values
                                             */
                                            var paramsStack = node.shaderState.shader.paramsStack;

                                            return function() {

                                                /*----------------------------------------------------------------------
                                                 * Code within the call function depends on state held within the
                                                 * closure, and may safely depend on state set by any previous other
                                                 * draw list node or call.
                                                 *--------------------------------------------------------------------*/

                                                var params;
                                                var name;
                                                for (var i = 0, len = paramsStack.length; i < len; i++) {
                                                    params = paramsStack[i];
                                                    for (name in params) {
                                                        if (params.hasOwnProperty(name)) {
                                                            program.setUniform(name, params[name]);  // TODO: cache locations
                                                        }
                                                    }
                                                }
                                            };
                                        })()));

                    this._lastShaderStateId = node.shaderState._stateId;
                }
            }
        }

        /*----------------------------------------------------------------------------------------------------------
         * shaderParams
         *--------------------------------------------------------------------------------------------------------*/

        if (node.shaderParamsState.paramsStack) {

            if (this._lastShaderParamsStateId != node.shaderParamsState._stateId) {

                this.createCall(
                        this._callFuncs["shaderParams"]
                                || (this._callFuncs["shaderParams"] =
                                    (function() {

                                        var program = self._program;

                                        var paramsStack = node.shaderParamsState.paramsStack;

                                        return function() {
                                            var params;
                                            var name;
                                            for (var i = 0, len = paramsStack.length; i < len; i++) {
                                                params = paramsStack[i];
                                                for (name in params) {
                                                    if (params.hasOwnProperty(name)) {
                                                        program.setUniform(name, params[name]);  // TODO: cache locations
                                                    }
                                                }
                                            }
                                        };
                                    })()));

                this._lastShaderParamsStateId = node.shaderParamsState._stateId;
            }
        }

        /*----------------------------------------------------------------------------------------------------------
         * frameBuf - maybe unbind old and maybe bind new
         *--------------------------------------------------------------------------------------------------------*/

        if ((!this._lastFrameBuf) || this._lastFramebufStateId != node.frameBufState._stateId) {

            this.createCall(
                    this._callFuncs["frameBuf"]
                            || (this._callFuncs["frameBuf"] =
                                (function() {

                                    var context = self._context;

                                    var callCtx = self._callCtx;

                                    var frameBuf = node.frameBufState.frameBuf;

                                    return function() {
                                        if (callCtx.lastFrameBuf) {
                                            context.finish(); // Force frameBuf to complete
                                            callCtx.lastFrameBuf.unbind();
                                        }
                                        if (frameBuf) {
                                            frameBuf.bind();
                                        }
                                        callCtx.lastFrameBuf = frameBuf;  // Must flush on cleanup
                                    };
                                })()));

            this._lastFramebufStateId = node.frameBufState._stateId;
        }

        /*----------------------------------------------------------------------------------------------------------
         * texture
         *--------------------------------------------------------------------------------------------------------*/

        if (!this._picking) {

            if (node.texState._stateId != this._lastTexStateId) {

                var core = node.texState.core;
                if (core) {

                    this.createCall(
                            this._callFuncs["texture"]
                                    || (this._callFuncs["texture"] =
                                        (function() {

                                            var program = self._program;

                                            var numLayers = core.layers.length;
                                            var layers = core.layers;

                                            var layerVars = [];

                                            for (var j = 0; j < numLayers; j++) {
                                                layerVars.push({
                                                    texSamplerName : "SCENEJS_uSampler" + j,
                                                    texMatrixName : "SCENEJS_uLayer" + j + "Matrix",
                                                    texBlendFactorName : "SCENEJS_uLayer" + j + "BlendFactor"
                                                });
                                            }

                                            return function() {
                                                var layer, vars;
                                                for (var j = 0, len = numLayers; j < len; j++) {
                                                    layer = layers[j];
                                                    vars = layerVars[j];
                                                    if (layer.texture) {    // Lazy-loads
                                                        program.bindTexture(vars.texSamplerName, layer.texture, j);
                                                        if (layer.matrixAsArray) { // Must bind matrix in any case
                                                            program.setUniform(vars.texMatrixName, layer.matrixAsArray);
                                                        }
                                                        program.setUniform(vars.texBlendFactorName, layer.blendFactor);
                                                    }
                                                }
                                            };
                                        })()));
                }
            }

            this._lastTexStateId = node.texState._stateId;
        }


        /*----------------------------------------------------------------------------------------------------------
         * geometry or morphGeometry
         *
         * 1. Disable VBOs
         * 2. If new morphGeometry then bind target VBOs and remember which arrays we bound
         * 3. If new geometry then bind VBOs for whatever is not already bound
         *--------------------------------------------------------------------------------------------------------*/

        if ((nodeGeoState._stateId != this._lastGeoStateId)  // New geometry
                || (node.morphState.morph && node.morphState._stateId != this._lastMorphStateId)) {   // New morphGeometry

            /* Disable all vertex arrays for draw and pick
             */
            this.createCall(
                    this._callFuncs["unbindVBOs"]
                            || (this._callFuncs["unbindVBOs"] =
                                (function() {

                                    var context = self._context;

                                    return function() {
                                        for (var k = 0; k < 8; k++) {
                                            context.disableVertexAttribArray(k);
                                        }
                                    };
                                })()));

            var morphVertexBufBound = false;
            var morphNormalBufBound = false;
            var morphUVBufBound = false;
            var morphUV2BufBound = false;


            if (node.morphState.morph && node.morphState._stateId != this._lastMorphStateId) {

                /* Bind morph VBOs for draw and pick
                 */
                this.createCall(
                        this._callFuncs["morph"]
                                || (this._callFuncs["morph"] =
                                    (function() {

                                        var program = self._program;
                                        var context = self._context;

                                        var vertexAttr = program.getAttribute("SCENEJS_aVertex");
                                        var morphVertexAttr = program.getAttribute("SCENEJS_aMorphVertex");

                                        var normalAttr = program.getAttribute("SCENEJS_aNormal");
                                        var morphNormalAttr = program.getAttribute("SCENEJS_aMorphNormal");

                                        var morphUVAttr = program.getAttribute("SCENEJS_aMorphUVCoord");
                                        var uMorphFactor = program.getUniformLocation("SCENEJS_uMorphFactor");

                                        var morph = node.morphState.morph;

                                        return function() {

                                            var target1 = morph.targets[morph.key1]; // Keys will update
                                            var target2 = morph.targets[morph.key2];

                                            if (vertexAttr) {
                                                vertexAttr.bindFloatArrayBuffer(target1.vertexBuf);
                                                morphVertexAttr.bindFloatArrayBuffer(target2.vertexBuf);
                                                morphVertexBufBound = true;
                                            }

                                            if (morphNormalAttr) {
                                                normalAttr.bindFloatArrayBuffer(target1.normalBuf);
                                                morphNormalAttr.bindFloatArrayBuffer(target2.normalBuf);
                                                morphNormalBufBound = true;

                                            } else if (normalAttr && target1.normalBuf) {
                                                normalAttr.bindFloatArrayBuffer(target1.normalBuf);
                                                morphNormalBufBound = true;
                                            }

                                            if (morphUVAttr && target1.uvBuf) {
                                                program.bindFloatArrayBuffer(target1.uvBuf);
                                                program.bindFloatArrayBuffer(target2.uvBuf);
                                                morphUVBufBound = true;
                                            }
                                            if (uMorphFactor) {
                                                context.uniform1f(uMorphFactor, morph.factor); // Bind LERP factor
                                            }
                                        };
                                    })()));

                this._lastMorphStateId = node.morphState._stateId;
            }

            /* Bind any unbound VBOs for draw and pick
             */
            this.createCall(
                    this._callFuncs["geo"]
                            || (this._callFuncs["geo"] =
                                (function() {

                                    var program = self._program;

                                    var geo = nodeGeoState.geo;

                                    var vertexBuf = geo.vertexBuf;
                                    var normalBuf = geo.normalBuf;
                                    var colorBuf = geo.colorBuf;

                                    var vertexAttr = (!morphVertexBufBound && vertexBuf) ? program.getAttribute("SCENEJS_aVertex") : undefined;
                                    var normalAttr = (!morphNormalBufBound && normalBuf) ? program.getAttribute("SCENEJS_aNormal") : undefined;
                                    var colorAttr = (colorBuf) ? program.getAttribute("SCENEJS_aVertexColor") : undefined;

                                    return function() {
                                        if (vertexAttr) {
                                            vertexAttr.bindFloatArrayBuffer(vertexBuf);
                                        }
                                        if (normalAttr) {
                                            normalAttr.bindFloatArrayBuffer(normalBuf);
                                        }
                                        if (colorAttr) {
                                            colorAttr.bindFloatArrayBuffer(colorBuf);
                                        }
                                    };
                                })()));


            if (!this._picking) {

                if (node.texState && node.texState.core && node.texState.core.layers.length > 0) {

                    /* Bind UV buffers for draw
                     * TODO: Texturing for pick as well; need to pick through transparent regions of alpha maps
                     */
                    this.createCall(
                            this._callFuncs["uvs"]
                                    || (this._callFuncs["uvs"] =
                                        (function() {

                                            var program = self._program;

                                            var geo = nodeGeoState.geo;

                                            var uvBuf = geo.uvBuf;
                                            var uvBuf2 = geo.uvBuf2;

                                            var uvCoordAttr = (uvBuf) ? program.getAttribute("SCENEJS_aUVCoord") : undefined;
                                            var uvCoord2Attr = (uvBuf) ? program.getAttribute("SCENEJS_aUVCoord2") : undefined;

                                            return function() {
                                                if (uvCoordAttr) {
                                                    uvCoordAttr.bindFloatArrayBuffer(uvBuf);
                                                }
                                                if (uvCoord2Attr) {
                                                    uvCoord2Attr.bindFloatArrayBuffer(uvBuf2);
                                                }
                                            };
                                        })()));
                }
            }

            /* Bind IBO for draw and pick
             */
            this.createCall(
                    this._callFuncs["ibo"]
                            || (this._callFuncs["ibo"] =
                                (function() {

                                    var indexBuf = nodeGeoState.geo.indexBuf;
                                    return function() {
                                        indexBuf.bind();
                                    };
                                })()));

            this.stateSortProfile.numGeometries++;
            this._lastGeoStateId = nodeGeoState._stateId;
        }

        /*----------------------------------------------------------------------------------------------------------
         * renderer
         *--------------------------------------------------------------------------------------------------------*/


        if (!this._lastRendererState || node.rendererState._stateId != this._lastRendererState._stateId) {

            /* Switch properties
             */
            this.createCall(
                    this._callFuncs["bindProps"]
                            || (this._callFuncs["bindProps"] =
                                (function() {

                                    var context = self._context;

                                    var callCtx = self._callCtx;

                                    var rendererState = node.rendererState;

                                    return function() {
                                        if (callCtx.lastRendererProps) {
                                            callCtx.lastRendererProps.restoreProps(context);
                                        }
                                        if (rendererState.props) {
                                            rendererState.props.setProps(context);
                                        }
                                        callCtx.lastRendererProps = rendererState.props;
                                    };
                                })()));

            /* Set ambient color
             */
            this.createCall(
                    this._callFuncs["ambient"]
                            || (this._callFuncs["ambient"] =
                                (function() {

                                    var context = self._context;
                                    var program = self._program;

                                    var rendererState = node.rendererState;
                                    var defaultColor = [0, 0, 0];

                                    var uColorLocation = program.getUniformLocation("SCENEJS_uAmbient");

                                    return function() {
                                        if (uColorLocation) {
                                            var props = rendererState.props;
                                            if (props && props.clearColor) {
                                                var clearColor = props.clearColor;
                                                context.uniform3fv(uColorLocation, [clearColor.r, clearColor.g, clearColor.b]);
                                            } else {
                                                context.uniform3fv(uColorLocation, defaultColor);
                                            }
                                        }
                                    };
                                })()));

            this._lastRendererState = node.rendererState;
        }

        /*----------------------------------------------------------------------------------------------------------
         * lookAt
         *--------------------------------------------------------------------------------------------------------*/

        if (node.viewXFormState._stateId != this._lastViewXFormStateId) {

            this.createCall(
                    this._callFuncs["lookAt"]
                            || (this._callFuncs["lookAt"] =
                                (function() {

                                    var program = self._program;
                                    var context = self._context;

                                    var viewXFormState = node.viewXFormState;

                                    var matLocation = program.getUniformLocation("SCENEJS_uVMatrix");
                                    var normalMatLocation = program.getUniformLocation("SCENEJS_uVNMatrix");
                                    var eyeLocation = program.getUniformLocation("SCENEJS_uEye");

                                    return function() {

                                        var mat = viewXFormState.mat;
                                        var normalMat = viewXFormState.normalMat;
                                        var lookAt = viewXFormState.lookAt;

                                        if (matLocation) {
                                            context.uniformMatrix4fv(matLocation, context.FALSE, mat);
                                        }
                                        if (normalMatLocation) {
                                            context.uniformMatrix4fv(normalMatLocation, context.FALSE, normalMat);
                                        }
                                        if (eyeLocation) {
                                            context.uniform3fv(eyeLocation, lookAt.eye);
                                        }
                                    };
                                })()));

            this._lastViewXFormStateId = node.viewXFormState._stateId;
        }

        /*----------------------------------------------------------------------------------------------------------
         * Model transform
         *--------------------------------------------------------------------------------------------------------*/

        if (node.modelXFormState._stateId != this._lastModelXFormStateId) {

            this.createCall(
                    this._callFuncs["modelXF"]
                            || (this._callFuncs["modelXF"] =
                                (function() {

                                    var program = self._program;
                                    var context = self._context;

                                    var modelXFormState = node.modelXFormState;

                                    var matLocation = program.getUniformLocation("SCENEJS_uMMatrix");
                                    var normalMatLocation = program.getUniformLocation("SCENEJS_uMNMatrix");

                                    return function() {
                                        var mat = modelXFormState.mat;
                                        var normalMat = modelXFormState.normalMat;
                                        if (matLocation) {
                                            context.uniformMatrix4fv(matLocation, context.FALSE, mat);
                                        }
                                        if (normalMatLocation) {
                                            context.uniformMatrix4fv(normalMatLocation, context.FALSE, normalMat);
                                        }
                                    };
                                })()));

            this._lastModelXFormStateId = node.modelXFormState._stateId;
        }

        /*----------------------------------------------------------------------------------------------------------
         * projection matrix
         *--------------------------------------------------------------------------------------------------------*/

        if (node.projXFormState._stateId != this._lastProjXFormStateId) {

            this.createCall(
                    this._callFuncs["camera"]
                            || (this._callFuncs["camera"] =
                                (function() {

                                    var program = self._program;
                                    var context = self._context;

                                    var callCtx = self._callCtx;

                                    var projXFormState = node.projXFormState;

                                    var matLocation = program.getUniformLocation("SCENEJS_uPMatrix");

                                    var zNearLocation = program.getUniformLocation("SCENEJS_uZNear");
                                    var zFarLocation = program.getUniformLocation("SCENEJS_uZFar");

                                    return function() {
                                        var mat = projXFormState.mat;
                                        var optics = projXFormState.optics;

                                        if (matLocation) {
                                            context.uniformMatrix4fv(matLocation, context.FALSE, mat);
                                        }

                                        if (callCtx.rayPicking) { // Z-pick pass: feed near and far clip planes into shader
                                            if (zFarLocation) {
                                                context.uniform1f(zNearLocation, optics.near);
                                            }
                                            if (zFarLocation) {
                                                context.uniform1f(zFarLocation, optics.far);
                                            }
                                        }
                                    };
                                })()));

            this._lastProjXFormStateId = node.projXFormState._stateId;
        }

        /*----------------------------------------------------------------------------------------------------------
         * clip
         *--------------------------------------------------------------------------------------------------------*/

        if (node.clipState &&
            (node.clipState._stateId != this._lastClipStateId ||
             nodeFlagsState._stateId != this._lastFlagsStateId)) { // Flags can enable/disable clip

            /* Load clip planes for draw and pick
             */
            var clips = node.clipState.clips;
            for (k = 0,len = clips.length; k < len; k++) {
                this.createCall(
                        (function() {
                            var context = self._context;
                            var program = self._program;

                            var clip = clips[k];
                            var flags = nodeFlagsState.flags;

                            var uClipModeLocation = program.getUniformLocation("SCENEJS_uClipMode" + k);
                            var uClipNormalAndDist = program.getUniformLocation("SCENEJS_uClipNormalAndDist" + k);

                            return function() {
                                if (uClipModeLocation && uClipNormalAndDist) {
                                    if (flags.clipping === false) { // Flags disable/enable clipping
                                        context.uniform1f(uClipModeLocation, 0);
                                    } else if (clip.mode == "inside") {
                                        context.uniform1f(uClipModeLocation, 2);
                                    } else if (clip.mode == "outside") {
                                        context.uniform1f(uClipModeLocation, 1);
                                    } else { // disabled
                                        context.uniform1f(uClipModeLocation, 0);
                                    }
                                    context.uniform4fv(uClipNormalAndDist, clip.normalAndDist);
                                }
                            };
                        } )());
            }

            this._lastClipStateId = node.clipState._stateId;
        }

        /*----------------------------------------------------------------------------------------------------------
         * colortrans
         *--------------------------------------------------------------------------------------------------------*/

        if (!this._picking && !this._rayPicking) {

            if (node.colortransState && node.colortransState.core
                    && (node.colortransState._stateId != this._lastColortransStateId ||
                        nodeFlagsState._stateId != this._lastFlagsStateId)) { // Flags can enable/disable colortrans

                this.createCall(
                        this._callFuncs["colortrans"]
                                || (this._callFuncs["colortrans"] =
                                    (function() {

                                        var program = self._program;

                                        var flags = nodeFlagsState.flags;
                                        var core = node.colortransState.core;

                                        return function() {
                                            if (flags.colortrans === false) {
                                                program.setUniform("SCENEJS_uColorTransMode", 0);  // Disable
                                            } else {
                                                var scale = core.scale;
                                                var add = core.add;
                                                program.setUniform("SCENEJS_uColorTransMode", 1);  // Enable
                                                program.setUniform("SCENEJS_uColorTransScale", [scale.r, scale.g, scale.b, scale.a]);  // Scale
                                                program.setUniform("SCENEJS_uColorTransAdd", [add.r, add.g, add.b, add.a]);  // Scale
                                                program.setUniform("SCENEJS_uColorTransSaturation", core.saturation);  // Saturation
                                            }
                                        };
                                    })()));

                this._lastColortransStateId = node.colortransState._stateId;
            }
        }

        /*----------------------------------------------------------------------------------------------------------
         * material
         *--------------------------------------------------------------------------------------------------------*/

        if (!this._picking) {

            if (node.materialState && node.materialState != this._lastMaterialStateId) {

                this.createCall(
                        this._callFuncs["material"]
                                || (this._callFuncs["material"] =
                                    (function() {

                                        var program = self._program;
                                        var context = self._context;

                                        var uMaterialBaseColorLocation = program.getUniformLocation("SCENEJS_uMaterialBaseColor");
                                        var uMaterialSpecularColorLocation = program.getUniformLocation("SCENEJS_uMaterialSpecularColor");
                                        var uMaterialSpecularLocation = program.getUniformLocation("SCENEJS_uMaterialSpecular");
                                        var uMaterialShineLocation = program.getUniformLocation("SCENEJS_uMaterialShine");
                                        var uMaterialEmitLocation = program.getUniformLocation("SCENEJS_uMaterialEmit");
                                        var uMaterialAlphaLocation = program.getUniformLocation("SCENEJS_uMaterialAlpha");

                                        return function() {
                                            var material = node.materialState.material;
                                            if (uMaterialBaseColorLocation) {
                                                context.uniform3fv(uMaterialBaseColorLocation, material.baseColor);
                                            }
                                            if (uMaterialSpecularColorLocation) {
                                                context.uniform3fv(uMaterialSpecularColorLocation, material.specularColor);
                                            }
                                            if (uMaterialSpecularLocation) {
                                                context.uniform1f(uMaterialSpecularLocation, material.specular);
                                            }
                                            if (uMaterialShineLocation) {
                                                context.uniform1f(uMaterialShineLocation, material.shine);
                                            }
                                            if (uMaterialEmitLocation) {
                                                context.uniform1f(uMaterialEmitLocation, material.emit);
                                            }
                                            if (uMaterialAlphaLocation) {
                                                context.uniform1f(uMaterialAlphaLocation, material.alpha);
                                            }
                                        };
                                    })()));

                this._lastMaterialStateId = node.materialState._stateId;
            }
        }

        /*----------------------------------------------------------------------------------------------------------
         * lights
         *--------------------------------------------------------------------------------------------------------*/

        if (!this._picking) {
            if (node.lightState && node.lightState._stateId != this._lastLightStateId) {

                /* Load lights for draw
                 */
                var lights = node.lightState.lights;
                for (k = 0,len = lights.length; k < len; k++) {

                    this.createCall(
                            this._callFuncs["light" + k]
                                    || (this._callFuncs["light" + k] =
                                        (function() {

                                            var program = self._program;
                                            var context = self._context;

                                            var uLightColorLocation = program.getUniformLocation("SCENEJS_uLightColor" + k);
                                            var uLightDirLocation = program.getUniformLocation("SCENEJS_uLightDir" + k);
                                            var uLightPosLocation = program.getUniformLocation("SCENEJS_uLightPos" + k);
                                            var uLightCutOffLocation = program.getUniformLocation("SCENEJS_uLightCutOff" + k);
                                            var uLightSpotExpLocation = program.getUniformLocation("SCENEJS_uLightSpotExpOff" + k);
                                            var uLightAttenuationLocation = program.getUniformLocation("SCENEJS_uLightAttenuation" + k);

                                            var light = lights[k];

                                            switch (light.mode) {

                                                case "ambient":
                                                    return function() {
                                                        if (uLightColorLocation) {
                                                            context.uniform3fv(uLightColorLocation, light.color);
                                                        }
                                                    };

                                                case "dir":
                                                    return function() {
                                                        if (uLightColorLocation) {
                                                            context.uniform3fv(uLightColorLocation, light.color);
                                                        }
                                                        if (uLightDirLocation) {
                                                            context.uniform3fv(uLightDirLocation, light.worldDir);
                                                        }
                                                    };

                                                case "point":
                                                    return function() {
                                                        if (uLightColorLocation) {
                                                            context.uniform3fv(uLightColorLocation, light.color);
                                                        }
                                                        if (uLightPosLocation) {
                                                            context.uniform3fv(uLightPosLocation, light.worldPos);
                                                        }
                                                    };

                                                case "spot":
                                                    return function() {
                                                        //                                        if (uLightColorLocation) {
                                                        //                                            context.uniform3fv(uLightColorLocation, light.color);
                                                        //                                        }
                                                        //                                        if (uLightPosLocation) {
                                                        //                                            context.uniform3fv(uLightPosLocation, light.worldPos);
                                                        //                                        }
                                                        //                                        if (uLightDirLocation) {
                                                        //                                            context.uniform3fv(uLightDirLocation, light.worldDir);
                                                        //                                        }
                                                        //                                        if (uLightCutOffLocation) {
                                                        //
                                                        //                                        }
                                                        //                                        if (uLightSpotPosExp) {
                                                        //
                                                        //                                        }
                                                        //                                        context.uniform3fv(uLightAttenuationLocation,
                                                        //                                                [
                                                        //                                                    light.constantAttenuation,
                                                        //                                                    light.linearAttenuation,
                                                        //                                                    light.quadraticAttenuation
                                                        //                                                ]);
                                                    };
                                            }
                                        })()));
                }

                this._lastLightStateId = node.lightState._stateId;
            }
        }

        /*----------------------------------------------------------------------------------------------------------
         * name
         *--------------------------------------------------------------------------------------------------------*/

        if (this._picking) {
            if (! this._lastNameState || node.nameState._stateId != this._lastNameState._stateId) {

                this.createCall(
                        this._callFuncs["name"]
                                || (this._callFuncs["name"] =
                                    (function() {

                                        var program = self._program;
                                        var context = self._context;

                                        var callCtx = self._callCtx;

                                        var nameState = node.nameState;

                                        var uPickColorLocation = program.getUniformLocation("SCENEJS_uPickColor");

                                        return function() {

                                            if (callCtx.picking) { // Colour-pick pass - feed name's colour into pick shader

                                                if (nameState.name) {

                                                    self.pickNameStates[self._pickIndex++] = nameState;

                                                    var b = self._pickIndex >> 16 & 0xFF;
                                                    var g = self._pickIndex >> 8 & 0xFF;
                                                    var r = self._pickIndex & 0xFF;

                                                    context.uniform3fv(uPickColorLocation, [r / 255, g / 255, b / 255]);
                                                }
                                            }
                                        };
                                    })()));

                this._lastNameState = node.nameState;
            }
        }

        /*--------------------------------------------------------------------------------------------------------------
         * Render listeners
         *------------------------------------------------------------------------------------------------------------*/

        if (!this._picking) {    // TODO: do we ever want matrices during a pick pass?

            if (! this._lastRenderListenersState || node.renderListenersState._stateId != this._lastRenderListenersState._stateId) {

                this.createCall(
                        this._callFuncs["rendered"]
                                || (this._callFuncs["rendered"] =
                                    (function() {

                                        var listeners = node.renderListenersState.listeners;
                                        var queryFacade = self._queryFacade;

                                        return function() {
                                            for (var i = listeners.length - 1; i >= 0; i--) {
                                                listeners[i](queryFacade);  // Call listener with query facade object as scope
                                            }
                                        };
                                    })()));
                this._lastRenderListenersState = node.renderListenersState;
            }
        }

        /*----------------------------------------------------------------------------------------------------------
         * flags
         *
         * Set these last because we change certain other states when we determine that flags will change
         *--------------------------------------------------------------------------------------------------------*/

        if (! this._lastFlagsState || nodeFlagsState._stateId != this._lastFlagsState._stateId) {

            this.createCall(
                    this._callFuncs["flags"]
                            || (this._callFuncs["flags"] =
                                (function() {

                                    var context = self._context;
                                    var program = self._program;

                                    var callCtx = self._callCtx;

                                    var uBackfaceTexturingLocation = program.getUniformLocation("SCENEJS_uBackfaceTexturing");
                                    var uBackfaceLightingLocation = program.getUniformLocation("SCENEJS_uBackfaceLighting");
                                    var uSpecularLightingLocation = program.getUniformLocation("SCENEJS_uSpecularLighting");

                                    var flagsState = nodeFlagsState;

                                    return function() {

                                        var newFlags = flagsState.flags;
                                        var oldFlagsState = callCtx.lastFlagsState;
                                        var oldFlags = oldFlagsState ? oldFlagsState.flags : null;

                                        //            var clear = newFlags.clear;
                                        //            if (!oldFlags || (clear && (clear.depth != oldFlags.depth || clear.stencil != oldFlags.stencil))) {
                                        //                var clear = newFlags.clear || {};
                                        //                var mask = 0;
                                        //                if (clear.depth) {
                                        //                    mask |= gl.DEPTH_BUFFER_BIT;
                                        //                }
                                        //                if (clear.stencil) {
                                        //                    mask |= gl.STENCIL_BUFFER_BIT;
                                        //                }
                                        //                if (mask != 0) { alert("clear");
                                        //                    gl.clear(mask);
                                        //                }
                                        //            }


                                        if (!oldFlags || newFlags.backfaces != oldFlags.backfaces) {
                                            if (newFlags.backfaces) {
                                                context.disable(context.CULL_FACE);
                                            } else {
                                                context.enable(context.CULL_FACE);
                                            }
                                        }

                                        if (!oldFlags || newFlags.frontface != oldFlags.frontface) {
                                            if (newFlags.frontface == "cw") {
                                                context.frontFace(context.CW);
                                            } else {
                                                context.frontFace(context.CCW);
                                            }
                                        }

                                        if (!oldFlags || newFlags.blendFunc != oldFlags.blendFunc) {
                                            if (newFlags.blendFunc) {
                                                context.blendFunc(glEnum(context, newFlags.blendFunc.sfactor || "one"), glEnum(context, newFlags.blendFunc.dfactor || "zero"));
                                            } else {
                                                context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA); // Not redundant, because of inequality test above
                                            }
                                        }

                                        context.uniform1i(uBackfaceTexturingLocation, newFlags.backfaceTexturing == undefined ? true : !!newFlags.backfaceTexturing);
                                        context.uniform1i(uBackfaceLightingLocation, newFlags.backfaceLighting == undefined ? true : !!newFlags.backfaceLighting);
                                        context.uniform1i(uSpecularLightingLocation, newFlags.specular == undefined ? true : !!newFlags.specular);

                                        //            var mask = newFlags.colorMask;
                                        //
                                        //            if (!oldFlags || (mask && (mask.r != oldFlags.r || mask.g != oldFlags.g || mask.b != oldFlags.b || mask.a != oldFlags.a))) {
                                        //
                                        //                if (mask) {
                                        //
                                        //                    context.colorMask(mask.r, mask.g, mask.b, mask.a);
                                        //
                                        //                } else {
                                        //                    context.colorMask(true, true, true, true);
                                        //                }
                                        //            }

                                    };
                                })()));

            this._lastFlagsState = nodeFlagsState;
        }

        /*----------------------------------------------------------------------------------------------------------
         * Draw
         *--------------------------------------------------------------------------------------------------------*/

        this.createCall(
                this._callFuncs["draw"]
                        || (this._callFuncs["draw"] =
                            (function() {

                                var context = self._context;

                                var primitive = nodeGeoState.geo.primitive;
                                var numItems = nodeGeoState.geo.indexBuf.numItems;

                                return function() {
                                    context.drawElements(primitive, numItems, context.UNSIGNED_SHORT, 0);
                                };
                            })()));
    };


    var glEnum = function(context, name) {
        if (!name) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Null SceneJS.renderer node config: \"" + name + "\"");
        }
        var result = SceneJS_webgl_enumMap[name];
        if (!result) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Unrecognised SceneJS.renderer node config value: \"" + name + "\"");
        }
        var value = context[result];
        if (!value) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.WEBGL_UNSUPPORTED_NODE_CONFIG,
                    "This browser's WebGL does not support renderer node config value: \"" + name + "\"");
        }
        return value;
    };

    /**
     * Called after all nodes rendered for the current frame
     */
    this.cleanup = function() {

        this._context.flush();

        var callCtx = this._callCtx;

        this._lastRendererState = null;                             // Forget last "renderer" state
        if (callCtx.lastRendererProps) {                           // Forget last call-time renderer properties
            callCtx.lastRendererProps.restoreProps(this._context);
        }

        this._lastFlagsState = null;
        this._lastFrameBufState = null;
        this._lastNameState = null;

        if (callCtx.lastFrameBuf) {
            callCtx.lastFrameBuf.unbind();
            callCtx.lastFrameBuf = null;
        }

        this._lastProgramId = -1;

        this._program = null;

        //        if (this._program) {
        //            this._program.unbind();
        //
        //        }
        //        this._context.colorMask(true, true, true, true);
    };
};
new (function() {

    var canvas;         // Currently active canvas
    var idStack = [];
    var propStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function(params) {
                stackLen = 0;
                dirty = true;
                canvas = params.canvas;
                stackLen = 0;
                var props = createProps({  // Dont set props - just define for restoring to on props pop
                    clear: {
                        depth : true,
                        color : true
                    },
                 //    clearColor: {r: 0, g : 0, b : 0 },
                    clearDepth: 1.0,
                    enableDepthTest:true,
                    enableCullFace: false,
                    frontFace: "ccw",
                    cullFace: "back",
                    depthFunc: "less",
                    depthRange: {
                        zNear: 0,
                        zFar: 1
                    },
                    enableScissorTest: false,
                    viewport:{
                        x : 1,
                        y : 1,
                        width: canvas.canvas.width,
                        height: canvas.canvas.height
                    },
                    wireframe: false,
                    highlight: false,
                    enableClip: undefined,
                    enableBlend: false,
                    blendFunc: {
                        sfactor: "srcAlpha",
                        dfactor: "one"
                    }
                });


                // Not sure if needed:
                setProperties(canvas.context, props.props);

                pushProps("__scenejs_default_props", props);
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setRenderer(idStack[stackLen - 1], propStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setRenderer();
                    }
                    dirty = false;
                }
            });

    function createProps(props) {
        var restore;
        if (stackLen > 0) {  // can't restore when no previous props set
            restore = {};
            for (var name in props) {
                if (props.hasOwnProperty(name)) {
                    if (!(props[name] == undefined)) {
                        restore[name] = getSuperProperty(name);
                    }
                }
            }
        }
        props = processProps(props);

        return {

            props: props,

            setProps: function(context) {
                setProperties(context, props);
            },

            restoreProps : function(context) {
                if (restore) {
                    restoreProperties(context, restore);
                }
            }
        };
    }

    var getSuperProperty = function(name) {
        var props;
        var prop;
        for (var i = stackLen - 1; i >= 0; i--) {
            props = propStack[i].props;
            prop = props[name];
            if (prop != undefined && prop != null) {
                return props[name];
            }
        }
        return null; // Cause default to be set
    };

    function processProps(props) {
        var prop;
        for (var name in props) {
            if (props.hasOwnProperty(name)) {
                prop = props[name];
                if (prop != undefined && prop != null) {
                    if (glModeSetters[name]) {
                        props[name] = glModeSetters[name](null, prop);
                    } else if (glStateSetters[name]) {
                        props[name] = glStateSetters[name](null, prop);
                    }
                }
            }
        }
        return props;
    }

    var setProperties = function(context, props) {
        for (var key in props) {        // Set order-insensitive properties (modes)
            if (props.hasOwnProperty(key)) {
                var setter = glModeSetters[key];
                if (setter) {
                    setter(context, props[key]);
                }
            }
        }
        if (props.viewport) {           // Set order-sensitive properties (states)
            glStateSetters.viewport(context, props.viewport);
        }
        if (props.scissor) {
            glStateSetters.clear(context, props.scissor);
        }
        if (props.clear) {
            glStateSetters.clear(context, props.clear);
        }
    };

    /**
     * Restores previous renderer properties, except for clear - that's the reason we
     * have a seperate set and restore semantic - we don't want to keep clearing the buffer.
     */
    var restoreProperties = function(context, props) {
        var value;
        for (var key in props) {            // Set order-insensitive properties (modes)
            if (props.hasOwnProperty(key)) {
                value = props[key];
                if (value != undefined && value != null) {
                    var setter = glModeSetters[key];
                    if (setter) {
                        setter(context, value);
                    }
                }
            }
        }
        if (props.viewport) {               //  Set order-sensitive properties (states)
            glStateSetters.viewport(context, props.viewport);
        }
        if (props.scissor) {
            glStateSetters.clear(context, props.scissor);
        }
    };

    function pushProps(id, props) {
        idStack[stackLen] = id;
        propStack[stackLen] = props;
        stackLen++;
        dirty = true;
    }

    /**
     * Maps renderer node properties to WebGL context enums
     * @private
     */
    var glEnum = function(context, name) {
        if (!name) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Null SceneJS.renderer node config: \"" + name + "\"");
        }
        var result = SceneJS_webgl_enumMap[name];
        if (!result) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Unrecognised SceneJS.renderer node config value: \"" + name + "\"");
        }
        var value = context[result];
        if (!value) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "This browser's WebGL does not support renderer node config value: \"" + name + "\"");
        }
        return value;
    };


    /**
     * Order-insensitive functions that set WebGL modes ie. not actually causing an
     * immediate change.
     *
     * These map to renderer properties and are called in whatever order their
     * property is found on the renderer config.
     *
     * Each of these wrap a state-setter function on the WebGL context. Each function
     * also uses the glEnum map to convert its renderer node property argument to the
     * WebGL enum constant required by its wrapped function.
     *
     * When called with undefined/null context, will condition and return the value given
     * ie. set it to default if value is undefined. When called with a context, will
     * set the value on the context using the wrapped function.
     *
     * @private
     */
    var glModeSetters = {

        enableBlend: function(context, flag) {
            if (!context) {
                if (flag == null || flag == undefined) {
                    flag = false;
                }
                return flag;
            }
            if (flag) {
                context.enable(context.BLEND);
            } else {
                context.disable(context.BLEND);
            }
        },

        blendColor: function(context, color) {
            if (!context) {
                color = color || {};
                return {
                    r: color.r || 0,
                    g: color.g || 0,
                    b: color.b || 0,
                    a: (color.a == undefined || color.a == null) ? 1 : color.a
                };
            }
            context.blendColor(color.r, color.g, color.b, color.a);
        },

        blendEquation: function(context, eqn) {
            if (!context) {
                return eqn || "funcAdd";
            }
            context.blendEquation(context, glEnum(context, eqn));
        },

        /** Sets the RGB blend equation and the alpha blend equation separately
         */
        blendEquationSeparate: function(context, eqn) {
            if (!context) {
                eqn = eqn || {};
                return {
                    rgb : eqn.rgb || "funcAdd",
                    alpha : eqn.alpha || "funcAdd"
                };
            }
            context.blendEquation(glEnum(context, eqn.rgb), glEnum(context, eqn.alpha));
        },

        blendFunc: function(context, funcs) {
            if (!context) {
                funcs = funcs || {};
                return  {
                    sfactor : funcs.sfactor || "srcAlpha",
                    dfactor : funcs.dfactor || "oneMinusSrcAlpha"
                };
            }
            context.blendFunc(glEnum(context, funcs.sfactor || "srcAlpha"), glEnum(context, funcs.dfactor || "oneMinusSrcAlpha"));
        },

        blendFuncSeparate: function(context, func) {
            if (!context) {
                func = func || {};
                return {
                    srcRGB : func.srcRGB || "zero",
                    dstRGB : func.dstRGB || "zero",
                    srcAlpha : func.srcAlpha || "zero",
                    dstAlpha :  func.dstAlpha || "zero"
                };
            }
            context.blendFuncSeparate(
                    glEnum(context, func.srcRGB || "zero"),
                    glEnum(context, func.dstRGB || "zero"),
                    glEnum(context, func.srcAlpha || "zero"),
                    glEnum(context, func.dstAlpha || "zero"));
        },

        clearColor: function(context, color) {
            if (!context) {
                color = color || {};
                return {
                    r : color.r || 0,
                    g : color.g || 0,
                    b : color.b || 0,
                    a : (color.a == undefined || color.a == null) ? 1 : color.a
                };
            }
            context.clearColor(color.r, color.g, color.b, color.a);
        },

        clearDepth: function(context, depth) {
            if (!context) {
                return (depth == null || depth == undefined) ? 1 : depth;
            }
            context.clearDepth(depth);
        },

        clearStencil: function(context, clearValue) {
            if (!context) {
                return  clearValue || 0;
            }
            context.clearStencil(clearValue);
        },

        colorMask: function(context, color) {
            if (!context) {
                color = color || {};
                return {
                    r : color.r || 0,
                    g : color.g || 0,
                    b : color.b || 0,
                    a : (color.a == undefined || color.a == null) ? 1 : color.a
                };

            }
            context.colorMask(color.r, color.g, color.b, color.a);
        },

        enableCullFace: function(context, flag) {
            if (!context) {
                return flag;
            }
            if (flag) {
                context.enable(context.CULL_FACE);
            } else {
                context.disable(context.CULL_FACE);
            }
        },

        cullFace: function(context, mode) {
            if (!context) {
                return mode || "back";
            }
            context.cullFace(glEnum(context, mode));
        },

        enableDepthTest: function(context, flag) {
            if (!context) {
                if (flag == null || flag == undefined) {
                    flag = true;
                }
                return flag;
            }
            if (flag) {
                context.enable(context.DEPTH_TEST);
            } else {
                context.disable(context.DEPTH_TEST);
            }
        },

        depthFunc: function(context, func) {
            if (!context) {
                return func || "less";
            }
            context.depthFunc(glEnum(context, func));
        },

        enableDepthMask: function(context, flag) {
            if (!context) {
                if (flag == null || flag == undefined) {
                    flag = true;
                }
                return flag;
            }
            context.depthMask(flag);
        },

        depthRange: function(context, range) {
            if (!context) {
                range = range || {};
                return {
                    zNear : (range.zNear == undefined || range.zNear == null) ? 0 : range.zNear,
                    zFar : (range.zFar == undefined || range.zFar == null) ? 1 : range.zFar
                };
            }
            context.depthRange(range.zNear, range.zFar);
        } ,

        frontFace: function(context, mode) {
            if (!context) {
                return mode || "ccw";
            }
            context.frontFace(glEnum(context, mode));
        },

        lineWidth: function(context, width) {
            if (!context) {
                return width || 1;
            }
            context.lineWidth(width);
        },

        enableScissorTest: function(context, flag) {
            if (!context) {
                return flag;
            }
            if (flag) {
                context.enable(context.SCISSOR_TEST);
            } else {
                flag = false;
                context.disable(context.SCISSOR_TEST);
            }
        }
    };

    /**
     * Order-sensitive functions that immediately effect WebGL state change.
     *
     * These map to renderer properties and are called in a particular order since they
     * affect one another.
     *
     * Each of these wrap a state-setter function on the WebGL context. Each function
     * also uses the glEnum map to convert its renderer node property argument to the
     * WebGL enum constant required by its wrapped function.
     *
     * @private
     */
    var glStateSetters = {

        /** Set viewport on the given context
         */
        viewport: function(context, v) {
            if (!context) {
                v = v || {};
                return {
                    x : v.x || 1,
                    y : v.y || 1,
                    width: v.width || canvas.canvas.width,
                    height: v.height || canvas.canvas.height
                };
            }
            context.viewport(v.x, v.y, v.width, v.height);
        },

        /** Sets scissor region on the given context
         */
        scissor: function(context, s) {
            if (!context) {
                s = s || {};
                return {
                    x : s.x || 0,
                    y : s.y || 0,
                    width: s.width || 1.0,
                    height: s.height || 1.0
                };
            }
            context.scissor(s.x, s.y, s.width, s.height);
        },

        /** Clears buffers on the given context as specified in mask
         */
        clear:function(context, mask) {
            if (!context) {
                mask = mask || {};
                return mask;
            }
            var m;
            if (mask.color) {
                m = context.COLOR_BUFFER_BIT;
            }
            if (mask.depth) {
                m = m | context.DEPTH_BUFFER_BIT;
            }
            if (mask.stencil) {
                m = m | context.STENCIL_BUFFER_BIT;
            }

            if (m) {
                context.clear(m);
            }
        }
    };

    function popProps() {
        var oldProps = propStack[stackLen - 1];
        stackLen--;
        var newProps = propStack[stackLen - 1];
        dirty = true;
    }
   
    var Renderer = SceneJS.createNodeType("renderer");

    Renderer.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node defines the resource
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    this.core[key] = params[key];
                }
            }
        }
    };

    Renderer.prototype.setViewport = function(viewport) {
        this.core.viewport = viewport ? {
            x : viewport.x || 1,
            y : viewport.y || 1,
            width: viewport.width || 1000,
            height: viewport.height || 1000
        } : undefined;
    };

    Renderer.prototype.getViewport = function() {
        return this.core.viewport ? {
            x : this.core.viewport.x,
            y : this.core.viewport.y,
            width: this.core.viewport.width,
            height: this.core.viewport.height
        } : undefined;
    };

    Renderer.prototype.setScissor = function(scissor) {
        this.core.scissor = scissor ? {
            x : scissor.x || 1,
            y : scissor.y || 1,
            width: scissor.width || 1000,
            height: scissor.height || 1000
        } : undefined;
    };

    Renderer.prototype.getScissor = function() {
        return this.core.scissor ? {
            x : this.core.scissor.x,
            y : this.core.scissor.y,
            width: this.core.scissor.width,
            height: this.core.scissor.height
        } : undefined;
    };

    Renderer.prototype.setClear = function(clear) {
        this.core.clear = clear ? {
            r : clear.r || 0,
            g : clear.g || 0,
            b : clear.b || 0
        } : undefined;
    };

    Renderer.prototype.getClear = function() {
        return this.core.clear ? {
            r : this.core.clear.r,
            g : this.core.clear.g,
            b : this.core.clear.b
        } : null;
    };

    Renderer.prototype.setEnableBlend = function(enableBlend) {
        this.core.enableBlend = enableBlend;
    };

    Renderer.prototype.getEnableBlend = function() {
        return this.core.enableBlend;
    };

    Renderer.prototype.setBlendColor = function(color) {
        this.core.blendColor = color ? {
            r : color.r || 0,
            g : color.g || 0,
            b : color.b || 0,
            a : (color.a == undefined || color.a == null) ? 1 : color.a
        } : undefined;
    };

    Renderer.prototype.getBlendColor = function() {
        return this.core.blendColor ? {
            r : this.core.blendColor.r,
            g : this.core.blendColor.g,
            b : this.core.blendColor.b,
            a : this.core.blendColor.a
        } : undefined;
    };

    Renderer.prototype.setBlendEquation = function(eqn) {
        this.core.blendEquation = eqn;
    };

    Renderer.prototype.getBlendEquation = function() {
        return this.core.blendEquation;
    };

    Renderer.prototype.setBlendEquationSeparate = function(eqn) {
        this.core.blendEquationSeparate = eqn ? {
            rgb : eqn.rgb || "funcAdd",
            alpha : eqn.alpha || "funcAdd"
        } : undefined;
    };

    Renderer.prototype.getBlendEquationSeparate = function() {
        return this.core.blendEquationSeparate ? {
            rgb : this.core.rgb,
            alpha : this.core.alpha
        } : undefined;
    };

    Renderer.prototype.setBlendFunc = function(funcs) {
        this.core.blendFunc = funcs ? {
            sfactor : funcs.sfactor || "srcAlpha",
            dfactor : funcs.dfactor || "one"
        } : undefined;
    };

    Renderer.prototype.getBlendFunc = function() {
        return this.core.blendFunc ? {
            sfactor : this.core.sfactor,
            dfactor : this.core.dfactor
        } : undefined;
    };

    Renderer.prototype.setBlendFuncSeparate = function(eqn) {
        this.core.blendFuncSeparate = eqn ? {
            srcRGB : eqn.srcRGB || "zero",
            dstRGB : eqn.dstRGB || "zero",
            srcAlpha : eqn.srcAlpha || "zero",
            dstAlpha : eqn.dstAlpha || "zero"
        } : undefined;
    };

    Renderer.prototype.getBlendFuncSeparate = function() {
        return this.core.blendFuncSeparate ? {
            srcRGB : this.core.blendFuncSeparate.srcRGB,
            dstRGB : this.core.blendFuncSeparate.dstRGB,
            srcAlpha : this.core.blendFuncSeparate.srcAlpha,
            dstAlpha : this.core.blendFuncSeparate.dstAlpha
        } : undefined;
    };

    Renderer.prototype.setEnableCullFace = function(enableCullFace) {
        this.core.enableCullFace = enableCullFace;
    };

    Renderer.prototype.getEnableCullFace = function() {
        return this.core.enableCullFace;
    };


    Renderer.prototype.setCullFace = function(cullFace) {
        this.core.cullFace = cullFace;
    };

    Renderer.prototype.getCullFace = function() {
        return this.core.cullFace;
    };

    Renderer.prototype.setEnableDepthTest = function(enableDepthTest) {
        this.core.enableDepthTest = enableDepthTest;
    };

    Renderer.prototype.getEnableDepthTest = function() {
        return this.core.enableDepthTest;
    };

    Renderer.prototype.setDepthFunc = function(depthFunc) {
        this.core.depthFunc = depthFunc;
    };

    Renderer.prototype.getDepthFunc = function() {
        return this.core.depthFunc;
    };

    Renderer.prototype.setEnableDepthMask = function(enableDepthMask) {
        this.core.enableDepthMask = enableDepthMask;
    };

    Renderer.prototype.getEnableDepthMask = function() {
        return this.core.enableDepthMask;
    };

    Renderer.prototype.setClearDepth = function(clearDepth) {
        this.core.clearDepth = clearDepth;
    };

    Renderer.prototype.getClearDepth = function() {
        return this.core.clearDepth;
    };

    Renderer.prototype.setDepthRange = function(range) {
        this.core.depthRange = range ? {
            zNear : (range.zNear == undefined || range.zNear == null) ? 0 : range.zNear,
            zFar : (range.zFar == undefined || range.zFar == null) ? 1 : range.zFar
        } : undefined;
    };

    Renderer.prototype.getDepthRange = function() {
        return this.core.depthRange ? {
            zNear : this.core.depthRange.zNear,
            zFar : this.core.depthRange.zFar
        } : undefined;
    };

    Renderer.prototype.setFrontFace = function(frontFace) {
        this.core.frontFace = frontFace;
    };

    Renderer.prototype.getFrontFace = function() {
        return this.core.frontFace;
    };

    Renderer.prototype.setLineWidth = function(lineWidth) {
        this.core.lineWidth = lineWidth;
    };

    Renderer.prototype.getLineWidth = function() {
        return this.core.lineWidth;
    };

    Renderer.prototype.setEnableScissorTest = function(enableScissorTest) {
        this.core.enableScissorTest = enableScissorTest;
    };

    Renderer.prototype.getEnableScissorTest = function() {
        return this.core.enableScissorTest;
    };

    Renderer.prototype.setClearStencil = function(clearStencil) {
        this.core.clearStencil = clearStencil;
    };

    Renderer.prototype.getClearStencil = function() {
        return this.core.clearStencil;
    };

    Renderer.prototype.setColorMask = function(color) {
        this.core.colorMask = color ? {
            r : color.r || 0,
            g : color.g || 0,
            b : color.b || 0,
            a : (color.a == undefined || color.a == null) ? 1 : color.a
        } : undefined;
    };

    Renderer.prototype.getColorMask = function() {
        return this.core.colorMask ? {
            r : this.core.colorMask.r,
            g : this.core.colorMask.g,
            b : this.core.colorMask.b,
            a : this.core.colorMask.a
        } : undefined;
    };

    Renderer.prototype.setWireframe = function(wireframe) {
        this.core.wireframe = wireframe;
    };

    Renderer.prototype.getWireframe = function() {
        return this.core.wireframe;
    };

    Renderer.prototype.setHighlight = function(highlight) {
        this.core.highlight = highlight;
    };

    Renderer.prototype.getHighlight = function() {
        return this.core.highlight;
    };

    Renderer.prototype.setEnableClip = function(enableClip) {
        this.core.enableClip = enableClip;
    };

    Renderer.prototype.getEnableClip = function() {
        return this.core.enableClip;
    };

    Renderer.prototype.setEnableFog = function(enableFog) {
        this.core.enableFog = enableFog;
    };

    Renderer.prototype.getEnableFog = function() {
        return this.core.enableFog;
    };

    Renderer.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Renderer.prototype._preCompile = function() {
        if (this._compileMemoLevel == 0) {
            this._props = createProps(this.core);
            this._compileMemoLevel = 1;
        }
        pushProps(this.core.id, this._props);
    };

    Renderer.prototype._postCompile = function() {
        popProps();
    };

})();
/**
 * Backend that manages scene flags. These are pushed and popped by "flags" nodes
 * to enable/disable features for the subgraph. An important point to note about these
 * is that they never trigger the generation of new GLSL shaders - flags are designed
 * to switch things on/of with minimal overhead.
 *
 */
(function() {

    var idStack = [];
    var flagStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    /* Export flags when renderer needs them - only when current set not exported (dirty)
     */
    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function(params) {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setFlags(idStack[stackLen - 1], flagStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setFlags();
                    }
                    dirty = false;
                }
            });

    var Flags = SceneJS.createNodeType("flags");

    Flags.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node defines the resource
            if (!params.flags) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.NODE_CONFIG_EXPECTED,
                        "flags node 'flags' attribute missing ");
            }
            this.core.flags = {};
            this.setFlags(params.flags);
        }
    };

    Flags.prototype.setFlags = function(flags) {
        SceneJS._apply(flags, this.core.flags, true); // Node's flags object is shared with drawlist node   
    };

    Flags.prototype.addFlags = function(flags) {
        SceneJS._apply(flags, this.core.flags);
    };

    Flags.prototype.getFlags = function() {
        return SceneJS._shallowClone(this.core.flags);
    };

    Flags.prototype._compile = function() {
        idStack[stackLen] = this.attr.id;
        flagStack[stackLen] = this.core.flags;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };
})();
(function() {

    var idStack = [];
    var tagStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function(params) {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setTag(idStack[stackLen - 1], tagStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setTag();
                    }
                    dirty = false;
                }
            });

    var Tag = SceneJS.createNodeType("tag");

    Tag.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node defines the resource
            if (!params.tag) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.NODE_CONFIG_EXPECTED,
                        "tag node attribute missing : 'tag'");
            }
            this.core.tag = "enabled";
            this.setTag(params.tag);
        }
    };

    Tag.prototype.setTag = function(tag) {
        var core = this.core;
        core.tag = tag;
        core.pattern = null;
        core.matched = false;

    };

    Tag.prototype.getTag = function() {
        return this.core.tag;
    };

    Tag.prototype._compile = function() {
        idStack[stackLen] = this.attr.id;
        tagStack[stackLen] = this.core;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };
})();
/**
 * Backend that tracks statistics on loading states of nodes during scene traversal.
 *
 * This supports the "loading-status" events that we can listen for on scene nodes.
 *
 * When a node with that listener is pre-visited, it will call getStatus on this module to
 * save a copy of the status. Then when it is post-visited, it will call diffStatus on this
 * module to find the status for its sub-nodes, which it then reports through the "loading-status" event.
 *
 * @private
 */
var SceneJS_sceneStatusModule = new (function() {

    this.sceneStatus = {};

    var self = this;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_CREATED,
            function(params) {
                self.sceneStatus[params.sceneId] = {
                    numLoading: 0
                };
            });

    this.nodeLoading = function(node) {
        this.sceneStatus[node.scene.attr.id].numLoading++;
    };

    this.nodeLoaded = function(node) {
        this.sceneStatus[node.scene.attr.id].numLoading--;
    };

})();

new (function() {

    var geoStack = [];
    var stackLen = 0;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_CREATED,
            function() {
                stackLen = 0;
            });

    function destroyVBOs(geo) {
        if (document.getElementById(geo.canvas.canvasId)) { // Context won't exist if canvas has disappeared
            if (geo.vertexBuf) {
                geo.vertexBuf.destroy();
            }
            if (geo.normalBuf) {
                geo.normalBuf.destroy();
            }
            if (geo.indexBuf) {
                geo.indexBuf.destroy();
            }
            if (geo.uvBuf) {
                geo.uvBuf.destroy();
            }
            if (geo.uvBuf2) {
                geo.uvBuf2.destroy();
            }
            if (geo.colorBuf) {
                geo.colorBuf.destroy();
            }
        }
    }

    function getPrimitiveType(context, primitive) {
        switch (primitive) {
            case "points":
                return context.POINTS;
            case "lines":
                return context.LINES;
            case "line-loop":
                return context.LINE_LOOP;
            case "line-strip":
                return context.LINE_STRIP;
            case "triangles":
                return context.TRIANGLES;
            case "triangle-strip":
                return context.TRIANGLE_STRIP;
            case "triangle-fan":
                return context.TRIANGLE_FAN;
            default:
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.ILLEGAL_NODE_CONFIG,
                        "SceneJS.geometry primitive unsupported: '" +
                        primitive +
                        "' - supported types are: 'points', 'lines', 'line-loop', " +
                        "'line-strip', 'triangles', 'triangle-strip' and 'triangle-fan'");
        }
    }

    function createGeometry(scene, source, callback, options) {

        if (typeof source == "string") {

            /* Load from stream
             */
            var geoService = SceneJS.Services.getService(SceneJS.Services.GEO_LOADER_SERVICE_ID);
            geoService.loadGeometry(source,
                    function(data) {
                        callback(_createGeometry(scene, data, options));
                    });
        } else {

            /* Create from arrays
             */
            var data = createTypedArrays(source, options);
            data.primitive = source.primitive;
            return _createGeometry(scene, data);
        }
    }

    function createTypedArrays(data, options) {
        return {
            positions: data.positions
                    ? new Float32Array((options.scale || options.origin)
                    ? applyOptions(data.positions, options)
                    : data.positions) : undefined,
            normals: data.normals ? new Float32Array(data.normals) : undefined,
            uv: data.uv ? new Float32Array(data.uv) : undefined,
            uv2: data.uv2 ? new Float32Array(data.uv2) : undefined,
            colors: data.colors ? new Float32Array(data.colors) : undefined,
            indices: data.indices ? new Int32Array(data.indices) : undefined
        };
    }

    function _createGeometry(scene, data) {

        var context = scene.canvas.context;

        if (!data.primitive) { // "points", "lines", "line-loop", "line-strip", "triangles", "triangle-strip" or "triangle-fan"
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.NODE_CONFIG_EXPECTED,
                    "SceneJS.geometry node property expected : primitive");
        }
        var usage = context.STATIC_DRAW;
        //var usage = (!data.fixed) ? context.STREAM_DRAW : context.STATIC_DRAW;

        var vertexBuf;
        var normalBuf;
        var uvBuf;
        var uvBuf2;
        var colorBuf;
        var indexBuf;

        try { // TODO: Modify usage flags in accordance with how often geometry is evicted

            if (data.positions && data.positions.length > 0) {
                vertexBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER, data.positions, data.positions.length, 3, usage);
            }
            if (data.normals && data.normals.length > 0) {
                normalBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER, data.normals, data.normals.length, 3, usage);
            }
            if (data.uv && data.uv.length > 0) {
                if (data.uv) {
                    uvBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER, data.uv, data.uv.length, 2, usage);
                }
            }
            if (data.uv2 && data.uv2.length > 0) {
                if (data.uv2) {
                    uvBuf2 = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER, data.uv2, data.uv2.length, 2, usage);
                }
            }
            if (data.colors && data.colors.length > 0) {
                if (data.colors) {
                    colorBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER, data.colors, data.colors.length, 4, usage);
                }
            }
            var primitive;
            if (data.indices && data.indices.length > 0) {
                primitive = getPrimitiveType(context, data.primitive);
                indexBuf = new SceneJS_webgl_ArrayBuffer(context, context.ELEMENT_ARRAY_BUFFER,
                        new Uint16Array(data.indices), data.indices.length, 3, usage);
            }
            var geo = {
                fixed : true, // TODO: support dynamic geometry
                primitive: primitive,
                scene: scene,
                canvas : scene.canvas,
                context : context,
                vertexBuf : vertexBuf,
                normalBuf : normalBuf,
                indexBuf : indexBuf,
                uvBuf: uvBuf,
                uvBuf2: uvBuf2,
                colorBuf: colorBuf,
                arrays: data
            };
            if (data.positions) {
                // geo.boundary = getBoundary(data.positions);
            }

            return geo;
        } catch (e) { // Allocation failure - delete whatever buffers got allocated
            if (vertexBuf) {
                vertexBuf.destroy();
            }
            if (normalBuf) {
                normalBuf.destroy();
            }
            if (uvBuf) {
                uvBuf.destroy();
            }
            if (uvBuf2) {
                uvBuf2.destroy();
            }
            if (colorBuf) {
                colorBuf.destroy();
            }
            if (indexBuf) {
                indexBuf.destroy();
            }
            throw e;
        }
    }

    function applyOptions(positions, options) {
        var positions2 = positions.slice(0);

        if (options.scale) {

            var scaleX = options.scale.x != undefined ? options.scale.x : 1.0;
            var scaleY = options.scale.y != undefined ? options.scale.y : 1.0;
            var scaleZ = options.scale.z != undefined ? options.scale.z : 1.0;

            for (var i = 0, len = positions2.length; i < len; i += 3) {
                positions2[i + 0] *= scaleX;
                positions2[i + 1] *= scaleY;
                positions2[i + 2] *= scaleZ;
            }
        }

        if (options.origin) {

            var originX = options.origin.x != undefined ? options.origin.x : 0.0;
            var originY = options.origin.y != undefined ? options.origin.y : 0.0;
            var originZ = options.origin.z != undefined ? options.origin.z : 0.0;

            for (var i = 0, len = positions2.length; i < len; i += 3) {
                positions2[i + 0] -= originX;
                positions2[i + 1] -= originY;
                positions2[i + 2] -= originZ;
            }
        }

        return positions2;
    }


    function destroyGeometry(geo) {
        destroyVBOs(geo);
    }

    function pushGeometry(id, geo) {
        if (!geo.vertexBuf) {

            /* Geometry has no vertex buffer - it must be therefore be indexing a vertex/uv buffers defined
             * by a higher Geometry, as part of a composite geometry:
             *
             * It must therefore inherit the vertex buffer, along with UV coord buffers.
             *
             * We'll leave it to the render state graph traversal to ensure that the
             * vertex and UV buffers are not needlessly rebound for this geometry.
             */
            geo = inheritVertices(geo);
        }
        if (geo.indexBuf) {

            /* We don't render Geometry's that have no index buffer - they merely define
             * vertex/uv buffers that are indexed by sub-Geometry's in a composite geometry
             */
            SceneJS_DrawList.setGeometry(id, geo);
        }
        geoStack[stackLen++] = geo;
    }

    function inheritVertices(geo) {
        var geo2 = {
            primitive: geo.primitive,
            boundary: geo.boundary,
            normalBuf: geo.normalBuf,
            uvBuf: geo.uvBuf,
            uvBuf2: geo.uvBuf2,
            colorBuf: geo.colorBuf,
            indexBuf: geo.indexBuf
        };
        for (var i = stackLen - 1; i >= 0; i--) {
            if (geoStack[i].vertexBuf) {
                geo2.vertexBuf = geoStack[i].vertexBuf;
                geo2.boundary = geoStack[i].boundary;
                geo2.normalBuf = geoStack[i].normalBuf;
                geo2.uvBuf = geoStack[i].uvBuf;           // Vertex and UVs are a package
                geo2.uvBuf2 = geoStack[i].uvBuf2;
                geo2.colorBuf = geoStack[i].colorBuf;
                return geo2;
            }
        }
        return geo2;
    }

    function popGeometry() {
        stackLen--;
    }

    /*----------------------------------------------------------------------------------------------------------------
     * Geometry node
     *---------------------------------------------------------------------------------------------------------------*/

    window.SceneJS_geometry = SceneJS.createNodeType("geometry");

    SceneJS_geometry.prototype._init = function(params) {

        if (this.core._nodeCount == 1) { // This node defines the core

            var options = {
                origin : params.origin,
                scale: params.scale
            };

            if (params.create instanceof Function) {

                /* Create using factory function
                 * Expose the arrays on the node
                 */
                var data = params.create();
                SceneJS._apply(createGeometry(this.scene, data, null, options), this.core);

            } else if (params.stream) {

                /* Load from stream
                 * TODO: Expose the arrays on the node
                 */
                this._stream = params.stream;
                this.core._loading = true;

                var self = this;
                createGeometry(
                        this.scene,
                        this._stream,
                        function(geo) {
                            SceneJS._apply(geo, self.core);
                            self.core._loading = false;
                            SceneJS_compileModule.nodeUpdated(self, "loaded"); // Compile again to apply freshly-loaded geometry
                        },
                        options);
            } else {

                /* Create from arrays
                 * Expose the arrays on the node
                 */
                var arrays = {
                    positions : params.positions || [],
                    normals : params.normals || [],
                    colors : params.colors || [],
                    indices : params.indices || [],
                    uv : params.uv || [],
                    uv2 : params.uv2 || [],
                    primitive : params.primitive || "triangles"
                };

                SceneJS._apply(createGeometry(this.scene, arrays, null, options), this.core);
            }
        }
    };

    SceneJS_geometry.prototype.getStream = function() {
        return this._stream;
    };

    SceneJS_geometry.prototype.getPositions = function() {
        return this._getArrays().positions;
    };

    SceneJS_geometry.prototype.setPositions = function(params) {
        this.core.vertexBuf.bind();
        this.core.vertexBuf.setData(params.positions, params.offset || 0);
    };

    SceneJS_geometry.prototype.getNormals = function() {
        return this._getArrays().normals;
    };

    SceneJS_geometry.prototype.setNormals = function(params) {
        this.core.normalBuf.bind();
        this.core.normalBuf.setData(params.normals, params.offset || 0);
    };

    SceneJS_geometry.prototype.getColors = function() {
        return this._getArrays().colors;
    };

    SceneJS_geometry.prototype.setColors = function(params) {
        this.core.colorBuf.bind();
        this.core.colorBuf.setData(params.colors, params.offset || 0);
    };

    SceneJS_geometry.prototype.getIndices = function() {
        return this._getArrays().indices;
    };


    SceneJS_geometry.prototype.getUv = function() {
        return this._getArrays().uv;
    };

    SceneJS_geometry.prototype.setUv = function(params) {
        this.core.uvBuf.bind();
        this.core.uvBuf.setData(params.uv, params.offset || 0);
    };

    SceneJS_geometry.prototype.getUv2 = function() {
        return this._getArrays().uv2;
    };

    SceneJS_geometry.prototype.setUv2 = function(params) {
        this.core.uvBuf2.bind();
        this.core.uvBuf2.setData(params.uv2, params.offset || 0);
    };

    SceneJS_geometry.prototype.getPrimitive = function() {
        return this.attr.primitive;
    };

    SceneJS_geometry.prototype._getArrays = function() {
        if (this.attr.positions) {
            return this.attr;
        } else {
            if (!this.core) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.NODE_ILLEGAL_STATE,
                        "Invalid node state exception: geometry stream not loaded yet - can't query geometry data yet");
            }
            return this.core.arrays;
        }
    };

    SceneJS_geometry.prototype.getBoundary = function() {
        if (this._boundary) {
            return this._boundary;
        }
        var positions = this._getArrays().positions;
        this._boundary = {
            xmin : SceneJS_math_MAX_DOUBLE,
            ymin : SceneJS_math_MAX_DOUBLE,
            zmin : SceneJS_math_MAX_DOUBLE,
            xmax : SceneJS_math_MIN_DOUBLE,
            ymax : SceneJS_math_MIN_DOUBLE,
            zmax : SceneJS_math_MIN_DOUBLE
        };
        var x, y, z;
        for (var i = 0, len = positions.length - 2; i < len; i += 3) {
            x = positions[i];
            y = positions[i + 1];
            z = positions[i + 2];

            if (x < this._boundary.xmin) {
                this._boundary.xmin = x;
            }
            if (y < this._boundary.ymin) {
                this._boundary.ymin = y;
            }
            if (z < this._boundary.zmin) {
                this._boundary.zmin = z;
            }
            if (x > this._boundary.xmax) {
                this._boundary.xmax = x;
            }
            if (y > this._boundary.ymax) {
                this._boundary.ymax = y;
            }
            if (z > this._boundary.zmax) {
                this._boundary.zmax = z;
            }
        }
        return this._boundary;
    };

    SceneJS_geometry.prototype._compile = function() {
        if (!this.core._loading) {
            pushGeometry(this.attr.id, this.core);
        }
        this._compileNodes();
        if (!this.core._loading) {
            popGeometry();
        }
    };

    SceneJS_geometry.prototype._destroy = function() {
        if (this.core._nodeCount == 1) { // Last core user
            destroyGeometry(this.core);

            /* When destroying scene nodes, we only need to notify the rendering module
             * of each geometry node destruction because that will destroy the display list
             * node associated with the geometry, which will in turn destroy rendering
             * states associated with the display list node, and so on.
             */
            SceneJS_DrawList.removeGeometry(this.scene.attr.id, this.attr.id);
        }
    };
})();
/**
 * @class A scene node that defines the geometry of the venerable OpenGL teapot.
 * <p><b>Example Usage</b></p><p>Definition of teapot:</b></p><pre><code>
 * var c = new SceneJS_teapot(); // Requires no parameters
 * </pre></code>
 * @extends SceneJS.Geometry
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS_teapot
 * @param {Object} [cfg] Static configuration object
 * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
 * @param {...SceneJS_node} [childNodes] Child nodes
 */

(function() {
/* Callback that does the creation when teapot not created yet
         * @private
         */
    function create() {
        var positions = [
            [-3.000000, 1.650000, 0.000000],
            [-2.987110, 1.650000, -0.098438],
            [-2.987110, 1.650000, 0.098438],
            [-2.985380, 1.567320, -0.049219],
            [-2.985380, 1.567320, 0.049219],
            [-2.983500, 1.483080, 0.000000],
            [-2.981890, 1.723470, -0.049219],
            [-2.981890, 1.723470, 0.049219],
            [-2.976560, 1.798530, 0.000000],
            [-2.970900, 1.486210, -0.098438],
            [-2.970900, 1.486210, 0.098438],
            [-2.963880, 1.795340, -0.098438],
            [-2.963880, 1.795340, 0.098438],
            [-2.962210, 1.570170, -0.133594],
            [-2.962210, 1.570170, 0.133594],
            [-2.958640, 1.720570, -0.133594],
            [-2.958640, 1.720570, 0.133594],
            [-2.953130, 1.650000, -0.168750],
            [-2.953130, 1.650000, 0.168750],
            [-2.952470, 1.403740, -0.049219],
            [-2.952470, 1.403740, 0.049219],
            [-2.937700, 1.494470, -0.168750],
            [-2.937700, 1.494470, 0.168750],
            [-2.935230, 1.852150, -0.049219],
            [-2.935230, 1.852150, 0.049219],
            [-2.933590, 1.320120, 0.000000],
            [-2.930450, 1.786930, -0.168750],
            [-2.930450, 1.786930, 0.168750],
            [-2.930370, 1.411500, -0.133594],
            [-2.930370, 1.411500, 0.133594],
            [-2.921880, 1.325530, -0.098438],
            [-2.921880, 1.325530, 0.098438],
            [-2.912780, 1.844170, -0.133594],
            [-2.912780, 1.844170, 0.133594],
            [-2.906250, 1.910160, 0.000000],
            [-2.894230, 1.904570, -0.098438],
            [-2.894230, 1.904570, 0.098438],
            [-2.891380, 1.579100, -0.196875],
            [-2.891380, 1.579100, 0.196875],
            [-2.890990, 1.339800, -0.168750],
            [-2.890990, 1.339800, 0.168750],
            [-2.890650, 1.712080, -0.196875],
            [-2.890650, 1.712080, 0.196875],
            [-2.883460, 1.245790, -0.048343],
            [-2.883460, 1.245790, 0.048343],
            [-2.863460, 1.257130, -0.132718],
            [-2.863460, 1.257130, 0.132718],
            [-2.862660, 1.434830, -0.196875],
            [-2.862660, 1.434830, 0.196875],
            [-2.862550, 1.889830, -0.168750],
            [-2.862550, 1.889830, 0.168750],
            [-2.850000, 1.650000, -0.225000],
            [-2.850000, 1.650000, 0.225000],
            [-2.849710, 1.161550, 0.000000],
            [-2.847100, 1.820820, -0.196875],
            [-2.847100, 1.820820, 0.196875],
            [-2.841940, 1.946920, -0.049219],
            [-2.841940, 1.946920, 0.049219],
            [-2.829000, 1.761400, -0.225000],
            [-2.829000, 1.761400, 0.225000],
            [-2.828670, 1.175980, -0.094933],
            [-2.828670, 1.175980, 0.094933],
            [-2.824700, 1.521940, -0.225000],
            [-2.824700, 1.521940, 0.225000],
            [-2.821150, 1.935200, -0.133594],
            [-2.821150, 1.935200, 0.133594],
            [-2.812310, 1.187190, -0.168750],
            [-2.812310, 1.187190, 0.168750],
            [-2.805010, 1.289970, -0.196875],
            [-2.805010, 1.289970, 0.196875],
            [-2.797270, 1.383110, -0.225000],
            [-2.797270, 1.383110, 0.225000],
            [-2.789060, 1.990140, 0.000000],
            [-2.788360, 1.699320, -0.196875],
            [-2.788360, 1.699320, 0.196875],
            [-2.778210, 1.982830, -0.098438],
            [-2.778210, 1.982830, 0.098438],
            [-2.774420, 1.527380, -0.196875],
            [-2.774420, 1.527380, 0.196875],
            [-2.773560, 1.098600, -0.084375],
            [-2.773560, 1.098600, 0.084375],
            [-2.766410, 1.845120, -0.225000],
            [-2.766410, 1.845120, 0.225000],
            [-2.760340, 1.900900, -0.196875],
            [-2.760340, 1.900900, 0.196875],
            [-2.749600, 1.963560, -0.168750],
            [-2.749600, 1.963560, 0.168750],
            [-2.748310, 1.785700, -0.196875],
            [-2.748310, 1.785700, 0.196875],
            [-2.746880, 1.650000, -0.168750],
            [-2.746880, 1.650000, 0.168750],
            [-2.731250, 1.007810, 0.000000],
            [-2.727560, 1.735870, -0.168750],
            [-2.727560, 1.735870, 0.168750],
            [-2.720360, 1.690830, -0.133594],
            [-2.720360, 1.690830, 0.133594],
            [-2.719480, 1.249770, -0.225000],
            [-2.719480, 1.249770, 0.225000],
            [-2.716780, 1.144680, -0.196875],
            [-2.716780, 1.144680, 0.196875],
            [-2.712890, 1.650000, -0.098438],
            [-2.712890, 1.650000, 0.098438],
            [-2.708990, 1.541770, -0.133594],
            [-2.708990, 1.541770, 0.133594],
            [-2.703540, 1.426410, -0.168750],
            [-2.703540, 1.426410, 0.168750],
            [-2.700980, 1.037840, -0.168750],
            [-2.700980, 1.037840, 0.168750],
            [-2.700000, 1.650000, 0.000000],
            [-2.699650, 2.010790, -0.048346],
            [-2.699650, 2.010790, 0.048346],
            [-2.697120, 1.687930, -0.049219],
            [-2.697120, 1.687930, 0.049219],
            [-2.694130, 1.727460, -0.098438],
            [-2.694130, 1.727460, 0.098438],
            [-2.686620, 1.546690, -0.049219],
            [-2.686620, 1.546690, 0.049219],
            [-2.682630, 1.762350, -0.133594],
            [-2.682630, 1.762350, 0.133594],
            [-2.681480, 1.996460, -0.132721],
            [-2.681480, 1.996460, 0.132721],
            [-2.681440, 1.724270, 0.000000],
            [-2.675740, 1.270850, -0.196875],
            [-2.675740, 1.270850, 0.196875],
            [-2.672650, 1.440680, -0.098438],
            [-2.672650, 1.440680, 0.098438],
            [-2.670260, 1.800400, -0.168750],
            [-2.670260, 1.800400, 0.168750],
            [-2.667800, 1.846230, -0.196875],
            [-2.667800, 1.846230, 0.196875],
            [-2.662790, 1.905100, -0.225000],
            [-2.662790, 1.905100, 0.225000],
            [-2.660940, 1.446090, 0.000000],
            [-2.660180, 1.754370, -0.049219],
            [-2.660180, 1.754370, 0.049219],
            [-2.638580, 1.785670, -0.098438],
            [-2.638580, 1.785670, 0.098438],
            [-2.634380, 1.103910, -0.225000],
            [-2.634380, 1.103910, 0.225000],
            [-2.630740, 1.956740, -0.196875],
            [-2.630740, 1.956740, 0.196875],
            [-2.626560, 1.780080, 0.000000],
            [-2.625000, 2.043750, 0.000000],
            [-2.624640, 1.305020, -0.132813],
            [-2.624640, 1.305020, 0.132813],
            [-2.606420, 1.317450, -0.048438],
            [-2.606420, 1.317450, 0.048438],
            [-2.606320, 2.026440, -0.094945],
            [-2.606320, 2.026440, 0.094945],
            [-2.591800, 2.012990, -0.168750],
            [-2.591800, 2.012990, 0.168750],
            [-2.571730, 1.834290, -0.168750],
            [-2.571730, 1.834290, 0.168750],
            [-2.567770, 1.169970, -0.168750],
            [-2.567770, 1.169970, 0.168750],
            [-2.554600, 1.183040, -0.095315],
            [-2.554600, 1.183040, 0.095315],
            [-2.549750, 1.890590, -0.196875],
            [-2.549750, 1.890590, 0.196875],
            [-2.549540, 0.878984, -0.084375],
            [-2.549540, 0.878984, 0.084375],
            [-2.546430, 1.831970, -0.132721],
            [-2.546430, 1.831970, 0.132721],
            [-2.537500, 1.200000, 0.000000],
            [-2.527210, 1.819200, -0.048346],
            [-2.527210, 1.819200, 0.048346],
            [-2.518750, 1.945310, -0.225000],
            [-2.518750, 1.945310, 0.225000],
            [-2.516830, 0.932671, -0.196875],
            [-2.516830, 0.932671, 0.196875],
            [-2.471840, 1.006490, -0.196875],
            [-2.471840, 1.006490, 0.196875],
            [-2.445700, 1.877640, -0.168750],
            [-2.445700, 1.877640, 0.168750],
            [-2.439130, 1.060180, -0.084375],
            [-2.439130, 1.060180, 0.084375],
            [-2.431180, 1.864180, -0.094945],
            [-2.431180, 1.864180, 0.094945],
            [-2.412500, 1.846870, 0.000000],
            [-2.388280, 0.716602, 0.000000],
            [-2.382250, 0.737663, -0.095854],
            [-2.382250, 0.737663, 0.095854],
            [-2.378840, 2.052020, -0.084375],
            [-2.378840, 2.052020, 0.084375],
            [-2.377660, 0.753680, -0.168750],
            [-2.377660, 0.753680, 0.168750],
            [-2.364750, 0.798761, -0.199836],
            [-2.364750, 0.798761, 0.199836],
            [-2.354300, 0.835254, -0.225000],
            [-2.354300, 0.835254, 0.225000],
            [-2.343840, 0.871747, -0.199836],
            [-2.343840, 0.871747, 0.199836],
            [-2.341150, 1.999720, -0.196875],
            [-2.341150, 1.999720, 0.196875],
            [-2.330930, 0.916827, -0.168750],
            [-2.330930, 0.916827, 0.168750],
            [-2.320310, 0.953906, 0.000000],
            [-2.289320, 1.927820, -0.196875],
            [-2.289320, 1.927820, 0.196875],
            [-2.251620, 1.875520, -0.084375],
            [-2.251620, 1.875520, 0.084375],
            [-2.247410, 0.882285, -0.084375],
            [-2.247410, 0.882285, 0.084375],
            [-2.173630, 0.844043, 0.000000],
            [-2.168530, 0.826951, -0.097184],
            [-2.168530, 0.826951, 0.097184],
            [-2.164770, 0.814364, -0.168750],
            [-2.164770, 0.814364, 0.168750],
            [-2.156880, 0.786694, -0.187068],
            [-2.156880, 0.786694, 0.187068],
            [-2.156250, 2.092970, 0.000000],
            [-2.154120, 0.740520, -0.215193],
            [-2.154120, 0.740520, 0.215193],
            [-2.150170, 0.694734, -0.215193],
            [-2.150170, 0.694734, 0.215193],
            [-2.147420, 0.648560, -0.187068],
            [-2.147420, 0.648560, 0.187068],
            [-2.144960, 0.612777, -0.132948],
            [-2.144960, 0.612777, 0.132948],
            [-2.143710, 0.591789, -0.048573],
            [-2.143710, 0.591789, 0.048573],
            [-2.142330, 2.058360, -0.168750],
            [-2.142330, 2.058360, 0.168750],
            [-2.111720, 1.982230, -0.225000],
            [-2.111720, 1.982230, 0.225000],
            [-2.084470, 0.789526, -0.048905],
            [-2.084470, 0.789526, 0.048905],
            [-2.081100, 1.906090, -0.168750],
            [-2.081100, 1.906090, 0.168750],
            [-2.078340, 0.770387, -0.133280],
            [-2.078340, 0.770387, 0.133280],
            [-2.067190, 1.871480, 0.000000],
            [-2.000000, 0.750000, 0.000000],
            [-1.995700, 0.737109, -0.098438],
            [-1.995700, 0.737109, 0.098438],
            [-1.984380, 0.703125, -0.168750],
            [-1.984380, 0.703125, 0.168750],
            [-1.978520, 0.591650, 0.000000],
            [-1.969370, 0.670825, -0.202656],
            [-1.969370, 0.670825, 0.202656],
            [-1.968360, 0.655078, -0.210938],
            [-1.968360, 0.655078, 0.210938],
            [-1.960000, 0.750000, -0.407500],
            [-1.960000, 0.750000, 0.407500],
            [-1.958730, 0.925195, -0.201561],
            [-1.958730, 0.925195, 0.201561],
            [-1.957030, 1.100390, 0.000000],
            [-1.950000, 0.600000, -0.225000],
            [-1.950000, 0.600000, 0.225000],
            [-1.938950, 0.591650, -0.403123],
            [-1.938950, 0.591650, 0.403123],
            [-1.931640, 0.544922, -0.210938],
            [-1.931640, 0.544922, 0.210938],
            [-1.930690, 0.522583, -0.198676],
            [-1.930690, 0.522583, 0.198676],
            [-1.921880, 0.453516, 0.000000],
            [-1.917890, 1.100390, -0.398745],
            [-1.917890, 1.100390, 0.398745],
            [-1.915620, 0.496875, -0.168750],
            [-1.915620, 0.496875, 0.168750],
            [-1.904300, 0.462891, -0.098438],
            [-1.904300, 0.462891, 0.098438],
            [-1.900000, 0.450000, 0.000000],
            [-1.892280, 0.670825, -0.593047],
            [-1.892280, 0.670825, 0.593047],
            [-1.883440, 0.453516, -0.391582],
            [-1.883440, 0.453516, 0.391582],
            [-1.882060, 0.925195, -0.589845],
            [-1.882060, 0.925195, 0.589845],
            [-1.881390, 1.286130, -0.193602],
            [-1.881390, 1.286130, 0.193602],
            [-1.855120, 0.522583, -0.581402],
            [-1.855120, 0.522583, 0.581402],
            [-1.845000, 0.750000, -0.785000],
            [-1.845000, 0.750000, 0.785000],
            [-1.843750, 1.471870, 0.000000],
            [-1.833170, 1.890680, -0.084375],
            [-1.833170, 1.890680, 0.084375],
            [-1.831800, 1.946490, -0.196875],
            [-1.831800, 1.946490, 0.196875],
            [-1.829920, 2.023230, -0.196875],
            [-1.829920, 2.023230, 0.196875],
            [-1.828550, 2.079040, -0.084375],
            [-1.828550, 2.079040, 0.084375],
            [-1.825180, 0.591650, -0.776567],
            [-1.825180, 0.591650, 0.776567],
            [-1.817580, 0.343945, -0.187036],
            [-1.817580, 0.343945, 0.187036],
            [-1.807750, 1.286130, -0.566554],
            [-1.807750, 1.286130, 0.566554],
            [-1.806870, 1.471870, -0.375664],
            [-1.806870, 1.471870, 0.375664],
            [-1.805360, 1.100390, -0.768135],
            [-1.805360, 1.100390, 0.768135],
            [-1.772930, 0.453516, -0.754336],
            [-1.772930, 0.453516, 0.754336],
            [-1.750000, 0.234375, 0.000000],
            [-1.746440, 0.343945, -0.547339],
            [-1.746440, 0.343945, 0.547339],
            [-1.744330, 0.670825, -0.949871],
            [-1.744330, 0.670825, 0.949871],
            [-1.734910, 0.925195, -0.944741],
            [-1.734910, 0.925195, 0.944741],
            [-1.715000, 0.234375, -0.356563],
            [-1.715000, 0.234375, 0.356562],
            [-1.710080, 0.522583, -0.931218],
            [-1.710080, 0.522583, 0.931218],
            [-1.700860, 1.471870, -0.723672],
            [-1.700860, 1.471870, 0.723672],
            [-1.666400, 1.286130, -0.907437],
            [-1.666400, 1.286130, 0.907437],
            [-1.662500, 0.750000, -1.125000],
            [-1.662500, 0.750000, 1.125000],
            [-1.655160, 1.860940, -0.170322],
            [-1.655160, 1.860940, 0.170322],
            [-1.647420, 0.159961, -0.169526],
            [-1.647420, 0.159961, 0.169526],
            [-1.644640, 0.591650, -1.112920],
            [-1.644640, 0.591650, 1.112920],
            [-1.626780, 1.100390, -1.100830],
            [-1.626780, 1.100390, 1.100830],
            [-1.614370, 0.234375, -0.686875],
            [-1.614370, 0.234375, 0.686875],
            [-1.609890, 0.343945, -0.876660],
            [-1.609890, 0.343945, 0.876660],
            [-1.600000, 1.875000, 0.000000],
            [-1.597560, 0.453516, -1.081060],
            [-1.597560, 0.453516, 1.081060],
            [-1.590370, 1.860940, -0.498428],
            [-1.590370, 1.860940, 0.498428],
            [-1.584380, 1.910160, -0.168750],
            [-1.584380, 1.910160, 0.168750],
            [-1.582940, 0.159961, -0.496099],
            [-1.582940, 0.159961, 0.496099],
            [-1.578130, 0.085547, 0.000000],
            [-1.550000, 1.987500, -0.225000],
            [-1.550000, 1.987500, 0.225000],
            [-1.546560, 0.085547, -0.321543],
            [-1.546560, 0.085547, 0.321543],
            [-1.532970, 0.670825, -1.265670],
            [-1.532970, 0.670825, 1.265670],
            [-1.532620, 1.471870, -1.037110],
            [-1.532620, 1.471870, 1.037110],
            [-1.524690, 0.925195, -1.258830],
            [-1.524690, 0.925195, 1.258830],
            [-1.523670, 0.042773, -0.156792],
            [-1.523670, 0.042773, 0.156792],
            [-1.515630, 2.064840, -0.168750],
            [-1.515630, 2.064840, 0.168750],
            [-1.502870, 0.522583, -1.240810],
            [-1.502870, 0.522583, 1.240810],
            [-1.500000, 0.000000, 0.000000],
            [-1.500000, 2.100000, 0.000000],
            [-1.500000, 2.250000, 0.000000],
            [-1.470000, 0.000000, -0.305625],
            [-1.470000, 0.000000, 0.305625],
            [-1.470000, 2.250000, -0.305625],
            [-1.470000, 2.250000, 0.305625],
            [-1.466020, 1.860940, -0.798320],
            [-1.466020, 1.860940, 0.798320],
            [-1.464490, 1.286130, -1.209120],
            [-1.464490, 1.286130, 1.209120],
            [-1.464030, 0.042773, -0.458833],
            [-1.464030, 0.042773, 0.458833],
            [-1.459860, 2.286910, -0.150226],
            [-1.459860, 2.286910, 0.150226],
            [-1.459170, 0.159961, -0.794590],
            [-1.459170, 0.159961, 0.794590],
            [-1.455820, 0.085547, -0.619414],
            [-1.455820, 0.085547, 0.619414],
            [-1.454690, 0.234375, -0.984375],
            [-1.454690, 0.234375, 0.984375],
            [-1.449220, 2.323830, 0.000000],
            [-1.420230, 2.323830, -0.295278],
            [-1.420230, 2.323830, 0.295278],
            [-1.420000, 0.750000, -1.420000],
            [-1.420000, 0.750000, 1.420000],
            [-1.414820, 0.343945, -1.168120],
            [-1.414820, 0.343945, 1.168120],
            [-1.411910, 2.336130, -0.145291],
            [-1.411910, 2.336130, 0.145291],
            [-1.404750, 0.591650, -1.404750],
            [-1.404750, 0.591650, 1.404750],
            [-1.403130, 2.348440, 0.000000],
            [-1.402720, 2.286910, -0.439618],
            [-1.402720, 2.286910, 0.439618],
            [-1.400000, 2.250000, 0.000000],
            [-1.389490, 1.100390, -1.389490],
            [-1.389490, 1.100390, 1.389490],
            [-1.383750, 0.000000, -0.588750],
            [-1.383750, 0.000000, 0.588750],
            [-1.383750, 2.250000, -0.588750],
            [-1.383750, 2.250000, 0.588750],
            [-1.380470, 2.323830, 0.000000],
            [-1.377880, 2.336130, -0.141789],
            [-1.377880, 2.336130, 0.141789],
            [-1.376330, 2.286910, -0.141630],
            [-1.376330, 2.286910, 0.141630],
            [-1.375060, 2.348440, -0.285887],
            [-1.375060, 2.348440, 0.285887],
            [-1.372000, 2.250000, -0.285250],
            [-1.372000, 2.250000, 0.285250],
            [-1.364530, 0.453516, -1.364530],
            [-1.364530, 0.453516, 1.364530],
            [-1.356650, 2.336130, -0.425177],
            [-1.356650, 2.336130, 0.425177],
            [-1.352860, 2.323830, -0.281271],
            [-1.352860, 2.323830, 0.281271],
            [-1.349570, 0.042773, -0.734902],
            [-1.349570, 0.042773, 0.734902],
            [-1.336900, 2.323830, -0.568818],
            [-1.336900, 2.323830, 0.568818],
            [-1.323950, 2.336130, -0.414929],
            [-1.323950, 2.336130, 0.414929],
            [-1.322460, 2.286910, -0.414464],
            [-1.322460, 2.286910, 0.414464],
            [-1.311820, 0.085547, -0.887695],
            [-1.311820, 0.085547, 0.887695],
            [-1.309060, 1.471870, -1.309060],
            [-1.309060, 1.471870, 1.309060],
            [-1.300000, 2.250000, 0.000000],
            [-1.294380, 2.348440, -0.550727],
            [-1.294380, 2.348440, 0.550727],
            [-1.293050, 2.286910, -0.704126],
            [-1.293050, 2.286910, 0.704126],
            [-1.291500, 2.250000, -0.549500],
            [-1.291500, 2.250000, 0.549500],
            [-1.288390, 1.860940, -1.063730],
            [-1.288390, 1.860940, 1.063730],
            [-1.282370, 0.159961, -1.058760],
            [-1.282370, 0.159961, 1.058760],
            [-1.274000, 2.250000, -0.264875],
            [-1.274000, 2.250000, 0.264875],
            [-1.273480, 2.323830, -0.541834],
            [-1.273480, 2.323830, 0.541834],
            [-1.267660, 2.274900, -0.130448],
            [-1.267660, 2.274900, 0.130448],
            [-1.265670, 0.670825, -1.532970],
            [-1.265670, 0.670825, 1.532970],
            [-1.260940, 2.299800, 0.000000],
            [-1.258830, 0.925195, -1.524690],
            [-1.258830, 0.925195, 1.524690],
            [-1.250570, 2.336130, -0.680997],
            [-1.250570, 2.336130, 0.680997],
            [-1.246880, 0.000000, -0.843750],
            [-1.246880, 0.000000, 0.843750],
            [-1.246880, 2.250000, -0.843750],
            [-1.246880, 2.250000, 0.843750],
            [-1.242500, 0.234375, -1.242500],
            [-1.242500, 0.234375, 1.242500],
            [-1.240810, 0.522583, -1.502870],
            [-1.240810, 0.522583, 1.502870],
            [-1.235720, 2.299800, -0.256916],
            [-1.235720, 2.299800, 0.256916],
            [-1.220430, 2.336130, -0.664583],
            [-1.220430, 2.336130, 0.664583],
            [-1.219060, 2.286910, -0.663837],
            [-1.219060, 2.286910, 0.663837],
            [-1.218050, 2.274900, -0.381740],
            [-1.218050, 2.274900, 0.381740],
            [-1.209120, 1.286130, -1.464490],
            [-1.209120, 1.286130, 1.464490],
            [-1.204660, 2.323830, -0.815186],
            [-1.204660, 2.323830, 0.815186],
            [-1.199250, 2.250000, -0.510250],
            [-1.199250, 2.250000, 0.510250],
            [-1.196510, 2.319430, -0.123125],
            [-1.196510, 2.319430, 0.123125],
            [-1.186040, 0.042773, -0.979229],
            [-1.186040, 0.042773, 0.979229],
            [-1.168120, 0.343945, -1.414820],
            [-1.168120, 0.343945, 1.414820],
            [-1.166350, 2.348440, -0.789258],
            [-1.166350, 2.348440, 0.789258],
            [-1.163750, 2.250000, -0.787500],
            [-1.163750, 2.250000, 0.787500],
            [-1.163220, 2.299800, -0.494918],
            [-1.163220, 2.299800, 0.494918],
            [-1.156250, 2.339060, 0.000000],
            [-1.149680, 2.319430, -0.360312],
            [-1.149680, 2.319430, 0.360312],
            [-1.147520, 2.323830, -0.776514],
            [-1.147520, 2.323830, 0.776514],
            [-1.136370, 2.286910, -0.938220],
            [-1.136370, 2.286910, 0.938220],
            [-1.133120, 2.339060, -0.235586],
            [-1.133120, 2.339060, 0.235586],
            [-1.125000, 0.750000, -1.662500],
            [-1.125000, 0.750000, 1.662500],
            [-1.122810, 2.274900, -0.611424],
            [-1.122810, 2.274900, 0.611424],
            [-1.120470, 0.085547, -1.120470],
            [-1.120470, 0.085547, 1.120470],
            [-1.112920, 0.591650, -1.644640],
            [-1.112920, 0.591650, 1.644640],
            [-1.100830, 1.100390, -1.626780],
            [-1.100830, 1.100390, 1.626780],
            [-1.099040, 2.336130, -0.907402],
            [-1.099040, 2.336130, 0.907402],
            [-1.081060, 0.453516, -1.597560],
            [-1.081060, 0.453516, 1.597560],
            [-1.080630, 2.250000, -0.731250],
            [-1.080630, 2.250000, 0.731250],
            [-1.072550, 2.336130, -0.885531],
            [-1.072550, 2.336130, 0.885531],
            [-1.071350, 2.286910, -0.884537],
            [-1.071350, 2.286910, 0.884537],
            [-1.066640, 2.339060, -0.453828],
            [-1.066640, 2.339060, 0.453828],
            [-1.065000, 0.000000, -1.065000],
            [-1.065000, 0.000000, 1.065000],
            [-1.065000, 2.250000, -1.065000],
            [-1.065000, 2.250000, 1.065000],
            [-1.063730, 1.860940, -1.288390],
            [-1.063730, 1.860940, 1.288390],
            [-1.059790, 2.319430, -0.577104],
            [-1.059790, 2.319430, 0.577104],
            [-1.058760, 0.159961, -1.282370],
            [-1.058760, 0.159961, 1.282370],
            [-1.048150, 2.299800, -0.709277],
            [-1.048150, 2.299800, 0.709277],
            [-1.037110, 1.471870, -1.532620],
            [-1.037110, 1.471870, 1.532620],
            [-1.028940, 2.323830, -1.028940],
            [-1.028940, 2.323830, 1.028940],
            [-0.996219, 2.348440, -0.996219],
            [-0.996219, 2.348440, 0.996219],
            [-0.994000, 2.250000, -0.994000],
            [-0.994000, 2.250000, 0.994000],
            [-0.986761, 2.274900, -0.814698],
            [-0.986761, 2.274900, 0.814698],
            [-0.984375, 0.234375, -1.454690],
            [-0.984375, 0.234375, 1.454690],
            [-0.980719, 2.369530, -0.100920],
            [-0.980719, 2.369530, 0.100920],
            [-0.980133, 2.323830, -0.980133],
            [-0.980133, 2.323830, 0.980133],
            [-0.979229, 0.042773, -1.186040],
            [-0.979229, 0.042773, 1.186040],
            [-0.961133, 2.339060, -0.650391],
            [-0.961133, 2.339060, 0.650391],
            [-0.949871, 0.670825, -1.744330],
            [-0.949871, 0.670825, 1.744330],
            [-0.944741, 0.925195, -1.734910],
            [-0.944741, 0.925195, 1.734910],
            [-0.942332, 2.369530, -0.295330],
            [-0.942332, 2.369530, 0.295330],
            [-0.938220, 2.286910, -1.136370],
            [-0.938220, 2.286910, 1.136370],
            [-0.931373, 2.319430, -0.768968],
            [-0.931373, 2.319430, 0.768968],
            [-0.931218, 0.522583, -1.710080],
            [-0.931218, 0.522583, 1.710080],
            [-0.923000, 2.250000, -0.923000],
            [-0.923000, 2.250000, 0.923000],
            [-0.907437, 1.286130, -1.666400],
            [-0.907437, 1.286130, 1.666400],
            [-0.907402, 2.336130, -1.099040],
            [-0.907402, 2.336130, 1.099040],
            [-0.895266, 2.299800, -0.895266],
            [-0.895266, 2.299800, 0.895266],
            [-0.887695, 0.085547, -1.311820],
            [-0.887695, 0.085547, 1.311820],
            [-0.885531, 2.336130, -1.072550],
            [-0.885531, 2.336130, 1.072550],
            [-0.884537, 2.286910, -1.071350],
            [-0.884537, 2.286910, 1.071350],
            [-0.876660, 0.343945, -1.609890],
            [-0.876660, 0.343945, 1.609890],
            [-0.868654, 2.369530, -0.473023],
            [-0.868654, 2.369530, 0.473023],
            [-0.843750, 0.000000, -1.246880],
            [-0.843750, 0.000000, 1.246880],
            [-0.843750, 2.250000, -1.246880],
            [-0.843750, 2.250000, 1.246880],
            [-0.825000, 2.400000, 0.000000],
            [-0.820938, 2.339060, -0.820938],
            [-0.820938, 2.339060, 0.820938],
            [-0.815186, 2.323830, -1.204660],
            [-0.815186, 2.323830, 1.204660],
            [-0.814698, 2.274900, -0.986761],
            [-0.814698, 2.274900, 0.986761],
            [-0.808500, 2.400000, -0.168094],
            [-0.808500, 2.400000, 0.168094],
            [-0.798320, 1.860940, -1.466020],
            [-0.798320, 1.860940, 1.466020],
            [-0.794590, 0.159961, -1.459170],
            [-0.794590, 0.159961, 1.459170],
            [-0.789258, 2.348440, -1.166350],
            [-0.789258, 2.348440, 1.166350],
            [-0.787500, 2.250000, -1.163750],
            [-0.787500, 2.250000, 1.163750],
            [-0.785000, 0.750000, -1.845000],
            [-0.785000, 0.750000, 1.845000],
            [-0.776567, 0.591650, -1.825180],
            [-0.776567, 0.591650, 1.825180],
            [-0.776514, 2.323830, -1.147520],
            [-0.776514, 2.323830, 1.147520],
            [-0.768968, 2.319430, -0.931373],
            [-0.768968, 2.319430, 0.931373],
            [-0.768135, 1.100390, -1.805360],
            [-0.768135, 1.100390, 1.805360],
            [-0.763400, 2.369530, -0.630285],
            [-0.763400, 2.369530, 0.630285],
            [-0.761063, 2.400000, -0.323813],
            [-0.761063, 2.400000, 0.323813],
            [-0.754336, 0.453516, -1.772930],
            [-0.754336, 0.453516, 1.772930],
            [-0.734902, 0.042773, -1.349570],
            [-0.734902, 0.042773, 1.349570],
            [-0.731250, 2.250000, -1.080630],
            [-0.731250, 2.250000, 1.080630],
            [-0.723672, 1.471870, -1.700860],
            [-0.723672, 1.471870, 1.700860],
            [-0.709277, 2.299800, -1.048150],
            [-0.709277, 2.299800, 1.048150],
            [-0.704126, 2.286910, -1.293050],
            [-0.704126, 2.286910, 1.293050],
            [-0.686875, 0.234375, -1.614370],
            [-0.686875, 0.234375, 1.614370],
            [-0.685781, 2.400000, -0.464063],
            [-0.685781, 2.400000, 0.464063],
            [-0.680997, 2.336130, -1.250570],
            [-0.680997, 2.336130, 1.250570],
            [-0.664583, 2.336130, -1.220430],
            [-0.664583, 2.336130, 1.220430],
            [-0.663837, 2.286910, -1.219060],
            [-0.663837, 2.286910, 1.219060],
            [-0.650391, 2.339060, -0.961133],
            [-0.650391, 2.339060, 0.961133],
            [-0.631998, 2.430470, -0.064825],
            [-0.631998, 2.430470, 0.064825],
            [-0.630285, 2.369530, -0.763400],
            [-0.630285, 2.369530, 0.763400],
            [-0.619414, 0.085547, -1.455820],
            [-0.619414, 0.085547, 1.455820],
            [-0.611424, 2.274900, -1.122810],
            [-0.611424, 2.274900, 1.122810],
            [-0.607174, 2.430470, -0.190548],
            [-0.607174, 2.430470, 0.190548],
            [-0.593047, 0.670825, -1.892280],
            [-0.593047, 0.670825, 1.892280],
            [-0.589845, 0.925195, -1.882060],
            [-0.589845, 0.925195, 1.882060],
            [-0.588750, 0.000000, -1.383750],
            [-0.588750, 0.000000, 1.383750],
            [-0.588750, 2.250000, -1.383750],
            [-0.588750, 2.250000, 1.383750],
            [-0.585750, 2.400000, -0.585750],
            [-0.585750, 2.400000, 0.585750],
            [-0.581402, 0.522583, -1.855120],
            [-0.581402, 0.522583, 1.855120],
            [-0.577104, 2.319430, -1.059790],
            [-0.577104, 2.319430, 1.059790],
            [-0.568818, 2.323830, -1.336900],
            [-0.568818, 2.323830, 1.336900],
            [-0.566554, 1.286130, -1.807750],
            [-0.566554, 1.286130, 1.807750],
            [-0.559973, 2.430470, -0.304711],
            [-0.559973, 2.430470, 0.304711],
            [-0.550727, 2.348440, -1.294380],
            [-0.550727, 2.348440, 1.294380],
            [-0.549500, 2.250000, -1.291500],
            [-0.549500, 2.250000, 1.291500],
            [-0.547339, 0.343945, -1.746440],
            [-0.547339, 0.343945, 1.746440],
            [-0.541834, 2.323830, -1.273480],
            [-0.541834, 2.323830, 1.273480],
            [-0.510250, 2.250000, -1.199250],
            [-0.510250, 2.250000, 1.199250],
            [-0.498428, 1.860940, -1.590370],
            [-0.498428, 1.860940, 1.590370],
            [-0.496099, 0.159961, -1.582940],
            [-0.496099, 0.159961, 1.582940],
            [-0.494918, 2.299800, -1.163220],
            [-0.494918, 2.299800, 1.163220],
            [-0.491907, 2.430470, -0.406410],
            [-0.491907, 2.430470, 0.406410],
            [-0.473023, 2.369530, -0.868654],
            [-0.473023, 2.369530, 0.868654],
            [-0.464063, 2.400000, -0.685781],
            [-0.464063, 2.400000, 0.685781],
            [-0.458833, 0.042773, -1.464030],
            [-0.458833, 0.042773, 1.464030],
            [-0.456250, 2.460940, 0.000000],
            [-0.453828, 2.339060, -1.066640],
            [-0.453828, 2.339060, 1.066640],
            [-0.439618, 2.286910, -1.402720],
            [-0.439618, 2.286910, 1.402720],
            [-0.438241, 2.460940, -0.091207],
            [-0.438241, 2.460940, 0.091207],
            [-0.425177, 2.336130, -1.356650],
            [-0.425177, 2.336130, 1.356650],
            [-0.420891, 2.460940, -0.179078],
            [-0.420891, 2.460940, 0.179078],
            [-0.414929, 2.336130, -1.323950],
            [-0.414929, 2.336130, 1.323950],
            [-0.414464, 2.286910, -1.322460],
            [-0.414464, 2.286910, 1.322460],
            [-0.407500, 0.750000, -1.960000],
            [-0.407500, 0.750000, 1.960000],
            [-0.406410, 2.430470, -0.491907],
            [-0.406410, 2.430470, 0.491907],
            [-0.403123, 0.591650, -1.938950],
            [-0.403123, 0.591650, 1.938950],
            [-0.398745, 1.100390, -1.917890],
            [-0.398745, 1.100390, 1.917890],
            [-0.391582, 0.453516, -1.883440],
            [-0.391582, 0.453516, 1.883440],
            [-0.381740, 2.274900, -1.218050],
            [-0.381740, 2.274900, 1.218050],
            [-0.375664, 1.471870, -1.806870],
            [-0.375664, 1.471870, 1.806870],
            [-0.372159, 2.460940, -0.251889],
            [-0.372159, 2.460940, 0.251889],
            [-0.362109, 2.897170, 0.000000],
            [-0.360312, 2.319430, -1.149680],
            [-0.360312, 2.319430, 1.149680],
            [-0.356563, 0.234375, 1.715000],
            [-0.356562, 0.234375, -1.715000],
            [-0.340625, 2.950780, 0.000000],
            [-0.337859, 2.923970, -0.069278],
            [-0.337859, 2.923970, 0.069278],
            [-0.334238, 2.897170, -0.142705],
            [-0.334238, 2.897170, 0.142705],
            [-0.330325, 2.864210, -0.067672],
            [-0.330325, 2.864210, 0.067672],
            [-0.325000, 2.831250, 0.000000],
            [-0.323938, 2.460940, -0.323938],
            [-0.323938, 2.460940, 0.323938],
            [-0.323813, 2.400000, -0.761063],
            [-0.323813, 2.400000, 0.761063],
            [-0.321543, 0.085547, -1.546560],
            [-0.321543, 0.085547, 1.546560],
            [-0.315410, 2.505470, -0.064395],
            [-0.315410, 2.505470, 0.064395],
            [-0.314464, 2.950780, -0.134407],
            [-0.314464, 2.950780, 0.134407],
            [-0.305625, 0.000000, -1.470000],
            [-0.305625, 0.000000, 1.470000],
            [-0.305625, 2.250000, -1.470000],
            [-0.305625, 2.250000, 1.470000],
            [-0.304711, 2.430470, -0.559973],
            [-0.304711, 2.430470, 0.559973],
            [-0.299953, 2.831250, -0.127984],
            [-0.299953, 2.831250, 0.127984],
            [-0.295330, 2.369530, -0.942332],
            [-0.295330, 2.369530, 0.942332],
            [-0.295278, 2.323830, -1.420230],
            [-0.295278, 2.323830, 1.420230],
            [-0.287197, 2.923970, -0.194300],
            [-0.287197, 2.923970, 0.194300],
            [-0.285887, 2.348440, -1.375060],
            [-0.285887, 2.348440, 1.375060],
            [-0.285250, 2.250000, -1.372000],
            [-0.285250, 2.250000, 1.372000],
            [-0.281271, 2.323830, -1.352860],
            [-0.281271, 2.323830, 1.352860],
            [-0.280732, 2.864210, -0.189856],
            [-0.280732, 2.864210, 0.189856],
            [-0.274421, 2.968800, -0.056380],
            [-0.274421, 2.968800, 0.056380],
            [-0.267832, 2.505470, -0.180879],
            [-0.267832, 2.505470, 0.180879],
            [-0.264875, 2.250000, -1.274000],
            [-0.264875, 2.250000, 1.274000],
            [-0.257610, 2.897170, -0.257610],
            [-0.257610, 2.897170, 0.257610],
            [-0.256916, 2.299800, -1.235720],
            [-0.256916, 2.299800, 1.235720],
            [-0.251889, 2.460940, -0.372159],
            [-0.251889, 2.460940, 0.372159],
            [-0.250872, 2.757420, -0.051347],
            [-0.250872, 2.757420, 0.051347],
            [-0.242477, 2.950780, -0.242477],
            [-0.242477, 2.950780, 0.242477],
            [-0.235586, 2.339060, -1.133120],
            [-0.235586, 2.339060, 1.133120],
            [-0.233382, 2.968800, -0.158018],
            [-0.233382, 2.968800, 0.158018],
            [-0.231125, 2.831250, -0.231125],
            [-0.231125, 2.831250, 0.231125],
            [-0.230078, 2.986820, 0.000000],
            [-0.213159, 2.757420, -0.144103],
            [-0.213159, 2.757420, 0.144103],
            [-0.212516, 2.986820, -0.091113],
            [-0.212516, 2.986820, 0.091113],
            [-0.202656, 0.670825, -1.969370],
            [-0.202656, 0.670825, 1.969370],
            [-0.201561, 0.925195, -1.958730],
            [-0.201561, 0.925195, 1.958730],
            [-0.200000, 2.550000, 0.000000],
            [-0.198676, 0.522583, -1.930690],
            [-0.198676, 0.522583, 1.930690],
            [-0.196875, 2.683590, 0.000000],
            [-0.194300, 2.923970, -0.287197],
            [-0.194300, 2.923970, 0.287197],
            [-0.193602, 1.286130, -1.881390],
            [-0.193602, 1.286130, 1.881390],
            [-0.190548, 2.430470, -0.607174],
            [-0.190548, 2.430470, 0.607174],
            [-0.189856, 2.864210, -0.280732],
            [-0.189856, 2.864210, 0.280732],
            [-0.187036, 0.343945, -1.817580],
            [-0.187036, 0.343945, 1.817580],
            [-0.184500, 2.550000, -0.078500],
            [-0.184500, 2.550000, 0.078500],
            [-0.181661, 2.683590, -0.077405],
            [-0.181661, 2.683590, 0.077405],
            [-0.180879, 2.505470, -0.267832],
            [-0.180879, 2.505470, 0.267832],
            [-0.179078, 2.460940, -0.420891],
            [-0.179078, 2.460940, 0.420891],
            [-0.176295, 2.581200, -0.036001],
            [-0.176295, 2.581200, 0.036001],
            [-0.174804, 2.648000, -0.035727],
            [-0.174804, 2.648000, 0.035727],
            [-0.170322, 1.860940, -1.655160],
            [-0.170322, 1.860940, 1.655160],
            [-0.169526, 0.159961, -1.647420],
            [-0.169526, 0.159961, 1.647420],
            [-0.168094, 2.400000, -0.808500],
            [-0.168094, 2.400000, 0.808500],
            [-0.166797, 2.612400, 0.000000],
            [-0.164073, 2.986820, -0.164073],
            [-0.164073, 2.986820, 0.164073],
            [-0.158018, 2.968800, -0.233382],
            [-0.158018, 2.968800, 0.233382],
            [-0.156792, 0.042773, -1.523670],
            [-0.156792, 0.042773, 1.523670],
            [-0.153882, 2.612400, -0.065504],
            [-0.153882, 2.612400, 0.065504],
            [-0.150226, 2.286910, -1.459860],
            [-0.150226, 2.286910, 1.459860],
            [-0.149710, 2.581200, -0.101116],
            [-0.149710, 2.581200, 0.101116],
            [-0.148475, 2.648000, -0.100316],
            [-0.148475, 2.648000, 0.100316],
            [-0.145291, 2.336130, -1.411910],
            [-0.145291, 2.336130, 1.411910],
            [-0.144103, 2.757420, -0.213159],
            [-0.144103, 2.757420, 0.213159],
            [-0.142705, 2.897170, -0.334238],
            [-0.142705, 2.897170, 0.334238],
            [-0.142000, 2.550000, -0.142000],
            [-0.142000, 2.550000, 0.142000],
            [-0.141789, 2.336130, -1.377880],
            [-0.141789, 2.336130, 1.377880],
            [-0.141630, 2.286910, -1.376330],
            [-0.141630, 2.286910, 1.376330],
            [-0.139898, 2.683590, -0.139898],
            [-0.139898, 2.683590, 0.139898],
            [-0.134407, 2.950780, -0.314464],
            [-0.134407, 2.950780, 0.314464],
            [-0.130448, 2.274900, -1.267660],
            [-0.130448, 2.274900, 1.267660],
            [-0.127984, 2.831250, -0.299953],
            [-0.127984, 2.831250, 0.299953],
            [-0.123125, 2.319430, -1.196510],
            [-0.123125, 2.319430, 1.196510],
            [-0.118458, 2.612400, -0.118458],
            [-0.118458, 2.612400, 0.118458],
            [-0.110649, 2.993410, -0.022778],
            [-0.110649, 2.993410, 0.022778],
            [-0.101116, 2.581200, -0.149710],
            [-0.101116, 2.581200, 0.149710],
            [-0.100920, 2.369530, -0.980719],
            [-0.100920, 2.369530, 0.980719],
            [-0.100316, 2.648000, -0.148475],
            [-0.100316, 2.648000, 0.148475],
            [-0.094147, 2.993410, -0.063797],
            [-0.094147, 2.993410, 0.063797],
            [-0.091207, 2.460940, -0.438241],
            [-0.091207, 2.460940, 0.438241],
            [-0.091113, 2.986820, -0.212516],
            [-0.091113, 2.986820, 0.212516],
            [-0.078500, 2.550000, -0.184500],
            [-0.078500, 2.550000, 0.184500],
            [-0.077405, 2.683590, -0.181661],
            [-0.077405, 2.683590, 0.181661],
            [-0.069278, 2.923970, -0.337859],
            [-0.069278, 2.923970, 0.337859],
            [-0.067672, 2.864210, -0.330325],
            [-0.067672, 2.864210, 0.330325],
            [-0.065504, 2.612400, -0.153882],
            [-0.065504, 2.612400, 0.153882],
            [-0.064825, 2.430470, -0.631998],
            [-0.064825, 2.430470, 0.631998],
            [-0.064395, 2.505470, -0.315410],
            [-0.064395, 2.505470, 0.315410],
            [-0.063797, 2.993410, -0.094147],
            [-0.063797, 2.993410, 0.094147],
            [-0.056380, 2.968800, -0.274421],
            [-0.056380, 2.968800, 0.274421],
            [-0.051347, 2.757420, -0.250872],
            [-0.051347, 2.757420, 0.250872],
            [-0.036001, 2.581200, -0.176295],
            [-0.036001, 2.581200, 0.176295],
            [-0.035727, 2.648000, -0.174804],
            [-0.035727, 2.648000, 0.174804],
            [-0.022778, 2.993410, -0.110649],
            [-0.022778, 2.993410, 0.110649],
            [0.000000, 0.000000, -1.500000],
            [0.000000, 0.000000, 1.500000],
            [0.000000, 0.085547, -1.578130],
            [0.000000, 0.085547, 1.578130],
            [0.000000, 0.234375, -1.750000],
            [0.000000, 0.234375, 1.750000],
            [0.000000, 0.453516, -1.921880],
            [0.000000, 0.453516, 1.921880],
            [0.000000, 0.591650, -1.978520],
            [0.000000, 0.591650, 1.978520],
            [0.000000, 0.750000, -2.000000],
            [0.000000, 0.750000, 2.000000],
            [0.000000, 1.100390, -1.957030],
            [0.000000, 1.100390, 1.957030],
            [0.000000, 1.471870, -1.843750],
            [0.000000, 1.471870, 1.843750],
            [0.000000, 2.250000, -1.500000],
            [0.000000, 2.250000, -1.400000],
            [0.000000, 2.250000, -1.300000],
            [0.000000, 2.250000, 1.300000],
            [0.000000, 2.250000, 1.400000],
            [0.000000, 2.250000, 1.500000],
            [0.000000, 2.299800, -1.260940],
            [0.000000, 2.299800, 1.260940],
            [0.000000, 2.323830, -1.449220],
            [0.000000, 2.323830, -1.380470],
            [0.000000, 2.323830, 1.380470],
            [0.000000, 2.323830, 1.449220],
            [0.000000, 2.339060, -1.156250],
            [0.000000, 2.339060, 1.156250],
            [0.000000, 2.348440, -1.403130],
            [0.000000, 2.348440, 1.403130],
            [0.000000, 2.400000, -0.825000],
            [0.000000, 2.400000, 0.825000],
            [0.000000, 2.460940, -0.456250],
            [0.000000, 2.460940, 0.456250],
            [0.000000, 2.550000, -0.200000],
            [0.000000, 2.550000, 0.200000],
            [0.000000, 2.612400, -0.166797],
            [0.000000, 2.612400, 0.166797],
            [0.000000, 2.683590, -0.196875],
            [0.000000, 2.683590, 0.196875],
            [0.000000, 2.831250, -0.325000],
            [0.000000, 2.831250, 0.325000],
            [0.000000, 2.897170, -0.362109],
            [0.000000, 2.897170, 0.362109],
            [0.000000, 2.950780, -0.340625],
            [0.000000, 2.950780, 0.340625],
            [0.000000, 2.986820, -0.230078],
            [0.000000, 2.986820, 0.230078],
            [0.000000, 3.000000, 0.000000],
            [0.022778, 2.993410, -0.110649],
            [0.022778, 2.993410, 0.110649],
            [0.035727, 2.648000, -0.174804],
            [0.035727, 2.648000, 0.174804],
            [0.036001, 2.581200, -0.176295],
            [0.036001, 2.581200, 0.176295],
            [0.051347, 2.757420, -0.250872],
            [0.051347, 2.757420, 0.250872],
            [0.056380, 2.968800, -0.274421],
            [0.056380, 2.968800, 0.274421],
            [0.063797, 2.993410, -0.094147],
            [0.063797, 2.993410, 0.094147],
            [0.064395, 2.505470, -0.315410],
            [0.064395, 2.505470, 0.315410],
            [0.064825, 2.430470, -0.631998],
            [0.064825, 2.430470, 0.631998],
            [0.065504, 2.612400, -0.153882],
            [0.065504, 2.612400, 0.153882],
            [0.067672, 2.864210, -0.330325],
            [0.067672, 2.864210, 0.330325],
            [0.069278, 2.923970, -0.337859],
            [0.069278, 2.923970, 0.337859],
            [0.077405, 2.683590, -0.181661],
            [0.077405, 2.683590, 0.181661],
            [0.078500, 2.550000, -0.184500],
            [0.078500, 2.550000, 0.184500],
            [0.091113, 2.986820, -0.212516],
            [0.091113, 2.986820, 0.212516],
            [0.091207, 2.460940, -0.438241],
            [0.091207, 2.460940, 0.438241],
            [0.094147, 2.993410, -0.063797],
            [0.094147, 2.993410, 0.063797],
            [0.100316, 2.648000, -0.148475],
            [0.100316, 2.648000, 0.148475],
            [0.100920, 2.369530, -0.980719],
            [0.100920, 2.369530, 0.980719],
            [0.101116, 2.581200, -0.149710],
            [0.101116, 2.581200, 0.149710],
            [0.110649, 2.993410, -0.022778],
            [0.110649, 2.993410, 0.022778],
            [0.118458, 2.612400, -0.118458],
            [0.118458, 2.612400, 0.118458],
            [0.123125, 2.319430, -1.196510],
            [0.123125, 2.319430, 1.196510],
            [0.127984, 2.831250, -0.299953],
            [0.127984, 2.831250, 0.299953],
            [0.130448, 2.274900, -1.267660],
            [0.130448, 2.274900, 1.267660],
            [0.134407, 2.950780, -0.314464],
            [0.134407, 2.950780, 0.314464],
            [0.139898, 2.683590, -0.139898],
            [0.139898, 2.683590, 0.139898],
            [0.141630, 2.286910, -1.376330],
            [0.141630, 2.286910, 1.376330],
            [0.141789, 2.336130, -1.377880],
            [0.141789, 2.336130, 1.377880],
            [0.142000, 2.550000, -0.142000],
            [0.142000, 2.550000, 0.142000],
            [0.142705, 2.897170, -0.334238],
            [0.142705, 2.897170, 0.334238],
            [0.144103, 2.757420, -0.213159],
            [0.144103, 2.757420, 0.213159],
            [0.145291, 2.336130, -1.411910],
            [0.145291, 2.336130, 1.411910],
            [0.148475, 2.648000, -0.100316],
            [0.148475, 2.648000, 0.100316],
            [0.149710, 2.581200, -0.101116],
            [0.149710, 2.581200, 0.101116],
            [0.150226, 2.286910, -1.459860],
            [0.150226, 2.286910, 1.459860],
            [0.153882, 2.612400, -0.065504],
            [0.153882, 2.612400, 0.065504],
            [0.156792, 0.042773, -1.523670],
            [0.156792, 0.042773, 1.523670],
            [0.158018, 2.968800, -0.233382],
            [0.158018, 2.968800, 0.233382],
            [0.164073, 2.986820, -0.164073],
            [0.164073, 2.986820, 0.164073],
            [0.166797, 2.612400, 0.000000],
            [0.168094, 2.400000, -0.808500],
            [0.168094, 2.400000, 0.808500],
            [0.169526, 0.159961, -1.647420],
            [0.169526, 0.159961, 1.647420],
            [0.170322, 1.860940, -1.655160],
            [0.170322, 1.860940, 1.655160],
            [0.174804, 2.648000, -0.035727],
            [0.174804, 2.648000, 0.035727],
            [0.176295, 2.581200, -0.036001],
            [0.176295, 2.581200, 0.036001],
            [0.179078, 2.460940, -0.420891],
            [0.179078, 2.460940, 0.420891],
            [0.180879, 2.505470, -0.267832],
            [0.180879, 2.505470, 0.267832],
            [0.181661, 2.683590, -0.077405],
            [0.181661, 2.683590, 0.077405],
            [0.184500, 2.550000, -0.078500],
            [0.184500, 2.550000, 0.078500],
            [0.187036, 0.343945, -1.817580],
            [0.187036, 0.343945, 1.817580],
            [0.189856, 2.864210, -0.280732],
            [0.189856, 2.864210, 0.280732],
            [0.190548, 2.430470, -0.607174],
            [0.190548, 2.430470, 0.607174],
            [0.193602, 1.286130, -1.881390],
            [0.193602, 1.286130, 1.881390],
            [0.194300, 2.923970, -0.287197],
            [0.194300, 2.923970, 0.287197],
            [0.196875, 2.683590, 0.000000],
            [0.198676, 0.522583, -1.930690],
            [0.198676, 0.522583, 1.930690],
            [0.200000, 2.550000, 0.000000],
            [0.201561, 0.925195, -1.958730],
            [0.201561, 0.925195, 1.958730],
            [0.202656, 0.670825, -1.969370],
            [0.202656, 0.670825, 1.969370],
            [0.212516, 2.986820, -0.091113],
            [0.212516, 2.986820, 0.091113],
            [0.213159, 2.757420, -0.144103],
            [0.213159, 2.757420, 0.144103],
            [0.230078, 2.986820, 0.000000],
            [0.231125, 2.831250, -0.231125],
            [0.231125, 2.831250, 0.231125],
            [0.233382, 2.968800, -0.158018],
            [0.233382, 2.968800, 0.158018],
            [0.235586, 2.339060, -1.133120],
            [0.235586, 2.339060, 1.133120],
            [0.242477, 2.950780, -0.242477],
            [0.242477, 2.950780, 0.242477],
            [0.250872, 2.757420, -0.051347],
            [0.250872, 2.757420, 0.051347],
            [0.251889, 2.460940, -0.372159],
            [0.251889, 2.460940, 0.372159],
            [0.256916, 2.299800, -1.235720],
            [0.256916, 2.299800, 1.235720],
            [0.257610, 2.897170, -0.257610],
            [0.257610, 2.897170, 0.257610],
            [0.264875, 2.250000, -1.274000],
            [0.264875, 2.250000, 1.274000],
            [0.267832, 2.505470, -0.180879],
            [0.267832, 2.505470, 0.180879],
            [0.274421, 2.968800, -0.056380],
            [0.274421, 2.968800, 0.056380],
            [0.280732, 2.864210, -0.189856],
            [0.280732, 2.864210, 0.189856],
            [0.281271, 2.323830, -1.352860],
            [0.281271, 2.323830, 1.352860],
            [0.285250, 2.250000, -1.372000],
            [0.285250, 2.250000, 1.372000],
            [0.285887, 2.348440, -1.375060],
            [0.285887, 2.348440, 1.375060],
            [0.287197, 2.923970, -0.194300],
            [0.287197, 2.923970, 0.194300],
            [0.295278, 2.323830, -1.420230],
            [0.295278, 2.323830, 1.420230],
            [0.295330, 2.369530, -0.942332],
            [0.295330, 2.369530, 0.942332],
            [0.299953, 2.831250, -0.127984],
            [0.299953, 2.831250, 0.127984],
            [0.304711, 2.430470, -0.559973],
            [0.304711, 2.430470, 0.559973],
            [0.305625, 0.000000, -1.470000],
            [0.305625, 0.000000, 1.470000],
            [0.305625, 2.250000, -1.470000],
            [0.305625, 2.250000, 1.470000],
            [0.314464, 2.950780, -0.134407],
            [0.314464, 2.950780, 0.134407],
            [0.315410, 2.505470, -0.064395],
            [0.315410, 2.505470, 0.064395],
            [0.321543, 0.085547, -1.546560],
            [0.321543, 0.085547, 1.546560],
            [0.323813, 2.400000, -0.761063],
            [0.323813, 2.400000, 0.761063],
            [0.323938, 2.460940, -0.323938],
            [0.323938, 2.460940, 0.323938],
            [0.325000, 2.831250, 0.000000],
            [0.330325, 2.864210, -0.067672],
            [0.330325, 2.864210, 0.067672],
            [0.334238, 2.897170, -0.142705],
            [0.334238, 2.897170, 0.142705],
            [0.337859, 2.923970, -0.069278],
            [0.337859, 2.923970, 0.069278],
            [0.340625, 2.950780, 0.000000],
            [0.356562, 0.234375, 1.715000],
            [0.356563, 0.234375, -1.715000],
            [0.360312, 2.319430, -1.149680],
            [0.360312, 2.319430, 1.149680],
            [0.362109, 2.897170, 0.000000],
            [0.372159, 2.460940, -0.251889],
            [0.372159, 2.460940, 0.251889],
            [0.375664, 1.471870, -1.806870],
            [0.375664, 1.471870, 1.806870],
            [0.381740, 2.274900, -1.218050],
            [0.381740, 2.274900, 1.218050],
            [0.391582, 0.453516, -1.883440],
            [0.391582, 0.453516, 1.883440],
            [0.398745, 1.100390, -1.917890],
            [0.398745, 1.100390, 1.917890],
            [0.403123, 0.591650, -1.938950],
            [0.403123, 0.591650, 1.938950],
            [0.406410, 2.430470, -0.491907],
            [0.406410, 2.430470, 0.491907],
            [0.407500, 0.750000, -1.960000],
            [0.407500, 0.750000, 1.960000],
            [0.414464, 2.286910, -1.322460],
            [0.414464, 2.286910, 1.322460],
            [0.414929, 2.336130, -1.323950],
            [0.414929, 2.336130, 1.323950],
            [0.420891, 2.460940, -0.179078],
            [0.420891, 2.460940, 0.179078],
            [0.425177, 2.336130, -1.356650],
            [0.425177, 2.336130, 1.356650],
            [0.438241, 2.460940, -0.091207],
            [0.438241, 2.460940, 0.091207],
            [0.439618, 2.286910, -1.402720],
            [0.439618, 2.286910, 1.402720],
            [0.453828, 2.339060, -1.066640],
            [0.453828, 2.339060, 1.066640],
            [0.456250, 2.460940, 0.000000],
            [0.458833, 0.042773, -1.464030],
            [0.458833, 0.042773, 1.464030],
            [0.464063, 2.400000, -0.685781],
            [0.464063, 2.400000, 0.685781],
            [0.473023, 2.369530, -0.868654],
            [0.473023, 2.369530, 0.868654],
            [0.491907, 2.430470, -0.406410],
            [0.491907, 2.430470, 0.406410],
            [0.494918, 2.299800, -1.163220],
            [0.494918, 2.299800, 1.163220],
            [0.496099, 0.159961, -1.582940],
            [0.496099, 0.159961, 1.582940],
            [0.498428, 1.860940, -1.590370],
            [0.498428, 1.860940, 1.590370],
            [0.510250, 2.250000, -1.199250],
            [0.510250, 2.250000, 1.199250],
            [0.541834, 2.323830, -1.273480],
            [0.541834, 2.323830, 1.273480],
            [0.547339, 0.343945, -1.746440],
            [0.547339, 0.343945, 1.746440],
            [0.549500, 2.250000, -1.291500],
            [0.549500, 2.250000, 1.291500],
            [0.550727, 2.348440, -1.294380],
            [0.550727, 2.348440, 1.294380],
            [0.559973, 2.430470, -0.304711],
            [0.559973, 2.430470, 0.304711],
            [0.566554, 1.286130, -1.807750],
            [0.566554, 1.286130, 1.807750],
            [0.568818, 2.323830, -1.336900],
            [0.568818, 2.323830, 1.336900],
            [0.577104, 2.319430, -1.059790],
            [0.577104, 2.319430, 1.059790],
            [0.581402, 0.522583, -1.855120],
            [0.581402, 0.522583, 1.855120],
            [0.585750, 2.400000, -0.585750],
            [0.585750, 2.400000, 0.585750],
            [0.588750, 0.000000, -1.383750],
            [0.588750, 0.000000, 1.383750],
            [0.588750, 2.250000, -1.383750],
            [0.588750, 2.250000, 1.383750],
            [0.589845, 0.925195, -1.882060],
            [0.589845, 0.925195, 1.882060],
            [0.593047, 0.670825, -1.892280],
            [0.593047, 0.670825, 1.892280],
            [0.607174, 2.430470, -0.190548],
            [0.607174, 2.430470, 0.190548],
            [0.611424, 2.274900, -1.122810],
            [0.611424, 2.274900, 1.122810],
            [0.619414, 0.085547, -1.455820],
            [0.619414, 0.085547, 1.455820],
            [0.630285, 2.369530, -0.763400],
            [0.630285, 2.369530, 0.763400],
            [0.631998, 2.430470, -0.064825],
            [0.631998, 2.430470, 0.064825],
            [0.650391, 2.339060, -0.961133],
            [0.650391, 2.339060, 0.961133],
            [0.663837, 2.286910, -1.219060],
            [0.663837, 2.286910, 1.219060],
            [0.664583, 2.336130, -1.220430],
            [0.664583, 2.336130, 1.220430],
            [0.680997, 2.336130, -1.250570],
            [0.680997, 2.336130, 1.250570],
            [0.685781, 2.400000, -0.464063],
            [0.685781, 2.400000, 0.464063],
            [0.686875, 0.234375, -1.614370],
            [0.686875, 0.234375, 1.614370],
            [0.704126, 2.286910, -1.293050],
            [0.704126, 2.286910, 1.293050],
            [0.709277, 2.299800, -1.048150],
            [0.709277, 2.299800, 1.048150],
            [0.723672, 1.471870, -1.700860],
            [0.723672, 1.471870, 1.700860],
            [0.731250, 2.250000, -1.080630],
            [0.731250, 2.250000, 1.080630],
            [0.734902, 0.042773, -1.349570],
            [0.734902, 0.042773, 1.349570],
            [0.754336, 0.453516, -1.772930],
            [0.754336, 0.453516, 1.772930],
            [0.761063, 2.400000, -0.323813],
            [0.761063, 2.400000, 0.323813],
            [0.763400, 2.369530, -0.630285],
            [0.763400, 2.369530, 0.630285],
            [0.768135, 1.100390, -1.805360],
            [0.768135, 1.100390, 1.805360],
            [0.768968, 2.319430, -0.931373],
            [0.768968, 2.319430, 0.931373],
            [0.776514, 2.323830, -1.147520],
            [0.776514, 2.323830, 1.147520],
            [0.776567, 0.591650, -1.825180],
            [0.776567, 0.591650, 1.825180],
            [0.785000, 0.750000, -1.845000],
            [0.785000, 0.750000, 1.845000],
            [0.787500, 2.250000, -1.163750],
            [0.787500, 2.250000, 1.163750],
            [0.789258, 2.348440, -1.166350],
            [0.789258, 2.348440, 1.166350],
            [0.794590, 0.159961, -1.459170],
            [0.794590, 0.159961, 1.459170],
            [0.798320, 1.860940, -1.466020],
            [0.798320, 1.860940, 1.466020],
            [0.808500, 2.400000, -0.168094],
            [0.808500, 2.400000, 0.168094],
            [0.814698, 2.274900, -0.986761],
            [0.814698, 2.274900, 0.986761],
            [0.815186, 2.323830, -1.204660],
            [0.815186, 2.323830, 1.204660],
            [0.820938, 2.339060, -0.820938],
            [0.820938, 2.339060, 0.820938],
            [0.825000, 2.400000, 0.000000],
            [0.843750, 0.000000, -1.246880],
            [0.843750, 0.000000, 1.246880],
            [0.843750, 2.250000, -1.246880],
            [0.843750, 2.250000, 1.246880],
            [0.868654, 2.369530, -0.473023],
            [0.868654, 2.369530, 0.473023],
            [0.876660, 0.343945, -1.609890],
            [0.876660, 0.343945, 1.609890],
            [0.884537, 2.286910, -1.071350],
            [0.884537, 2.286910, 1.071350],
            [0.885531, 2.336130, -1.072550],
            [0.885531, 2.336130, 1.072550],
            [0.887695, 0.085547, -1.311820],
            [0.887695, 0.085547, 1.311820],
            [0.895266, 2.299800, -0.895266],
            [0.895266, 2.299800, 0.895266],
            [0.907402, 2.336130, -1.099040],
            [0.907402, 2.336130, 1.099040],
            [0.907437, 1.286130, -1.666400],
            [0.907437, 1.286130, 1.666400],
            [0.923000, 2.250000, -0.923000],
            [0.923000, 2.250000, 0.923000],
            [0.931218, 0.522583, -1.710080],
            [0.931218, 0.522583, 1.710080],
            [0.931373, 2.319430, -0.768968],
            [0.931373, 2.319430, 0.768968],
            [0.938220, 2.286910, -1.136370],
            [0.938220, 2.286910, 1.136370],
            [0.942332, 2.369530, -0.295330],
            [0.942332, 2.369530, 0.295330],
            [0.944741, 0.925195, -1.734910],
            [0.944741, 0.925195, 1.734910],
            [0.949871, 0.670825, -1.744330],
            [0.949871, 0.670825, 1.744330],
            [0.961133, 2.339060, -0.650391],
            [0.961133, 2.339060, 0.650391],
            [0.979229, 0.042773, -1.186040],
            [0.979229, 0.042773, 1.186040],
            [0.980133, 2.323830, -0.980133],
            [0.980133, 2.323830, 0.980133],
            [0.980719, 2.369530, -0.100920],
            [0.980719, 2.369530, 0.100920],
            [0.984375, 0.234375, -1.454690],
            [0.984375, 0.234375, 1.454690],
            [0.986761, 2.274900, -0.814698],
            [0.986761, 2.274900, 0.814698],
            [0.994000, 2.250000, -0.994000],
            [0.994000, 2.250000, 0.994000],
            [0.996219, 2.348440, -0.996219],
            [0.996219, 2.348440, 0.996219],
            [1.028940, 2.323830, -1.028940],
            [1.028940, 2.323830, 1.028940],
            [1.037110, 1.471870, -1.532620],
            [1.037110, 1.471870, 1.532620],
            [1.048150, 2.299800, -0.709277],
            [1.048150, 2.299800, 0.709277],
            [1.058760, 0.159961, -1.282370],
            [1.058760, 0.159961, 1.282370],
            [1.059790, 2.319430, -0.577104],
            [1.059790, 2.319430, 0.577104],
            [1.063730, 1.860940, -1.288390],
            [1.063730, 1.860940, 1.288390],
            [1.065000, 0.000000, -1.065000],
            [1.065000, 0.000000, 1.065000],
            [1.065000, 2.250000, -1.065000],
            [1.065000, 2.250000, 1.065000],
            [1.066640, 2.339060, -0.453828],
            [1.066640, 2.339060, 0.453828],
            [1.071350, 2.286910, -0.884537],
            [1.071350, 2.286910, 0.884537],
            [1.072550, 2.336130, -0.885531],
            [1.072550, 2.336130, 0.885531],
            [1.080630, 2.250000, -0.731250],
            [1.080630, 2.250000, 0.731250],
            [1.081060, 0.453516, -1.597560],
            [1.081060, 0.453516, 1.597560],
            [1.099040, 2.336130, -0.907402],
            [1.099040, 2.336130, 0.907402],
            [1.100830, 1.100390, -1.626780],
            [1.100830, 1.100390, 1.626780],
            [1.112920, 0.591650, -1.644640],
            [1.112920, 0.591650, 1.644640],
            [1.120470, 0.085547, -1.120470],
            [1.120470, 0.085547, 1.120470],
            [1.122810, 2.274900, -0.611424],
            [1.122810, 2.274900, 0.611424],
            [1.125000, 0.750000, -1.662500],
            [1.125000, 0.750000, 1.662500],
            [1.133120, 2.339060, -0.235586],
            [1.133120, 2.339060, 0.235586],
            [1.136370, 2.286910, -0.938220],
            [1.136370, 2.286910, 0.938220],
            [1.147520, 2.323830, -0.776514],
            [1.147520, 2.323830, 0.776514],
            [1.149680, 2.319430, -0.360312],
            [1.149680, 2.319430, 0.360312],
            [1.156250, 2.339060, 0.000000],
            [1.163220, 2.299800, -0.494918],
            [1.163220, 2.299800, 0.494918],
            [1.163750, 2.250000, -0.787500],
            [1.163750, 2.250000, 0.787500],
            [1.166350, 2.348440, -0.789258],
            [1.166350, 2.348440, 0.789258],
            [1.168120, 0.343945, -1.414820],
            [1.168120, 0.343945, 1.414820],
            [1.186040, 0.042773, -0.979229],
            [1.186040, 0.042773, 0.979229],
            [1.196510, 2.319430, -0.123125],
            [1.196510, 2.319430, 0.123125],
            [1.199250, 2.250000, -0.510250],
            [1.199250, 2.250000, 0.510250],
            [1.204660, 2.323830, -0.815186],
            [1.204660, 2.323830, 0.815186],
            [1.209120, 1.286130, -1.464490],
            [1.209120, 1.286130, 1.464490],
            [1.218050, 2.274900, -0.381740],
            [1.218050, 2.274900, 0.381740],
            [1.219060, 2.286910, -0.663837],
            [1.219060, 2.286910, 0.663837],
            [1.220430, 2.336130, -0.664583],
            [1.220430, 2.336130, 0.664583],
            [1.235720, 2.299800, -0.256916],
            [1.235720, 2.299800, 0.256916],
            [1.240810, 0.522583, -1.502870],
            [1.240810, 0.522583, 1.502870],
            [1.242500, 0.234375, -1.242500],
            [1.242500, 0.234375, 1.242500],
            [1.246880, 0.000000, -0.843750],
            [1.246880, 0.000000, 0.843750],
            [1.246880, 2.250000, -0.843750],
            [1.246880, 2.250000, 0.843750],
            [1.250570, 2.336130, -0.680997],
            [1.250570, 2.336130, 0.680997],
            [1.258830, 0.925195, -1.524690],
            [1.258830, 0.925195, 1.524690],
            [1.260940, 2.299800, 0.000000],
            [1.265670, 0.670825, -1.532970],
            [1.265670, 0.670825, 1.532970],
            [1.267660, 2.274900, -0.130448],
            [1.267660, 2.274900, 0.130448],
            [1.273480, 2.323830, -0.541834],
            [1.273480, 2.323830, 0.541834],
            [1.274000, 2.250000, -0.264875],
            [1.274000, 2.250000, 0.264875],
            [1.282370, 0.159961, -1.058760],
            [1.282370, 0.159961, 1.058760],
            [1.288390, 1.860940, -1.063730],
            [1.288390, 1.860940, 1.063730],
            [1.291500, 2.250000, -0.549500],
            [1.291500, 2.250000, 0.549500],
            [1.293050, 2.286910, -0.704126],
            [1.293050, 2.286910, 0.704126],
            [1.294380, 2.348440, -0.550727],
            [1.294380, 2.348440, 0.550727],
            [1.300000, 2.250000, 0.000000],
            [1.309060, 1.471870, -1.309060],
            [1.309060, 1.471870, 1.309060],
            [1.311820, 0.085547, -0.887695],
            [1.311820, 0.085547, 0.887695],
            [1.322460, 2.286910, -0.414464],
            [1.322460, 2.286910, 0.414464],
            [1.323950, 2.336130, -0.414929],
            [1.323950, 2.336130, 0.414929],
            [1.336900, 2.323830, -0.568818],
            [1.336900, 2.323830, 0.568818],
            [1.349570, 0.042773, -0.734902],
            [1.349570, 0.042773, 0.734902],
            [1.352860, 2.323830, -0.281271],
            [1.352860, 2.323830, 0.281271],
            [1.356650, 2.336130, -0.425177],
            [1.356650, 2.336130, 0.425177],
            [1.364530, 0.453516, -1.364530],
            [1.364530, 0.453516, 1.364530],
            [1.372000, 2.250000, -0.285250],
            [1.372000, 2.250000, 0.285250],
            [1.375060, 2.348440, -0.285887],
            [1.375060, 2.348440, 0.285887],
            [1.376330, 2.286910, -0.141630],
            [1.376330, 2.286910, 0.141630],
            [1.377880, 2.336130, -0.141789],
            [1.377880, 2.336130, 0.141789],
            [1.380470, 2.323830, 0.000000],
            [1.383750, 0.000000, -0.588750],
            [1.383750, 0.000000, 0.588750],
            [1.383750, 2.250000, -0.588750],
            [1.383750, 2.250000, 0.588750],
            [1.389490, 1.100390, -1.389490],
            [1.389490, 1.100390, 1.389490],
            [1.400000, 2.250000, 0.000000],
            [1.402720, 2.286910, -0.439618],
            [1.402720, 2.286910, 0.439618],
            [1.403130, 2.348440, 0.000000],
            [1.404750, 0.591650, -1.404750],
            [1.404750, 0.591650, 1.404750],
            [1.411910, 2.336130, -0.145291],
            [1.411910, 2.336130, 0.145291],
            [1.414820, 0.343945, -1.168120],
            [1.414820, 0.343945, 1.168120],
            [1.420000, 0.750000, -1.420000],
            [1.420000, 0.750000, 1.420000],
            [1.420230, 2.323830, -0.295278],
            [1.420230, 2.323830, 0.295278],
            [1.449220, 2.323830, 0.000000],
            [1.454690, 0.234375, -0.984375],
            [1.454690, 0.234375, 0.984375],
            [1.455820, 0.085547, -0.619414],
            [1.455820, 0.085547, 0.619414],
            [1.459170, 0.159961, -0.794590],
            [1.459170, 0.159961, 0.794590],
            [1.459860, 2.286910, -0.150226],
            [1.459860, 2.286910, 0.150226],
            [1.464030, 0.042773, -0.458833],
            [1.464030, 0.042773, 0.458833],
            [1.464490, 1.286130, -1.209120],
            [1.464490, 1.286130, 1.209120],
            [1.466020, 1.860940, -0.798320],
            [1.466020, 1.860940, 0.798320],
            [1.470000, 0.000000, -0.305625],
            [1.470000, 0.000000, 0.305625],
            [1.470000, 2.250000, -0.305625],
            [1.470000, 2.250000, 0.305625],
            [1.500000, 0.000000, 0.000000],
            [1.500000, 2.250000, 0.000000],
            [1.502870, 0.522583, -1.240810],
            [1.502870, 0.522583, 1.240810],
            [1.523670, 0.042773, -0.156792],
            [1.523670, 0.042773, 0.156792],
            [1.524690, 0.925195, -1.258830],
            [1.524690, 0.925195, 1.258830],
            [1.532620, 1.471870, -1.037110],
            [1.532620, 1.471870, 1.037110],
            [1.532970, 0.670825, -1.265670],
            [1.532970, 0.670825, 1.265670],
            [1.546560, 0.085547, -0.321543],
            [1.546560, 0.085547, 0.321543],
            [1.578130, 0.085547, 0.000000],
            [1.582940, 0.159961, -0.496099],
            [1.582940, 0.159961, 0.496099],
            [1.590370, 1.860940, -0.498428],
            [1.590370, 1.860940, 0.498428],
            [1.597560, 0.453516, -1.081060],
            [1.597560, 0.453516, 1.081060],
            [1.609890, 0.343945, -0.876660],
            [1.609890, 0.343945, 0.876660],
            [1.614370, 0.234375, -0.686875],
            [1.614370, 0.234375, 0.686875],
            [1.626780, 1.100390, -1.100830],
            [1.626780, 1.100390, 1.100830],
            [1.644640, 0.591650, -1.112920],
            [1.644640, 0.591650, 1.112920],
            [1.647420, 0.159961, -0.169526],
            [1.647420, 0.159961, 0.169526],
            [1.655160, 1.860940, -0.170322],
            [1.655160, 1.860940, 0.170322],
            [1.662500, 0.750000, -1.125000],
            [1.662500, 0.750000, 1.125000],
            [1.666400, 1.286130, -0.907437],
            [1.666400, 1.286130, 0.907437],
            [1.700000, 0.450000, 0.000000],
            [1.700000, 0.485449, -0.216563],
            [1.700000, 0.485449, 0.216563],
            [1.700000, 0.578906, -0.371250],
            [1.700000, 0.578906, 0.371250],
            [1.700000, 0.711035, -0.464063],
            [1.700000, 0.711035, 0.464063],
            [1.700000, 0.862500, -0.495000],
            [1.700000, 0.862500, 0.495000],
            [1.700000, 1.013970, -0.464063],
            [1.700000, 1.013970, 0.464063],
            [1.700000, 1.146090, -0.371250],
            [1.700000, 1.146090, 0.371250],
            [1.700000, 1.239550, -0.216563],
            [1.700000, 1.239550, 0.216563],
            [1.700000, 1.275000, 0.000000],
            [1.700860, 1.471870, -0.723672],
            [1.700860, 1.471870, 0.723672],
            [1.710080, 0.522583, -0.931218],
            [1.710080, 0.522583, 0.931218],
            [1.715000, 0.234375, -0.356562],
            [1.715000, 0.234375, 0.356563],
            [1.734910, 0.925195, -0.944741],
            [1.734910, 0.925195, 0.944741],
            [1.744330, 0.670825, -0.949871],
            [1.744330, 0.670825, 0.949871],
            [1.746440, 0.343945, -0.547339],
            [1.746440, 0.343945, 0.547339],
            [1.750000, 0.234375, 0.000000],
            [1.772930, 0.453516, -0.754336],
            [1.772930, 0.453516, 0.754336],
            [1.805360, 1.100390, -0.768135],
            [1.805360, 1.100390, 0.768135],
            [1.806870, 1.471870, -0.375664],
            [1.806870, 1.471870, 0.375664],
            [1.807750, 1.286130, -0.566554],
            [1.807750, 1.286130, 0.566554],
            [1.808680, 0.669440, -0.415335],
            [1.808680, 0.669440, 0.415335],
            [1.815230, 0.556498, -0.292881],
            [1.815230, 0.556498, 0.292881],
            [1.817580, 0.343945, -0.187036],
            [1.817580, 0.343945, 0.187036],
            [1.818500, 0.493823, -0.107904],
            [1.818500, 0.493823, 0.107904],
            [1.825180, 0.591650, -0.776567],
            [1.825180, 0.591650, 0.776567],
            [1.843750, 1.471870, 0.000000],
            [1.844080, 1.273110, -0.106836],
            [1.844080, 1.273110, 0.106836],
            [1.845000, 0.750000, -0.785000],
            [1.845000, 0.750000, 0.785000],
            [1.849890, 1.212450, -0.289984],
            [1.849890, 1.212450, 0.289984],
            [1.855120, 0.522583, -0.581402],
            [1.855120, 0.522583, 0.581402],
            [1.860070, 1.106280, -0.412082],
            [1.860070, 1.106280, 0.412082],
            [1.872860, 0.972820, -0.473131],
            [1.872860, 0.972820, 0.473131],
            [1.881390, 1.286130, -0.193602],
            [1.881390, 1.286130, 0.193602],
            [1.882060, 0.925195, -0.589845],
            [1.882060, 0.925195, 0.589845],
            [1.883440, 0.453516, -0.391582],
            [1.883440, 0.453516, 0.391582],
            [1.886520, 0.830257, -0.473131],
            [1.886520, 0.830257, 0.473131],
            [1.892280, 0.670825, -0.593047],
            [1.892280, 0.670825, 0.593047],
            [1.908980, 0.762851, -0.457368],
            [1.908980, 0.762851, 0.457368],
            [1.917890, 1.100390, -0.398745],
            [1.917890, 1.100390, 0.398745],
            [1.921880, 0.453516, 0.000000],
            [1.925720, 0.624968, -0.368660],
            [1.925720, 0.624968, 0.368660],
            [1.930690, 0.522583, -0.198676],
            [1.930690, 0.522583, 0.198676],
            [1.935200, 0.536667, -0.215052],
            [1.935200, 0.536667, 0.215052],
            [1.938790, 0.503174, 0.000000],
            [1.938950, 0.591650, -0.403123],
            [1.938950, 0.591650, 0.403123],
            [1.957030, 1.100390, 0.000000],
            [1.958730, 0.925195, -0.201561],
            [1.958730, 0.925195, 0.201561],
            [1.960000, 0.750000, -0.407500],
            [1.960000, 0.750000, 0.407500],
            [1.969370, 0.670825, -0.202656],
            [1.969370, 0.670825, 0.202656],
            [1.978520, 0.591650, 0.000000],
            [1.984960, 1.304590, 0.000000],
            [1.991360, 1.273310, -0.210782],
            [1.991360, 1.273310, 0.210782],
            [2.000000, 0.750000, 0.000000],
            [2.007990, 0.721263, -0.409761],
            [2.007990, 0.721263, 0.409761],
            [2.008210, 1.190840, -0.361340],
            [2.008210, 1.190840, 0.361340],
            [2.024710, 0.614949, -0.288958],
            [2.024710, 0.614949, 0.288958],
            [2.032050, 1.074240, -0.451675],
            [2.032050, 1.074240, 0.451675],
            [2.033790, 0.556062, -0.106458],
            [2.033790, 0.556062, 0.106458],
            [2.059380, 0.940576, -0.481787],
            [2.059380, 0.940576, 0.481787],
            [2.086440, 1.330480, -0.101581],
            [2.086440, 1.330480, 0.101581],
            [2.086700, 0.806915, -0.451675],
            [2.086700, 0.806915, 0.451675],
            [2.101410, 1.278150, -0.275720],
            [2.101410, 1.278150, 0.275720],
            [2.110530, 0.690317, -0.361340],
            [2.110530, 0.690317, 0.361340],
            [2.127390, 0.607845, -0.210782],
            [2.127390, 0.607845, 0.210782],
            [2.127600, 1.186560, -0.391812],
            [2.127600, 1.186560, 0.391812],
            [2.133790, 0.576563, 0.000000],
            [2.160540, 1.071430, -0.449859],
            [2.160540, 1.071430, 0.449859],
            [2.169220, 0.790259, -0.399360],
            [2.169220, 0.790259, 0.399360],
            [2.179690, 1.385160, 0.000000],
            [2.189760, 1.358870, -0.195542],
            [2.189760, 1.358870, 0.195542],
            [2.194810, 0.691761, -0.281559],
            [2.194810, 0.691761, 0.281559],
            [2.195710, 0.948444, -0.449859],
            [2.195710, 0.948444, 0.449859],
            [2.208370, 0.637082, -0.103732],
            [2.208370, 0.637082, 0.103732],
            [2.216310, 1.289570, -0.335215],
            [2.216310, 1.289570, 0.335215],
            [2.220200, 0.891314, -0.434457],
            [2.220200, 0.891314, 0.434457],
            [2.248570, 1.433000, -0.092384],
            [2.248570, 1.433000, 0.092384],
            [2.253840, 1.191600, -0.419019],
            [2.253840, 1.191600, 0.419019],
            [2.259440, 0.772489, -0.349967],
            [2.259440, 0.772489, 0.349967],
            [2.268570, 1.390160, -0.250758],
            [2.268570, 1.390160, 0.250758],
            [2.281890, 0.696393, -0.204147],
            [2.281890, 0.696393, 0.204147],
            [2.290410, 0.667529, 0.000000],
            [2.296880, 1.079300, -0.446953],
            [2.296880, 1.079300, 0.446953],
            [2.299250, 0.874953, -0.384664],
            [2.299250, 0.874953, 0.384664],
            [2.303580, 1.315200, -0.356340],
            [2.303580, 1.315200, 0.356340],
            [2.306440, 1.504400, 0.000000],
            [2.318380, 1.483560, -0.173996],
            [2.318380, 1.483560, 0.173996],
            [2.330690, 0.784406, -0.271218],
            [2.330690, 0.784406, 0.271218],
            [2.339910, 0.966989, -0.419019],
            [2.339910, 0.966989, 0.419019],
            [2.347590, 0.734271, -0.099922],
            [2.347590, 0.734271, 0.099922],
            [2.347590, 1.220960, -0.409131],
            [2.347590, 1.220960, 0.409131],
            [2.349840, 1.428640, -0.298279],
            [2.349840, 1.428640, 0.298279],
            [2.353180, 1.568160, -0.080823],
            [2.353180, 1.568160, 0.080823],
            [2.375750, 1.535310, -0.219377],
            [2.375750, 1.535310, 0.219377],
            [2.377440, 0.869019, -0.335215],
            [2.377440, 0.869019, 0.335215],
            [2.387500, 1.650000, 0.000000],
            [2.394320, 1.350980, -0.372849],
            [2.394320, 1.350980, 0.372849],
            [2.394600, 1.120300, -0.409131],
            [2.394600, 1.120300, 0.409131],
            [2.400390, 1.634690, -0.149297],
            [2.400390, 1.634690, 0.149297],
            [2.403990, 0.799722, -0.195542],
            [2.403990, 0.799722, 0.195542],
            [2.414060, 0.773438, 0.000000],
            [2.415240, 1.477810, -0.311747],
            [2.415240, 1.477810, 0.311747],
            [2.434380, 1.594340, -0.255938],
            [2.434380, 1.594340, 0.255938],
            [2.438610, 1.026060, -0.356340],
            [2.438610, 1.026060, 0.356340],
            [2.445310, 1.261960, -0.397705],
            [2.445310, 1.261960, 0.397705],
            [2.451680, 1.805340, -0.063087],
            [2.451680, 1.805340, 0.063087],
            [2.464890, 1.405520, -0.357931],
            [2.464890, 1.405520, 0.357931],
            [2.473620, 0.951099, -0.250758],
            [2.473620, 0.951099, 0.250758],
            [2.477680, 1.786380, -0.171237],
            [2.477680, 1.786380, 0.171237],
            [2.482420, 1.537280, -0.319922],
            [2.482420, 1.537280, 0.319922],
            [2.493620, 0.908264, -0.092384],
            [2.493620, 0.908264, 0.092384],
            [2.496300, 1.172950, -0.372849],
            [2.496300, 1.172950, 0.372849],
            [2.501560, 1.971090, 0.000000],
            [2.517270, 1.965550, -0.103052],
            [2.517270, 1.965550, 0.103052],
            [2.517920, 1.328310, -0.357931],
            [2.517920, 1.328310, 0.357931],
            [2.523180, 1.753220, -0.243336],
            [2.523180, 1.753220, 0.243336],
            [2.537500, 1.471870, -0.341250],
            [2.537500, 1.471870, 0.341250],
            [2.540780, 1.095290, -0.298279],
            [2.540780, 1.095290, 0.298279],
            [2.549110, 2.044640, -0.047716],
            [2.549110, 2.044640, 0.047716],
            [2.558690, 1.950950, -0.176660],
            [2.558690, 1.950950, 0.176660],
            [2.567570, 1.256030, -0.311747],
            [2.567570, 1.256030, 0.311747],
            [2.572250, 1.040360, -0.173996],
            [2.572250, 1.040360, 0.173996],
            [2.579100, 2.121970, 0.000000],
            [2.580390, 1.711530, -0.279386],
            [2.580390, 1.711530, 0.279386],
            [2.581010, 2.037730, -0.129515],
            [2.581010, 2.037730, 0.129515],
            [2.584180, 1.019530, 0.000000],
            [2.592580, 1.406470, -0.319922],
            [2.592580, 1.406470, 0.319922],
            [2.598490, 2.119920, -0.087812],
            [2.598490, 2.119920, 0.087812],
            [2.601780, 1.554720, -0.304019],
            [2.601780, 1.554720, 0.304019],
            [2.607070, 1.198530, -0.219377],
            [2.607070, 1.198530, 0.219377],
            [2.611620, 1.691280, -0.287908],
            [2.611620, 1.691280, 0.287908],
            [2.617250, 1.930310, -0.220825],
            [2.617250, 1.930310, 0.220825],
            [2.629630, 1.165680, -0.080823],
            [2.629630, 1.165680, 0.080823],
            [2.637880, 2.025550, -0.180818],
            [2.637880, 2.025550, 0.180818],
            [2.640630, 1.349410, -0.255938],
            [2.640630, 1.349410, 0.255938],
            [2.649600, 2.114510, -0.150535],
            [2.649600, 2.114510, 0.150535],
            [2.650840, 2.185470, -0.042461],
            [2.650840, 2.185470, 0.042461],
            [2.653910, 1.504200, -0.264113],
            [2.653910, 1.504200, 0.264113],
            [2.665420, 1.649250, -0.266995],
            [2.665420, 1.649250, 0.266995],
            [2.674610, 1.309060, -0.149297],
            [2.674610, 1.309060, 0.149297],
            [2.678230, 1.782540, -0.252819],
            [2.678230, 1.782540, 0.252819],
            [2.684380, 1.906640, -0.235547],
            [2.684380, 1.906640, 0.235547],
            [2.687500, 1.293750, 0.000000],
            [2.691900, 2.183610, -0.115251],
            [2.691900, 2.183610, 0.115251],
            [2.696450, 1.463800, -0.185857],
            [2.696450, 1.463800, 0.185857],
            [2.700000, 2.250000, 0.000000],
            [2.708080, 2.010370, -0.208084],
            [2.708080, 2.010370, 0.208084],
            [2.717030, 1.611670, -0.213596],
            [2.717030, 1.611670, 0.213596],
            [2.720760, 1.440720, -0.068474],
            [2.720760, 1.440720, 0.068474],
            [2.725780, 2.250000, -0.082031],
            [2.725780, 2.250000, 0.082031],
            [2.725990, 2.106430, -0.175250],
            [2.725990, 2.106430, 0.175250],
            [2.736000, 1.751550, -0.219519],
            [2.736000, 1.751550, 0.219519],
            [2.750210, 2.269190, -0.039734],
            [2.750210, 2.269190, 0.039734],
            [2.751500, 1.882970, -0.220825],
            [2.751500, 1.882970, 0.220825],
            [2.753540, 1.585080, -0.124598],
            [2.753540, 1.585080, 0.124598],
            [2.767380, 1.575000, 0.000000],
            [2.775560, 2.284000, 0.000000],
            [2.780990, 1.994370, -0.208084],
            [2.780990, 1.994370, 0.208084],
            [2.783030, 1.726700, -0.154476],
            [2.783030, 1.726700, 0.154476],
            [2.793750, 2.250000, -0.140625],
            [2.793750, 2.250000, 0.140625],
            [2.797820, 2.271750, -0.107849],
            [2.797820, 2.271750, 0.107849],
            [2.799490, 2.292750, -0.076904],
            [2.799490, 2.292750, 0.076904],
            [2.800000, 2.250000, 0.000000],
            [2.804690, 2.098100, -0.200713],
            [2.804690, 2.098100, 0.200713],
            [2.809900, 1.712500, -0.056912],
            [2.809900, 1.712500, 0.056912],
            [2.810060, 1.862330, -0.176660],
            [2.810060, 1.862330, 0.176660],
            [2.812010, 2.178150, -0.169843],
            [2.812010, 2.178150, 0.169843],
            [2.812740, 2.297540, -0.035632],
            [2.812740, 2.297540, 0.035632],
            [2.817190, 2.250000, -0.049219],
            [2.817190, 2.250000, 0.049219],
            [2.825000, 2.306250, 0.000000],
            [2.830110, 2.271290, -0.025891],
            [2.830110, 2.271290, 0.025891],
            [2.840630, 2.292190, 0.000000],
            [2.844790, 2.299640, -0.029993],
            [2.844790, 2.299640, 0.029993],
            [2.850920, 2.307160, -0.065625],
            [2.850920, 2.307160, 0.065625],
            [2.851180, 1.979190, -0.180818],
            [2.851180, 1.979190, 0.180818],
            [2.851480, 1.847730, -0.103052],
            [2.851480, 1.847730, 0.103052],
            [2.860480, 2.300930, -0.096716],
            [2.860480, 2.300930, 0.096716],
            [2.862500, 2.250000, -0.084375],
            [2.862500, 2.250000, 0.084375],
            [2.862630, 2.292980, -0.054346],
            [2.862630, 2.292980, 0.054346],
            [2.865740, 2.272010, -0.070276],
            [2.865740, 2.272010, 0.070276],
            [2.867190, 1.842190, 0.000000],
            [2.872280, 2.294250, -0.131836],
            [2.872280, 2.294250, 0.131836],
            [2.883390, 2.089770, -0.175250],
            [2.883390, 2.089770, 0.175250],
            [2.888360, 2.301190, -0.081409],
            [2.888360, 2.301190, 0.081409],
            [2.898270, 2.170880, -0.194382],
            [2.898270, 2.170880, 0.194382],
            [2.908050, 1.967000, -0.129515],
            [2.908050, 1.967000, 0.129515],
            [2.919240, 2.309550, -0.112500],
            [2.919240, 2.309550, 0.112500],
            [2.920640, 2.295070, -0.093164],
            [2.920640, 2.295070, 0.093164],
            [2.932790, 2.131030, -0.172211],
            [2.932790, 2.131030, 0.172211],
            [2.939800, 2.273260, -0.158936],
            [2.939800, 2.273260, 0.158936],
            [2.939960, 1.960100, -0.047716],
            [2.939960, 1.960100, 0.047716],
            [2.959780, 2.081680, -0.150535],
            [2.959780, 2.081680, 0.150535],
            [2.969950, 2.274120, -0.103564],
            [2.969950, 2.274120, 0.103564],
            [3.000000, 2.250000, -0.187500],
            [3.000000, 2.250000, -0.112500],
            [3.000000, 2.250000, 0.112500],
            [3.000000, 2.250000, 0.187500],
            [3.002810, 2.304840, -0.142529],
            [3.002810, 2.304840, 0.142529],
            [3.010890, 2.076270, -0.087812],
            [3.010890, 2.076270, 0.087812],
            [3.015780, 2.305710, -0.119971],
            [3.015780, 2.305710, 0.119971],
            [3.030270, 2.074220, 0.000000],
            [3.041500, 2.125670, -0.116276],
            [3.041500, 2.125670, 0.116276],
            [3.043230, 2.211080, -0.166431],
            [3.043230, 2.211080, 0.166431],
            [3.068420, 2.173450, -0.143215],
            [3.068420, 2.173450, 0.143215],
            [3.079290, 2.123060, -0.042838],
            [3.079290, 2.123060, 0.042838],
            [3.093160, 2.298780, -0.175781],
            [3.093160, 2.298780, 0.175781],
            [3.096680, 2.301420, -0.124219],
            [3.096680, 2.301420, 0.124219],
            [3.126560, 2.316800, -0.150000],
            [3.126560, 2.316800, 0.150000],
            [3.126720, 2.277290, -0.103564],
            [3.126720, 2.277290, 0.103564],
            [3.126910, 2.171280, -0.083542],
            [3.126910, 2.171280, 0.083542],
            [3.137500, 2.250000, -0.084375],
            [3.137500, 2.250000, 0.084375],
            [3.149100, 2.170460, 0.000000],
            [3.153370, 2.275520, -0.158936],
            [3.153370, 2.275520, 0.158936],
            [3.168950, 2.211180, -0.112353],
            [3.168950, 2.211180, 0.112353],
            [3.182810, 2.250000, -0.049219],
            [3.182810, 2.250000, 0.049219],
            [3.200000, 2.250000, 0.000000],
            [3.206250, 2.250000, -0.140625],
            [3.206250, 2.250000, 0.140625],
            [3.207460, 2.312510, -0.119971],
            [3.207460, 2.312510, 0.119971],
            [3.212560, 2.210430, -0.041393],
            [3.212560, 2.210430, 0.041393],
            [3.216920, 2.310730, -0.142529],
            [3.216920, 2.310730, 0.142529],
            [3.230940, 2.279400, -0.070276],
            [3.230940, 2.279400, 0.070276],
            [3.267240, 2.278140, -0.025891],
            [3.267240, 2.278140, 0.025891],
            [3.272720, 2.307760, -0.093164],
            [3.272720, 2.307760, 0.093164],
            [3.274220, 2.250000, -0.082031],
            [3.274220, 2.250000, 0.082031],
            [3.295340, 2.277030, -0.107849],
            [3.295340, 2.277030, 0.107849],
            [3.300000, 2.250000, 0.000000],
            [3.314050, 2.303310, -0.131836],
            [3.314050, 2.303310, 0.131836],
            [3.330730, 2.309850, -0.054346],
            [3.330730, 2.309850, 0.054346],
            [3.333890, 2.324050, -0.112500],
            [3.333890, 2.324050, 0.112500],
            [3.334890, 2.317020, -0.081409],
            [3.334890, 2.317020, 0.081409],
            [3.342360, 2.280060, -0.039734],
            [3.342360, 2.280060, 0.039734],
            [3.355430, 2.302700, 0.000000],
            [3.359250, 2.314650, -0.096716],
            [3.359250, 2.314650, 0.096716],
            [3.379120, 2.316580, -0.029993],
            [3.379120, 2.316580, 0.029993],
            [3.386840, 2.304810, -0.076904],
            [3.386840, 2.304810, 0.076904],
            [3.402210, 2.326440, -0.065625],
            [3.402210, 2.326440, 0.065625],
            [3.406390, 2.318500, -0.035632],
            [3.406390, 2.318500, 0.035632],
            [3.408380, 2.315430, 0.000000],
            [3.428120, 2.327340, 0.000000]
        ];

        var indices = [
            [1454,1468,1458],
            [1448,1454,1458],
            [1461,1448,1458],
            [1468,1461,1458],
            [1429,1454,1440],
            [1421,1429,1440],
            [1448,1421,1440],
            [1454,1448,1440],
            [1380,1429,1398],
            [1373,1380,1398],
            [1421,1373,1398],
            [1429,1421,1398],
            [1327,1380,1349],
            [1319,1327,1349],
            [1373,1319,1349],
            [1380,1373,1349],
            [1448,1461,1460],
            [1456,1448,1460],
            [1471,1456,1460],
            [1461,1471,1460],
            [1421,1448,1442],
            [1433,1421,1442],
            [1456,1433,1442],
            [1448,1456,1442],
            [1373,1421,1400],
            [1382,1373,1400],
            [1433,1382,1400],
            [1421,1433,1400],
            [1319,1373,1351],
            [1329,1319,1351],
            [1382,1329,1351],
            [1373,1382,1351],
            [1264,1327,1289],
            [1258,1264,1289],
            [1319,1258,1289],
            [1327,1319,1289],
            [1192,1264,1228],
            [1188,1192,1228],
            [1258,1188,1228],
            [1264,1258,1228],
            [1100,1192,1157],
            [1098,1100,1157],
            [1188,1098,1157],
            [1192,1188,1157],
            [922,1100,1006],
            [928,922,1006],
            [1098,928,1006],
            [1100,1098,1006],
            [1258,1319,1291],
            [1266,1258,1291],
            [1329,1266,1291],
            [1319,1329,1291],
            [1188,1258,1230],
            [1194,1188,1230],
            [1266,1194,1230],
            [1258,1266,1230],
            [1098,1188,1159],
            [1102,1098,1159],
            [1194,1102,1159],
            [1188,1194,1159],
            [928,1098,1008],
            [933,928,1008],
            [1102,933,1008],
            [1098,1102,1008],
            [1456,1471,1475],
            [1481,1456,1475],
            [1482,1481,1475],
            [1471,1482,1475],
            [1433,1456,1450],
            [1444,1433,1450],
            [1481,1444,1450],
            [1456,1481,1450],
            [1382,1433,1412],
            [1392,1382,1412],
            [1444,1392,1412],
            [1433,1444,1412],
            [1329,1382,1357],
            [1331,1329,1357],
            [1392,1331,1357],
            [1382,1392,1357],
            [1481,1482,1490],
            [1500,1481,1490],
            [1502,1500,1490],
            [1482,1502,1490],
            [1444,1481,1470],
            [1465,1444,1470],
            [1500,1465,1470],
            [1481,1500,1470],
            [1392,1444,1431],
            [1410,1392,1431],
            [1465,1410,1431],
            [1444,1465,1431],
            [1331,1392,1371],
            [1345,1331,1371],
            [1410,1345,1371],
            [1392,1410,1371],
            [1266,1329,1297],
            [1276,1266,1297],
            [1331,1276,1297],
            [1329,1331,1297],
            [1194,1266,1232],
            [1200,1194,1232],
            [1276,1200,1232],
            [1266,1276,1232],
            [1102,1194,1163],
            [1106,1102,1163],
            [1200,1106,1163],
            [1194,1200,1163],
            [933,1102,1016],
            [929,933,1016],
            [1106,929,1016],
            [1102,1106,1016],
            [1276,1331,1307],
            [1283,1276,1307],
            [1345,1283,1307],
            [1331,1345,1307],
            [1200,1276,1238],
            [1210,1200,1238],
            [1283,1210,1238],
            [1276,1283,1238],
            [1106,1200,1167],
            [1116,1106,1167],
            [1210,1116,1167],
            [1200,1210,1167],
            [929,1106,1022],
            [923,929,1022],
            [1116,923,1022],
            [1106,1116,1022],
            [755,922,849],
            [757,755,849],
            [928,757,849],
            [922,928,849],
            [663,755,698],
            [667,663,698],
            [757,667,698],
            [755,757,698],
            [591,663,627],
            [597,591,627],
            [667,597,627],
            [663,667,627],
            [528,591,566],
            [536,528,566],
            [597,536,566],
            [591,597,566],
            [757,928,847],
            [753,757,847],
            [933,753,847],
            [928,933,847],
            [667,757,696],
            [661,667,696],
            [753,661,696],
            [757,753,696],
            [597,667,625],
            [589,597,625],
            [661,589,625],
            [667,661,625],
            [536,597,564],
            [526,536,564],
            [589,526,564],
            [597,589,564],
            [475,528,506],
            [482,475,506],
            [536,482,506],
            [528,536,506],
            [426,475,457],
            [434,426,457],
            [482,434,457],
            [475,482,457],
            [401,426,415],
            [407,401,415],
            [434,407,415],
            [426,434,415],
            [386,401,397],
            [393,386,397],
            [407,393,397],
            [401,407,397],
            [482,536,504],
            [473,482,504],
            [526,473,504],
            [536,526,504],
            [434,482,455],
            [422,434,455],
            [473,422,455],
            [482,473,455],
            [407,434,413],
            [399,407,413],
            [422,399,413],
            [434,422,413],
            [393,407,395],
            [383,393,395],
            [399,383,395],
            [407,399,395],
            [753,933,839],
            [749,753,839],
            [929,749,839],
            [933,929,839],
            [661,753,692],
            [655,661,692],
            [749,655,692],
            [753,749,692],
            [589,661,623],
            [579,589,623],
            [655,579,623],
            [661,655,623],
            [526,589,558],
            [524,526,558],
            [579,524,558],
            [589,579,558],
            [749,929,833],
            [741,749,833],
            [923,741,833],
            [929,923,833],
            [655,749,688],
            [647,655,688],
            [741,647,688],
            [749,741,688],
            [579,655,617],
            [574,579,617],
            [647,574,617],
            [655,647,617],
            [524,579,548],
            [512,524,548],
            [574,512,548],
            [579,574,548],
            [473,526,498],
            [463,473,498],
            [524,463,498],
            [526,524,498],
            [422,473,443],
            [411,422,443],
            [463,411,443],
            [473,463,443],
            [399,422,405],
            [374,399,405],
            [411,374,405],
            [422,411,405],
            [383,399,380],
            [372,383,380],
            [374,372,380],
            [399,374,380],
            [463,524,484],
            [447,463,484],
            [512,447,484],
            [524,512,484],
            [411,463,424],
            [392,411,424],
            [447,392,424],
            [463,447,424],
            [374,411,385],
            [357,374,385],
            [392,357,385],
            [411,392,385],
            [372,374,365],
            [353,372,365],
            [357,353,365],
            [374,357,365],
            [400,386,396],
            [406,400,396],
            [393,406,396],
            [386,393,396],
            [425,400,414],
            [433,425,414],
            [406,433,414],
            [400,406,414],
            [474,425,456],
            [481,474,456],
            [433,481,456],
            [425,433,456],
            [527,474,505],
            [535,527,505],
            [481,535,505],
            [474,481,505],
            [406,393,394],
            [398,406,394],
            [383,398,394],
            [393,383,394],
            [433,406,412],
            [421,433,412],
            [398,421,412],
            [406,398,412],
            [481,433,454],
            [472,481,454],
            [421,472,454],
            [433,421,454],
            [535,481,503],
            [525,535,503],
            [472,525,503],
            [481,472,503],
            [590,527,565],
            [596,590,565],
            [535,596,565],
            [527,535,565],
            [662,590,626],
            [666,662,626],
            [596,666,626],
            [590,596,626],
            [754,662,697],
            [756,754,697],
            [666,756,697],
            [662,666,697],
            [919,754,848],
            [927,919,848],
            [756,927,848],
            [754,756,848],
            [596,535,563],
            [588,596,563],
            [525,588,563],
            [535,525,563],
            [666,596,624],
            [660,666,624],
            [588,660,624],
            [596,588,624],
            [756,666,695],
            [752,756,695],
            [660,752,695],
            [666,660,695],
            [927,756,846],
            [932,927,846],
            [752,932,846],
            [756,752,846],
            [398,383,379],
            [373,398,379],
            [372,373,379],
            [383,372,379],
            [421,398,404],
            [410,421,404],
            [373,410,404],
            [398,373,404],
            [472,421,442],
            [462,472,442],
            [410,462,442],
            [421,410,442],
            [525,472,497],
            [523,525,497],
            [462,523,497],
            [472,462,497],
            [373,372,364],
            [356,373,364],
            [353,356,364],
            [372,353,364],
            [410,373,384],
            [391,410,384],
            [356,391,384],
            [373,356,384],
            [462,410,423],
            [446,462,423],
            [391,446,423],
            [410,391,423],
            [523,462,483],
            [511,523,483],
            [446,511,483],
            [462,446,483],
            [588,525,557],
            [578,588,557],
            [523,578,557],
            [525,523,557],
            [660,588,622],
            [654,660,622],
            [578,654,622],
            [588,578,622],
            [752,660,691],
            [748,752,691],
            [654,748,691],
            [660,654,691],
            [932,752,838],
            [926,932,838],
            [748,926,838],
            [752,748,838],
            [578,523,547],
            [573,578,547],
            [511,573,547],
            [523,511,547],
            [654,578,616],
            [646,654,616],
            [573,646,616],
            [578,573,616],
            [748,654,687],
            [740,748,687],
            [646,740,687],
            [654,646,687],
            [926,748,832],
            [918,926,832],
            [740,918,832],
            [748,740,832],
            [1099,919,1005],
            [1097,1099,1005],
            [927,1097,1005],
            [919,927,1005],
            [1191,1099,1156],
            [1187,1191,1156],
            [1097,1187,1156],
            [1099,1097,1156],
            [1263,1191,1227],
            [1257,1263,1227],
            [1187,1257,1227],
            [1191,1187,1227],
            [1326,1263,1288],
            [1318,1326,1288],
            [1257,1318,1288],
            [1263,1257,1288],
            [1097,927,1007],
            [1101,1097,1007],
            [932,1101,1007],
            [927,932,1007],
            [1187,1097,1158],
            [1193,1187,1158],
            [1101,1193,1158],
            [1097,1101,1158],
            [1257,1187,1229],
            [1265,1257,1229],
            [1193,1265,1229],
            [1187,1193,1229],
            [1318,1257,1290],
            [1328,1318,1290],
            [1265,1328,1290],
            [1257,1265,1290],
            [1379,1326,1348],
            [1372,1379,1348],
            [1318,1372,1348],
            [1326,1318,1348],
            [1428,1379,1397],
            [1420,1428,1397],
            [1372,1420,1397],
            [1379,1372,1397],
            [1453,1428,1439],
            [1447,1453,1439],
            [1420,1447,1439],
            [1428,1420,1439],
            [1468,1453,1457],
            [1461,1468,1457],
            [1447,1461,1457],
            [1453,1447,1457],
            [1372,1318,1350],
            [1381,1372,1350],
            [1328,1381,1350],
            [1318,1328,1350],
            [1420,1372,1399],
            [1432,1420,1399],
            [1381,1432,1399],
            [1372,1381,1399],
            [1447,1420,1441],
            [1455,1447,1441],
            [1432,1455,1441],
            [1420,1432,1441],
            [1461,1447,1459],
            [1471,1461,1459],
            [1455,1471,1459],
            [1447,1455,1459],
            [1101,932,1015],
            [1105,1101,1015],
            [926,1105,1015],
            [932,926,1015],
            [1193,1101,1162],
            [1199,1193,1162],
            [1105,1199,1162],
            [1101,1105,1162],
            [1265,1193,1231],
            [1275,1265,1231],
            [1199,1275,1231],
            [1193,1199,1231],
            [1328,1265,1296],
            [1330,1328,1296],
            [1275,1330,1296],
            [1265,1275,1296],
            [1105,926,1021],
            [1115,1105,1021],
            [918,1115,1021],
            [926,918,1021],
            [1199,1105,1166],
            [1209,1199,1166],
            [1115,1209,1166],
            [1105,1115,1166],
            [1275,1199,1237],
            [1282,1275,1237],
            [1209,1282,1237],
            [1199,1209,1237],
            [1330,1275,1306],
            [1344,1330,1306],
            [1282,1344,1306],
            [1275,1282,1306],
            [1381,1328,1356],
            [1391,1381,1356],
            [1330,1391,1356],
            [1328,1330,1356],
            [1432,1381,1411],
            [1443,1432,1411],
            [1391,1443,1411],
            [1381,1391,1411],
            [1455,1432,1449],
            [1480,1455,1449],
            [1443,1480,1449],
            [1432,1443,1449],
            [1471,1455,1474],
            [1482,1471,1474],
            [1480,1482,1474],
            [1455,1480,1474],
            [1391,1330,1370],
            [1409,1391,1370],
            [1344,1409,1370],
            [1330,1344,1370],
            [1443,1391,1430],
            [1464,1443,1430],
            [1409,1464,1430],
            [1391,1409,1430],
            [1480,1443,1469],
            [1499,1480,1469],
            [1464,1499,1469],
            [1443,1464,1469],
            [1482,1480,1489],
            [1502,1482,1489],
            [1499,1502,1489],
            [1480,1499,1489],
            [1500,1502,1533],
            [1572,1500,1533],
            [1585,1572,1533],
            [1502,1585,1533],
            [1465,1500,1519],
            [1555,1465,1519],
            [1572,1555,1519],
            [1500,1572,1519],
            [1410,1465,1496],
            [1510,1410,1496],
            [1555,1510,1496],
            [1465,1555,1496],
            [1345,1410,1427],
            [1436,1345,1427],
            [1510,1436,1427],
            [1410,1510,1427],
            [1283,1345,1341],
            [1333,1283,1341],
            [1436,1333,1341],
            [1345,1436,1341],
            [1210,1283,1270],
            [1242,1210,1270],
            [1333,1242,1270],
            [1283,1333,1270],
            [1116,1210,1184],
            [1143,1116,1184],
            [1242,1143,1184],
            [1210,1242,1184],
            [923,1116,1037],
            [917,923,1037],
            [1143,917,1037],
            [1116,1143,1037],
            [1572,1585,1599],
            [1611,1572,1599],
            [1622,1611,1599],
            [1585,1622,1599],
            [1555,1572,1574],
            [1570,1555,1574],
            [1611,1570,1574],
            [1572,1611,1574],
            [1510,1555,1537],
            [1527,1510,1537],
            [1570,1527,1537],
            [1555,1570,1537],
            [1436,1510,1494],
            [1467,1436,1494],
            [1527,1467,1494],
            [1510,1527,1494],
            [1611,1622,1624],
            [1626,1611,1624],
            [1633,1626,1624],
            [1622,1633,1624],
            [1570,1611,1601],
            [1589,1570,1601],
            [1626,1589,1601],
            [1611,1626,1601],
            [1527,1570,1561],
            [1535,1527,1561],
            [1589,1535,1561],
            [1570,1589,1561],
            [1467,1527,1508],
            [1479,1467,1508],
            [1535,1479,1508],
            [1527,1535,1508],
            [1333,1436,1394],
            [1359,1333,1394],
            [1467,1359,1394],
            [1436,1467,1394],
            [1242,1333,1299],
            [1254,1242,1299],
            [1359,1254,1299],
            [1333,1359,1299],
            [1143,1242,1198],
            [1149,1143,1198],
            [1254,1149,1198],
            [1242,1254,1198],
            [917,1143,1057],
            [915,917,1057],
            [1149,915,1057],
            [1143,1149,1057],
            [1359,1467,1414],
            [1367,1359,1414],
            [1479,1367,1414],
            [1467,1479,1414],
            [1254,1359,1311],
            [1262,1254,1311],
            [1367,1262,1311],
            [1359,1367,1311],
            [1149,1254,1212],
            [1155,1149,1212],
            [1262,1155,1212],
            [1254,1262,1212],
            [915,1149,1065],
            [913,915,1065],
            [1155,913,1065],
            [1149,1155,1065],
            [741,923,818],
            [712,741,818],
            [917,712,818],
            [923,917,818],
            [647,741,671],
            [613,647,671],
            [712,613,671],
            [741,712,671],
            [574,647,585],
            [522,574,585],
            [613,522,585],
            [647,613,585],
            [512,574,514],
            [419,512,514],
            [522,419,514],
            [574,522,514],
            [447,512,428],
            [342,447,428],
            [419,342,428],
            [512,419,428],
            [392,447,359],
            [308,392,359],
            [342,308,359],
            [447,342,359],
            [357,392,329],
            [291,357,329],
            [308,291,329],
            [392,308,329],
            [353,357,314],
            [275,353,314],
            [291,275,314],
            [357,291,314],
            [712,917,798],
            [706,712,798],
            [915,706,798],
            [917,915,798],
            [613,712,657],
            [601,613,657],
            [706,601,657],
            [712,706,657],
            [522,613,556],
            [496,522,556],
            [601,496,556],
            [613,601,556],
            [419,522,461],
            [388,419,461],
            [496,388,461],
            [522,496,461],
            [706,915,790],
            [700,706,790],
            [913,700,790],
            [915,913,790],
            [601,706,643],
            [593,601,643],
            [700,593,643],
            [706,700,643],
            [496,601,544],
            [488,496,544],
            [593,488,544],
            [601,593,544],
            [388,496,441],
            [376,388,441],
            [488,376,441],
            [496,488,441],
            [342,419,361],
            [320,342,361],
            [388,320,361],
            [419,388,361],
            [308,342,310],
            [293,308,310],
            [320,293,310],
            [342,320,310],
            [291,308,289],
            [257,291,289],
            [293,257,289],
            [308,293,289],
            [275,291,270],
            [246,275,270],
            [257,246,270],
            [291,257,270],
            [320,388,344],
            [312,320,344],
            [376,312,344],
            [388,376,344],
            [293,320,302],
            [274,293,302],
            [312,274,302],
            [320,312,302],
            [257,293,268],
            [243,257,268],
            [274,243,268],
            [293,274,268],
            [246,257,245],
            [232,246,245],
            [243,232,245],
            [257,243,245],
            [356,353,313],
            [290,356,313],
            [275,290,313],
            [353,275,313],
            [391,356,328],
            [307,391,328],
            [290,307,328],
            [356,290,328],
            [446,391,358],
            [341,446,358],
            [307,341,358],
            [391,307,358],
            [511,446,427],
            [418,511,427],
            [341,418,427],
            [446,341,427],
            [573,511,513],
            [521,573,513],
            [418,521,513],
            [511,418,513],
            [646,573,584],
            [612,646,584],
            [521,612,584],
            [573,521,584],
            [740,646,670],
            [711,740,670],
            [612,711,670],
            [646,612,670],
            [918,740,817],
            [916,918,817],
            [711,916,817],
            [740,711,817],
            [290,275,269],
            [256,290,269],
            [246,256,269],
            [275,246,269],
            [307,290,288],
            [292,307,288],
            [256,292,288],
            [290,256,288],
            [341,307,309],
            [319,341,309],
            [292,319,309],
            [307,292,309],
            [418,341,360],
            [387,418,360],
            [319,387,360],
            [341,319,360],
            [256,246,244],
            [242,256,244],
            [232,242,244],
            [246,232,244],
            [292,256,267],
            [273,292,267],
            [242,273,267],
            [256,242,267],
            [319,292,301],
            [311,319,301],
            [273,311,301],
            [292,273,301],
            [387,319,343],
            [375,387,343],
            [311,375,343],
            [319,311,343],
            [521,418,460],
            [495,521,460],
            [387,495,460],
            [418,387,460],
            [612,521,555],
            [600,612,555],
            [495,600,555],
            [521,495,555],
            [711,612,656],
            [705,711,656],
            [600,705,656],
            [612,600,656],
            [916,711,797],
            [914,916,797],
            [705,914,797],
            [711,705,797],
            [495,387,440],
            [487,495,440],
            [375,487,440],
            [387,375,440],
            [600,495,543],
            [592,600,543],
            [487,592,543],
            [495,487,543],
            [705,600,642],
            [699,705,642],
            [592,699,642],
            [600,592,642],
            [914,705,789],
            [912,914,789],
            [699,912,789],
            [705,699,789],
            [1115,918,1036],
            [1142,1115,1036],
            [916,1142,1036],
            [918,916,1036],
            [1209,1115,1183],
            [1241,1209,1183],
            [1142,1241,1183],
            [1115,1142,1183],
            [1282,1209,1269],
            [1332,1282,1269],
            [1241,1332,1269],
            [1209,1241,1269],
            [1344,1282,1340],
            [1435,1344,1340],
            [1332,1435,1340],
            [1282,1332,1340],
            [1409,1344,1426],
            [1509,1409,1426],
            [1435,1509,1426],
            [1344,1435,1426],
            [1464,1409,1495],
            [1554,1464,1495],
            [1509,1554,1495],
            [1409,1509,1495],
            [1499,1464,1518],
            [1571,1499,1518],
            [1554,1571,1518],
            [1464,1554,1518],
            [1502,1499,1532],
            [1585,1502,1532],
            [1571,1585,1532],
            [1499,1571,1532],
            [1142,916,1056],
            [1148,1142,1056],
            [914,1148,1056],
            [916,914,1056],
            [1241,1142,1197],
            [1253,1241,1197],
            [1148,1253,1197],
            [1142,1148,1197],
            [1332,1241,1298],
            [1358,1332,1298],
            [1253,1358,1298],
            [1241,1253,1298],
            [1435,1332,1393],
            [1466,1435,1393],
            [1358,1466,1393],
            [1332,1358,1393],
            [1148,914,1064],
            [1154,1148,1064],
            [912,1154,1064],
            [914,912,1064],
            [1253,1148,1211],
            [1261,1253,1211],
            [1154,1261,1211],
            [1148,1154,1211],
            [1358,1253,1310],
            [1366,1358,1310],
            [1261,1366,1310],
            [1253,1261,1310],
            [1466,1358,1413],
            [1478,1466,1413],
            [1366,1478,1413],
            [1358,1366,1413],
            [1509,1435,1493],
            [1526,1509,1493],
            [1466,1526,1493],
            [1435,1466,1493],
            [1554,1509,1536],
            [1569,1554,1536],
            [1526,1569,1536],
            [1509,1526,1536],
            [1571,1554,1573],
            [1610,1571,1573],
            [1569,1610,1573],
            [1554,1569,1573],
            [1585,1571,1598],
            [1622,1585,1598],
            [1610,1622,1598],
            [1571,1610,1598],
            [1526,1466,1507],
            [1534,1526,1507],
            [1478,1534,1507],
            [1466,1478,1507],
            [1569,1526,1560],
            [1588,1569,1560],
            [1534,1588,1560],
            [1526,1534,1560],
            [1610,1569,1600],
            [1625,1610,1600],
            [1588,1625,1600],
            [1569,1588,1600],
            [1622,1610,1623],
            [1633,1622,1623],
            [1625,1633,1623],
            [1610,1625,1623],
            [1626,1633,1628],
            [1621,1626,1628],
            [1629,1621,1628],
            [1633,1629,1628],
            [1589,1626,1607],
            [1584,1589,1607],
            [1621,1584,1607],
            [1626,1621,1607],
            [1621,1629,1616],
            [1603,1621,1616],
            [1612,1603,1616],
            [1629,1612,1616],
            [1584,1621,1593],
            [1568,1584,1593],
            [1603,1568,1593],
            [1621,1603,1593],
            [1535,1589,1563],
            [1529,1535,1563],
            [1584,1529,1563],
            [1589,1584,1563],
            [1479,1535,1512],
            [1473,1479,1512],
            [1529,1473,1512],
            [1535,1529,1512],
            [1529,1584,1557],
            [1521,1529,1557],
            [1568,1521,1557],
            [1584,1568,1557],
            [1473,1529,1504],
            [1452,1473,1504],
            [1521,1452,1504],
            [1529,1521,1504],
            [1603,1612,1580],
            [1559,1603,1580],
            [1566,1559,1580],
            [1612,1566,1580],
            [1568,1603,1565],
            [1525,1568,1565],
            [1559,1525,1565],
            [1603,1559,1565],
            [1521,1568,1523],
            [1484,1521,1523],
            [1525,1484,1523],
            [1568,1525,1523],
            [1452,1521,1477],
            [1406,1452,1477],
            [1484,1406,1477],
            [1521,1484,1477],
            [1367,1479,1417],
            [1361,1367,1417],
            [1473,1361,1417],
            [1479,1473,1417],
            [1262,1367,1313],
            [1260,1262,1313],
            [1361,1260,1313],
            [1367,1361,1313],
            [1361,1473,1404],
            [1355,1361,1404],
            [1452,1355,1404],
            [1473,1452,1404],
            [1260,1361,1303],
            [1248,1260,1303],
            [1355,1248,1303],
            [1361,1355,1303],
            [1155,1262,1214],
            [1151,1155,1214],
            [1260,1151,1214],
            [1262,1260,1214],
            [913,1155,1067],
            [911,913,1067],
            [1151,911,1067],
            [1155,1151,1067],
            [1151,1260,1204],
            [1147,1151,1204],
            [1248,1147,1204],
            [1260,1248,1204],
            [911,1151,1062],
            [909,911,1062],
            [1147,909,1062],
            [1151,1147,1062],
            [1355,1452,1384],
            [1323,1355,1384],
            [1406,1323,1384],
            [1452,1406,1384],
            [1248,1355,1287],
            [1236,1248,1287],
            [1323,1236,1287],
            [1355,1323,1287],
            [1147,1248,1190],
            [1135,1147,1190],
            [1236,1135,1190],
            [1248,1236,1190],
            [909,1147,1051],
            [907,909,1051],
            [1135,907,1051],
            [1147,1135,1051],
            [1559,1566,1531],
            [1514,1559,1531],
            [1515,1514,1531],
            [1566,1515,1531],
            [1525,1559,1517],
            [1486,1525,1517],
            [1514,1486,1517],
            [1559,1514,1517],
            [1484,1525,1488],
            [1438,1484,1488],
            [1486,1438,1488],
            [1525,1486,1488],
            [1406,1484,1425],
            [1363,1406,1425],
            [1438,1363,1425],
            [1484,1438,1425],
            [1514,1515,1506],
            [1498,1514,1506],
            [1501,1498,1506],
            [1515,1501,1506],
            [1486,1514,1492],
            [1463,1486,1492],
            [1498,1463,1492],
            [1514,1498,1492],
            [1438,1486,1446],
            [1408,1438,1446],
            [1463,1408,1446],
            [1486,1463,1446],
            [1363,1438,1386],
            [1343,1363,1386],
            [1408,1343,1386],
            [1438,1408,1386],
            [1323,1406,1337],
            [1293,1323,1337],
            [1363,1293,1337],
            [1406,1363,1337],
            [1236,1323,1268],
            [1220,1236,1268],
            [1293,1220,1268],
            [1323,1293,1268],
            [1135,1236,1182],
            [1122,1135,1182],
            [1220,1122,1182],
            [1236,1220,1182],
            [907,1135,1035],
            [905,907,1035],
            [1122,905,1035],
            [1135,1122,1035],
            [1293,1363,1317],
            [1281,1293,1317],
            [1343,1281,1317],
            [1363,1343,1317],
            [1220,1293,1246],
            [1208,1220,1246],
            [1281,1208,1246],
            [1293,1281,1246],
            [1122,1220,1172],
            [1114,1122,1172],
            [1208,1114,1172],
            [1220,1208,1172],
            [905,1122,1026],
            [903,905,1026],
            [1114,903,1026],
            [1122,1114,1026],
            [700,913,788],
            [704,700,788],
            [911,704,788],
            [913,911,788],
            [593,700,641],
            [595,593,641],
            [704,595,641],
            [700,704,641],
            [704,911,793],
            [708,704,793],
            [909,708,793],
            [911,909,793],
            [595,704,651],
            [607,595,651],
            [708,607,651],
            [704,708,651],
            [488,593,542],
            [494,488,542],
            [595,494,542],
            [593,595,542],
            [376,488,438],
            [382,376,438],
            [494,382,438],
            [488,494,438],
            [494,595,552],
            [500,494,552],
            [607,500,552],
            [595,607,552],
            [382,494,451],
            [403,382,451],
            [500,403,451],
            [494,500,451],
            [708,909,804],
            [718,708,804],
            [907,718,804],
            [909,907,804],
            [607,708,665],
            [619,607,665],
            [718,619,665],
            [708,718,665],
            [500,607,568],
            [532,500,568],
            [619,532,568],
            [607,619,568],
            [403,500,471],
            [449,403,471],
            [532,449,471],
            [500,532,471],
            [312,376,340],
            [318,312,340],
            [382,318,340],
            [376,382,340],
            [274,312,300],
            [285,274,300],
            [318,285,300],
            [312,318,300],
            [318,382,350],
            [327,318,350],
            [403,327,350],
            [382,403,350],
            [285,318,306],
            [295,285,306],
            [327,295,306],
            [318,327,306],
            [243,274,264],
            [250,243,264],
            [285,250,264],
            [274,285,264],
            [232,243,239],
            [237,232,239],
            [250,237,239],
            [243,250,239],
            [250,285,272],
            [266,250,272],
            [295,266,272],
            [285,295,272],
            [237,250,254],
            [255,237,254],
            [266,255,254],
            [250,266,254],
            [327,403,378],
            [371,327,378],
            [449,371,378],
            [403,449,378],
            [295,327,324],
            [322,295,324],
            [371,322,324],
            [327,371,324],
            [266,295,298],
            [304,266,298],
            [322,304,298],
            [295,322,298],
            [255,266,287],
            [296,255,287],
            [304,296,287],
            [266,304,287],
            [718,907,820],
            [733,718,820],
            [905,733,820],
            [907,905,820],
            [619,718,673],
            [635,619,673],
            [733,635,673],
            [718,733,673],
            [532,619,587],
            [562,532,587],
            [635,562,587],
            [619,635,587],
            [449,532,518],
            [492,449,518],
            [562,492,518],
            [532,562,518],
            [733,905,829],
            [739,733,829],
            [903,739,829],
            [905,903,829],
            [635,733,683],
            [645,635,683],
            [739,645,683],
            [733,739,683],
            [562,635,609],
            [572,562,609],
            [645,572,609],
            [635,645,609],
            [492,562,538],
            [510,492,538],
            [572,510,538],
            [562,572,538],
            [371,449,430],
            [417,371,430],
            [492,417,430],
            [449,492,430],
            [322,371,367],
            [369,322,367],
            [417,369,367],
            [371,417,367],
            [304,322,333],
            [338,304,333],
            [369,338,333],
            [322,369,333],
            [296,304,316],
            [334,296,316],
            [338,334,316],
            [304,338,316],
            [417,492,469],
            [445,417,469],
            [510,445,469],
            [492,510,469],
            [369,417,409],
            [390,369,409],
            [445,390,409],
            [417,445,409],
            [338,369,363],
            [355,338,363],
            [390,355,363],
            [369,390,363],
            [334,338,346],
            [351,334,346],
            [355,351,346],
            [338,355,346],
            [242,232,238],
            [249,242,238],
            [237,249,238],
            [232,237,238],
            [273,242,263],
            [284,273,263],
            [249,284,263],
            [242,249,263],
            [249,237,253],
            [265,249,253],
            [255,265,253],
            [237,255,253],
            [284,249,271],
            [294,284,271],
            [265,294,271],
            [249,265,271],
            [311,273,299],
            [317,311,299],
            [284,317,299],
            [273,284,299],
            [375,311,339],
            [381,375,339],
            [317,381,339],
            [311,317,339],
            [317,284,305],
            [326,317,305],
            [294,326,305],
            [284,294,305],
            [381,317,349],
            [402,381,349],
            [326,402,349],
            [317,326,349],
            [265,255,286],
            [303,265,286],
            [296,303,286],
            [255,296,286],
            [294,265,297],
            [321,294,297],
            [303,321,297],
            [265,303,297],
            [326,294,323],
            [370,326,323],
            [321,370,323],
            [294,321,323],
            [402,326,377],
            [448,402,377],
            [370,448,377],
            [326,370,377],
            [487,375,437],
            [493,487,437],
            [381,493,437],
            [375,381,437],
            [592,487,541],
            [594,592,541],
            [493,594,541],
            [487,493,541],
            [493,381,450],
            [499,493,450],
            [402,499,450],
            [381,402,450],
            [594,493,551],
            [606,594,551],
            [499,606,551],
            [493,499,551],
            [699,592,640],
            [703,699,640],
            [594,703,640],
            [592,594,640],
            [912,699,787],
            [910,912,787],
            [703,910,787],
            [699,703,787],
            [703,594,650],
            [707,703,650],
            [606,707,650],
            [594,606,650],
            [910,703,792],
            [908,910,792],
            [707,908,792],
            [703,707,792],
            [499,402,470],
            [531,499,470],
            [448,531,470],
            [402,448,470],
            [606,499,567],
            [618,606,567],
            [531,618,567],
            [499,531,567],
            [707,606,664],
            [719,707,664],
            [618,719,664],
            [606,618,664],
            [908,707,803],
            [906,908,803],
            [719,906,803],
            [707,719,803],
            [303,296,315],
            [337,303,315],
            [334,337,315],
            [296,334,315],
            [321,303,332],
            [368,321,332],
            [337,368,332],
            [303,337,332],
            [370,321,366],
            [416,370,366],
            [368,416,366],
            [321,368,366],
            [448,370,429],
            [491,448,429],
            [416,491,429],
            [370,416,429],
            [337,334,345],
            [354,337,345],
            [351,354,345],
            [334,351,345],
            [368,337,362],
            [389,368,362],
            [354,389,362],
            [337,354,362],
            [416,368,408],
            [444,416,408],
            [389,444,408],
            [368,389,408],
            [491,416,468],
            [509,491,468],
            [444,509,468],
            [416,444,468],
            [531,448,517],
            [561,531,517],
            [491,561,517],
            [448,491,517],
            [618,531,586],
            [634,618,586],
            [561,634,586],
            [531,561,586],
            [719,618,672],
            [732,719,672],
            [634,732,672],
            [618,634,672],
            [906,719,819],
            [904,906,819],
            [732,904,819],
            [719,732,819],
            [561,491,537],
            [571,561,537],
            [509,571,537],
            [491,509,537],
            [634,561,608],
            [644,634,608],
            [571,644,608],
            [561,571,608],
            [732,634,682],
            [738,732,682],
            [644,738,682],
            [634,644,682],
            [904,732,828],
            [902,904,828],
            [738,902,828],
            [732,738,828],
            [1154,912,1066],
            [1150,1154,1066],
            [910,1150,1066],
            [912,910,1066],
            [1261,1154,1213],
            [1259,1261,1213],
            [1150,1259,1213],
            [1154,1150,1213],
            [1150,910,1061],
            [1146,1150,1061],
            [908,1146,1061],
            [910,908,1061],
            [1259,1150,1203],
            [1247,1259,1203],
            [1146,1247,1203],
            [1150,1146,1203],
            [1366,1261,1312],
            [1360,1366,1312],
            [1259,1360,1312],
            [1261,1259,1312],
            [1478,1366,1416],
            [1472,1478,1416],
            [1360,1472,1416],
            [1366,1360,1416],
            [1360,1259,1302],
            [1354,1360,1302],
            [1247,1354,1302],
            [1259,1247,1302],
            [1472,1360,1403],
            [1451,1472,1403],
            [1354,1451,1403],
            [1360,1354,1403],
            [1146,908,1050],
            [1136,1146,1050],
            [906,1136,1050],
            [908,906,1050],
            [1247,1146,1189],
            [1235,1247,1189],
            [1136,1235,1189],
            [1146,1136,1189],
            [1354,1247,1286],
            [1322,1354,1286],
            [1235,1322,1286],
            [1247,1235,1286],
            [1451,1354,1383],
            [1405,1451,1383],
            [1322,1405,1383],
            [1354,1322,1383],
            [1534,1478,1511],
            [1528,1534,1511],
            [1472,1528,1511],
            [1478,1472,1511],
            [1588,1534,1562],
            [1583,1588,1562],
            [1528,1583,1562],
            [1534,1528,1562],
            [1528,1472,1503],
            [1520,1528,1503],
            [1451,1520,1503],
            [1472,1451,1503],
            [1583,1528,1556],
            [1567,1583,1556],
            [1520,1567,1556],
            [1528,1520,1556],
            [1625,1588,1606],
            [1620,1625,1606],
            [1583,1620,1606],
            [1588,1583,1606],
            [1633,1625,1627],
            [1629,1633,1627],
            [1620,1629,1627],
            [1625,1620,1627],
            [1620,1583,1592],
            [1602,1620,1592],
            [1567,1602,1592],
            [1583,1567,1592],
            [1629,1620,1615],
            [1612,1629,1615],
            [1602,1612,1615],
            [1620,1602,1615],
            [1520,1451,1476],
            [1483,1520,1476],
            [1405,1483,1476],
            [1451,1405,1476],
            [1567,1520,1522],
            [1524,1567,1522],
            [1483,1524,1522],
            [1520,1483,1522],
            [1602,1567,1564],
            [1558,1602,1564],
            [1524,1558,1564],
            [1567,1524,1564],
            [1612,1602,1579],
            [1566,1612,1579],
            [1558,1566,1579],
            [1602,1558,1579],
            [1136,906,1034],
            [1121,1136,1034],
            [904,1121,1034],
            [906,904,1034],
            [1235,1136,1181],
            [1219,1235,1181],
            [1121,1219,1181],
            [1136,1121,1181],
            [1322,1235,1267],
            [1292,1322,1267],
            [1219,1292,1267],
            [1235,1219,1267],
            [1405,1322,1336],
            [1362,1405,1336],
            [1292,1362,1336],
            [1322,1292,1336],
            [1121,904,1025],
            [1113,1121,1025],
            [902,1113,1025],
            [904,902,1025],
            [1219,1121,1171],
            [1207,1219,1171],
            [1113,1207,1171],
            [1121,1113,1171],
            [1292,1219,1245],
            [1280,1292,1245],
            [1207,1280,1245],
            [1219,1207,1245],
            [1362,1292,1316],
            [1342,1362,1316],
            [1280,1342,1316],
            [1292,1280,1316],
            [1483,1405,1424],
            [1437,1483,1424],
            [1362,1437,1424],
            [1405,1362,1424],
            [1524,1483,1487],
            [1485,1524,1487],
            [1437,1485,1487],
            [1483,1437,1487],
            [1558,1524,1516],
            [1513,1558,1516],
            [1485,1513,1516],
            [1524,1485,1516],
            [1566,1558,1530],
            [1515,1566,1530],
            [1513,1515,1530],
            [1558,1513,1530],
            [1437,1362,1385],
            [1407,1437,1385],
            [1342,1407,1385],
            [1362,1342,1385],
            [1485,1437,1445],
            [1462,1485,1445],
            [1407,1462,1445],
            [1437,1407,1445],
            [1513,1485,1491],
            [1497,1513,1491],
            [1462,1497,1491],
            [1485,1462,1491],
            [1515,1513,1505],
            [1501,1515,1505],
            [1497,1501,1505],
            [1513,1497,1505],
            [331,325,277],
            [228,331,277],
            [231,228,277],
            [325,231,277],
            [336,331,279],
            [224,336,279],
            [228,224,279],
            [331,228,279],
            [228,231,200],
            [173,228,200],
            [178,173,200],
            [231,178,200],
            [224,228,198],
            [167,224,198],
            [173,167,198],
            [228,173,198],
            [348,336,281],
            [222,348,281],
            [224,222,281],
            [336,224,281],
            [352,348,283],
            [210,352,283],
            [222,210,283],
            [348,222,283],
            [222,224,193],
            [150,222,193],
            [167,150,193],
            [224,167,193],
            [210,222,183],
            [142,210,183],
            [150,142,183],
            [222,150,183],
            [177,178,165],
            [136,177,165],
            [141,136,165],
            [178,141,165],
            [173,177,162],
            [127,173,162],
            [136,127,162],
            [177,136,162],
            [167,173,158],
            [131,167,158],
            [152,131,158],
            [173,152,158],
            [131,152,129],
            [82,131,129],
            [127,82,129],
            [152,127,129],
            [136,141,134],
            [114,136,134],
            [121,114,134],
            [141,121,134],
            [127,136,118],
            [93,127,118],
            [114,93,118],
            [136,114,118],
            [114,121,112],
            [101,114,112],
            [108,101,112],
            [121,108,112],
            [93,114,95],
            [90,93,95],
            [101,90,95],
            [114,101,95],
            [82,127,88],
            [59,82,88],
            [93,59,88],
            [127,93,88],
            [59,93,74],
            [52,59,74],
            [90,52,74],
            [93,90,74],
            [150,167,140],
            [86,150,140],
            [131,86,140],
            [167,131,140],
            [86,131,84],
            [50,86,84],
            [82,50,84],
            [131,82,84],
            [148,150,120],
            [76,148,120],
            [86,76,120],
            [150,86,120],
            [142,148,110],
            [72,142,110],
            [76,72,110],
            [148,76,110],
            [76,86,65],
            [36,76,65],
            [50,36,65],
            [86,50,65],
            [72,76,57],
            [34,72,57],
            [36,34,57],
            [76,36,57],
            [50,82,55],
            [27,50,55],
            [59,27,55],
            [82,59,55],
            [27,59,42],
            [18,27,42],
            [52,18,42],
            [59,52,42],
            [36,50,33],
            [12,36,33],
            [27,12,33],
            [50,27,33],
            [34,36,24],
            [8,34,24],
            [12,8,24],
            [36,12,24],
            [12,27,16],
            [2,12,16],
            [18,2,16],
            [27,18,16],
            [8,12,7],
            [0,8,7],
            [2,0,7],
            [12,2,7],
            [347,352,282],
            [221,347,282],
            [210,221,282],
            [352,210,282],
            [335,347,280],
            [223,335,280],
            [221,223,280],
            [347,221,280],
            [221,210,182],
            [149,221,182],
            [142,149,182],
            [210,142,182],
            [223,221,192],
            [166,223,192],
            [149,166,192],
            [221,149,192],
            [330,335,278],
            [227,330,278],
            [223,227,278],
            [335,223,278],
            [325,330,276],
            [231,325,276],
            [227,231,276],
            [330,227,276],
            [227,223,197],
            [172,227,197],
            [166,172,197],
            [223,166,197],
            [231,227,199],
            [178,231,199],
            [172,178,199],
            [227,172,199],
            [147,142,109],
            [75,147,109],
            [72,75,109],
            [142,72,109],
            [149,147,119],
            [85,149,119],
            [75,85,119],
            [147,75,119],
            [75,72,56],
            [35,75,56],
            [34,35,56],
            [72,34,56],
            [85,75,64],
            [49,85,64],
            [35,49,64],
            [75,35,64],
            [166,149,139],
            [130,166,139],
            [85,130,139],
            [149,85,139],
            [130,85,83],
            [81,130,83],
            [49,81,83],
            [85,49,83],
            [35,34,23],
            [11,35,23],
            [8,11,23],
            [34,8,23],
            [49,35,32],
            [26,49,32],
            [11,26,32],
            [35,11,32],
            [11,8,6],
            [1,11,6],
            [0,1,6],
            [8,0,6],
            [26,11,15],
            [17,26,15],
            [1,17,15],
            [11,1,15],
            [81,49,54],
            [58,81,54],
            [26,58,54],
            [49,26,54],
            [58,26,41],
            [51,58,41],
            [17,51,41],
            [26,17,41],
            [172,166,157],
            [151,172,157],
            [130,151,157],
            [166,130,157],
            [151,130,128],
            [126,151,128],
            [81,126,128],
            [130,81,128],
            [176,172,161],
            [135,176,161],
            [126,135,161],
            [172,126,161],
            [178,176,164],
            [141,178,164],
            [135,141,164],
            [176,135,164],
            [126,81,87],
            [92,126,87],
            [58,92,87],
            [81,58,87],
            [92,58,73],
            [89,92,73],
            [51,89,73],
            [58,51,73],
            [135,126,117],
            [113,135,117],
            [92,113,117],
            [126,92,117],
            [141,135,133],
            [121,141,133],
            [113,121,133],
            [135,113,133],
            [113,92,94],
            [100,113,94],
            [89,100,94],
            [92,89,94],
            [121,113,111],
            [108,121,111],
            [100,108,111],
            [113,100,111],
            [101,108,116],
            [125,101,116],
            [132,125,116],
            [108,132,116],
            [90,101,103],
            [105,90,103],
            [125,105,103],
            [101,125,103],
            [52,90,78],
            [71,52,78],
            [105,71,78],
            [90,105,78],
            [125,132,146],
            [156,125,146],
            [163,156,146],
            [132,163,146],
            [105,125,144],
            [154,105,144],
            [156,154,144],
            [125,156,144],
            [71,105,123],
            [138,71,123],
            [154,138,123],
            [105,154,123],
            [18,52,38],
            [22,18,38],
            [63,22,38],
            [52,63,38],
            [22,63,48],
            [40,22,48],
            [71,40,48],
            [63,71,48],
            [2,18,14],
            [10,2,14],
            [22,10,14],
            [18,22,14],
            [0,2,4],
            [5,0,4],
            [10,5,4],
            [2,10,4],
            [10,22,29],
            [31,10,29],
            [40,31,29],
            [22,40,29],
            [5,10,20],
            [25,5,20],
            [31,25,20],
            [10,31,20],
            [40,71,69],
            [67,40,69],
            [97,67,69],
            [71,97,69],
            [67,97,99],
            [107,67,99],
            [138,107,99],
            [97,138,99],
            [31,40,46],
            [61,31,46],
            [67,61,46],
            [40,67,46],
            [25,31,44],
            [53,25,44],
            [61,53,44],
            [31,61,44],
            [53,67,80],
            [91,53,80],
            [107,91,80],
            [67,107,80],
            [154,163,175],
            [195,154,175],
            [196,195,175],
            [163,196,175],
            [138,154,171],
            [189,138,171],
            [195,189,171],
            [154,195,171],
            [195,196,202],
            [207,195,202],
            [203,207,202],
            [196,203,202],
            [205,203,226],
            [234,205,226],
            [232,234,226],
            [203,232,226],
            [207,205,230],
            [236,207,230],
            [234,236,230],
            [205,234,230],
            [191,195,209],
            [241,191,209],
            [236,241,209],
            [195,236,209],
            [189,191,212],
            [248,189,212],
            [241,248,212],
            [191,241,212],
            [107,138,169],
            [185,107,169],
            [189,185,169],
            [138,189,169],
            [91,107,160],
            [179,91,160],
            [185,179,160],
            [107,185,160],
            [187,189,214],
            [252,187,214],
            [248,252,214],
            [189,248,214],
            [185,187,216],
            [259,185,216],
            [252,259,216],
            [187,252,216],
            [181,185,218],
            [261,181,218],
            [259,261,218],
            [185,259,218],
            [179,181,220],
            [262,179,220],
            [261,262,220],
            [181,261,220],
            [1,0,3],
            [9,1,3],
            [5,9,3],
            [0,5,3],
            [17,1,13],
            [21,17,13],
            [9,21,13],
            [1,9,13],
            [9,5,19],
            [30,9,19],
            [25,30,19],
            [5,25,19],
            [21,9,28],
            [39,21,28],
            [30,39,28],
            [9,30,28],
            [51,17,37],
            [62,51,37],
            [21,62,37],
            [17,21,37],
            [62,21,47],
            [70,62,47],
            [39,70,47],
            [21,39,47],
            [30,25,43],
            [60,30,43],
            [53,60,43],
            [25,53,43],
            [39,30,45],
            [66,39,45],
            [60,66,45],
            [30,60,45],
            [66,53,79],
            [106,66,79],
            [91,106,79],
            [53,91,79],
            [70,39,68],
            [96,70,68],
            [66,96,68],
            [39,66,68],
            [96,66,98],
            [137,96,98],
            [106,137,98],
            [66,106,98],
            [89,51,77],
            [104,89,77],
            [70,104,77],
            [51,70,77],
            [100,89,102],
            [124,100,102],
            [104,124,102],
            [89,104,102],
            [108,100,115],
            [132,108,115],
            [124,132,115],
            [100,124,115],
            [104,70,122],
            [153,104,122],
            [137,153,122],
            [70,137,122],
            [124,104,143],
            [155,124,143],
            [153,155,143],
            [104,153,143],
            [132,124,145],
            [163,132,145],
            [155,163,145],
            [124,155,145],
            [106,91,159],
            [184,106,159],
            [179,184,159],
            [91,179,159],
            [137,106,168],
            [188,137,168],
            [184,188,168],
            [106,184,168],
            [180,179,219],
            [260,180,219],
            [262,260,219],
            [179,262,219],
            [184,180,217],
            [258,184,217],
            [260,258,217],
            [180,260,217],
            [186,184,215],
            [251,186,215],
            [258,251,215],
            [184,258,215],
            [188,186,213],
            [247,188,213],
            [251,247,213],
            [186,251,213],
            [153,137,170],
            [194,153,170],
            [188,194,170],
            [137,188,170],
            [163,153,174],
            [196,163,174],
            [194,196,174],
            [153,194,174],
            [190,188,211],
            [240,190,211],
            [247,240,211],
            [188,247,211],
            [194,190,208],
            [235,194,208],
            [240,235,208],
            [190,240,208],
            [196,194,201],
            [203,196,201],
            [206,203,201],
            [194,206,201],
            [204,206,229],
            [233,204,229],
            [235,233,229],
            [206,235,229],
            [203,204,225],
            [232,203,225],
            [233,232,225],
            [204,233,225],
            [1552,1553,1587],
            [1632,1552,1587],
            [1630,1632,1587],
            [1553,1630,1587],
            [1550,1552,1591],
            [1637,1550,1591],
            [1632,1637,1591],
            [1552,1632,1591],
            [1632,1630,1647],
            [1665,1632,1647],
            [1663,1665,1647],
            [1630,1663,1647],
            [1637,1632,1651],
            [1673,1637,1651],
            [1665,1673,1651],
            [1632,1665,1651],
            [1548,1550,1595],
            [1641,1548,1595],
            [1637,1641,1595],
            [1550,1637,1595],
            [1546,1548,1597],
            [1645,1546,1597],
            [1641,1645,1597],
            [1548,1641,1597],
            [1641,1637,1657],
            [1679,1641,1657],
            [1673,1679,1657],
            [1637,1673,1657],
            [1645,1641,1660],
            [1688,1645,1660],
            [1679,1688,1660],
            [1641,1679,1660],
            [1665,1663,1677],
            [1695,1665,1677],
            [1693,1695,1677],
            [1663,1693,1677],
            [1673,1665,1683],
            [1705,1673,1683],
            [1695,1705,1683],
            [1665,1695,1683],
            [1695,1693,1707],
            [1718,1695,1707],
            [1712,1718,1707],
            [1693,1712,1707],
            [1705,1695,1709],
            [1725,1705,1709],
            [1718,1725,1709],
            [1695,1718,1709],
            [1679,1673,1692],
            [1714,1679,1692],
            [1705,1714,1692],
            [1673,1705,1692],
            [1688,1679,1703],
            [1729,1688,1703],
            [1714,1729,1703],
            [1679,1714,1703],
            [1714,1705,1723],
            [1739,1714,1723],
            [1725,1739,1723],
            [1705,1725,1723],
            [1729,1714,1733],
            [1752,1729,1733],
            [1739,1752,1733],
            [1714,1739,1733],
            [1544,1546,1605],
            [1649,1544,1605],
            [1645,1649,1605],
            [1546,1645,1605],
            [1542,1544,1576],
            [1614,1542,1576],
            [1609,1614,1576],
            [1544,1609,1576],
            [1614,1609,1635],
            [1653,1614,1635],
            [1649,1653,1635],
            [1609,1649,1635],
            [1649,1645,1669],
            [1699,1649,1669],
            [1688,1699,1669],
            [1645,1688,1669],
            [1653,1649,1662],
            [1681,1653,1662],
            [1675,1681,1662],
            [1649,1675,1662],
            [1681,1675,1690],
            [1711,1681,1690],
            [1699,1711,1690],
            [1675,1699,1690],
            [1540,1542,1578],
            [1618,1540,1578],
            [1614,1618,1578],
            [1542,1614,1578],
            [1618,1614,1639],
            [1655,1618,1639],
            [1653,1655,1639],
            [1614,1653,1639],
            [1538,1540,1582],
            [1619,1538,1582],
            [1618,1619,1582],
            [1540,1618,1582],
            [1619,1618,1643],
            [1658,1619,1643],
            [1655,1658,1643],
            [1618,1655,1643],
            [1655,1653,1667],
            [1685,1655,1667],
            [1681,1685,1667],
            [1653,1681,1667],
            [1685,1681,1697],
            [1720,1685,1697],
            [1711,1720,1697],
            [1681,1711,1697],
            [1658,1655,1671],
            [1686,1658,1671],
            [1685,1686,1671],
            [1655,1685,1671],
            [1686,1685,1701],
            [1721,1686,1701],
            [1720,1721,1701],
            [1685,1720,1701],
            [1699,1688,1716],
            [1743,1699,1716],
            [1729,1743,1716],
            [1688,1729,1716],
            [1711,1699,1727],
            [1754,1711,1727],
            [1743,1754,1727],
            [1699,1743,1727],
            [1743,1729,1748],
            [1770,1743,1748],
            [1752,1770,1748],
            [1729,1752,1748],
            [1754,1743,1760],
            [1786,1754,1760],
            [1770,1786,1760],
            [1743,1770,1760],
            [1720,1711,1735],
            [1762,1720,1735],
            [1754,1762,1735],
            [1711,1754,1735],
            [1721,1720,1741],
            [1768,1721,1741],
            [1762,1768,1741],
            [1720,1762,1741],
            [1762,1754,1776],
            [1796,1762,1776],
            [1786,1796,1776],
            [1754,1786,1776],
            [1768,1762,1782],
            [1801,1768,1782],
            [1796,1801,1782],
            [1762,1796,1782],
            [1718,1712,1731],
            [1746,1718,1731],
            [1744,1746,1731],
            [1712,1744,1731],
            [1725,1718,1737],
            [1758,1725,1737],
            [1746,1758,1737],
            [1718,1746,1737],
            [1739,1725,1750],
            [1780,1739,1750],
            [1758,1780,1750],
            [1725,1758,1750],
            [1752,1739,1765],
            [1800,1752,1765],
            [1780,1800,1765],
            [1739,1780,1765],
            [1746,1744,1756],
            [1772,1746,1756],
            [1763,1772,1756],
            [1744,1763,1756],
            [1758,1746,1767],
            [1788,1758,1767],
            [1772,1788,1767],
            [1746,1772,1767],
            [1772,1763,1790],
            [1814,1772,1790],
            [1806,1814,1790],
            [1763,1806,1790],
            [1788,1772,1803],
            [1832,1788,1803],
            [1814,1832,1803],
            [1772,1814,1803],
            [1780,1758,1784],
            [1816,1780,1784],
            [1788,1816,1784],
            [1758,1788,1784],
            [1800,1780,1808],
            [1839,1800,1808],
            [1816,1839,1808],
            [1780,1816,1808],
            [1839,1788,1845],
            [1898,1839,1845],
            [1832,1898,1845],
            [1788,1832,1845],
            [1770,1752,1774],
            [1794,1770,1774],
            [1778,1794,1774],
            [1752,1778,1774],
            [1786,1770,1792],
            [1810,1786,1792],
            [1794,1810,1792],
            [1770,1794,1792],
            [1794,1778,1798],
            [1822,1794,1798],
            [1800,1822,1798],
            [1778,1800,1798],
            [1810,1794,1818],
            [1843,1810,1818],
            [1822,1843,1818],
            [1794,1822,1818],
            [1796,1786,1805],
            [1824,1796,1805],
            [1810,1824,1805],
            [1786,1810,1805],
            [1801,1796,1812],
            [1825,1801,1812],
            [1824,1825,1812],
            [1796,1824,1812],
            [1824,1810,1830],
            [1861,1824,1830],
            [1843,1861,1830],
            [1810,1843,1830],
            [1825,1824,1841],
            [1870,1825,1841],
            [1861,1870,1841],
            [1824,1861,1841],
            [1822,1800,1828],
            [1874,1822,1828],
            [1839,1874,1828],
            [1800,1839,1828],
            [1843,1822,1859],
            [1892,1843,1859],
            [1874,1892,1859],
            [1822,1874,1859],
            [1892,1839,1886],
            [1911,1892,1886],
            [1878,1911,1886],
            [1839,1878,1886],
            [1911,1878,1909],
            [1935,1911,1909],
            [1898,1935,1909],
            [1878,1898,1909],
            [1861,1843,1880],
            [1902,1861,1880],
            [1892,1902,1880],
            [1843,1892,1880],
            [1870,1861,1890],
            [1905,1870,1890],
            [1902,1905,1890],
            [1861,1902,1890],
            [1902,1892,1907],
            [1923,1902,1907],
            [1911,1923,1907],
            [1892,1911,1907],
            [1923,1911,1930],
            [1949,1923,1930],
            [1935,1949,1930],
            [1911,1935,1930],
            [1905,1902,1913],
            [1926,1905,1913],
            [1923,1926,1913],
            [1902,1923,1913],
            [1926,1923,1939],
            [1952,1926,1939],
            [1949,1952,1939],
            [1923,1949,1939],
            [1539,1538,1581],
            [1617,1539,1581],
            [1619,1617,1581],
            [1538,1619,1581],
            [1617,1619,1642],
            [1654,1617,1642],
            [1658,1654,1642],
            [1619,1658,1642],
            [1541,1539,1577],
            [1613,1541,1577],
            [1617,1613,1577],
            [1539,1617,1577],
            [1613,1617,1638],
            [1652,1613,1638],
            [1654,1652,1638],
            [1617,1654,1638],
            [1654,1658,1670],
            [1684,1654,1670],
            [1686,1684,1670],
            [1658,1686,1670],
            [1684,1686,1700],
            [1719,1684,1700],
            [1721,1719,1700],
            [1686,1721,1700],
            [1652,1654,1666],
            [1680,1652,1666],
            [1684,1680,1666],
            [1654,1684,1666],
            [1680,1684,1696],
            [1710,1680,1696],
            [1719,1710,1696],
            [1684,1719,1696],
            [1543,1541,1575],
            [1608,1543,1575],
            [1613,1608,1575],
            [1541,1613,1575],
            [1608,1613,1634],
            [1648,1608,1634],
            [1652,1648,1634],
            [1613,1652,1634],
            [1545,1543,1604],
            [1644,1545,1604],
            [1648,1644,1604],
            [1543,1648,1604],
            [1648,1652,1661],
            [1674,1648,1661],
            [1680,1674,1661],
            [1652,1680,1661],
            [1674,1680,1689],
            [1698,1674,1689],
            [1710,1698,1689],
            [1680,1710,1689],
            [1644,1648,1668],
            [1687,1644,1668],
            [1698,1687,1668],
            [1648,1698,1668],
            [1719,1721,1740],
            [1761,1719,1740],
            [1768,1761,1740],
            [1721,1768,1740],
            [1710,1719,1734],
            [1753,1710,1734],
            [1761,1753,1734],
            [1719,1761,1734],
            [1761,1768,1781],
            [1795,1761,1781],
            [1801,1795,1781],
            [1768,1801,1781],
            [1753,1761,1775],
            [1785,1753,1775],
            [1795,1785,1775],
            [1761,1795,1775],
            [1698,1710,1726],
            [1742,1698,1726],
            [1753,1742,1726],
            [1710,1753,1726],
            [1687,1698,1715],
            [1728,1687,1715],
            [1742,1728,1715],
            [1698,1742,1715],
            [1742,1753,1759],
            [1769,1742,1759],
            [1785,1769,1759],
            [1753,1785,1759],
            [1728,1742,1747],
            [1751,1728,1747],
            [1769,1751,1747],
            [1742,1769,1747],
            [1547,1545,1596],
            [1640,1547,1596],
            [1644,1640,1596],
            [1545,1644,1596],
            [1549,1547,1594],
            [1636,1549,1594],
            [1640,1636,1594],
            [1547,1640,1594],
            [1640,1644,1659],
            [1678,1640,1659],
            [1687,1678,1659],
            [1644,1687,1659],
            [1636,1640,1656],
            [1672,1636,1656],
            [1678,1672,1656],
            [1640,1678,1656],
            [1551,1549,1590],
            [1631,1551,1590],
            [1636,1631,1590],
            [1549,1636,1590],
            [1553,1551,1586],
            [1630,1553,1586],
            [1631,1630,1586],
            [1551,1631,1586],
            [1631,1636,1650],
            [1664,1631,1650],
            [1672,1664,1650],
            [1636,1672,1650],
            [1630,1631,1646],
            [1663,1630,1646],
            [1664,1663,1646],
            [1631,1664,1646],
            [1678,1687,1702],
            [1713,1678,1702],
            [1728,1713,1702],
            [1687,1728,1702],
            [1672,1678,1691],
            [1704,1672,1691],
            [1713,1704,1691],
            [1678,1713,1691],
            [1713,1728,1732],
            [1738,1713,1732],
            [1751,1738,1732],
            [1728,1751,1732],
            [1704,1713,1722],
            [1724,1704,1722],
            [1738,1724,1722],
            [1713,1738,1722],
            [1664,1672,1682],
            [1694,1664,1682],
            [1704,1694,1682],
            [1672,1704,1682],
            [1663,1664,1676],
            [1693,1663,1676],
            [1694,1693,1676],
            [1664,1694,1676],
            [1694,1704,1708],
            [1717,1694,1708],
            [1724,1717,1708],
            [1704,1724,1708],
            [1693,1694,1706],
            [1712,1693,1706],
            [1717,1712,1706],
            [1694,1717,1706],
            [1795,1801,1811],
            [1823,1795,1811],
            [1825,1823,1811],
            [1801,1825,1811],
            [1785,1795,1804],
            [1809,1785,1804],
            [1823,1809,1804],
            [1795,1823,1804],
            [1823,1825,1840],
            [1860,1823,1840],
            [1870,1860,1840],
            [1825,1870,1840],
            [1809,1823,1829],
            [1842,1809,1829],
            [1860,1842,1829],
            [1823,1860,1829],
            [1769,1785,1791],
            [1793,1769,1791],
            [1809,1793,1791],
            [1785,1809,1791],
            [1751,1769,1773],
            [1777,1751,1773],
            [1793,1777,1773],
            [1769,1793,1773],
            [1793,1809,1817],
            [1821,1793,1817],
            [1842,1821,1817],
            [1809,1842,1817],
            [1777,1793,1797],
            [1799,1777,1797],
            [1821,1799,1797],
            [1793,1821,1797],
            [1860,1870,1889],
            [1901,1860,1889],
            [1905,1901,1889],
            [1870,1905,1889],
            [1842,1860,1879],
            [1891,1842,1879],
            [1901,1891,1879],
            [1860,1901,1879],
            [1901,1905,1912],
            [1922,1901,1912],
            [1926,1922,1912],
            [1905,1926,1912],
            [1922,1926,1938],
            [1948,1922,1938],
            [1952,1948,1938],
            [1926,1952,1938],
            [1891,1901,1906],
            [1910,1891,1906],
            [1922,1910,1906],
            [1901,1922,1906],
            [1910,1922,1929],
            [1934,1910,1929],
            [1948,1934,1929],
            [1922,1948,1929],
            [1821,1842,1858],
            [1873,1821,1858],
            [1891,1873,1858],
            [1842,1891,1858],
            [1799,1821,1827],
            [1838,1799,1827],
            [1873,1838,1827],
            [1821,1873,1827],
            [1838,1891,1885],
            [1877,1838,1885],
            [1910,1877,1885],
            [1891,1910,1885],
            [1877,1910,1908],
            [1895,1877,1908],
            [1934,1895,1908],
            [1910,1934,1908],
            [1738,1751,1764],
            [1779,1738,1764],
            [1799,1779,1764],
            [1751,1799,1764],
            [1724,1738,1749],
            [1757,1724,1749],
            [1779,1757,1749],
            [1738,1779,1749],
            [1717,1724,1736],
            [1745,1717,1736],
            [1757,1745,1736],
            [1724,1757,1736],
            [1712,1717,1730],
            [1744,1712,1730],
            [1745,1744,1730],
            [1717,1745,1730],
            [1779,1799,1807],
            [1815,1779,1807],
            [1838,1815,1807],
            [1799,1838,1807],
            [1757,1779,1783],
            [1787,1757,1783],
            [1815,1787,1783],
            [1779,1815,1783],
            [1787,1838,1844],
            [1831,1787,1844],
            [1895,1831,1844],
            [1838,1895,1844],
            [1745,1757,1766],
            [1771,1745,1766],
            [1787,1771,1766],
            [1757,1787,1766],
            [1744,1745,1755],
            [1763,1744,1755],
            [1771,1763,1755],
            [1745,1771,1755],
            [1771,1787,1802],
            [1813,1771,1802],
            [1831,1813,1802],
            [1787,1831,1802],
            [1763,1771,1789],
            [1806,1763,1789],
            [1813,1806,1789],
            [1771,1813,1789],
            [1814,1806,1820],
            [1836,1814,1820],
            [1826,1836,1820],
            [1806,1826,1820],
            [1832,1814,1834],
            [1872,1832,1834],
            [1836,1872,1834],
            [1814,1836,1834],
            [1898,1832,1888],
            [1915,1898,1888],
            [1872,1915,1888],
            [1832,1872,1888],
            [1836,1826,1847],
            [1857,1836,1847],
            [1850,1857,1847],
            [1826,1850,1847],
            [1872,1836,1863],
            [1882,1872,1863],
            [1857,1882,1863],
            [1836,1857,1863],
            [1915,1872,1900],
            [1919,1915,1900],
            [1882,1919,1900],
            [1872,1882,1900],
            [1935,1898,1928],
            [1954,1935,1928],
            [1915,1954,1928],
            [1898,1915,1928],
            [1949,1935,1951],
            [1969,1949,1951],
            [1954,1969,1951],
            [1935,1954,1951],
            [1952,1949,1962],
            [1974,1952,1962],
            [1969,1974,1962],
            [1949,1969,1962],
            [1954,1915,1941],
            [1958,1954,1941],
            [1919,1958,1941],
            [1915,1919,1941],
            [1969,1954,1965],
            [1971,1969,1965],
            [1958,1971,1965],
            [1954,1958,1965],
            [1974,1969,1973],
            [1975,1974,1973],
            [1971,1975,1973],
            [1969,1971,1973],
            [1857,1850,1855],
            [1867,1857,1855],
            [1853,1867,1855],
            [1850,1853,1855],
            [1882,1857,1876],
            [1884,1882,1876],
            [1867,1884,1876],
            [1857,1867,1876],
            [1919,1882,1904],
            [1917,1919,1904],
            [1884,1917,1904],
            [1882,1884,1904],
            [1867,1853,1852],
            [1849,1867,1852],
            [1837,1849,1852],
            [1853,1837,1852],
            [1884,1867,1869],
            [1865,1884,1869],
            [1849,1865,1869],
            [1867,1849,1869],
            [1917,1884,1894],
            [1897,1917,1894],
            [1865,1897,1894],
            [1884,1865,1894],
            [1958,1919,1937],
            [1947,1958,1937],
            [1917,1947,1937],
            [1919,1917,1937],
            [1971,1958,1960],
            [1956,1971,1960],
            [1947,1956,1960],
            [1958,1947,1960],
            [1975,1971,1967],
            [1963,1975,1967],
            [1956,1963,1967],
            [1971,1956,1967],
            [1947,1917,1921],
            [1925,1947,1921],
            [1897,1925,1921],
            [1917,1897,1921],
            [1956,1947,1943],
            [1932,1956,1943],
            [1925,1932,1943],
            [1947,1925,1943],
            [1963,1956,1945],
            [1933,1963,1945],
            [1932,1933,1945],
            [1956,1932,1945],
            [1948,1952,1961],
            [1968,1948,1961],
            [1974,1968,1961],
            [1952,1974,1961],
            [1934,1948,1950],
            [1953,1934,1950],
            [1968,1953,1950],
            [1948,1968,1950],
            [1895,1934,1927],
            [1914,1895,1927],
            [1953,1914,1927],
            [1934,1953,1927],
            [1968,1974,1972],
            [1970,1968,1972],
            [1975,1970,1972],
            [1974,1975,1972],
            [1953,1968,1964],
            [1957,1953,1964],
            [1970,1957,1964],
            [1968,1970,1964],
            [1914,1953,1940],
            [1918,1914,1940],
            [1957,1918,1940],
            [1953,1957,1940],
            [1831,1895,1887],
            [1871,1831,1887],
            [1914,1871,1887],
            [1895,1914,1887],
            [1813,1831,1833],
            [1835,1813,1833],
            [1871,1835,1833],
            [1831,1871,1833],
            [1806,1813,1819],
            [1826,1806,1819],
            [1835,1826,1819],
            [1813,1835,1819],
            [1871,1914,1899],
            [1881,1871,1899],
            [1918,1881,1899],
            [1914,1918,1899],
            [1835,1871,1862],
            [1856,1835,1862],
            [1881,1856,1862],
            [1871,1881,1862],
            [1826,1835,1846],
            [1850,1826,1846],
            [1856,1850,1846],
            [1835,1856,1846],
            [1970,1975,1966],
            [1955,1970,1966],
            [1963,1955,1966],
            [1975,1963,1966],
            [1957,1970,1959],
            [1946,1957,1959],
            [1955,1946,1959],
            [1970,1955,1959],
            [1918,1957,1936],
            [1916,1918,1936],
            [1946,1916,1936],
            [1957,1946,1936],
            [1955,1963,1944],
            [1931,1955,1944],
            [1933,1931,1944],
            [1963,1933,1944],
            [1946,1955,1942],
            [1924,1946,1942],
            [1931,1924,1942],
            [1955,1931,1942],
            [1916,1946,1920],
            [1896,1916,1920],
            [1924,1896,1920],
            [1946,1924,1920],
            [1881,1918,1903],
            [1883,1881,1903],
            [1916,1883,1903],
            [1918,1916,1903],
            [1856,1881,1875],
            [1866,1856,1875],
            [1883,1866,1875],
            [1881,1883,1875],
            [1850,1856,1854],
            [1853,1850,1854],
            [1866,1853,1854],
            [1856,1866,1854],
            [1883,1916,1893],
            [1864,1883,1893],
            [1896,1864,1893],
            [1916,1896,1893],
            [1866,1883,1868],
            [1848,1866,1868],
            [1864,1848,1868],
            [1883,1864,1868],
            [1853,1866,1851],
            [1837,1853,1851],
            [1848,1837,1851],
            [1866,1848,1851],
            [1069,952,992],
            [1072,1069,992],
            [952,1072,992],
            [1069,1072,1094],
            [1118,1069,1094],
            [1134,1118,1094],
            [1072,1134,1094],
            [1030,952,984],
            [1069,1030,984],
            [952,1069,984],
            [1030,1069,1076],
            [1080,1030,1076],
            [1118,1080,1076],
            [1069,1118,1076],
            [1118,1134,1133],
            [1131,1118,1133],
            [1139,1131,1133],
            [1134,1139,1133],
            [1131,1139,1129],
            [1110,1131,1129],
            [1127,1110,1129],
            [1139,1127,1129],
            [1080,1118,1104],
            [1088,1080,1104],
            [1131,1088,1104],
            [1118,1131,1104],
            [1088,1131,1096],
            [1074,1088,1096],
            [1110,1074,1096],
            [1131,1110,1096],
            [980,952,964],
            [1030,980,964],
            [952,1030,964],
            [980,1030,1028],
            [1002,980,1028],
            [1080,1002,1028],
            [1030,1080,1028],
            [951,952,954],
            [980,951,954],
            [952,980,954],
            [951,980,962],
            [949,951,962],
            [1002,949,962],
            [980,1002,962],
            [1002,1080,1059],
            [1012,1002,1059],
            [1088,1012,1059],
            [1080,1088,1059],
            [1012,1088,1053],
            [998,1012,1053],
            [1074,998,1053],
            [1088,1074,1053],
            [949,1002,974],
            [947,949,974],
            [1012,947,974],
            [1002,1012,974],
            [947,1012,972],
            [945,947,972],
            [998,945,972],
            [1012,998,972],
            [1110,1127,1082],
            [1047,1110,1082],
            [1060,1047,1082],
            [1127,1060,1082],
            [1074,1110,1071],
            [1004,1074,1071],
            [1047,1004,1071],
            [1110,1047,1071],
            [1047,1060,1039],
            [1024,1047,1039],
            [1031,1024,1039],
            [1060,1031,1039],
            [1024,1031,1041],
            [1049,1024,1041],
            [1063,1049,1041],
            [1031,1063,1041],
            [1004,1047,1018],
            [994,1004,1018],
            [1024,994,1018],
            [1047,1024,1018],
            [994,1024,1020],
            [1010,994,1020],
            [1049,1010,1020],
            [1024,1049,1020],
            [998,1074,1014],
            [976,998,1014],
            [1004,976,1014],
            [1074,1004,1014],
            [945,998,960],
            [943,945,960],
            [976,943,960],
            [998,976,960],
            [976,1004,986],
            [970,976,986],
            [994,970,986],
            [1004,994,986],
            [970,994,990],
            [978,970,990],
            [1010,978,990],
            [994,1010,990],
            [943,976,956],
            [941,943,956],
            [970,941,956],
            [976,970,956],
            [941,970,958],
            [939,941,958],
            [978,939,958],
            [970,978,958],
            [875,952,901],
            [951,875,901],
            [952,951,901],
            [875,951,893],
            [853,875,893],
            [949,853,893],
            [951,949,893],
            [825,952,891],
            [875,825,891],
            [952,875,891],
            [825,875,827],
            [775,825,827],
            [853,775,827],
            [875,853,827],
            [853,949,881],
            [843,853,881],
            [947,843,881],
            [949,947,881],
            [843,947,883],
            [857,843,883],
            [945,857,883],
            [947,945,883],
            [775,853,796],
            [767,775,796],
            [843,767,796],
            [853,843,796],
            [767,843,802],
            [781,767,802],
            [857,781,802],
            [843,857,802],
            [786,952,871],
            [825,786,871],
            [952,825,871],
            [786,825,779],
            [737,786,779],
            [775,737,779],
            [825,775,779],
            [782,952,863],
            [786,782,863],
            [952,786,863],
            [782,786,761],
            [720,782,761],
            [737,720,761],
            [786,737,761],
            [737,775,751],
            [724,737,751],
            [767,724,751],
            [775,767,751],
            [724,767,759],
            [745,724,759],
            [781,745,759],
            [767,781,759],
            [720,737,722],
            [715,720,722],
            [724,715,722],
            [737,724,722],
            [715,724,726],
            [727,715,726],
            [745,727,726],
            [724,745,726],
            [857,945,895],
            [879,857,895],
            [943,879,895],
            [945,943,895],
            [781,857,841],
            [851,781,841],
            [879,851,841],
            [857,879,841],
            [879,943,899],
            [885,879,899],
            [941,885,899],
            [943,941,899],
            [885,941,897],
            [877,885,897],
            [939,877,897],
            [941,939,897],
            [851,879,869],
            [861,851,869],
            [885,861,869],
            [879,885,869],
            [861,885,865],
            [845,861,865],
            [877,845,865],
            [885,877,865],
            [745,781,784],
            [808,745,784],
            [851,808,784],
            [781,851,784],
            [727,745,773],
            [794,727,773],
            [808,794,773],
            [745,808,773],
            [808,851,837],
            [831,808,837],
            [861,831,837],
            [851,861,837],
            [831,861,835],
            [806,831,835],
            [845,806,835],
            [861,845,835],
            [794,808,816],
            [823,794,816],
            [831,823,816],
            [808,831,816],
            [823,831,814],
            [791,823,814],
            [806,791,814],
            [831,806,814],
            [785,952,862],
            [782,785,862],
            [952,782,862],
            [785,782,760],
            [736,785,760],
            [720,736,760],
            [782,720,760],
            [824,952,870],
            [785,824,870],
            [952,785,870],
            [824,785,778],
            [774,824,778],
            [736,774,778],
            [785,736,778],
            [736,720,721],
            [723,736,721],
            [715,723,721],
            [720,715,721],
            [723,715,725],
            [744,723,725],
            [727,744,725],
            [715,727,725],
            [774,736,750],
            [766,774,750],
            [723,766,750],
            [736,723,750],
            [766,723,758],
            [780,766,758],
            [744,780,758],
            [723,744,758],
            [874,952,890],
            [824,874,890],
            [952,824,890],
            [874,824,826],
            [852,874,826],
            [774,852,826],
            [824,774,826],
            [950,952,900],
            [874,950,900],
            [952,874,900],
            [950,874,892],
            [948,950,892],
            [852,948,892],
            [874,852,892],
            [852,774,795],
            [842,852,795],
            [766,842,795],
            [774,766,795],
            [842,766,801],
            [856,842,801],
            [780,856,801],
            [766,780,801],
            [948,852,880],
            [946,948,880],
            [842,946,880],
            [852,842,880],
            [946,842,882],
            [944,946,882],
            [856,944,882],
            [842,856,882],
            [744,727,772],
            [807,744,772],
            [794,807,772],
            [727,794,772],
            [780,744,783],
            [850,780,783],
            [807,850,783],
            [744,807,783],
            [807,794,815],
            [830,807,815],
            [823,830,815],
            [794,823,815],
            [830,823,813],
            [805,830,813],
            [791,805,813],
            [823,791,813],
            [850,807,836],
            [860,850,836],
            [830,860,836],
            [807,830,836],
            [860,830,834],
            [844,860,834],
            [805,844,834],
            [830,805,834],
            [856,780,840],
            [878,856,840],
            [850,878,840],
            [780,850,840],
            [944,856,894],
            [942,944,894],
            [878,942,894],
            [856,878,894],
            [878,850,868],
            [884,878,868],
            [860,884,868],
            [850,860,868],
            [884,860,864],
            [876,884,864],
            [844,876,864],
            [860,844,864],
            [942,878,898],
            [940,942,898],
            [884,940,898],
            [878,884,898],
            [940,884,896],
            [938,940,896],
            [876,938,896],
            [884,876,896],
            [979,952,953],
            [950,979,953],
            [952,950,953],
            [979,950,961],
            [1001,979,961],
            [948,1001,961],
            [950,948,961],
            [1029,952,963],
            [979,1029,963],
            [952,979,963],
            [1029,979,1027],
            [1079,1029,1027],
            [1001,1079,1027],
            [979,1001,1027],
            [1001,948,973],
            [1011,1001,973],
            [946,1011,973],
            [948,946,973],
            [1011,946,971],
            [997,1011,971],
            [944,997,971],
            [946,944,971],
            [1079,1001,1058],
            [1087,1079,1058],
            [1011,1087,1058],
            [1001,1011,1058],
            [1087,1011,1052],
            [1073,1087,1052],
            [997,1073,1052],
            [1011,997,1052],
            [1068,952,983],
            [1029,1068,983],
            [952,1029,983],
            [1068,1029,1075],
            [1117,1068,1075],
            [1079,1117,1075],
            [1029,1079,1075],
            [1072,952,991],
            [1068,1072,991],
            [952,1068,991],
            [1072,1068,1093],
            [1134,1072,1093],
            [1117,1134,1093],
            [1068,1117,1093],
            [1117,1079,1103],
            [1130,1117,1103],
            [1087,1130,1103],
            [1079,1087,1103],
            [1130,1087,1095],
            [1109,1130,1095],
            [1073,1109,1095],
            [1087,1073,1095],
            [1134,1117,1132],
            [1139,1134,1132],
            [1130,1139,1132],
            [1117,1130,1132],
            [1139,1130,1128],
            [1127,1139,1128],
            [1109,1127,1128],
            [1130,1109,1128],
            [997,944,959],
            [975,997,959],
            [942,975,959],
            [944,942,959],
            [1073,997,1013],
            [1003,1073,1013],
            [975,1003,1013],
            [997,975,1013],
            [975,942,955],
            [969,975,955],
            [940,969,955],
            [942,940,955],
            [969,940,957],
            [977,969,957],
            [938,977,957],
            [940,938,957],
            [1003,975,985],
            [993,1003,985],
            [969,993,985],
            [975,969,985],
            [993,969,989],
            [1009,993,989],
            [977,1009,989],
            [969,977,989],
            [1109,1073,1070],
            [1046,1109,1070],
            [1003,1046,1070],
            [1073,1003,1070],
            [1127,1109,1081],
            [1060,1127,1081],
            [1046,1060,1081],
            [1109,1046,1081],
            [1046,1003,1017],
            [1023,1046,1017],
            [993,1023,1017],
            [1003,993,1017],
            [1023,993,1019],
            [1048,1023,1019],
            [1009,1048,1019],
            [993,1009,1019],
            [1060,1046,1038],
            [1031,1060,1038],
            [1023,1031,1038],
            [1046,1023,1038],
            [1031,1023,1040],
            [1063,1031,1040],
            [1048,1063,1040],
            [1023,1048,1040],
            [1049,1063,1120],
            [1161,1049,1120],
            [1170,1161,1120],
            [1063,1170,1120],
            [1010,1049,1092],
            [1126,1010,1092],
            [1161,1126,1092],
            [1049,1161,1092],
            [1165,1170,1224],
            [1272,1165,1224],
            [1279,1272,1224],
            [1170,1279,1224],
            [1161,1165,1216],
            [1250,1161,1216],
            [1272,1250,1216],
            [1165,1272,1216],
            [1141,1161,1196],
            [1234,1141,1196],
            [1250,1234,1196],
            [1161,1250,1196],
            [1126,1141,1178],
            [1206,1126,1178],
            [1234,1206,1178],
            [1141,1234,1178],
            [978,1010,1045],
            [1043,978,1045],
            [1126,1043,1045],
            [1010,1126,1045],
            [939,978,966],
            [937,939,966],
            [1043,937,966],
            [978,1043,966],
            [1084,1126,1153],
            [1174,1084,1153],
            [1206,1174,1153],
            [1126,1206,1153],
            [1043,1084,1112],
            [1124,1043,1112],
            [1174,1124,1112],
            [1084,1174,1112],
            [982,1043,1055],
            [1033,982,1055],
            [1124,1033,1055],
            [1043,1124,1055],
            [937,982,968],
            [935,937,968],
            [1033,935,968],
            [982,1033,968],
            [1272,1279,1321],
            [1369,1272,1321],
            [1376,1369,1321],
            [1279,1376,1321],
            [1250,1272,1309],
            [1347,1250,1309],
            [1369,1347,1309],
            [1272,1369,1309],
            [1234,1250,1285],
            [1315,1234,1285],
            [1347,1315,1285],
            [1250,1347,1285],
            [1206,1234,1252],
            [1278,1206,1252],
            [1315,1278,1252],
            [1234,1315,1252],
            [1369,1376,1388],
            [1402,1369,1388],
            [1415,1402,1388],
            [1376,1415,1388],
            [1347,1369,1375],
            [1378,1347,1375],
            [1402,1378,1375],
            [1369,1402,1375],
            [1402,1415,1419],
            [1423,1402,1419],
            [1434,1423,1419],
            [1415,1434,1419],
            [1378,1402,1396],
            [1390,1378,1396],
            [1423,1390,1396],
            [1402,1423,1396],
            [1315,1347,1339],
            [1335,1315,1339],
            [1378,1335,1339],
            [1347,1378,1339],
            [1278,1315,1305],
            [1295,1278,1305],
            [1335,1295,1305],
            [1315,1335,1305],
            [1335,1378,1365],
            [1353,1335,1365],
            [1390,1353,1365],
            [1378,1390,1365],
            [1295,1335,1325],
            [1301,1295,1325],
            [1353,1301,1325],
            [1335,1353,1325],
            [1174,1206,1222],
            [1226,1174,1222],
            [1278,1226,1222],
            [1206,1278,1222],
            [1124,1174,1176],
            [1169,1124,1176],
            [1226,1169,1176],
            [1174,1226,1176],
            [1033,1124,1108],
            [1078,1033,1108],
            [1169,1078,1108],
            [1124,1169,1108],
            [935,1033,988],
            [931,935,988],
            [1078,931,988],
            [1033,1078,988],
            [1226,1278,1256],
            [1240,1226,1256],
            [1295,1240,1256],
            [1278,1295,1256],
            [1169,1226,1202],
            [1180,1169,1202],
            [1240,1180,1202],
            [1226,1240,1202],
            [1240,1295,1274],
            [1244,1240,1274],
            [1301,1244,1274],
            [1295,1301,1274],
            [1180,1240,1218],
            [1186,1180,1218],
            [1244,1186,1218],
            [1240,1244,1218],
            [1078,1169,1138],
            [1086,1078,1138],
            [1180,1086,1138],
            [1169,1180,1138],
            [931,1078,996],
            [925,931,996],
            [1086,925,996],
            [1078,1086,996],
            [1086,1180,1145],
            [1090,1086,1145],
            [1186,1090,1145],
            [1180,1186,1145],
            [925,1086,1000],
            [921,925,1000],
            [1090,921,1000],
            [1086,1090,1000],
            [877,939,889],
            [812,877,889],
            [937,812,889],
            [939,937,889],
            [845,877,810],
            [729,845,810],
            [812,729,810],
            [877,812,810],
            [873,937,887],
            [822,873,887],
            [935,822,887],
            [937,935,887],
            [812,873,800],
            [731,812,800],
            [822,731,800],
            [873,822,800],
            [771,812,743],
            [681,771,743],
            [731,681,743],
            [812,731,743],
            [729,771,702],
            [649,729,702],
            [681,649,702],
            [771,681,702],
            [806,845,763],
            [694,806,763],
            [729,694,763],
            [845,729,763],
            [791,806,735],
            [684,791,735],
            [694,684,735],
            [806,694,735],
            [714,729,677],
            [621,714,677],
            [649,621,677],
            [729,649,677],
            [694,714,659],
            [605,694,659],
            [621,605,659],
            [714,621,659],
            [690,694,639],
            [583,690,639],
            [605,583,639],
            [694,605,639],
            [684,690,631],
            [575,684,631],
            [583,575,631],
            [690,583,631],
            [822,935,867],
            [777,822,867],
            [931,777,867],
            [935,931,867],
            [731,822,747],
            [686,731,747],
            [777,686,747],
            [822,777,747],
            [681,731,679],
            [629,681,679],
            [686,629,679],
            [731,686,679],
            [649,681,633],
            [577,649,633],
            [629,577,633],
            [681,629,633],
            [777,931,859],
            [769,777,859],
            [925,769,859],
            [931,925,859],
            [686,777,717],
            [675,686,717],
            [769,675,717],
            [777,769,717],
            [769,925,855],
            [765,769,855],
            [921,765,855],
            [925,921,855],
            [675,769,710],
            [669,675,710],
            [765,669,710],
            [769,765,710],
            [629,686,653],
            [615,629,653],
            [675,615,653],
            [686,675,653],
            [577,629,599],
            [560,577,599],
            [615,560,599],
            [629,615,599],
            [615,675,637],
            [611,615,637],
            [669,611,637],
            [675,669,637],
            [560,615,581],
            [554,560,581],
            [611,554,581],
            [615,611,581],
            [621,649,603],
            [540,621,603],
            [577,540,603],
            [649,577,603],
            [605,621,570],
            [508,605,570],
            [540,508,570],
            [621,540,570],
            [583,605,546],
            [486,583,546],
            [508,486,546],
            [605,508,546],
            [575,583,534],
            [478,575,534],
            [486,478,534],
            [583,486,534],
            [540,577,550],
            [520,540,550],
            [560,520,550],
            [577,560,550],
            [508,540,516],
            [477,508,516],
            [520,477,516],
            [540,520,516],
            [520,560,530],
            [502,520,530],
            [554,502,530],
            [560,554,530],
            [477,520,490],
            [465,477,490],
            [502,465,490],
            [520,502,490],
            [486,508,480],
            [453,486,480],
            [477,453,480],
            [508,477,480],
            [478,486,467],
            [439,478,467],
            [453,439,467],
            [486,453,467],
            [453,477,459],
            [432,453,459],
            [465,432,459],
            [477,465,459],
            [439,453,436],
            [420,439,436],
            [432,420,436],
            [453,432,436],
            [805,791,734],
            [693,805,734],
            [684,693,734],
            [791,684,734],
            [844,805,762],
            [728,844,762],
            [693,728,762],
            [805,693,762],
            [689,684,630],
            [582,689,630],
            [575,582,630],
            [684,575,630],
            [693,689,638],
            [604,693,638],
            [582,604,638],
            [689,582,638],
            [713,693,658],
            [620,713,658],
            [604,620,658],
            [693,604,658],
            [728,713,676],
            [648,728,676],
            [620,648,676],
            [713,620,676],
            [876,844,809],
            [811,876,809],
            [728,811,809],
            [844,728,809],
            [938,876,888],
            [936,938,888],
            [811,936,888],
            [876,811,888],
            [770,728,701],
            [680,770,701],
            [648,680,701],
            [728,648,701],
            [811,770,742],
            [730,811,742],
            [680,730,742],
            [770,680,742],
            [872,811,799],
            [821,872,799],
            [730,821,799],
            [811,730,799],
            [936,872,886],
            [934,936,886],
            [821,934,886],
            [872,821,886],
            [582,575,533],
            [485,582,533],
            [478,485,533],
            [575,478,533],
            [604,582,545],
            [507,604,545],
            [485,507,545],
            [582,485,545],
            [620,604,569],
            [539,620,569],
            [507,539,569],
            [604,507,569],
            [648,620,602],
            [576,648,602],
            [539,576,602],
            [620,539,602],
            [485,478,466],
            [452,485,466],
            [439,452,466],
            [478,439,466],
            [507,485,479],
            [476,507,479],
            [452,476,479],
            [485,452,479],
            [452,439,435],
            [431,452,435],
            [420,431,435],
            [439,420,435],
            [476,452,458],
            [464,476,458],
            [431,464,458],
            [452,431,458],
            [539,507,515],
            [519,539,515],
            [476,519,515],
            [507,476,515],
            [576,539,549],
            [559,576,549],
            [519,559,549],
            [539,519,549],
            [519,476,489],
            [501,519,489],
            [464,501,489],
            [476,464,489],
            [559,519,529],
            [553,559,529],
            [501,553,529],
            [519,501,529],
            [680,648,632],
            [628,680,632],
            [576,628,632],
            [648,576,632],
            [730,680,678],
            [685,730,678],
            [628,685,678],
            [680,628,678],
            [821,730,746],
            [776,821,746],
            [685,776,746],
            [730,685,746],
            [934,821,866],
            [930,934,866],
            [776,930,866],
            [821,776,866],
            [628,576,598],
            [614,628,598],
            [559,614,598],
            [576,559,598],
            [685,628,652],
            [674,685,652],
            [614,674,652],
            [628,614,652],
            [614,559,580],
            [610,614,580],
            [553,610,580],
            [559,553,580],
            [674,614,636],
            [668,674,636],
            [610,668,636],
            [614,610,636],
            [776,685,716],
            [768,776,716],
            [674,768,716],
            [685,674,716],
            [930,776,858],
            [924,930,858],
            [768,924,858],
            [776,768,858],
            [768,674,709],
            [764,768,709],
            [668,764,709],
            [674,668,709],
            [924,768,854],
            [920,924,854],
            [764,920,854],
            [768,764,854],
            [977,938,965],
            [1042,977,965],
            [936,1042,965],
            [938,936,965],
            [1009,977,1044],
            [1125,1009,1044],
            [1042,1125,1044],
            [977,1042,1044],
            [981,936,967],
            [1032,981,967],
            [934,1032,967],
            [936,934,967],
            [1042,981,1054],
            [1123,1042,1054],
            [1032,1123,1054],
            [981,1032,1054],
            [1083,1042,1111],
            [1173,1083,1111],
            [1123,1173,1111],
            [1042,1123,1111],
            [1125,1083,1152],
            [1205,1125,1152],
            [1173,1205,1152],
            [1083,1173,1152],
            [1048,1009,1091],
            [1160,1048,1091],
            [1125,1160,1091],
            [1009,1125,1091],
            [1063,1048,1119],
            [1170,1063,1119],
            [1160,1170,1119],
            [1048,1160,1119],
            [1140,1125,1177],
            [1233,1140,1177],
            [1205,1233,1177],
            [1125,1205,1177],
            [1160,1140,1195],
            [1249,1160,1195],
            [1233,1249,1195],
            [1140,1233,1195],
            [1164,1160,1215],
            [1271,1164,1215],
            [1249,1271,1215],
            [1160,1249,1215],
            [1170,1164,1223],
            [1279,1170,1223],
            [1271,1279,1223],
            [1164,1271,1223],
            [1032,934,987],
            [1077,1032,987],
            [930,1077,987],
            [934,930,987],
            [1123,1032,1107],
            [1168,1123,1107],
            [1077,1168,1107],
            [1032,1077,1107],
            [1173,1123,1175],
            [1225,1173,1175],
            [1168,1225,1175],
            [1123,1168,1175],
            [1205,1173,1221],
            [1277,1205,1221],
            [1225,1277,1221],
            [1173,1225,1221],
            [1077,930,995],
            [1085,1077,995],
            [924,1085,995],
            [930,924,995],
            [1168,1077,1137],
            [1179,1168,1137],
            [1085,1179,1137],
            [1077,1085,1137],
            [1085,924,999],
            [1089,1085,999],
            [920,1089,999],
            [924,920,999],
            [1179,1085,1144],
            [1185,1179,1144],
            [1089,1185,1144],
            [1085,1089,1144],
            [1225,1168,1201],
            [1239,1225,1201],
            [1179,1239,1201],
            [1168,1179,1201],
            [1277,1225,1255],
            [1294,1277,1255],
            [1239,1294,1255],
            [1225,1239,1255],
            [1239,1179,1217],
            [1243,1239,1217],
            [1185,1243,1217],
            [1179,1185,1217],
            [1294,1239,1273],
            [1300,1294,1273],
            [1243,1300,1273],
            [1239,1243,1273],
            [1233,1205,1251],
            [1314,1233,1251],
            [1277,1314,1251],
            [1205,1277,1251],
            [1249,1233,1284],
            [1346,1249,1284],
            [1314,1346,1284],
            [1233,1314,1284],
            [1271,1249,1308],
            [1368,1271,1308],
            [1346,1368,1308],
            [1249,1346,1308],
            [1279,1271,1320],
            [1376,1279,1320],
            [1368,1376,1320],
            [1271,1368,1320],
            [1314,1277,1304],
            [1334,1314,1304],
            [1294,1334,1304],
            [1277,1294,1304],
            [1346,1314,1338],
            [1377,1346,1338],
            [1334,1377,1338],
            [1314,1334,1338],
            [1334,1294,1324],
            [1352,1334,1324],
            [1300,1352,1324],
            [1294,1300,1324],
            [1377,1334,1364],
            [1389,1377,1364],
            [1352,1389,1364],
            [1334,1352,1364],
            [1368,1346,1374],
            [1401,1368,1374],
            [1377,1401,1374],
            [1346,1377,1374],
            [1376,1368,1387],
            [1415,1376,1387],
            [1401,1415,1387],
            [1368,1401,1387],
            [1401,1377,1395],
            [1422,1401,1395],
            [1389,1422,1395],
            [1377,1389,1395],
            [1415,1401,1418],
            [1434,1415,1418],
            [1422,1434,1418],
            [1401,1422,1418]
        ];

        var calculateNormals = function(positions, indices) {
            var nvecs = new Array(positions.length);

            for (var i = 0; i < indices.length; i++) {
                var j0 = indices[i][0];
                var j1 = indices[i][1];
                var j2 = indices[i][2];

                var v1 = positions[j0];
                var v2 = positions[j1];
                var v3 = positions[j2];

                v2 = SceneJS_math_subVec4(v2, v1, [0,0,0,0]);
                v3 = SceneJS_math_subVec4(v3, v1, [0,0,0,0]);

                var n = SceneJS_math_normalizeVec4(SceneJS_math_cross3Vec4(v2, v3, [0,0,0,0]), [0,0,0,0]);

                if (!nvecs[j0]) nvecs[j0] = [];
                if (!nvecs[j1]) nvecs[j1] = [];
                if (!nvecs[j2]) nvecs[j2] = [];

                nvecs[j0].push(n);
                nvecs[j1].push(n);
                nvecs[j2].push(n);
            }

            var normals = new Array(positions.length);

            // now go through and average out everything
            for (var i = 0; i < nvecs.length; i++) {
                var count = nvecs[i].length;
                var x = 0;
                var y = 0;
                var z = 0;
                for (var j = 0; j < count; j++) {
                    x += nvecs[i][j][0];
                    y += nvecs[i][j][1];
                    z += nvecs[i][j][2];
                }
                normals[i] = [-(x / count), -(y / count), -(z / count)];
            }
            return normals;
        };

        // @private
        var flatten = function (ar, numPerElement) {
            var result = [];
            for (var i = 0; i < ar.length; i++) {
                if (numPerElement && ar[i].length != numPerElement)
                    throw SceneJS_errorModule.fatalError("Bad geometry array element");
                for (var j = 0; j < ar[i].length; j++)
                    result.push(ar[i][j]);
            }
            return result;
        };
        return {
            primitive:"triangles",
            positions: flatten(positions, 3),
            indices:flatten(indices, 3),
            normals:flatten(calculateNormals(positions, indices), 3)
        };
    };

    var Teapot = SceneJS.createNodeType("teapot", "geometry");

    Teapot.prototype._init = function() {

       this.attr.type = "teapot";

        SceneJS_geometry.prototype._init.call(this, {

            /* Resource ID ensures that we save memory by reusing any teapot that has already been created
             */
            coreId : "teapot",
            create: create
        });


    };

})();
(function() {

    var Box = SceneJS.createNodeType("box", "geometry");

    Box.prototype._init = function(params) {

        this.attr.type = "box";

        var x = params.xSize || 1;
        var y = params.ySize || 1;
        var z = params.zSize || 1;

        var solid = (params.solid != undefined) ? params.solid : true;

        SceneJS_geometry.prototype._init.call(this, {

            /* Resource ID ensures that we reuse any sbox that has already been created with
             * these parameters instead of wasting memory
             */
            resource : "box_" + x + "_" + y + "_" + z + (solid ? "_solid" : "wire"),

            /* Callback that does the creation in case we can't find matching box to reuse
             */
            create: function() {
                var positions = [
                    x, y, z,  -x, y, z, -x,-y, z,  x,-y, z, // v0-v1-v2-v3 front
                    x, y, z,   x,-y, z,  x,-y,-z,  x, y,-z, // v0-v3-v4-v5 right
                    x, y, z,   x, y,-z, -x, y,-z, -x, y, z, // v0-v5-v6-v1 top
                    -x, y, z, -x, y,-z, -x,-y,-z,
                    -x,-y, z,
                    // v1-v6-v7-v2 left
                    -x,-y,-z,
                    x,-y,-z,
                    x,-y, z,
                    -x,-y, z,
                    // v7-v4-v3-v2 bottom
                    x,-y,-z,
                    -x,-y,-z,
                    -x, y,-z,
                    x, y,-z
                ];   // v4-v7-v6-v5 back

                var normals = [
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    // v0-v1-v2-v3 front
                    1, 0, 0,
                    1, 0, 0,
                    1, 0, 0,
                    1, 0, 0,
                    // v0-v3-v4-v5 right
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0,
                    // v0-v5-v6-v1 top
                    -1, 0, 0,
                    -1, 0, 0,
                    -1, 0, 0,
                    -1, 0, 0,
                    // v1-v6-v7-v2 left
                    0,-1, 0,
                    0,-1, 0,
                    0,-1, 0,
                    0,-1, 0,
                    // v7-v4-v3-v2 bottom
                    0, 0,-1,
                    0, 0,-1,
                    0, 0,-1,
                    0, 0,-1
                ];    // v4-v7-v6-v5 back

                var uv = [
                    x, y,
                    0, y,
                    0, 0,
                    x, 0,
                    // v0-v1-v2-v3 front
                    0, y,
                    0, 0,
                    x, 0,
                    x, y,
                    // v0-v3-v4-v5 right
                    x, 0,
                    x, y,
                    0, y,
                    0, 0,
                    // v0-v5-v6-v1 top
                    x, y,
                    0, y,
                    0, 0,
                    x, 0,
                    // v1-v6-v7-v2 left
                    0, 0,
                    x, 0,
                    x, y,
                    0, y,
                    // v7-v4-v3-v2 bottom
                    0, 0,
                    x, 0,
                    x, y,
                    0, y
                ];   // v4-v7-v6-v5 back

                var indices = [
                    0, 1, 2,
                    0, 2, 3,
                    // front
                    4, 5, 6,
                    4, 6, 7,
                    // right
                    8, 9,10,
                    8,10,11,
                    // top
                    12,13,14,
                    12,14,15,
                    // left
                    16,17,18,
                    16,18,19,
                    // bottom
                    20,21,22,
                    20,22,23
                ] ;  // back

                return {
                    primitive : solid ? "triangles" : "lines",
                    positions : positions,
                    normals: normals,
                    uv : uv,
                    indices : indices,
                    colors:[]
                };
            }
        });
    };

    SceneJS.createNodeType("cube", "box");  // Alias for backwards compatibility with V0.7.9

})();
(function() {

    /**
     * @class A scene node that defines sphere geometry.
     * <p>The geometry is complete with normals for shading and one layer of UV coordinates for
     * texture-mapping.</p>
     * <p><b>Example Usage</b></p><p>Definition of sphere with a radius of 6 units:</b></p><pre><code>
     * var c = new Sphere({
     *            radius: 6
     *          slices: 30,          // Optional number of longitudinal slices (30 is default)
     *          rings: 30,           // Optional number of latitudinal slices (30 is default)
     *          semiMajorAxis: 1.5,  // Optional semiMajorAxis results in elliptical sphere (default of 1 creates sphere)
     *          sweep: 0.75,         // Optional rotational extrusion (1 is default)
     *          sliceDepth: 0.25,    // Optional depth of slices to generate from top to bottom (1 is default)
     (1 is default)
     *     })
     * </pre></code>
     * @extends SceneJS.Geometry
     * @since Version 0.7.4
     * @constructor
     * Create a new Sphere
     * @param {Object} [cfg] Static configuration object
     * @param {float} [cfg.slices=30] Number of longitudinal slices
     * @param {float} [cfg.rings=30] Number of longitudinal slices
     * @param {float} [cfg.semiMajorAxis=1.0] values other than one generate an elliptical sphere
     * @param {float} [cfg.sweep=1]  rotational extrusion, default is 1
     * @param {float} [cfg.sliceDepth=1]  depth of slices to generate, default is 1
     * @param {function(SceneJS.Data):Object} [fn] Dynamic configuration function
     * @param {...SceneJS_node} [childNodes] Child nodes
     */
    var Sphere = SceneJS.createNodeType("sphere", "geometry");

    Sphere.prototype._init = function(params) {
        var slices = params.slices || 30;
        var rings = params.rings || 30;
        var radius = params.radius || 1;

        var semiMajorAxis = params.semiMajorAxis || 1;
        var semiMinorAxis = 1 / semiMajorAxis;

        var sweep = params.sweep || 1;
        if (sweep > 1) {
            sweep = 1
        }

        var sliceDepth = params.sliceDepth || 1;
        if (sliceDepth > 1) {
            sliceDepth = 1
        }

        var ringLimit = rings * sweep;
        var sliceLimit = slices * sliceDepth;

        SceneJS_geometry.prototype._init.call(this, {

            /* Core ID ensures that we reuse any sphere that has already been created with
             * these parameters instead of wasting memory
             */
            coreId : params.coreId || "sphere_" + radius + "_" + rings + "_" + slices + "_" + semiMajorAxis + "_" + sweep + "_" + sliceDepth,

            /* Optional pre-applied static model-space transforms
             */
            scale: params.scale,
            origin: params.origin,

            /* Callback that does the creation in case we can't find matching sphere to reuse
             */
            create : function() {
                var positions = [];
                var normals = [];
                var uv = [];
                var ringNum, sliceNum, index;

                for (sliceNum = 0; sliceNum <= slices; sliceNum++) {
                    if (sliceNum > sliceLimit) break;
                    var theta = sliceNum * Math.PI / slices;
                    var sinTheta = Math.sin(theta);
                    var cosTheta = Math.cos(theta);

                    for (ringNum = 0; ringNum <= rings; ringNum++) {
                        if (ringNum > ringLimit) break;
                        var phi = ringNum * 2 * Math.PI / rings;
                        var sinPhi = semiMinorAxis * Math.sin(phi);
                        var cosPhi = semiMajorAxis * Math.cos(phi);

                        var x = cosPhi * sinTheta;
                        var y = cosTheta;
                        var z = sinPhi * sinTheta;
                        var u = 1 - (ringNum / rings);
                        var v = sliceNum / slices;

                        normals.push(x);
                        normals.push(y);
                        normals.push(z);
                        uv.push(u);
                        uv.push(v);
                        positions.push(radius * x);
                        positions.push(radius * y);
                        positions.push(radius * z);
                    }
                }

                // create a center point which is only used when sweep or sliceDepth are less than one
                if (sliceDepth < 1) {
                    var yPos = Math.cos((sliceNum - 1) * Math.PI / slices) * radius;
                    positions.push(0, yPos, 0);
                    normals.push(1, 1, 1);
                    uv.push(1, 1);
                } else {
                    positions.push(0, 0, 0);
                    normals.push(1, 1, 1);
                    uv.push(1, 1);
                }

                // index of the center position point in the positions array
                // var centerIndex = (ringLimit + 1) *  (sliceLimit);
                var centerIndex = positions.length / 3 - 1;

                var indices = [];

                for (sliceNum = 0; sliceNum < slices; sliceNum++) {
                    if (sliceNum >= sliceLimit) break;
                    for (ringNum = 0; ringNum < rings; ringNum++) {
                        if (ringNum >= ringLimit) break;
                        var first = (sliceNum * (ringLimit + 1)) + ringNum;
                        var second = first + ringLimit + 1;
                        indices.push(first);
                        indices.push(second);
                        indices.push(first + 1);

                        indices.push(second);
                        indices.push(second + 1);
                        indices.push(first + 1);
                    }
                    if (rings >= ringLimit) {
                        // We aren't sweeping the whole way around so ...
                        //  indices for a sphere with fours ring-segments when only two are drawn.
                        index = (ringLimit + 1) * sliceNum;
                        //    0,3,15   2,5,15  3,6,15  5,8,15 ...
                        indices.push(index, index + ringLimit + 1, centerIndex);
                        indices.push(index + ringLimit, index + ringLimit * 2 + 1, centerIndex);
                    }
                }

                if (slices > sliceLimit) {
                    // We aren't sweeping from the top all the way to the bottom so ...
                    for (ringNum = 1; ringNum <= ringLimit; ringNum++) {
                        index = sliceNum * ringLimit + ringNum;
                        indices.push(index, index + 1, centerIndex);
                    }
                    indices.push(index + 1, sliceNum * ringLimit + 1, centerIndex);
                }

                return {
                    primitive : "triangles",
                    positions : positions,
                    normals: normals,
                    uv : uv,
                    indices : indices
                };
            }
        });
    };

})();
(function() {

    /**
     * A scene node that defines 2D quad (sprite) geometry.
     * The geometry is complete with normals for shading and one layer of UV coordinates for
     * texture-mapping. A Quad may be configured with an optional half-size for X and Y axis. Where
     * not specified, the half-size on each axis will be 1 by default. It can also be configured as solid (default),
     * to construct it from triangles with normals for shading and one layer of UV coordinates for texture-mapping
     * one made of triangles. When not solid, it will be a wireframe drawn as line segments.
     */
    var Quad = SceneJS.createNodeType("quad", "geometry");

    Quad.prototype._init = function(params) {
        this.attr.type = "quad";

        var solid = (params.solid != undefined) ? params.solid : true;

        var x = params.xSize || 1;
        var y = params.ySize || 1;

        SceneJS_geometry.prototype._init.call(this, {

            /* Core ID ensures that we reuse any quad that has already been created with
             * these parameters instead of wasting memory
             */
            coreId : params.coreId || "quad_" + x + "_" + y + (solid ? "_solid" : "_wire"),

            /* Factory function used when resource not found
             */
            create : function() {

                var xDiv = params.xDiv || 1;
                var yDiv = params.yDiv || 1;

                var positions, normals, uv, indices;

                if (xDiv == 1 && yDiv == 1) {
                    positions = [
                        x, y, 0,
                        -x, y, 0,
                        -x,-y, 0,
                        x,-y, 0
                    ];
                    normals = [
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1
                    ];
                    uv = [
                        1, 1,
                        0, 1,
                        0, 0,
                        1, 0
                    ];
                    indices = [
                        2, 1, 0,
                        3, 2, 0
                    ];
                } else {
                    if (xDiv < 0) {
                        throw SceneJS_errorModule.fatalError(SceneJS.errors.ILLEGAL_NODE_CONFIG, "quad xDiv should be greater than zero");
                    }
                    if (yDiv < 0) {
                        throw SceneJS_errorModule.fatalError(SceneJS.errors.ILLEGAL_NODE_CONFIG, "quad yDiv should be greater than zero");
                    }
                    positions = [];
                    normals = [];
                    uv = [];
                    indices = [];
                    var xStep = (x * 2) / xDiv;
                    var yStep = (y * 2) / yDiv;
                    var xRat = 0.5 / xDiv;
                    var yRat = 0.5 / yDiv;
                    var i = 0;
                    for (var yi = -y, yuv = 0; yi <= y; yi += yStep,yuv += yRat) {
                        for (var xi = -x, xuv = 0; xi <= x; xi += xStep,xuv += xRat) {
                            positions.push(xi);
                            positions.push(yi);
                            positions.push(0);
                            normals.push(0);
                            normals.push(0);
                            normals.push(1);
                            uv.push(xuv);
                            uv.push(yuv);
                            if (yi < y && xi < x) { // Two triangles
                                indices.push(i + 2);
                                indices.push(i + 1);
                                indices.push(i);
                                indices.push(i + 3);
                                indices.push(i + 2);
                                indices.push(i);
                            }
                            i += 3;
                        }
                    }
                }

                return {
                    primitive : solid ? "triangles" : "lines",
                    positions : positions,
                    normals: normals,
                    uv : uv,
                    indices : indices,
                    colors:[]
                };
            }
        });
    };

})();
(function() {

    /**
     * @class A scene node that defines a disk geometry.
     * <p>The geometry is complete with normals for shading and one layer of UV coordinates for
     * texture-mapping. It can also be configured as solid (default), to construct it from
     * triangles with normals for shading and one layer of UV coordinates for texture-mapping
     * When not solid, it will be a wireframe drawn as line segments.</p>
     * <p><b>Example Usage</b></p><p>Definition of solid disk that extends 6 units radially from the Y-axis,
     * is elliptical in shape with a normalized semiMajorAxis of 1.5, is 2 units high in the Y-axis and
     * is made up of 48 longitudinal rings:</b></p><pre><code>
     * var c = new Disk({
     *          radius: 6,          // Optional radius (1 is default)
     *          innerRadius: 3     // Optional innerRadius results in ring (default is 0)
     *          semiMajorAxis: 1.5  // Optional semiMajorAxis results in ellipse (default is 1 which is a circle)
     *          height: 2,          // Optional height (1 is default)
     *          rings: 48           // Optional number of longitudinal rings (30 is default)
     *     })
     * </pre></code>
     * @extends SceneJS.Geometry
     * @since Version 0.7.9
     * @constructor
     * Create a new Disk
     * @param {Object} [cfg] Static configuration object
     * @param {float} [cfg.radius=1.0] radius extending from Y-axis
     * @param {float} [cfg.innerRadius=0] inner radius extending from Y-axis
     * @param {float} [cfg.innerRadius=0] inner radius extending from Y-axis
     * @param {float} [cfg.semiMajorAxis=1.0] values other than one generate an ellipse
     * @param {float} [cfg.rings=30]  number of longitudinal rings
     * @param {...SceneJS_node} [childNodes] Child nodes
     */
    var Disk = SceneJS.createNodeType("disk", "geometry");

    Disk.prototype._init = function(params) {
        this.attr.type = "disk";

        var radius = params.radius || 1;
        var height = params.height || 1;
        var rings = params.rings || 30;
        var innerRadius = params.innerRadius || 0;
        if (innerRadius > radius) {
            innerRadius = radius
        }

        var semiMajorAxis = params.semiMajorAxis || 1;
        var semiMinorAxis = 1 / semiMajorAxis;

        var sweep = params.sweep || 1;
        if (sweep > 1) {
            sweep = 1
        }

        var ringLimit = rings * sweep;

        SceneJS_geometry.prototype._init.call(this, {

            /* Resource ID ensures that we reuse any sphere that has already been created with
             * these parameters instead of wasting memory
             */
            coreId : params.coreId || "disk_" + radius + "_" + height + "_" + rings + "_" + innerRadius + "_" + semiMajorAxis + "_" + sweep,

            /* Callback that does the creation in case we can't find matching disk to reuse
             */
            create : function() {
                var positions = [];
                var normals = [];
                var uv = [];

                var ybot = height * -0.5;
                var ytop = height * 0.5;

                if (innerRadius <= 0) {
                    // create the central vertices

                    // bottom vertex
                    normals.push(0);
                    normals.push(-1);
                    normals.push(0);
                    uv.push(u);
                    uv.push(v);
                    positions.push(0);
                    positions.push(ybot);
                    positions.push(0);

                    // top vertex
                    normals.push(0);
                    normals.push(1);
                    normals.push(0);
                    uv.push(u);
                    uv.push(v);
                    positions.push(0);
                    positions.push(ytop);
                    positions.push(0);
                }

                for (var ringNum = 0; ringNum <= rings; ringNum++) {

                    if (ringNum > ringLimit) break;

                    var phi = ringNum * 2 * Math.PI / rings;
                    var sinPhi = semiMinorAxis * Math.sin(phi);
                    var cosPhi = semiMajorAxis * Math.cos(phi);

                    var x = cosPhi;
                    var z = sinPhi;
                    var u = 1 - (ringNum / rings);
                    var v = 0.5;

                    //
                    // Create the outer set of vertices,
                    // two for the bottom and two for the top.
                    // 

                    // bottom vertex, facing the disk axis
                    normals.push(0);
                    normals.push(-1);
                    normals.push(0);
                    uv.push(u);
                    uv.push(v);
                    positions.push(radius * x);
                    positions.push(ybot);
                    positions.push(radius * z);

                    // bottom vertex, facing outwards
                    normals.push(x);
                    normals.push(0);
                    normals.push(z);
                    uv.push(u);
                    uv.push(v);
                    positions.push(radius * x);
                    positions.push(ybot);
                    positions.push(radius * z);

                    // top vertex, facing the disk axis
                    normals.push(0);
                    normals.push(1);
                    normals.push(0);
                    uv.push(u);
                    uv.push(v);
                    positions.push(radius * x);
                    positions.push(ytop);
                    positions.push(radius * z);

                    // top vertex, facing outwards
                    normals.push(x);
                    normals.push(0);
                    normals.push(z);
                    uv.push(u);
                    uv.push(v);
                    positions.push(radius * x);
                    positions.push(ytop);
                    positions.push(radius * z);

                    if (innerRadius > 0) {

                        //
                        // Creating a disk with a hole in the middle ...
                        // generate the inner set of vertices,
                        // one for the bottom and one for the top
                        //

                        // bottom vertex, facing the disk axis
                        normals.push(0);
                        normals.push(-1);
                        normals.push(0);
                        uv.push(u);
                        uv.push(v);
                        positions.push(innerRadius * x);
                        positions.push(ybot);
                        positions.push(innerRadius * z);

                        // bottom vertex, facing inwards
                        normals.push(-x);
                        normals.push(0);
                        normals.push(-z);
                        uv.push(u);
                        uv.push(v);
                        positions.push(innerRadius * x);
                        positions.push(ybot);
                        positions.push(innerRadius * z);

                        // top vertex, facing the disk axis
                        normals.push(0);
                        normals.push(1);
                        normals.push(0);
                        uv.push(u);
                        uv.push(v);
                        positions.push(innerRadius * x);
                        positions.push(ytop);
                        positions.push(innerRadius * z);

                        // top vertex, facing inwards
                        normals.push(-x);
                        normals.push(0);
                        normals.push(-z);
                        uv.push(u);
                        uv.push(v);
                        positions.push(innerRadius * x);
                        positions.push(ytop);
                        positions.push(innerRadius * z);
                    }

                    if (ringNum + 1 > ringLimit) {

                        //
                        // Create (outer) vertices for end caps.
                        //

                        // bottom vertex for the first end cap
                        normals.push(0);
                        normals.push(0);
                        normals.push(-1);
                        uv.push(u);
                        uv.push(v);
                        positions.push(radius * semiMajorAxis);
                        positions.push(ybot);
                        positions.push(0);

                        // top vertex for the first end cap
                        normals.push(0);
                        normals.push(0);
                        normals.push(-1);
                        uv.push(u);
                        uv.push(v);
                        positions.push(radius * semiMajorAxis);
                        positions.push(ytop);
                        positions.push(0);

                        // bottom vertex for the second end cap
                        normals.push(-z);
                        normals.push(0);
                        normals.push(x);
                        uv.push(u);
                        uv.push(v);
                        positions.push(radius * x);
                        positions.push(ybot);
                        positions.push(radius * z);

                        // top vertex for the second end cap
                        normals.push(-z);
                        normals.push(0);
                        normals.push(x);
                        uv.push(u);
                        uv.push(v);
                        positions.push(radius * x);
                        positions.push(ytop);
                        positions.push(radius * z);

                        if (innerRadius > 0) {

                            //
                            // Disk with a hole.
                            // Create inner vertices for end caps.
                            //

                            // bottom vertex for the first end cap
                            normals.push(0);
                            normals.push(0);
                            normals.push(-1);
                            uv.push(u);
                            uv.push(v);
                            positions.push(innerRadius * semiMajorAxis);
                            positions.push(ybot);
                            positions.push(0);

                            // top vertex for the first end cap
                            normals.push(0);
                            normals.push(0);
                            normals.push(-1);
                            uv.push(u);
                            uv.push(v);
                            positions.push(innerRadius * semiMajorAxis);
                            positions.push(ytop);
                            positions.push(0);

                            // bottom vertex for the second end cap
                            normals.push(-z);
                            normals.push(0);
                            normals.push(x);
                            uv.push(u);
                            uv.push(v);
                            positions.push(innerRadius * x);
                            positions.push(ybot);
                            positions.push(innerRadius * z);

                            // top vertex for the second end cap
                            normals.push(-z);
                            normals.push(0);
                            normals.push(x);
                            uv.push(u);
                            uv.push(v);
                            positions.push(innerRadius * x);
                            positions.push(ytop);
                            positions.push(innerRadius * z);
                        } else {

                            //
                            // Disk without a hole.
                            // End cap vertices at the center of the disk.
                            //

                            // bottom vertex for the first end cap
                            normals.push(0);
                            normals.push(0);
                            normals.push(-1);
                            uv.push(u);
                            uv.push(v);
                            positions.push(0);
                            positions.push(ybot);
                            positions.push(0);

                            // top vertex for the first end cap
                            normals.push(0);
                            normals.push(0);
                            normals.push(-1);
                            uv.push(u);
                            uv.push(v);
                            positions.push(0);
                            positions.push(ytop);
                            positions.push(0);

                            // bottom vertex for the second end cap
                            normals.push(-z);
                            normals.push(0);
                            normals.push(x);
                            uv.push(u);
                            uv.push(v);
                            positions.push(0);
                            positions.push(ybot);
                            positions.push(0);

                            // top vertex for the second end cap
                            normals.push(-z);
                            normals.push(0);
                            normals.push(x);
                            uv.push(u);
                            uv.push(v);
                            positions.push(0);
                            positions.push(ytop);
                            positions.push(0);
                        }

                        break;
                    }
                }

                var indices = [];

                //
                // Create indices pointing to vertices for the top, bottom
                // and optional endcaps for the disk
                //

                if (innerRadius > 0) {
                    //
                    // Creating a disk with a hole in the middle ...
                    // Each ring sengment rquires a quad surface on the top and bottom
                    // so create two triangles for the top and two for the bottom.
                    //
                    var index;
                    for (var ringNum = 0; ringNum < rings; ringNum++) {
                        if (ringNum + 1 > ringLimit) {

                            //
                            // We aren't sweeping the whole way around so also create triangles to cap the ends.
                            //

                            index = (ringNum + 1) * 8;    // the first vertex after the regular vertices

                            // start cap
                            indices.push(index);
                            indices.push(index + 4);
                            indices.push(index + 5);

                            indices.push(index);
                            indices.push(index + 5);
                            indices.push(index + 1);

                            // end cap
                            indices.push(index + 2);
                            indices.push(index + 7);
                            indices.push(index + 6);

                            indices.push(index + 2);
                            indices.push(index + 3);
                            indices.push(index + 7);

                            break;
                        }

                        index = ringNum * 8;

                        // outer ring segment quad
                        indices.push(index + 1);
                        indices.push(index + 3);
                        indices.push(index + 11);

                        indices.push(index + 1);
                        indices.push(index + 11);
                        indices.push(index + 9);

                        // inner ring segment quad
                        indices.push(index + 5);
                        indices.push(index + 7);
                        indices.push(index + 15);

                        indices.push(index + 5);
                        indices.push(index + 15);
                        indices.push(index + 13);

                        // bottom disk segment
                        indices.push(index);
                        indices.push(index + 8);
                        indices.push(index + 12);

                        indices.push(index + 0);
                        indices.push(index + 12);
                        indices.push(index + 4);

                        // top disk segment
                        indices.push(index + 2);
                        indices.push(index + 6);
                        indices.push(index + 14);

                        indices.push(index + 2);
                        indices.push(index + 14);
                        indices.push(index + 10);
                    }

                } else {
                    //
                    // Create a solid disk without a hole in the middle.
                    //

                    for (var ringNum = 0; ringNum < rings; ringNum++) {

                        if (ringNum + 1 > ringLimit) {
                            index = 2 + (ringNum + 1) * 4;    // the first after the regular vertices

                            // start cap
                            indices.push(index);
                            indices.push(index + 4);
                            indices.push(index + 5);

                            indices.push(index + 0);
                            indices.push(index + 5);
                            indices.push(index + 1);

                            // end cap
                            indices.push(index + 2);
                            indices.push(index + 7);
                            indices.push(index + 6);

                            indices.push(index + 2);
                            indices.push(index + 3);
                            indices.push(index + 7);

                            break;
                        }

                        //
                        //  generate the two outer-facing triangles for each ring segment
                        //

                        var index = ringNum * 4 + 2;

                        // outer ring segment quad
                        indices.push(index + 1);
                        indices.push(index + 3);
                        indices.push(index + 7);

                        indices.push(index + 1);
                        indices.push(index + 7);
                        indices.push(index + 5);

                        // bottom disk segment
                        indices.push(index);
                        indices.push(0);
                        indices.push(index + 4);

                        // top disk segment
                        indices.push(index + 2);
                        indices.push(1);
                        indices.push(index + 6);
                    }
                }

                return {
                    primitive : "triangles",
                    positions : positions,
                    normals: normals,
                    uv : uv,
                    indices : indices
                };
            }
        });
    };

})();
/** Backend module that creates vector geometry repreentations of text
 *  @private
 */
var SceneJS_vectorTextModule = new (function() {

    var letters = {
        ' ': { width: 16, points: [] },
        '!': { width: 10, points: [
            [5,21],
            [5,7],
            [-1,-1],
            [5,2],
            [4,1],
            [5,0],
            [6,1],
            [5,2]
        ] },
        '"': { width: 16, points: [
            [4,21],
            [4,14],
            [-1,-1],
            [12,21],
            [12,14]
        ] },
        '#': { width: 21, points: [
            [11,25],
            [4,-7],
            [-1,-1],
            [17,25],
            [10,-7],
            [-1,-1],
            [4,12],
            [18,12],
            [-1,-1],
            [3,6],
            [17,6]
        ] },
        '$': { width: 20, points: [
            [8,25],
            [8,-4],
            [-1,-1],
            [12,25],
            [12,-4],
            [-1,-1],
            [17,18],
            [15,20],
            [12,21],
            [8,21],
            [5,20],
            [3,18],
            [3,16],
            [4,14],
            [5,13],
            [7,12],
            [13,10],
            [15,9],
            [16,8],
            [17,6],
            [17,3],
            [15,1],
            [12,0],
            [8,0],
            [5,1],
            [3,3]
        ] },
        '%': { width: 24, points: [
            [21,21],
            [3,0],
            [-1,-1],
            [8,21],
            [10,19],
            [10,17],
            [9,15],
            [7,14],
            [5,14],
            [3,16],
            [3,18],
            [4,20],
            [6,21],
            [8,21],
            [10,20],
            [13,19],
            [16,19],
            [19,20],
            [21,21],
            [-1,-1],
            [17,7],
            [15,6],
            [14,4],
            [14,2],
            [16,0],
            [18,0],
            [20,1],
            [21,3],
            [21,5],
            [19,7],
            [17,7]
        ] },
        '&': { width: 26, points: [
            [23,12],
            [23,13],
            [22,14],
            [21,14],
            [20,13],
            [19,11],
            [17,6],
            [15,3],
            [13,1],
            [11,0],
            [7,0],
            [5,1],
            [4,2],
            [3,4],
            [3,6],
            [4,8],
            [5,9],
            [12,13],
            [13,14],
            [14,16],
            [14,18],
            [13,20],
            [11,21],
            [9,20],
            [8,18],
            [8,16],
            [9,13],
            [11,10],
            [16,3],
            [18,1],
            [20,0],
            [22,0],
            [23,1],
            [23,2]
        ] },
        '\'': { width: 10, points: [
            [5,19],
            [4,20],
            [5,21],
            [6,20],
            [6,18],
            [5,16],
            [4,15]
        ] },
        '(': { width: 14, points: [
            [11,25],
            [9,23],
            [7,20],
            [5,16],
            [4,11],
            [4,7],
            [5,2],
            [7,-2],
            [9,-5],
            [11,-7]
        ] },
        ')': { width: 14, points: [
            [3,25],
            [5,23],
            [7,20],
            [9,16],
            [10,11],
            [10,7],
            [9,2],
            [7,-2],
            [5,-5],
            [3,-7]
        ] },
        '*': { width: 16, points: [
            [8,21],
            [8,9],
            [-1,-1],
            [3,18],
            [13,12],
            [-1,-1],
            [13,18],
            [3,12]
        ] },
        '+': { width: 26, points: [
            [13,18],
            [13,0],
            [-1,-1],
            [4,9],
            [22,9]
        ] },
        ',': { width: 10, points: [
            [6,1],
            [5,0],
            [4,1],
            [5,2],
            [6,1],
            [6,-1],
            [5,-3],
            [4,-4]
        ] },
        '-': { width: 26, points: [
            [4,9],
            [22,9]
        ] },
        '.': { width: 10, points: [
            [5,2],
            [4,1],
            [5,0],
            [6,1],
            [5,2]
        ] },
        '/': { width: 22, points: [
            [20,25],
            [2,-7]
        ] },
        '0': { width: 20, points: [
            [9,21],
            [6,20],
            [4,17],
            [3,12],
            [3,9],
            [4,4],
            [6,1],
            [9,0],
            [11,0],
            [14,1],
            [16,4],
            [17,9],
            [17,12],
            [16,17],
            [14,20],
            [11,21],
            [9,21]
        ] },
        '1': { width: 20, points: [
            [6,17],
            [8,18],
            [11,21],
            [11,0]
        ] },
        '2': { width: 20, points: [
            [4,16],
            [4,17],
            [5,19],
            [6,20],
            [8,21],
            [12,21],
            [14,20],
            [15,19],
            [16,17],
            [16,15],
            [15,13],
            [13,10],
            [3,0],
            [17,0]
        ] },
        '3': { width: 20, points: [
            [5,21],
            [16,21],
            [10,13],
            [13,13],
            [15,12],
            [16,11],
            [17,8],
            [17,6],
            [16,3],
            [14,1],
            [11,0],
            [8,0],
            [5,1],
            [4,2],
            [3,4]
        ] },
        '4': { width: 20, points: [
            [13,21],
            [3,7],
            [18,7],
            [-1,-1],
            [13,21],
            [13,0]
        ] },
        '5': { width: 20, points: [
            [15,21],
            [5,21],
            [4,12],
            [5,13],
            [8,14],
            [11,14],
            [14,13],
            [16,11],
            [17,8],
            [17,6],
            [16,3],
            [14,1],
            [11,0],
            [8,0],
            [5,1],
            [4,2],
            [3,4]
        ] },
        '6': { width: 20, points: [
            [16,18],
            [15,20],
            [12,21],
            [10,21],
            [7,20],
            [5,17],
            [4,12],
            [4,7],
            [5,3],
            [7,1],
            [10,0],
            [11,0],
            [14,1],
            [16,3],
            [17,6],
            [17,7],
            [16,10],
            [14,12],
            [11,13],
            [10,13],
            [7,12],
            [5,10],
            [4,7]
        ] },
        '7': { width: 20, points: [
            [17,21],
            [7,0],
            [-1,-1],
            [3,21],
            [17,21]
        ] },
        '8': { width: 20, points: [
            [8,21],
            [5,20],
            [4,18],
            [4,16],
            [5,14],
            [7,13],
            [11,12],
            [14,11],
            [16,9],
            [17,7],
            [17,4],
            [16,2],
            [15,1],
            [12,0],
            [8,0],
            [5,1],
            [4,2],
            [3,4],
            [3,7],
            [4,9],
            [6,11],
            [9,12],
            [13,13],
            [15,14],
            [16,16],
            [16,18],
            [15,20],
            [12,21],
            [8,21]
        ] },
        '9': { width: 20, points: [
            [16,14],
            [15,11],
            [13,9],
            [10,8],
            [9,8],
            [6,9],
            [4,11],
            [3,14],
            [3,15],
            [4,18],
            [6,20],
            [9,21],
            [10,21],
            [13,20],
            [15,18],
            [16,14],
            [16,9],
            [15,4],
            [13,1],
            [10,0],
            [8,0],
            [5,1],
            [4,3]
        ] },
        ':': { width: 10, points: [
            [5,14],
            [4,13],
            [5,12],
            [6,13],
            [5,14],
            [-1,-1],
            [5,2],
            [4,1],
            [5,0],
            [6,1],
            [5,2]
        ] },
        ';': { width: 10, points: [
            [5,14],
            [4,13],
            [5,12],
            [6,13],
            [5,14],
            [-1,-1],
            [6,1],
            [5,0],
            [4,1],
            [5,2],
            [6,1],
            [6,-1],
            [5,-3],
            [4,-4]
        ] },
        '<': { width: 24, points: [
            [20,18],
            [4,9],
            [20,0]
        ] },
        '=': { width: 26, points: [
            [4,12],
            [22,12],
            [-1,-1],
            [4,6],
            [22,6]
        ] },
        '>': { width: 24, points: [
            [4,18],
            [20,9],
            [4,0]
        ] },
        '?': { width: 18, points: [
            [3,16],
            [3,17],
            [4,19],
            [5,20],
            [7,21],
            [11,21],
            [13,20],
            [14,19],
            [15,17],
            [15,15],
            [14,13],
            [13,12],
            [9,10],
            [9,7],
            [-1,-1],
            [9,2],
            [8,1],
            [9,0],
            [10,1],
            [9,2]
        ] },
        '@': { width: 27, points: [
            [18,13],
            [17,15],
            [15,16],
            [12,16],
            [10,15],
            [9,14],
            [8,11],
            [8,8],
            [9,6],
            [11,5],
            [14,5],
            [16,6],
            [17,8],
            [-1,-1],
            [12,16],
            [10,14],
            [9,11],
            [9,8],
            [10,6],
            [11,5],
            [-1,-1],
            [18,16],
            [17,8],
            [17,6],
            [19,5],
            [21,5],
            [23,7],
            [24,10],
            [24,12],
            [23,15],
            [22,17],
            [20,19],
            [18,20],
            [15,21],
            [12,21],
            [9,20],
            [7,19],
            [5,17],
            [4,15],
            [3,12],
            [3,9],
            [4,6],
            [5,4],
            [7,2],
            [9,1],
            [12,0],
            [15,0],
            [18,1],
            [20,2],
            [21,3],
            [-1,-1],
            [19,16],
            [18,8],
            [18,6],
            [19,5]
        ] },
        'A': { width: 18, points: [
            [9,21],
            [1,0],
            [-1,-1],
            [9,21],
            [17,0],
            [-1,-1],
            [4,7],
            [14,7]
        ] },
        'B': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [13,21],
            [16,20],
            [17,19],
            [18,17],
            [18,15],
            [17,13],
            [16,12],
            [13,11],
            [-1,-1],
            [4,11],
            [13,11],
            [16,10],
            [17,9],
            [18,7],
            [18,4],
            [17,2],
            [16,1],
            [13,0],
            [4,0]
        ] },
        'C': { width: 21, points: [
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5]
        ] },
        'D': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [11,21],
            [14,20],
            [16,18],
            [17,16],
            [18,13],
            [18,8],
            [17,5],
            [16,3],
            [14,1],
            [11,0],
            [4,0]
        ] },
        'E': { width: 19, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [17,21],
            [-1,-1],
            [4,11],
            [12,11],
            [-1,-1],
            [4,0],
            [17,0]
        ] },
        'F': { width: 18, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [17,21],
            [-1,-1],
            [4,11],
            [12,11]
        ] },
        'G': { width: 21, points: [
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5],
            [18,8],
            [-1,-1],
            [13,8],
            [18,8]
        ] },
        'H': { width: 22, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [18,21],
            [18,0],
            [-1,-1],
            [4,11],
            [18,11]
        ] },
        'I': { width: 8, points: [
            [4,21],
            [4,0]
        ] },
        'J': { width: 16, points: [
            [12,21],
            [12,5],
            [11,2],
            [10,1],
            [8,0],
            [6,0],
            [4,1],
            [3,2],
            [2,5],
            [2,7]
        ] },
        'K': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [18,21],
            [4,7],
            [-1,-1],
            [9,12],
            [18,0]
        ] },
        'L': { width: 17, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,0],
            [16,0]
        ] },
        'M': { width: 24, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [12,0],
            [-1,-1],
            [20,21],
            [12,0],
            [-1,-1],
            [20,21],
            [20,0]
        ] },
        'N': { width: 22, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [18,0],
            [-1,-1],
            [18,21],
            [18,0]
        ] },
        'O': { width: 22, points: [
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5],
            [19,8],
            [19,13],
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21]
        ] },
        'P': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [13,21],
            [16,20],
            [17,19],
            [18,17],
            [18,14],
            [17,12],
            [16,11],
            [13,10],
            [4,10]
        ] },
        'Q': { width: 22, points: [
            [9,21],
            [7,20],
            [5,18],
            [4,16],
            [3,13],
            [3,8],
            [4,5],
            [5,3],
            [7,1],
            [9,0],
            [13,0],
            [15,1],
            [17,3],
            [18,5],
            [19,8],
            [19,13],
            [18,16],
            [17,18],
            [15,20],
            [13,21],
            [9,21],
            [-1,-1],
            [12,4],
            [18,-2]
        ] },
        'R': { width: 21, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,21],
            [13,21],
            [16,20],
            [17,19],
            [18,17],
            [18,15],
            [17,13],
            [16,12],
            [13,11],
            [4,11],
            [-1,-1],
            [11,11],
            [18,0]
        ] },
        'S': { width: 20, points: [
            [17,18],
            [15,20],
            [12,21],
            [8,21],
            [5,20],
            [3,18],
            [3,16],
            [4,14],
            [5,13],
            [7,12],
            [13,10],
            [15,9],
            [16,8],
            [17,6],
            [17,3],
            [15,1],
            [12,0],
            [8,0],
            [5,1],
            [3,3]
        ] },
        'T': { width: 16, points: [
            [8,21],
            [8,0],
            [-1,-1],
            [1,21],
            [15,21]
        ] },
        'U': { width: 22, points: [
            [4,21],
            [4,6],
            [5,3],
            [7,1],
            [10,0],
            [12,0],
            [15,1],
            [17,3],
            [18,6],
            [18,21]
        ] },
        'V': { width: 18, points: [
            [1,21],
            [9,0],
            [-1,-1],
            [17,21],
            [9,0]
        ] },
        'W': { width: 24, points: [
            [2,21],
            [7,0],
            [-1,-1],
            [12,21],
            [7,0],
            [-1,-1],
            [12,21],
            [17,0],
            [-1,-1],
            [22,21],
            [17,0]
        ] },
        'X': { width: 20, points: [
            [3,21],
            [17,0],
            [-1,-1],
            [17,21],
            [3,0]
        ] },
        'Y': { width: 18, points: [
            [1,21],
            [9,11],
            [9,0],
            [-1,-1],
            [17,21],
            [9,11]
        ] },
        'Z': { width: 20, points: [
            [17,21],
            [3,0],
            [-1,-1],
            [3,21],
            [17,21],
            [-1,-1],
            [3,0],
            [17,0]
        ] },
        '[': { width: 14, points: [
            [4,25],
            [4,-7],
            [-1,-1],
            [5,25],
            [5,-7],
            [-1,-1],
            [4,25],
            [11,25],
            [-1,-1],
            [4,-7],
            [11,-7]
        ] },
        '\\': { width: 14, points: [
            [0,21],
            [14,-3]
        ] },
        ']': { width: 14, points: [
            [9,25],
            [9,-7],
            [-1,-1],
            [10,25],
            [10,-7],
            [-1,-1],
            [3,25],
            [10,25],
            [-1,-1],
            [3,-7],
            [10,-7]
        ] },
        '^': { width: 16, points: [
            [6,15],
            [8,18],
            [10,15],
            [-1,-1],
            [3,12],
            [8,17],
            [13,12],
            [-1,-1],
            [8,17],
            [8,0]
        ] },
        '_': { width: 16, points: [
            [0,-2],
            [16,-2]
        ] },
        '`': { width: 10, points: [
            [6,21],
            [5,20],
            [4,18],
            [4,16],
            [5,15],
            [6,16],
            [5,17]
        ] },
        'a': { width: 19, points: [
            [15,14],
            [15,0],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'b': { width: 19, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,11],
            [6,13],
            [8,14],
            [11,14],
            [13,13],
            [15,11],
            [16,8],
            [16,6],
            [15,3],
            [13,1],
            [11,0],
            [8,0],
            [6,1],
            [4,3]
        ] },
        'c': { width: 18, points: [
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'd': { width: 19, points: [
            [15,21],
            [15,0],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'e': { width: 18, points: [
            [3,8],
            [15,8],
            [15,10],
            [14,12],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'f': { width: 12, points: [
            [10,21],
            [8,21],
            [6,20],
            [5,17],
            [5,0],
            [-1,-1],
            [2,14],
            [9,14]
        ] },
        'g': { width: 19, points: [
            [15,14],
            [15,-2],
            [14,-5],
            [13,-6],
            [11,-7],
            [8,-7],
            [6,-6],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'h': { width: 19, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [4,10],
            [7,13],
            [9,14],
            [12,14],
            [14,13],
            [15,10],
            [15,0]
        ] },
        'i': { width: 8, points: [
            [3,21],
            [4,20],
            [5,21],
            [4,22],
            [3,21],
            [-1,-1],
            [4,14],
            [4,0]
        ] },
        'j': { width: 10, points: [
            [5,21],
            [6,20],
            [7,21],
            [6,22],
            [5,21],
            [-1,-1],
            [6,14],
            [6,-3],
            [5,-6],
            [3,-7],
            [1,-7]
        ] },
        'k': { width: 17, points: [
            [4,21],
            [4,0],
            [-1,-1],
            [14,14],
            [4,4],
            [-1,-1],
            [8,8],
            [15,0]
        ] },
        'l': { width: 8, points: [
            [4,21],
            [4,0]
        ] },
        'm': { width: 30, points: [
            [4,14],
            [4,0],
            [-1,-1],
            [4,10],
            [7,13],
            [9,14],
            [12,14],
            [14,13],
            [15,10],
            [15,0],
            [-1,-1],
            [15,10],
            [18,13],
            [20,14],
            [23,14],
            [25,13],
            [26,10],
            [26,0]
        ] },
        'n': { width: 19, points: [
            [4,14],
            [4,0],
            [-1,-1],
            [4,10],
            [7,13],
            [9,14],
            [12,14],
            [14,13],
            [15,10],
            [15,0]
        ] },
        'o': { width: 19, points: [
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3],
            [16,6],
            [16,8],
            [15,11],
            [13,13],
            [11,14],
            [8,14]
        ] },
        'p': { width: 19, points: [
            [4,14],
            [4,-7],
            [-1,-1],
            [4,11],
            [6,13],
            [8,14],
            [11,14],
            [13,13],
            [15,11],
            [16,8],
            [16,6],
            [15,3],
            [13,1],
            [11,0],
            [8,0],
            [6,1],
            [4,3]
        ] },
        'q': { width: 19, points: [
            [15,14],
            [15,-7],
            [-1,-1],
            [15,11],
            [13,13],
            [11,14],
            [8,14],
            [6,13],
            [4,11],
            [3,8],
            [3,6],
            [4,3],
            [6,1],
            [8,0],
            [11,0],
            [13,1],
            [15,3]
        ] },
        'r': { width: 13, points: [
            [4,14],
            [4,0],
            [-1,-1],
            [4,8],
            [5,11],
            [7,13],
            [9,14],
            [12,14]
        ] },
        's': { width: 17, points: [
            [14,11],
            [13,13],
            [10,14],
            [7,14],
            [4,13],
            [3,11],
            [4,9],
            [6,8],
            [11,7],
            [13,6],
            [14,4],
            [14,3],
            [13,1],
            [10,0],
            [7,0],
            [4,1],
            [3,3]
        ] },
        't': { width: 12, points: [
            [5,21],
            [5,4],
            [6,1],
            [8,0],
            [10,0],
            [-1,-1],
            [2,14],
            [9,14]
        ] },
        'u': { width: 19, points: [
            [4,14],
            [4,4],
            [5,1],
            [7,0],
            [10,0],
            [12,1],
            [15,4],
            [-1,-1],
            [15,14],
            [15,0]
        ] },
        'v': { width: 16, points: [
            [2,14],
            [8,0],
            [-1,-1],
            [14,14],
            [8,0]
        ] },
        'w': { width: 22, points: [
            [3,14],
            [7,0],
            [-1,-1],
            [11,14],
            [7,0],
            [-1,-1],
            [11,14],
            [15,0],
            [-1,-1],
            [19,14],
            [15,0]
        ] },
        'x': { width: 17, points: [
            [3,14],
            [14,0],
            [-1,-1],
            [14,14],
            [3,0]
        ] },
        'y': { width: 16, points: [
            [2,14],
            [8,0],
            [-1,-1],
            [14,14],
            [8,0],
            [6,-4],
            [4,-6],
            [2,-7],
            [1,-7]
        ] },
        'z': { width: 17, points: [
            [14,14],
            [3,0],
            [-1,-1],
            [3,14],
            [14,14],
            [-1,-1],
            [3,0],
            [14,0]
        ] },
        '{': { width: 14, points: [
            [9,25],
            [7,24],
            [6,23],
            [5,21],
            [5,19],
            [6,17],
            [7,16],
            [8,14],
            [8,12],
            [6,10],
            [-1,-1],
            [7,24],
            [6,22],
            [6,20],
            [7,18],
            [8,17],
            [9,15],
            [9,13],
            [8,11],
            [4,9],
            [8,7],
            [9,5],
            [9,3],
            [8,1],
            [7,0],
            [6,-2],
            [6,-4],
            [7,-6],
            [-1,-1],
            [6,8],
            [8,6],
            [8,4],
            [7,2],
            [6,1],
            [5,-1],
            [5,-3],
            [6,-5],
            [7,-6],
            [9,-7]
        ] },
        '|': { width: 8, points: [
            [4,25],
            [4,-7]
        ] },
        '}': { width: 14, points: [
            [5,25],
            [7,24],
            [8,23],
            [9,21],
            [9,19],
            [8,17],
            [7,16],
            [6,14],
            [6,12],
            [8,10],
            [-1,-1],
            [7,24],
            [8,22],
            [8,20],
            [7,18],
            [6,17],
            [5,15],
            [5,13],
            [6,11],
            [10,9],
            [6,7],
            [5,5],
            [5,3],
            [6,1],
            [7,0],
            [8,-2],
            [8,-4],
            [7,-6],
            [-1,-1],
            [8,8],
            [6,6],
            [6,4],
            [7,2],
            [8,1],
            [9,-1],
            [9,-3],
            [8,-5],
            [7,-6],
            [5,-7]
        ] },
        '~': { width: 24, points: [
            [3,6],
            [3,8],
            [4,11],
            [6,12],
            [8,12],
            [10,11],
            [14,8],
            [16,7],
            [18,7],
            [20,8],
            [21,10],
            [-1,-1],
            [3,8],
            [4,10],
            [6,11],
            [8,11],
            [10,10],
            [14,7],
            [16,6],
            [18,6],
            [20,7],
            [21,10],
            [21,12]
        ] }
    };

    // @private
    function letter(ch) {
        return letters[ch];
    }

    // @private
    function ascent(font, size) {
        return size;
    }

    // @private
    function descent(font, size) {
        return 7.0 * size / 25.0;
    }

    // @private
    function measure(font, size, str)
    {
        var total = 0;
        var len = str.length;

        for (var i = 0; i < len; i++) {
            var c = letter(str.charAt(i));
            if (c) total += c.width * size / 25.0;
        }
        return total;
    }

    // @private
    this.getGeometry = function(size, xPos, yPos, text) {
        var geo = {
            positions : [],
            indices : []
        };

        var lines = text.split("\n");
        var countVerts = 0;
        var y = yPos;

        for (var iLine = 0; iLine < lines.length; iLine++) {
            var x = xPos;

            var str = lines[iLine];

            var len = str.length;
            var mag = size / 25.0;

            for (var i = 0; i < len; i++) {
                var c = letter(str.charAt(i));
                if (c == '\n') {
                    alert("newline");
                }
                if (!c) {
                    continue;
                }

                var penUp = 1;

                var p1 = -1;
                var p2 = -1;

                var needLine = false;
                for (var j = 0; j < c.points.length; j++) {
                    var a = c.points[j];

                    if (a[0] == -1 && a[1] == -1) {
                        penUp = 1;
                        needLine = false;
                        continue;
                    }

                    geo.positions.push(x + a[0] * mag);
                    geo.positions.push(y + a[1] * mag);
                    geo.positions.push(0);


                    if (p1 == -1) {
                        p1 = countVerts;
                    } else if (p2 == -1) {
                        p2 = countVerts;
                    } else {
                        p1 = p2;
                        p2 = countVerts;
                    }
                    countVerts++;

                    if (penUp) {
                        penUp = false;
                    } else {

                        geo.indices.push(p1);
                        geo.indices.push(p2);


                    }
                    needLine = true;
                }
                x += c.width * mag;

            }
            y += 25 * mag;
        }
        return geo;
    };

})();
/** Backend module that creates bitmapp text textures
 *  @private
 */
var SceneJS_bitmapTextModule = new (function() {


    SceneJS_eventModule.addListener(
            SceneJS_eventModule.INIT,
            function() {

            });

    function getHMTLColor(color) {
        if (color.length != 4) {
            return color;
        }
        for (var i = 0; i < color.length; i++) {
            color[i] *= 255;
        }
        return 'rgba(' + color.join(',') + ')';
    }

    this.createText = function(font, size, text) {
        var canvas = document.createElement("canvas");
        var cx = canvas.getContext('2d');

        cx.font = size + "px " + font;

        var width = cx.measureText(text).width;
        canvas.width = width;
        canvas.height = size;

        cx.font = size + "px " + font;
        cx.textBaseline = "middle";
        cx.fillStyle = getHMTLColor([.5, 10, 30, .5]);
        cx.fillStyle = "#FFFF00";


        var x = 0;
        var y = (size / 2);
        cx.fillText(text, x, y);
     
        return {
            image: canvas,
            width: canvas.width,
            height: canvas.height
        };
    };
})();
SceneJS.Text = SceneJS.createNodeType("text");

// @private
SceneJS.Text.prototype._init = function(params) {
    var mode = params.mode || "bitmap";
    if (mode != "vector" && mode != "bitmap") {
        throw SceneJS_errorModule.fatalError(
                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                "SceneJS.Text unsupported mode - should be 'vector' or 'bitmap'");
    }
    this._mode = mode;
    if (this._mode == "bitmap") {
        var text = SceneJS_bitmapTextModule.createText("Helvetica", params.size || 1, params.text || "");

        var w = text.width / 16;
        var h = text.height / 16;

        var positions = [ w, h, 0.01, 0, h, 0.1, 0,0, 0.1, w,0, 0.01 ];
        var normals = [ 0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1 ];
        var uv = [1, 1,  0, 1,  0, 0, 1, 0];
        var indices = [0, 1, 2,  0, 2, 3];

        if (params.doubleSided) {
            var z = 0.01;
            positions = positions.concat([w,0,-z, 0,0,-z, 0, h,-z, w, h,-z]);
            normals = normals.concat([0, 0,1, 0, 0,1, 0, 0,1,  0, 0,1]);
            uv = uv.concat([0, 0, 1, 0, 1, 1, 0, 1]);
            indices = indices.concat([4,5,6, 4,6,7]);
        }

        this.addNode({
            type: "texture",
            layers: [
                {
                    image: text.image,
                    minFilter: "linear",
                    magFilter: "linear",
                    wrapS: "repeat",
                    wrapT: "repeat",
                    isDepth: false,
                    depthMode:"luminance",
                    depthCompareMode: "compareRToTexture",
                    depthCompareFunc: "lequal",
                    flipY: false,
                    width: 1,
                    height: 1,
                    internalFormat:"lequal",
                    sourceFormat:"alpha",
                    sourceType: "unsignedByte",
                    applyTo:"baseColor",
                    blendMode:"add"
                }
            ],

            nodes: [
                {
                    type: "material",
                    emit: 1,
                    baseColor:      { r: 1.0, g: 0.0, b: 0.0 },
                    specularColor:  { r: 0.9, g: 0.9, b: 0.9 },
                    specular:       0.9,
                    shine:          100.0,
                    nodes: [
                        {
                            type: "geometry",
                            primitive: "triangles",
                            positions : positions,
                            normals : normals,
                            uv : uv,
                            indices : indices
                        }
                    ]
                }
            ]
        });
    } else {
        var self = this;
        this.addNode({
            type: "geometry",
            create: function() {
                var geo = SceneJS_vectorTextModule.getGeometry(3, 0, 0, params.text); // Unit size
                return {
                    resource: self.attr.id, // Assuming text geometry varies a lot - don't try to share VBOs
                    primitive : "lines",
                    positions : geo.positions,
                    normals: [],
                    uv : [],
                    indices : geo.indices,
                    colors:[]
                };
            }
        });
    }
};

SceneJS.Text.prototype._compile = function() {
    if (this._mode == "bitmap") {
        this._compileNodes();
    }
};
/**
 * Backend that manages the current modelling transform matrices (modelling and normal).
 *
 * Services the scene modelling transform nodes, such as SceneJS.rotate, providing them with methods to set and
 * get the current modelling transform matrices.
 *
 * Interacts with the shading backend through events; on a SCENE_RENDERING event it will respond with a
 * MODEL_TRANSFORM_EXPORTED to pass the modelling matrix and inverse normal matrix as Float32Arrays to the
 * shading backend.
 *
 * Normal matrix and Float32Arrays are lazy-computed and cached on export to avoid repeatedly regenerating them.
 *
 * Avoids redundant export of the matrices with a dirty flag; they are only exported when that is set, which occurs
 * when transform is set by scene node, or on SCENE_COMPILING, SHADER_ACTIVATED and SHADER_DEACTIVATED events.
 *
 * Whenever a scene node sets the matrix, this backend publishes it with a MODEL_TRANSFORM_UPDATED to allow other
 * dependent backends to synchronise their resources.
 *
 *  @private
 */
var SceneJS_modelTransformModule = new (function() {

    var DEFAULT_TRANSFORM = {
        matrix : SceneJS_math_identityMat4(),
        fixed: true,
        identity : true
    };

    var idStack = [];
    var transformStack = [];
    var stackLen = 0;

    var nodeId;
    this.transform = DEFAULT_TRANSFORM;

    var dirty;

    var self = this;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                nodeId = null;
                self.transform = DEFAULT_TRANSFORM;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function (params) {
                if (dirty) {
                    if (stackLen > 0) {
                        var t = self.transform;
                        if (!t.matrixAsArray) {
                            t.matrixAsArray = new Float32Array(t.matrix);
                            t.normalMatrixAsArray = new Float32Array(
                                    SceneJS_math_transposeMat4(
                                            SceneJS_math_inverseMat4(t.matrix, SceneJS_math_mat4())));
                        } else {
                            t.matrixAsArray.set(t.matrix);
                            t.normalMatrixAsArray.set(
                                    SceneJS_math_transposeMat4(
                                            SceneJS_math_inverseMat4(t.matrix, SceneJS_math_mat4())));
                        }
                        SceneJS_DrawList.setModelTransform(nodeId, t.matrixAsArray, t.normalMatrixAsArray);
                    } else {
                        SceneJS_DrawList.setModelTransform();
                    }
                    dirty = false;
                }
            });

    this.pushTransform = function(id, t) {
        idStack[stackLen] = id;
        transformStack[stackLen] = t;
        stackLen++;
        nodeId = id;
        this.transform = t;
        dirty = true;
    };

    this.popTransform = function() {
        stackLen--;
        if (stackLen > 0) {
            nodeId = idStack[stackLen - 1];
            this.transform = transformStack[stackLen - 1];            
        } else {
            nodeId = null;
            this.transform = DEFAULT_TRANSFORM;
        }
        dirty = true;
    };

})();
(function () {
    var Rotate = SceneJS.createNodeType("rotate");

    Rotate.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setMultOrder(params.multOrder);
            this.setAngle(params.angle);
            this.setXYZ({x : params.x, y: params.y, z: params.z });
        }
        this._mat = null;
        this._xf = {};
    };

    Rotate.prototype.setMultOrder = function(multOrder) {
        multOrder = multOrder || "post";
        if (multOrder != "post" && multOrder != "pre") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Illegal rotate multOrder - '" + multOrder + "' should be 'pre' or 'post'");
        }
        this.core.multOrder = multOrder;
        this._postMult = (multOrder == "post");
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.setAngle = function(angle) {
        this.core.angle = angle || 0;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.getAngle = function() {
        return this.core.angle;
    };

    Rotate.prototype.setXYZ = function(xyz) {
        xyz = xyz || {};
        this.core.x = xyz.x || 0;
        this.core.y = xyz.y || 0;
        this.core.z = xyz.z || 0;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.getXYZ = function() {
        return {
            x: this.core.x,
            y: this.core.y,
            z: this.core.z
        };
    };

    Rotate.prototype.setX = function(x) {
        this.core.x = x;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.getX = function() {
        return this.core.x;
    };

    Rotate.prototype.setY = function(y) {
        this.core.y = y;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.getY = function() {
        return this.core.y;
    };

    Rotate.prototype.setZ = function(z) {
        this.core.z = z;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.getZ = function() {
        return this.core.z;
    };

    Rotate.prototype.incX = function(x) {
        this.core.x += x;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.incY = function(y) {
        this.core.y += y;
    };

    Rotate.prototype.incZ = function(z) {
        this.core.z += z;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.incAngle = function(angle) {
        this.core.angle += angle;
        this._compileMemoLevel = 0;
    };

    Rotate.prototype.getMatrix = function() {
        return (this._compileMemoLevel > 0)
                ? this._mat.slice(0)
                : SceneJS_math_rotationMat4v(this.core.angle * Math.PI / 180.0, [this.core.x, this.core.y, this.core.z]);
    };

    Rotate.prototype.getAttributes = function() {
        return {
            x: this.core.x,
            y: this.core.y,
            z: this.core.z,
            angle : this.core.angle
        };
    };

    Rotate.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Rotate.prototype._preCompile = function() {
        var origMemoLevel = this._compileMemoLevel;
        if (this._compileMemoLevel == 0) {
            this._compileMemoLevel = 1;
            if (this.core.x != 0 || this.core.y != 0 || this.core.z != 0) {

                /* When building a view transform, apply the negated rotation angle
                 * to correctly transform the SceneJS.Camera
                 */
                var angle = this.core.angle;
                this._mat = SceneJS_math_rotationMat4v(angle * Math.PI / 180.0, [this.core.x, this.core.y, this.core.z]);
            } else {
                this._mat = SceneJS_math_identityMat4();
            }
        }
        var superXForm = SceneJS_modelTransformModule.transform;
        if (origMemoLevel < 2 || (!superXForm.fixed)) {
            var tempMat = SceneJS_math_mat4();

            if (this._postMult) {
                SceneJS_math_mulMat4(superXForm.matrix, this._mat, tempMat);
            } else {
                SceneJS_math_mulMat4(this._mat, superXForm.matrix, tempMat);
            }

            this._xf.localMatrix = this._mat;
            this._xf.matrix = tempMat;
            this._xf.fixed = origMemoLevel == 2;

            if (this._compileMemoLevel == 1 && superXForm.fixed) {   // Bump up memoization level if model-space fixed
                this._compileMemoLevel = 2;
            }
        }
        SceneJS_modelTransformModule.pushTransform(this.attr.id, this._xf);
    };

    Rotate.prototype._postCompile = function() {
        SceneJS_modelTransformModule.popTransform();
    };

})();


(function () {

    var Translate = SceneJS.createNodeType("translate");

    Translate.prototype._init = function(params) {
        this._mat = null;
        this._xf = {};
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setMultOrder(params.multOrder);
            this.setXyz({x : params.x, y: params.y, z: params.z });
        }
    };

    Translate.prototype.setMultOrder = function(multOrder) {
        multOrder = multOrder || "post";
        if (multOrder != "post" && multOrder != "pre") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Illegal translate multOrder - '" + multOrder + "' should be 'pre' or 'post'");
        }
        this.core.multOrder = multOrder;
        this._postMult = (multOrder == "post");
        this._compileMemoLevel = 0;
    };

    Translate.prototype.setXyz = function(xyz) {
        xyz = xyz || {};
        var x = xyz.x || 0;
        var y = xyz.y || 0;
        var z = xyz.z || 0;
        this.core.x = x;
        this.core.y = y;
        this.core.z = z;
        this._compileMemoLevel = 0;
    };

    Translate.prototype.getXyz = function() {
        return {
            x: this.core.x,
            y: this.core.y,
            z: this.core.z
        };
    };

    Translate.prototype.setX = function(x) {
        this.core.x = x;
        this._compileMemoLevel = 0;
    };

    Translate.prototype.getX = function() {
        return this.core.x;
    };

    Translate.prototype.setY = function(y) {
        this.core.y = y;
        this._compileMemoLevel = 0;
    };

    Translate.prototype.getY = function() {
        return this.core.y;
    };

    Translate.prototype.setZ = function(z) {
        this.core.z = z;
        this._compileMemoLevel = 0;
    };

    Translate.prototype.getZ = function() {
        return this.core.z;
    };

    Translate.prototype.incX = function(x) {
        this.core.x += x;
        this._compileMemoLevel = 0;
    };

    Translate.prototype.incY = function(y) {
        this.core.y += y;
    };

    Translate.prototype.incZ = function(z) {
        this.core.z += z;
        this._compileMemoLevel = 0;
    };

    Translate.prototype.getMatrix = function() {
        return (this._compileMemoLevel > 0) ? this._mat.slice(0) : SceneJS_math_translationMat4v([this.core.x, this.core.y, this.core.z]);
    };

    Translate.prototype.getAttributes = function() {
        return {
            x: this.core.x,
            y: this.core.y,
            z: this.core.z
        };
    };

    Translate.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Translate.prototype._preCompile = function() {
        var origMemoLevel = this._compileMemoLevel;
        if (this._compileMemoLevel == 0) {
            this._mat = SceneJS_math_translationMat4v([this.core.x, this.core.y, this.core.z]);
            this._compileMemoLevel = 1;
        }
        var superXForm = SceneJS_modelTransformModule.transform;
        if (origMemoLevel < 2 || (!superXForm.fixed)) {

            var tempMat = SceneJS_math_mat4();

            if (this._postMult) {
                SceneJS_math_mulMat4(superXForm.matrix, this._mat, tempMat);
            } else {
                SceneJS_math_mulMat4(this._mat, superXForm.matrix, tempMat);
            }

            this._xf.localMatrix = this._mat;
            this._xf.matrix = tempMat;
            this._xf.fixed = origMemoLevel == 2;

            if (this._compileMemoLevel == 1 && superXForm.fixed) {
                this._compileMemoLevel = 2;
            }
        }
        SceneJS_modelTransformModule.pushTransform(this.attr.id, this._xf);
    };

    Translate.prototype._postCompile = function() {
        SceneJS_modelTransformModule.popTransform();
    };

})();
(function () {

    var Scale = SceneJS.createNodeType("scale");

    Scale.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setMultOrder(params.multOrder);
            this.setXYZ({x : params.x, y: params.y, z: params.z });
        }
        this._mat = null;
        this._xf = {};
    };

    Scale.prototype.setMultOrder = function(multOrder) {
        multOrder = multOrder || "post";
        if (multOrder != "post" && multOrder != "pre") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Illegal scale multOrder - '" + multOrder + "' should be 'pre' or 'post'");
        }
        this.core.multOrder = multOrder;
        this._postMult = (multOrder == "post");
        this._compileMemoLevel = 0;
    };

    Scale.prototype.setXYZ = function(xyz) {
        xyz = xyz || {};
        this.core.x = (xyz.x != undefined) ? xyz.x : 1;
        this.core.y = (xyz.y != undefined) ? xyz.y : 1;
        this.core.z = (xyz.z != undefined) ? xyz.z : 1;
        this._resetCompilationMemos();
        return this;
    };

    Scale.prototype.getXYZ = function() {
        return {
            x: this.core.x,
            y: this.core.y,
            z: this.core.z
        };
    };

    Scale.prototype.setX = function(x) {
        this.core.x = (x != undefined && x != null) ? x : 1.0;
        this._resetCompilationMemos();
        return this;
    };

    Scale.prototype.getX = function() {
        return this.core.x;
    };

    Scale.prototype.setY = function(y) {
        this.core.y = (y != undefined && y != null) ? y : 1.0;
        this._resetCompilationMemos();
        return this;
    };

    Scale.prototype.getY = function() {
        return this.core.y;
    };

    Scale.prototype.setZ = function(z) {
        this.core.z = (z != undefined && z != null) ? z : 1.0;
        this._resetCompilationMemos();
        return this;
    };

    Scale.prototype.getZ = function() {
        return this.core.z;
    };

    Scale.prototype.incX = function(x) {
        this.core.x += x;
        this._compileMemoLevel = 0;
    };

    Scale.prototype.incY = function(y) {
        this.core.y += y;
    };

    Scale.prototype.incZ = function(z) {
        this.core.z += z;
        this._compileMemoLevel = 0;
    };

    Scale.prototype.getMatrix = function() {
        return (this._compileMemoLevel > 0) ? this._mat.slice(0) : SceneJS_math_scalingMat4v([this.core.x, this.core.y, this.core.z]);
    };

    Scale.prototype.getAttributes = function() {
        return {
            x: this.core.x,
            y: this.core.y,
            z: this.core.z
        };
    };

    Scale.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Scale.prototype._preCompile = function() {
        var origMemoLevel = this._compileMemoLevel;
        if (this._compileMemoLevel == 0) {
            this._compileMemoLevel = 1;
            this._mat = SceneJS_math_scalingMat4v([this.core.x, this.core.y, this.core.z]);
        }
        var superXform = SceneJS_modelTransformModule.transform;
        if (origMemoLevel < 2 || (!superXform.fixed)) {
            var tempMat = SceneJS_math_mat4();

            if (this._postMult) {
                SceneJS_math_mulMat4(superXform.matrix, this._mat, tempMat);
            } else {
                SceneJS_math_mulMat4(this._mat, superXform.matrix, tempMat);
            }

            this._xf.localMatrix = this._mat;
            this._xf.matrix = tempMat;
            this._xf.fixed = origMemoLevel == 2;

            if (this._compileMemoLevel == 1 && superXform.fixed) {   // Bump up memoization level if model-space fixed
                this._compileMemoLevel = 2;
            }
        }
        SceneJS_modelTransformModule.pushTransform(this.attr.id, this._xf);
    };

    Scale.prototype._postCompile = function(traversalContext) {
        SceneJS_modelTransformModule.popTransform();
    };

})();
(function() {

    var Matrix = SceneJS.createNodeType("matrix");

    Matrix.prototype._init = function(params) {
        this._xf = {};
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setMultOrder(params.multOrder);
            this.setElements(params.elements);
        }
    };

    Matrix.prototype.setMultOrder = function(multOrder) {
        multOrder = multOrder || "post";
        if (multOrder != "post" && multOrder != "pre") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Illegal matrix multOrder - '" + multOrder + "' should be 'pre' or 'post'");
        }
        this.attr.multOrder = multOrder;
        this._postMult = (multOrder == "post");
        this._compileMemoLevel = 0;
    };

    /**
     * Sets the matrix elements
     * @param {Array} elements One-dimensional array of matrix elements
     * @returns {Matrix} this
     */
    Matrix.prototype.setElements = function(elements) {
        elements = elements || SceneJS_math_identityMat4();
        if (!elements) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Matrix elements undefined");
        }
        if (elements.length != 16) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Matrix elements should number 16");
        }
        if (!this.core.mat) {
            this.core.mat = elements;
        } else {
            for (var i = 0; i < 16; i++) {
                this.core.mat[i] = elements[i];
            }
        }
        this._resetCompilationMemos();
        return this;
    };

    /** Returns the matrix elements
     * @returns {Object} One-dimensional array of matrix elements
     */
    Matrix.prototype.getElements = function() {
        var elements = new Array(16);
        for (var i = 0; i < 16; i++) {
            elements[i] = this.core.mat[i];
        }
        return elements;
    };

    /**
     * Returns a copy of the matrix as a 1D array of 16 elements
     * @returns {Number[16]} The matrix elements
     */
    Matrix.prototype.getMatrix = function() {
        return this.core.mat.slice(0);
    };

    Matrix.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Matrix.prototype._preCompile = function() {
        var origMemoLevel = this._compileMemoLevel;

        if (this._compileMemoLevel == 0) {
            this._compileMemoLevel = 1;
        }
        var superXform = SceneJS_modelTransformModule.transform;
        if (origMemoLevel < 2 || (!superXform.fixed)) {

            /* When building a view transform, apply the inverse of the matrix
             * to correctly transform the SceneJS.Camera
             */
            var tempMat = SceneJS_math_mat4();

            if (this._postMult) {
                SceneJS_math_mulMat4(superXform.matrix, this.core.mat, tempMat);
            } else {
                SceneJS_math_mulMat4(this.core.mat, superXform.matrix, tempMat);
            }

            this._xf.localMatrix = this.core.mat;
            this._xf.matrix = tempMat;
            this._xf.fixed = origMemoLevel == 2;

            if (this._compileMemoLevel == 1 && superXform.fixed) {   // Bump up memoization level if model-space fixed
                this._compileMemoLevel = 2;
            }
        }
        SceneJS_modelTransformModule.pushTransform(this.attr.id, this._xf);
    };

    Matrix.prototype._postCompile = function() {
        SceneJS_modelTransformModule.popTransform();
    };
})();
(function () {

    var Quaternion = SceneJS.createNodeType("quaternion");

    Quaternion.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setMultOrder(params.multOrder);

            this.core.q = SceneJS_math_identityQuaternion();

            if (params.x || params.y || params.x || params.angle || params.w) {
                this.setRotation(params);
            }
            if (params.rotations) {
                for (var i = 0; i < params.rotations.length; i++) {
                    this.addRotation(params.rotations[i]);
                }
            }
        }
        this._mat = null;
        this._xf = {};

    };

    Quaternion.prototype.setMultOrder = function(multOrder) {
        multOrder = multOrder || "post";
        if (multOrder != "post" && multOrder != "pre") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Illegal quaternion multOrder - '" + multOrder + "' should be 'pre' or 'post'");
        }
        this.core.multOrder = multOrder;
        this._postMult = (multOrder == "post");
        this._compileMemoLevel = 0;
    };

    Quaternion.prototype.setRotation = function(q) {
        q = q || {};
        this.core.q = SceneJS_math_angleAxisQuaternion(q.x || 0, q.y || 0, q.z || 0, q.angle || 0);
        this._resetCompilationMemos();
        return this;
    };

    Quaternion.prototype.getRotation = function() {
        return SceneJS_math_angleAxisFromQuaternion(this.core.q);
    };

    Quaternion.prototype.addRotation = function(q) {
        this.core.q = SceneJS_math_mulQuaternions(SceneJS_math_angleAxisQuaternion(q.x || 0, q.y || 0, q.z || 0, q.angle || 0), this.core.q);
        this._resetCompilationMemos();
        return this;
    };

    Quaternion.prototype.getMatrix = function() {
        return (this._compileMemoLevel > 0) ? this._mat.slice(0) : SceneJS_math_newMat4FromQuaternion(this.core.q);
    };

    Quaternion.prototype.normalize = function() {
        this.core.q = SceneJS_math_normalizeQuaternion(this.core.q);
        this._resetCompilationMemos();
        return this;
    };

    Quaternion.prototype.getAttributes = function() {
        return {
            x: this.core.q[0],
            y: this.core.q[1],
            z: this.core.q[2],
            w: this.core.q[3]
        };
    };

    Quaternion.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Quaternion.prototype._preCompile = function() {
        var origMemoLevel = this._compileMemoLevel;
        if (this._compileMemoLevel == 0) {
            this._mat = SceneJS_math_newMat4FromQuaternion(this.core.q);
            this._compileMemoLevel = 1;
        }
        var superXform = SceneJS_modelTransformModule.transform;
        if (origMemoLevel < 2 || (!superXform.fixed)) {
            var tempMat = SceneJS_math_mat4();

            if (this._postMult) {
                SceneJS_math_mulMat4(superXform.matrix, this._mat, tempMat);
            } else {
                SceneJS_math_mulMat4(this._mat, superXform.matrix, tempMat);
            }

            this._xf.localMatrix = this._mat;
            this._xf.matrix = tempMat;
            this._xf.fixed = origMemoLevel == 2;

            if (this._compileMemoLevel == 1 && superXform.fixed) {   // Bump up memoization level if model-space fixed
                this._compileMemoLevel = 2;
            }
        }
        SceneJS_modelTransformModule.pushTransform(this.attr.id, this._xf);
    };

    Quaternion.prototype._postCompile = function() {
        SceneJS_modelTransformModule.popTransform();
    };

})();
var SceneJS_viewTransformModule = new (function() {
    var DEFAULT_TRANSFORM = {
        matrix : SceneJS_math_identityMat4(),
        fixed: true,
        identity : true,
        lookAt:SceneJS_math_LOOKAT_ARRAYS
    };

    var idStack = [];
    var transformStack = [];
    var stackLen = 0;

    var nodeId;
    this.transform = DEFAULT_TRANSFORM;

    var dirty;

    var self = this;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                nodeId = null;
                self.transform = DEFAULT_TRANSFORM;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                loadTransform();
            });


    function loadTransform() {
        if (dirty) {
            if (stackLen > 0) {
                var t = self.transform;
                if (!t.matrixAsArray) {
                    t.matrixAsArray = new Float32Array(t.matrix);
                    t.normalMatrixAsArray = new Float32Array(
                            SceneJS_math_transposeMat4(SceneJS_math_inverseMat4(t.matrix, SceneJS_math_mat4())));
                } else {
                    t.matrixAsArray.set(t.matrix);
                    t.normalMatrixAsArray.set(SceneJS_math_transposeMat4(SceneJS_math_inverseMat4(t.matrix, SceneJS_math_mat4())));
                }
                SceneJS_DrawList.setViewTransform(nodeId, t.matrixAsArray, t.normalMatrixAsArray, t.lookAt);
            } else {
                SceneJS_DrawList.setViewTransform();
            }
            dirty = false;
        }
    }

    this.pushTransform = function(id, t) {
        idStack[stackLen] = id;
        transformStack[stackLen] = t;
        stackLen++;
        nodeId = id;
        this.transform = t;
        dirty = true;
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.VIEW_TRANSFORM_UPDATED, this.transform);
        loadTransform();
    };


    this.popTransform = function() {
        stackLen--;
        if (stackLen > 0) {
            nodeId = idStack[stackLen - 1];
            this.transform = transformStack[stackLen - 1];
        } else {
            nodeId = null;
            this.transform = DEFAULT_TRANSFORM;
        }
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.VIEW_TRANSFORM_UPDATED, this.transform);
        dirty = true;

        /*--------------------------------------------------------------
         * TODO: Vital to reload transform here for some reason.
         *
         * When removed, then there are mysterious cases when only
         * the lights are transformed by the lookAt.
         *------------------------------------------------------------*/
        loadTransform();
    };

})();
(function() {

    var Lookat = SceneJS.createNodeType("lookAt");

    Lookat.prototype._init = function(params) {
        this._mat = null;
        this._xf = {
            type: "lookat"
        };
        if (this.core._nodeCount == 1) { // This node is the resource definer
            if (!params.eye && !params.look && !params.up) {
                this.setEye({x: 0, y: 0, z: 1.0 });
                this.setLook({x: 0, y: 0, z: 0 });
                this.setUp({x: 0, y: 1.0, z: 0 });
            } else {
                this.setEye(params.eye);
                this.setLook(params.look);
                this.setUp(params.up);
            }
        }
    };

    Lookat.prototype.setEye = function(eye) {
        eye = eye || {};
        this.core.eyeX = (eye.x != undefined && eye.x != null) ? eye.x : 0;
        this.core.eyeY = (eye.y != undefined && eye.y != null) ? eye.y : 0;
        this.core.eyeZ = (eye.z != undefined && eye.z != null) ? eye.z : 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setEyeX = function(x) {
        this.core.eyeX = x || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setEyeY = function(y) {
        this.core.eyeY = y || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.incEye = function(eye) {
        eye = eye || {};
        this.core.eyeX += (eye.x != undefined && eye.x != null) ? eye.x : 0;
        this.core.eyeY += (eye.y != undefined && eye.y != null) ? eye.y : 0;
        this.core.eyeZ += (eye.z != undefined && eye.z != null) ? eye.z : 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.incEyeX = function(x) {
        this.core.eyeX += x;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.incEyeY = function(y) {
        this.core.eyeY += y;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.incEyeZ = function(z) {
        this.core.eyeZ += z;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setEyeZ = function(z) {
        this.core.eyeZ = z || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.getEye = function() {
        return {
            x: this.core.eyeX,
            y: this.core.eyeY,
            z: this.core.eyeZ
        };
    };

    Lookat.prototype.setLook = function(look) {
        look = look || {};
        this.core.lookX = (look.x != undefined && look.x != null) ? look.x : 0;
        this.core.lookY = (look.y != undefined && look.y != null) ? look.y : 0;
        this.core.lookZ = (look.z != undefined && look.z != null) ? look.z : 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setLookX = function(x) {
        this.core.lookX = x || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setLookY = function(y) {
        this.core.lookY = y || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setLookZ = function(z) {
        this.core.lookZ = z || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.incLook = function(look) {
        look = look || {};
        this.core.lookX += (look.x != undefined && look.x != null) ? look.x : 0;
        this.core.lookY += (look.y != undefined && look.y != null) ? look.y : 0;
        this.core.lookZ += (look.z != undefined && look.z != null) ? look.z : 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.getLook = function() {
        return {
            x: this.core.lookX,
            y: this.core.lookY,
            z: this.core.lookZ
        };
    };

    Lookat.prototype.setUp = function(up) {
        up = up || { y: 1.0 };
        var x = (up.x != undefined && up.x != null) ? up.x : 0;
        var y = (up.y != undefined && up.y != null) ? up.y : 0;
        var z = (up.z != undefined && up.z != null) ? up.z : 0;
        if (x == 0 && y == 0 && z == 0) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Lookat up vector is zero length - at least one of its x,y and z components must be non-zero");
        }
        this.core.upX = x;
        this.core.upY = y;
        this.core.upZ = z;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setUpX = function(x) {
        this.core.upX = x || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setUpY = function(x) {
        this.core.upY = y || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.setUpZ = function(x) {
        this.core.upZ = z || 0;
        this._compileMemoLevel = 0;
    };

    Lookat.prototype.getUp = function() {
        return {
            x: this.core.upX,
            y: this.core.upY,
            z: this.core.upZ
        };
    };

    Lookat.prototype.incUp = function(up) {
        up = up || {};
        this.core.upX += (up.x != undefined && up.x != null) ? up.x : 0;
        this.core.upY += (up.y != undefined && up.y != null) ? up.y : 0;
        this.core.upZ += (up.z != undefined && up.z != null) ? up.z : 0;
        this._compileMemoLevel = 0;
    };

    /**
     * Returns a copy of the matrix as a 1D array of 16 elements
     * @returns {Number[16]}
     */
    Lookat.prototype.getMatrix = function() {
        return (this._compileMemoLevel > 0)
                ? this._mat.slice(0)
                : SceneJS_math_lookAtMat4c(
                this.core.eyeX, this.core.eyeY, this.core.eyeZ,
                this.core.lookX, this.core.lookY, this.core.lookZ,
                this.core.upX, this.core.upY, this.core.upZ);
    };

    Lookat.prototype.getAttributes = function() {
        return {
            look: {
                x: this.core.lookX,
                y: this.core.lookY,
                z: this.core.lookZ
            },
            eye: {
                x: this.core.eyeX,
                y: this.core.eyeY,
                z: this.core.eyeZ
            },
            up: {
                x: this.core.upX,
                y: this.core.upY,
                z: this.core.upZ
            }
        };
    };

    Lookat.prototype._compile = function() {
        if (this._compileMemoLevel == 0) {
            this._mat = SceneJS_math_lookAtMat4c(
                    this.core.eyeX, this.core.eyeY, this.core.eyeZ,
                    this.core.lookX, this.core.lookY, this.core.lookZ,
                    this.core.upX, this.core.upY, this.core.upZ);
            this._compileMemoLevel = 1;
            this._xf.matrix = this._mat;
            this._xf.lookAt = {
                eye: [this.core.eyeX, this.core.eyeY, this.core.eyeZ ],
                look: [this.core.lookX, this.core.lookY, this.core.lookZ ],
                up:  [this.core.upX, this.core.upY, this.core.upZ ]
            };
        }
        SceneJS_viewTransformModule.pushTransform(this.attr.id, this._xf);

        this._compileNodes();

        SceneJS_viewTransformModule.popTransform();
    };

})();
(function () {

    var Stationary = SceneJS.createNodeType("stationary");

    Stationary.prototype._compile = function() {

        
        var origMemoLevel = this._compileMemoLevel;

        var superXform = SceneJS_viewTransformModule.transform;
        var lookAt = superXform.lookAt;
        if (lookAt) {
            if (this._compileMemoLevel == 0 || (!superXform.fixed)) {
                var tempMat = SceneJS_math_mat4();
                SceneJS_math_mulMat4(superXform.matrix,
                        SceneJS_math_translationMat4v(lookAt.eye), tempMat);
                this._xform = {
                    matrix: tempMat,
                    lookAt: lookAt,
                    fixed: origMemoLevel == 1
                };

                if (superXform.fixed) {
                    this._compileMemoLevel = 1;
                }
           }
            SceneJS_viewTransformModule.pushTransform(this.attr.id, this._xform);
            this._compileNodes();
            SceneJS_viewTransformModule.popTransform();
        } else {
            this._compileNodes();
        }

    };

})();
(function () {

    var Billboard = SceneJS.createNodeType("billboard");

    Billboard.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Billboard.prototype._preCompile = function() {
        // 0. The base variable
        var superViewXForm = SceneJS_viewTransformModule.transform;
        var lookAt = superViewXForm.lookAt;

        var superModelXForm = SceneJS_modelTransformModule.transform;
        var matrix = superModelXForm.matrix.slice(0);

        // 1. Invert the model rotation matrix, which will reset the subnodes rotation
        var rotMatrix = [
            matrix[0], matrix[1], matrix[2],  0,
            matrix[4], matrix[5], matrix[6],  0,
            matrix[8], matrix[9], matrix[10], 0,
            0,         0,         0,          1
        ];
        SceneJS_math_inverseMat4(rotMatrix);
        SceneJS_math_mulMat4(matrix, rotMatrix, matrix);

        // 2. Get the billboard Z vector
        var ZZ = [];
        SceneJS_math_subVec3(lookAt.eye, lookAt.look, ZZ);
        SceneJS_math_normalizeVec3(ZZ);

        // 3. Get the billboard X vector
        var XX = [];
        SceneJS_math_cross3Vec3(lookAt.up, ZZ, XX);
        SceneJS_math_normalizeVec3(XX);

        // 4. Get the billboard Y vector
        var YY = [];
        SceneJS_math_cross3Vec3(ZZ, XX, YY);
        SceneJS_math_normalizeVec3(YY);

        // 5. Multiply those billboard vector to the matrix
        SceneJS_math_mulMat4(matrix, [
            XX[0], XX[1], XX[2], 0,
            YY[0], YY[1], YY[2], 0,
            ZZ[0], ZZ[1], ZZ[2], 0,
            0,     0,     0,     1
        ], matrix);

        // 6. Render
        SceneJS_modelTransformModule.pushTransform(this.attr.id, { matrix: matrix }); // TODO : memoize!
    };

    Billboard.prototype._postCompile = function() {
        SceneJS_modelTransformModule.popTransform();
    };
})();
(function() {

    var idStack = [];
    var transformStack = [];
    var stackLen = 0;

    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setProjectionTransform(idStack[stackLen - 1], transformStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setProjectionTransform();
                    }
                    dirty = false;
                }
            });

    var Camera = SceneJS.createNodeType("camera");

    Camera.prototype._init = function(params) {
        if (this.core._nodeCount == 1) {
            this.setOptics(params.optics); // Can be undefined
        }
    };

    Camera.prototype.setOptics = function(optics) {
        var core = this.core;
        if (!optics) {
            core.optics = {
                type: optics.type,
                left : optics.left || -1.0,
                bottom : optics.bottom || -1.0,
                near : optics.near || 0.1,
                right : optics.right || 1.00,
                top : optics.top || 1.0,
                far : optics.far || 5000.0
            };
        } else {
            if (optics.type == "ortho") {
                core.optics = SceneJS._applyIf(SceneJS_math_ORTHO_OBJ, {
                    type: optics.type,
                    left : optics.left,
                    bottom : optics.bottom,
                    near : optics.near,
                    right : optics.right,
                    top : optics.top,
                    far : optics.far
                });
            } else if (optics.type == "frustum") {
                core.optics = {
                    type: optics.type,
                    left : optics.left || -1.0,
                    bottom : optics.bottom || -1.0,
                    near : optics.near || 0.1,
                    right : optics.right || 1.00,
                    top : optics.top || 1.0,
                    far : optics.far || 5000.0
                };
            } else  if (optics.type == "perspective") {
                core.optics = {
                    type: optics.type,
                    fovy : optics.fovy || 60.0,
                    aspect: optics.aspect || 1.0,
                    near : optics.near || 0.1,
                    far : optics.far || 5000.0
                };
            } else if (!optics.type) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.ILLEGAL_NODE_CONFIG,
                        "Camera configuration invalid: optics type not specified - " +
                        "supported types are 'perspective', 'frustum' and 'ortho'");
            } else {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.ILLEGAL_NODE_CONFIG,
                        "Camera configuration invalid: optics type not supported - " +
                        "supported types are 'perspective', 'frustum' and 'ortho'");
            }
        }
        this._rebuild();
    };

    Camera.prototype._rebuild = function () {
        var optics = this.core.optics;
        if (optics.type == "ortho") {
            this.core.matrix = SceneJS_math_orthoMat4c(
                    optics.left,
                    optics.right,
                    optics.bottom,
                    optics.top,
                    optics.near,
                    optics.far);

        } else if (optics.type == "frustum") {
            this.core.matrix = SceneJS_math_frustumMatrix4(
                    optics.left,
                    optics.right,
                    optics.bottom,
                    optics.top,
                    optics.near,
                    optics.far);

        } else if (optics.type == "perspective") {
            this.core.matrix = SceneJS_math_perspectiveMatrix4(
                    optics.fovy * Math.PI / 180.0,
                    optics.aspect,
                    optics.near,
                    optics.far);
        }
        if (!this.core.matrixAsArray) {
            this.core.matrixAsArray = new Float32Array(this.core.matrix);
        } else {
            this.core.matrixAsArray.set(this.core.matrix);
        }
    };

    Camera.prototype.getOptics = function() {
        var optics = {};
        for (var key in this.core.optics) {
            if (this.core.optics.hasOwnProperty(key)) {
                optics[key] = this.core.optics[key];
            }
        }
        return optics;
    };

    Camera.prototype.getMatrix = function() {
        if (this._compileMemoLevel == 0) {
            this._rebuild();
        }
        return this.core.matrix.slice(0);
    };

    Camera.prototype._compile = function() {
        idStack[stackLen] = this.attr.id;
        transformStack[stackLen] = this.core;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };
})();
(function() {

    var Matrix = SceneJS.createNodeType("xform");

    Matrix.prototype._init = function(params) {
        this._xf = {};
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setElements(params.elements);
        }
    };

    /**
     * Sets the matrix elements
     * @param {Array} elements One-dimensional array of matrix elements
     */
    Matrix.prototype.setElements = function(elements) {
        elements = elements || SceneJS_math_identityMat4();
        if (elements.length != 16) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Matrix elements should number 16");
        }
        var core = this.core;
        if (!core.matrix) {
            core.matrix = elements;
        } else {
            for (var i = 0; i < 16; i++) {
                core.matrix[i] = elements[i];
            }
        }
        if (!core.matrixAsArray) {
            core.matrixAsArray = new Float32Array(elements);
            core.normalMatrixAsArray = new Float32Array(
                    SceneJS_math_transposeMat4(SceneJS_math_inverseMat4(elements, SceneJS_math_mat4())));
        } else {
            core.matrixAsArray.set(elements);
            core.normalMatrixAsArray.set(
                    SceneJS_math_transposeMat4(SceneJS_math_inverseMat4(elements, SceneJS_math_mat4())));
        }
        return this;
    };

    Matrix.prototype._compile = function() {
        SceneJS_modelTransformModule.pushTransform(this.attr.id, this.core);
        this._compileNodes();
        SceneJS_modelTransformModule.popTransform();
    };

})();
new (function() {

    var idStack = [];
    var lightStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setLights(idStack[stackLen - 1], lightStack.slice(0, stackLen));
                    } else { // Full compile supplies it's own default states
                        SceneJS_DrawList.setLights();
                    }
                    dirty = false;
                }
            });

    var Light = SceneJS.createNodeType("light");

    Light.prototype._init = function(params) {
        params = params || {};
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.core.light = {
               viewSpace: !!params.viewSpace
            };
            this.setMode(params.mode);
            this.setColor(params.color);
            this.setDiffuse(params.diffuse);
            this.setSpecular(params.specular);
            this.setPos(params.pos);
            this.setDir(params.dir);
            this.setConstantAttenuation(params.constantAttenuation);
            this.setLinearAttenuation(params.linearAttenuation);
            this.setQuadraticAttenuation(params.quadraticAttenuation);
        }
    };

    Light.prototype.setMode = function(mode) {
        mode = mode || "dir";
        if (mode != "dir" && mode != "point") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Light unsupported mode - should be 'dir' or 'point' or 'ambient'");
        }
        this.core.light.mode = mode;
    };

    Light.prototype.getMode = function() {
        return this.core.light.mode;
    };

    Light.prototype.setColor = function(color) {
        color = color || {};
        this.core.light.color = [
            color.r != undefined ? color.r : 1.0,
            color.g != undefined ? color.g : 1.0,
            color.b != undefined ? color.b : 1.0
        ];
    };

    Light.prototype.getColor = function() {
        return {
            r: this.core.light.color[0],
            g: this.core.light.color[1],
            b: this.core.light.color[2] };
    };

    Light.prototype.setDiffuse = function (diffuse) {
        this.core.light.diffuse = (diffuse != undefined) ? diffuse : true;
    };

    Light.prototype.getDiffuse = function() {
        return this.core.light.diffuse;
    };

    Light.prototype.setSpecular = function (specular) {
        this.core.light.specular = specular || true;
    };

    Light.prototype.getSpecular = function() {
        return this.core.light.specular;
    };

    Light.prototype.setPos = function(pos) {
        pos = pos || {};
        this.core.light.pos = [ pos.x || 0.0, pos.y || 0.0, pos.z || 0.0 ];
    };

    Light.prototype.getPos = function() {
        return { x: this.core.light.pos[0], y: this.core.light.pos[1], z: this.core.light.pos[2] };
    };

    Light.prototype.setDir = function(dir) {
        dir = dir || {};
        this.core.light.dir = [ dir.x || 0.0, dir.y || 0.0, (dir.z == undefined || dir.z == null) ? -1 : dir.z ];
    };

    Light.prototype.getDir = function() {
        return { x: this.core.light.dir[0], y: this.core.light.dir[1], z: this.core.light.dir[2] };
    };

    Light.prototype.setConstantAttenuation = function (constantAttenuation) {
        this.core.light.constantAttenuation = (constantAttenuation != undefined) ? constantAttenuation : 1.0;
    };

    Light.prototype.getConstantAttenuation = function() {
        return this.core.light.constantAttenuation;
    };

    Light.prototype.setLinearAttenuation = function (linearAttenuation) {
        this.core.light.linearAttenuation = linearAttenuation || 0.0;
    };

    Light.prototype.getLinearAttenuation = function() {
        return this.core.light.linearAttenuation;
    };

    Light.prototype.setQuadraticAttenuation = function (quadraticAttenuation) {
        this.core.light.quadraticAttenuation = quadraticAttenuation || 0.0;
    };

    Light.prototype.getQuadraticAttenuation = function() {
        return this.core.light.quadraticAttenuation;
    };

    Light.prototype._compile = function() {
        var modelMat = SceneJS_modelTransformModule.transform.matrix;
        if (this.core.light.mode == "point") {
            this.core.light.worldPos = SceneJS_math_transformPoint3(modelMat, this.core.light.pos);
        } else if (this.core.light.mode == "dir") {
            this.core.light.worldDir = SceneJS_math_transformVector3(modelMat, this.core.light.dir);
        }
        idStack[stackLen] = this.attr.id;
        lightStack[stackLen] = this.core.light;
        stackLen++;
        dirty = true;

        this._compileNodes();
    };

})();
new (function() {

    var DEFAULT_MATERIAL = {
        baseColor :  [ 0.0, 0.0, 0.0 ],
        specularColor :  [ 0.0,  0.0,  0.0 ],
        specular : 1.0,
        shine :  10.0,
        reflect :  0.8,
        alpha :  1.0,
        emit :  0.0
    };

    var idStack = [];
    var materialStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setMaterial(idStack[stackLen - 1], materialStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setMaterial();
                    }
                    dirty = false;
                }
            });

    var Material = SceneJS.createNodeType("material");

    Material.prototype._init = function(params) {
        if (this.core._nodeCount == 1) {
            this.setBaseColor(params.baseColor);
            this.setSpecularColor(params.specularColor);
            this.setSpecular(params.specular);
            this.setShine(params.shine);
            this.setReflect(params.reflect);
            this.setEmit(params.emit);
            this.setAlpha(params.alpha);
            this.setOpacity(params.opacity);
        }
    };

    Material.prototype.setBaseColor = function(color) {
        this.core.baseColor = color ? [
            color.r != undefined && color.r != null ? color.r : 0.0,
            color.g != undefined && color.g != null ? color.g : 0.0,
            color.b != undefined && color.b != null ? color.b : 0.0
        ] : DEFAULT_MATERIAL.baseColor;
    };

    Material.prototype.getBaseColor = function() {
        return {
            r: this.core.baseColor[0],
            g: this.core.baseColor[1],
            b: this.core.baseColor[2]
        };
    };

    Material.prototype.setSpecularColor = function(color) {
        this.core.specularColor = color ? [
            color.r != undefined && color.r != null ? color.r : 0.0,
            color.g != undefined && color.g != null ? color.g : 0.0,
            color.b != undefined && color.b != null ? color.b : 0.0
        ] : DEFAULT_MATERIAL.specularColor;
    };

    Material.prototype.getSpecularColor = function() {
        return {
            r: this.core.specularColor[0],
            g: this.core.specularColor[1],
            b: this.core.specularColor[2]
        };
    };

    Material.prototype.setSpecular = function(specular) {
        this.core.specular = (specular != undefined && specular != null) ? specular : DEFAULT_MATERIAL.specular;
    };

    Material.prototype.getSpecular = function() {
        return this.core.specular;
    };

    Material.prototype.setShine = function(shine) {
        this.core.shine = (shine != undefined && shine != null) ? shine : DEFAULT_MATERIAL.shine;
    };

    Material.prototype.getShine = function() {
        return this.core.shine;
    };

    Material.prototype.setReflect = function(reflect) {
        this.core.reflect = (reflect != undefined && reflect != null) ? reflect : DEFAULT_MATERIAL.reflect;
    };

    Material.prototype.getReflect = function() {
        return this.core.reflect;
    };

    Material.prototype.setEmit = function(emit) {
        this.core.emit = (emit != undefined && emit != null) ? emit : DEFAULT_MATERIAL.emit;
    };

    Material.prototype.getEmit = function() {
        return this.core.emit;
    };

    Material.prototype.setAlpha = function(alpha) {
        this.core.alpha = (alpha != undefined && alpha != null) ? alpha : DEFAULT_MATERIAL.alpha;
    };

    Material.prototype.getAlpha = function() {
        return this.core.alpha;
    };

    Material.prototype.setOpacity = function(opacity) {
        this.core.opacity = (opacity != undefined && opacity != null) ? opacity : DEFAULT_MATERIAL.opacity;
    };

    Material.prototype.getOpacity = function() {
        return this.core.opacity;
    };

    Material.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    Material.prototype._preCompile = function() {
        //        var top = stackLen > 0 ? materialStack[stackLen - 1] : null;
        //        var origMemoLevel = this._compileMemoLevel;
        //        if (this._compileMemoLevel == 0 || (top && !top.fixed)) {
        //            var m = this.attr;
        //            top = top || DEFAULT_MATERIAL;
        //            this._material = {
        //                baseColor : m.baseColor ? [ m.baseColor.r, m.baseColor.g, m.baseColor.b ] : top.baseColor,
        //                specularColor: m.specularColor ? [ m.specularColor.r, m.specularColor.g, m.specularColor.b ] : top.specularColor,
        //                specular : (m.specular != undefined ) ? m.specular : top.specular,
        //                shine : (m.shine != undefined ) ? m.shine : top.shine,
        //                reflect : (m.reflect != undefined) ? m.reflect : top.reflect,
        //                alpha : (m.alpha != undefined) ? m.alpha : top.alpha,
        //                emit : (m.emit != undefined) ? m.emit : top.emit,
        //                opacity : (m.opacity != undefined) ? m.opacity : top.opacity
        //            };
        //            this._compileMemoLevel = 1;
        //        }
        //        this._material.fixed = (origMemoLevel == 1); // State not changed because of update to this node

        idStack[stackLen] = this.core._coreId; // Tie draw list state to core, not to scene node - reduces amount of state
        materialStack[stackLen] = this.core;       
        stackLen++;
        dirty = true;
    };

    Material.prototype._postCompile = function() {
        stackLen--;                                 // Pop material
        dirty = true;
    };


    Material.prototype._destroy = function() {};

})();
/**
 * @class A scene node that defines color transforms to apply to materials.
 *
 */

new (function() {
    var idStack = [];
    var colortransStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setColortrans(idStack[stackLen - 1], colortransStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setColortrans();
                    }
                    dirty = false;
                }
            });

    var Colortrans = SceneJS.createNodeType("colortrans");

    Colortrans.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node defines the resource
            this.setScale(params.scale);
            this.setAdd(params.add);
            this.setSaturation(params.saturation);
        }
    };

    Colortrans.prototype.setSaturation = function(saturation) {
        this.core.saturation = saturation;
    };

    Colortrans.prototype.mulSaturation = function(saturation) {
        this.core.saturation *= saturation;
    };

    Colortrans.prototype.incSaturation = function(saturation) {
        this.core.saturation += saturation;
    };

    Colortrans.prototype.getSaturation = function() {
        return this.core.saturation;
    };

    Colortrans.prototype.setScale = function(scale) {
        scale = scale || {};
        this.core.scale = {
            r: scale.r != undefined ? scale.r : 1,
            g: scale.g != undefined ? scale.g : 1,
            b: scale.b != undefined ? scale.b : 1,
            a: scale.a != undefined ? scale.a : 1
        };
    };

    Colortrans.prototype.incScale = function(scale) {
        scale = scale || {};
        var s = this.core.scale;
        if (scale.r) {
            s.r += scale.r;
        }
        if (scale.g) {
            s.g += scale.g;
        }
        if (scale.b) {
            s.b += scale.b;
        }
        if (scale.a) {
            s.a += scale.a;
        }
    };

    Colortrans.prototype.mulScale = function(scale) {
        scale = scale || {};
        var s = this.core.scale;
        if (scale.r) {
            s.r *= scale.r;
        }
        if (scale.g) {
            s.g *= scale.g;
        }
        if (scale.b) {
            s.b *= scale.b;
        }
        if (scale.a) {
            s.a *= scale.a;
        }
    };

    Colortrans.prototype.getScale = function() {
        return this.core.scale;
    };

    Colortrans.prototype.setAdd = function(add) {
        add = add || {};
        this.core.add = {
            r: add.r != undefined ? add.r : 0,
            g: add.g != undefined ? add.g : 0,
            b: add.b != undefined ? add.b : 0,
            a: add.a != undefined ? add.a : 0
        };
    };

    Colortrans.prototype.incAdd = function(add) {
        add = add || {};
        var s = this.core.add;
        if (add.r) {
            s.r += add.r;
        }
        if (add.g) {
            s.g += add.g;
        }
        if (add.b) {
            s.b += add.b;
        }
        if (add.a) {
            s.a += add.a;
        }
    };

    Colortrans.prototype.mulAdd = function(add) {
        add = add || {};
        var s = this.core.add;
        if (add.r) {
            s.r *= add.r;
        }
        if (add.g) {
            s.g *= add.g;
        }
        if (add.b) {
            s.b *= add.b;
        }
        if (add.a) {
            s.a *= add.a;
        }
    };

    Colortrans.prototype.getAdd = function() {
        return this.core.add;
    };

    Colortrans.prototype._compile = function() {

        idStack[stackLen] = this.core._coreId; // Tie draw list state to core, not to scene node
        colortransStack[stackLen] = this.core;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };

})();
/**
 * A scene node that defines one or more layers of texture to apply to geometries within its subgraph
 * that have UV coordinates.
 */
var SceneJS_textureModule = new (function() {

    var idStack = [];
    var textureStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.INIT,
            function() {

            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setTexture(idStack[stackLen - 1], textureStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setTexture();
                    }
                    dirty = false;
                }
            });

    /** Creates texture from either image URL or image object
     */
    function createTexture(scene, cfg, onComplete) {
        var context = scene.canvas.context;
        var textureId = SceneJS._createUUID();
        var update;
        try {
            if (cfg.autoUpdate) {
                update = function() {

                    //TODO: fix this when minefield is upto spec
                    try {
                        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
                    }
                    catch(e) {
                        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image, null);
                    }
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
                    //context.generateMipmap(context.TEXTURE_2D);
                };
            }
            return new SceneJS_webgl_Texture2D(context, {
                textureId : textureId,
                canvas: scene.canvas,
                image : cfg.image,
                url: cfg.uri,
                texels :cfg.texels,
                minFilter : getGLOption("minFilter", context, cfg, context.NEAREST_MIPMAP_NEAREST),
                magFilter :  getGLOption("magFilter", context, cfg, context.LINEAR),
                wrapS : getGLOption("wrapS", context, cfg, context.CLAMP_TO_EDGE),
                wrapT :   getGLOption("wrapT", context, cfg, context.CLAMP_TO_EDGE),
                isDepth :  getOption(cfg.isDepth, false),
                depthMode : getGLOption("depthMode", context, cfg, context.LUMINANCE),
                depthCompareMode : getGLOption("depthCompareMode", context, cfg, context.COMPARE_R_TO_TEXTURE),
                depthCompareFunc : getGLOption("depthCompareFunc", context, cfg, context.LEQUAL),
                flipY : getOption(cfg.flipY, true),
                width: getOption(cfg.width, 1),
                height: getOption(cfg.height, 1),
                internalFormat : getGLOption("internalFormat", context, cfg, context.LEQUAL),
                sourceFormat : getGLOption("sourceType", context, cfg, context.ALPHA),
                sourceType : getGLOption("sourceType", context, cfg, context.UNSIGNED_BYTE),
                logging: SceneJS_loggingModule ,
                update: update
            }, onComplete);
        } catch (e) {
            throw SceneJS_errorModule.fatalError(SceneJS.errors.ERROR, "Failed to create texture: " + e.message || e);
        }
    }

    function getGLOption(name, context, cfg, defaultVal) {
        var value = cfg[name];
        if (value == undefined) {
            return defaultVal;
        }
        var glName = SceneJS_webgl_enumMap[value];
        if (glName == undefined) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Unrecognised value for texture node property '" + name + "' value: '" + value + "'");
        }
        var glValue = context[glName];
        //                if (!glValue) {
        //                    throw new SceneJS.errors.WebGLUnsupportedNodeConfigException(
        //                            "This browser's WebGL does not support value of SceneJS.texture node property '" + name + "' value: '" + value + "'");
        //                }
        return glValue;
    }

    function getOption(value, defaultVal) {
        return (value == undefined) ? defaultVal : value;
    }

    function destroyTexture(texture) {
        texture.destroy();
    }


    /*----------------------------------------------------------------------------------------------------------------
     * Texture node
     *---------------------------------------------------------------------------------------------------------------*/

    var Texture = SceneJS.createNodeType("texture");

    Texture.prototype._init = function(params) {

        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.core.layers = [];
            this.core.params = {};
            var config = SceneJS_debugModule.getConfigs("texturing") || {};
            var waitForLoad = (config.waitForLoad != undefined && config.waitForLoad != null)
                    ? config.waitForLoad
                    : params.waitForLoad;

            if (!params.layers) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.NODE_CONFIG_EXPECTED,
                        "texture layers missing");
            }

            if (!SceneJS._isArray(params.layers)) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.NODE_CONFIG_EXPECTED,
                        "texture layers should be an array");
            }

            for (var i = 0; i < params.layers.length; i++) {
                var layerParam = params.layers[i];
                if (!layerParam.uri && !layerParam.frameBuf && !layerParam.video && !layerParam.image && !layerParam.canvasId) {
                    throw SceneJS_errorModule.fatalError(
                            SceneJS.errors.NODE_CONFIG_EXPECTED,
                            "texture layer " + i + "  has no uri, frameBuf, video or canvasId specified");
                }
                if (layerParam.applyFrom) {
                    if (layerParam.applyFrom != "uv" &&
                        layerParam.applyFrom != "uv2" &&
                        layerParam.applyFrom != "normal" &&
                        layerParam.applyFrom != "geometry") {
                        throw SceneJS_errorModule.fatalError(
                                SceneJS.errors.NODE_CONFIG_EXPECTED,
                                "texture layer " + i + "  applyFrom value is unsupported - " +
                                "should be either 'uv', 'uv2', 'normal' or 'geometry'");
                    }
                }
                if (layerParam.applyTo) {
                    if (layerParam.applyTo != "baseColor" && // Colour map
                        layerParam.applyTo != "specular" && // Specular map
                        layerParam.applyTo != "emit" && // Emission map
                        layerParam.applyTo != "alpha" && // Alpha map
                        //   layerParam.applyTo != "diffuseColor" &&
                        layerParam.applyTo != "normals") {
                        throw SceneJS_errorModule.fatalError(
                                SceneJS.errors.NODE_CONFIG_EXPECTED,
                                "texture layer " + i + " applyTo value is unsupported - " +
                                "should be either 'baseColor', 'specular' or 'normals'");
                    }
                }
                if (layerParam.blendMode) {
                    if (layerParam.blendMode != "add" && layerParam.blendMode != "multiply") {
                        throw SceneJS_errorModule.fatalError(
                                SceneJS.errors.NODE_CONFIG_EXPECTED,
                                "texture layer " + i + " blendMode value is unsupported - " +
                                "should be either 'add' or 'multiply'");
                    }
                }
                var layer = {
                    image : null,                       // Initialised when state == IMAGE_LOADED
                    creationParams: layerParam,         // Create texture using this
                    waitForLoad: waitForLoad,
                    texture: null,                      // Initialised when state == TEXTURE_LOADED
                    applyFrom: layerParam.applyFrom || "uv",
                    applyTo: layerParam.applyTo || "baseColor",
                    blendMode: layerParam.blendMode || "add",
                    blendFactor: (layerParam.blendFactor != undefined && layerParam.blendFactor != null) ? layerParam.blendFactor : 1.0,
                    translate: { x:0, y: 0},
                    scale: { x: 1, y: 1 },
                    rotate: { z: 0.0 }
                };

                this.core.layers.push(layer);

                this._setLayerTransform(layerParam, layer);

                if (layer.creationParams.frameBuf) {
                    layer.texture = SceneJS._compilationStates.getState("frameBuf", this.scene.attr.id, layer.creationParams.frameBuf);

                } else if (layer.creationParams.video) {
                    layer.texture = SceneJS._compilationStates.getState("video", this.scene.attr.id, layer.creationParams.video);

                } else {

                    SceneJS_sceneStatusModule.nodeLoading(this);

                    var self = this;

                    layer.texture = createTexture(
                            this.scene,
                            layer.creationParams,

                            function() { // onComplete
                                SceneJS_sceneStatusModule.nodeLoaded(self);                                
                                if (self._destroyed) {
                                    destroyTexture(layer.texture);
                                }
                                SceneJS_compileModule.nodeUpdated(self, "loaded"); // Trigger display list redraw
                            });
                }
            }
        }
    };

    Texture.prototype.setLayer = function(cfg) {
        if (cfg.index == undefined || cfg.index == null) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Invalid texture set layer argument: index null or undefined");
        }
        if (cfg.index < 0 || cfg.index >= this.core.layers.length) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "Invalid texture set layer argument: index out of range (" + this.core.layers.length + " layers defined)");
        }
        this._setLayer(parseInt(cfg.index), cfg);
    };

    Texture.prototype.setLayers = function(layers) {
        var indexNum;
        for (var index in layers) {
            if (layers.hasOwnProperty(index)) {
                if (index != undefined || index != null) {
                    indexNum = parseInt(index);
                    if (indexNum < 0 || indexNum >= this.core.layers.length) {
                        throw SceneJS_errorModule.fatalError(
                                SceneJS.errors.ILLEGAL_NODE_CONFIG,
                                "Invalid texture set layer argument: index out of range (" + this.core.layers.length + " layers defined)");
                    }
                    this._setLayer(indexNum, layers[index] || {});
                }
            }
        }
    };

    Texture.prototype._setLayer = function(index, cfg) {
        cfg = cfg || {};
        var layer = this.core.layers[index];
        if (cfg.blendFactor != undefined && cfg.blendFactor != null) {
            layer.blendFactor = cfg.blendFactor;
        }
        this._setLayerTransform(cfg, layer);
    };

    Texture.prototype._setLayerTransform = function(cfg, layer) {
        var matrix;
        var t;
        if (cfg.translate) {
            var translate = cfg.translate;
            if (translate.x != undefined) {
                layer.translate.x = translate.x;
            }
            if (translate.y != undefined) {
                layer.translate.y = translate.y;
            }
            matrix = SceneJS_math_translationMat4v([ translate.x || 0, translate.y || 0, 0]);
        }
        if (cfg.scale) {
            var scale = cfg.scale;
            if (scale.x != undefined) {
                layer.scale.x = scale.x;
            }
            if (scale.y != undefined) {
                layer.scale.y = scale.y;
            }
            t = SceneJS_math_scalingMat4v([ scale.x || 1, scale.y || 1, 1]);
            matrix = matrix ? SceneJS_math_mulMat4(matrix, t) : t;
        }
        if (cfg.rotate) {
            var rotate = cfg.rotate;
            if (rotate.z != undefined) {
                layer.rotate.z = rotate.z || 0;
            }
            t = SceneJS_math_rotationMat4v(rotate.z * 0.0174532925, [0,0,1]);
            matrix = matrix ? SceneJS_math_mulMat4(matrix, t) : t;
        }
        if (matrix) {
            layer.matrix = matrix;
            if (!layer.matrixAsArray) {
                layer.matrixAsArray = new Float32Array(layer.matrix);
            } else {
                layer.matrixAsArray.set(layer.matrix);
            }

            layer.matrixAsArray = new Float32Array(layer.matrix); // TODO - reinsert into array
        }
    };

    Texture.prototype._compile = function() {
        idStack[stackLen] = this.core._coreId; // Tie draw list state to core, not to scene node
        textureStack[stackLen] = this.core;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };


    Texture.prototype._destroy = function() {
        if (this.core._nodeCount == 1) { // Last resource user
            var layer;
            for (var i = 0, len = this.core.layers.length; i < len; i++) {
                layer = this.core.layers[i];
                if (layer.texture) {
                    destroyTexture(layer.texture);
                }
            }
        }
    };
})();
/**
 * @class A scene node that defines an arbitrary clipping plane for nodes in its sub graph.

 */
new (function() {

    var idStack = [];
    var clipStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setClips(idStack[stackLen - 1], clipStack.slice(0, stackLen));
                    } else {
                        SceneJS_DrawList.setClips();
                    }
                    dirty = false;
                }
            });

    var Clip = SceneJS.createNodeType("clip");

    Clip.prototype._init = function(params) {
        if (this.core._nodeCount == 1) {
            this.setMode(params.mode);
            this.setA(params.a);
            this.setB(params.b);
            this.setC(params.c);

//            this.core.doClean = function() {
//                var modelMat = SceneJS_modelTransformModule.transform.matrix;
//                var worldA = SceneJS_math_transformPoint3(modelMat, this.a);
//                var worldB = SceneJS_math_transformPoint3(modelMat, this.b);
//                var worldC = SceneJS_math_transformPoint3(modelMat, this.c);
//                var normal = SceneJS_math_normalizeVec3(
//                        SceneJS_math_cross3Vec4(
//                                SceneJS_math_normalizeVec3(
//                                        SceneJS_math_subVec3(worldB, worldA, [0,0,0]), [0,0,0]),
//                                SceneJS_math_normalizeVec3(
//                                        SceneJS_math_subVec3(worldB, worldC, [0,0,0]), [0,0,0])));
//                var dist = SceneJS_math_dotVector3(normal, worldA);
//                this.normalAndDist = [normal[0], normal[1], normal[2], dist];
//            };
        }
    };

    /**
     Sets the clipping mode. Default is "disabled".
     */
    Clip.prototype.setMode = function(mode) {
        mode = mode || "outside";
        if (mode != "disabled" && mode != "inside" && mode != "outside") {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "SceneJS.clip has a mode of unsupported type: '" + mode + " - should be 'disabled', 'inside' or 'outside'");
        }
        this.core.mode = mode;
    };

    Clip.prototype.getMode = function() {
        return this.core.mode;
    };

    Clip.prototype.setAbc = function(abc) {
        abc = abc || {};
        this.setA(abc.a);
        this.setB(abc.b);
        this.setC(abc.c);
    };

    Clip.prototype.getAbc = function() {
        return {
            a: this.getA(),
            b: this.getB(),
            c: this.getC()
        };
    };

    Clip.prototype.setA = function(a) {
        a = a || {};
        this.core.a = [
            a.x != undefined ? a.x : 0.0,
            a.y != undefined ? a.y : 0.0,
            a.z != undefined ? a.z : 0.0,
            1
        ];
    };

    Clip.prototype.getA = function() {
        return {
            x: this.core.a[0],
            y: this.core.a[1],
            z: this.core.a[2]
        };
    };

    Clip.prototype.setB = function(b) {
        b = b || {};
        this.core.b = [
            b.x != undefined ? b.x : 0.0,
            b.y != undefined ? b.y : 0.0,
            b.z != undefined ? b.z : 0.0,
            1
        ];
    };

    Clip.prototype.getB = function() {
        return {
            x: this.core.b[0],
            y: this.core.b[1],
            z: this.core.b[2]
        };
    };

    Clip.prototype.setC = function(c) {
        c = c || {};
        this.core.c = [
            c.x != undefined ? c.x : 0.0,
            c.y != undefined ? c.y : 0.0,
            c.z != undefined ? c.z : 0.0,
            1
        ];
    };

    Clip.prototype.getC = function() {
        return {
            x: this.core.c[0],
            y: this.core.c[1],
            z: this.core.c[2]
        };
    };

    Clip.prototype.getAttributes = function() {
        return {
            mode: this.core.mode,
            a: this.getA(),
            b: this.getB(),
            c: this.getC()
        };
    };

    Clip.prototype._compile = function() {

        var core = this.core;

                var modelMat = SceneJS_modelTransformModule.transform.matrix;
                var worldA = SceneJS_math_transformPoint3(modelMat, core.a);
                var worldB = SceneJS_math_transformPoint3(modelMat, core.b);
                var worldC = SceneJS_math_transformPoint3(modelMat, core.c);
                var normal = SceneJS_math_normalizeVec3(
                        SceneJS_math_cross3Vec4(
                                SceneJS_math_normalizeVec3(
                                        SceneJS_math_subVec3(worldB, worldA, [0,0,0]), [0,0,0]),
                                SceneJS_math_normalizeVec3(
                                        SceneJS_math_subVec3(worldB, worldC, [0,0,0]), [0,0,0])));

                var dist = SceneJS_math_dotVector3(normal, worldA);

                core.normalAndDist = [normal[0], normal[1], normal[2], dist];

        clipStack[stackLen] = core;
        idStack[stackLen] = this.attr.id;
        stackLen++;
        dirty = true;

        this._compileNodes();
    };

})();
new (function() {

    var idStack = [];
    var morphStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setMorph(idStack[stackLen - 1], morphStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setMorph();
                    }
                    dirty = false;
                }
            });

    /**
     * Destroys morph, returning true if memory freed, else false
     * where canvas not found and morph was implicitly destroyed
     */
    function destroyMorph(morph) {
        if (document.getElementById(morph.canvas.canvasId)) { // Context won't exist if canvas has disappeared
            var target;
            for (var i = 0, len = morph.targets.length; i < len; i++) {
                target = morph.targets[i];
                if (target.vertexBuf) {
                    target.vertexBuf.destroy();
                }
                if (target.normalBuf) {
                    target.normalBuf.destroy();
                }
                if (target.uvBuf) {
                    target.uvBuf.destroy();
                }
                if (target.uvBuf2) {
                    target.uvBuf2.destroy();
                }
            }
        }
    }


    function createMorphGeometry(scene, source, options, callback) {
        if (typeof source == "string") {

            /* Load from stream - http://scenejs.wikispaces.com/MorphGeoLoaderService
             */
            var geoService = SceneJS.Services.getService(SceneJS.Services.MORPH_GEO_LOADER_SERVICE_ID);
            geoService.loadMorphGeometry(source,
                    function(data) {
                        callback(_createMorph(scene, data, options));
                    });
        } else {

            /* Create from arrays
             */
            return _createMorph(scene, createTypedMorph(source), options);
        }
    }

    function createTypedMorph(data) {
        var typedMorph = {
            keys: data.keys,
            targets: []
        };
        for (var i = 0, len = data.targets.length; i < len; i++) {
            typedMorph.targets.push(createTypedArrays(data.targets[i]));
        }
        return typedMorph;
    }

    function createTypedArrays(data) {
        return {
            positions: data.positions ? new Float32Array(data.positions) : undefined,
            normals: data.normals ? new Float32Array(data.normals) : undefined,
            uv: data.uv ? new Float32Array(data.uv) : undefined,
            uv2: data.uv2 ? new Float32Array(data.uv2) : undefined
        };
    }


    function _createMorph(scene, data, options) {

        var context = scene.canvas.context;

        var morph = {
            scene: scene,
            canvas: scene.canvas,
            keys: data.keys,
            targets: [],
            key1: 0,
            key2: 1
        };

        try {

            var usage = context.STATIC_DRAW;

            var target;
            var newTarget;

            for (var i = 0, len = data.targets.length; i < len; i++) {
                target = data.targets[i];
                newTarget = {};
                morph.targets.push(newTarget);  // We'll iterate this to destroy targets when we recover from error
                if (target.positions && target.positions.length > 0) {
                    newTarget.vertexBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER,
                            target.positions, target.positions.length, 3, usage);
                }
                if (target.normals && target.normals.length > 0) {
                    newTarget.normalBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER,
                            target.normals, target.normals.length, 3, usage);
                }
                if (target.uv && target.uv.length > 0) {
                    newTarget.uvBuf = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER,
                            target.uv, target.uv.length, 2, usage);
                }
                if (target.uv2 && target.uv2.length > 0) {
                    newTarget.uvBuf2 = new SceneJS_webgl_ArrayBuffer(context, context.ARRAY_BUFFER,
                            target.uv2, target.uv2.length, 2, usage);
                }
            }

            return morph;

        } catch (e) {

            /* Allocation failure - deallocate all target VBOs
             */
            for (var i = 0, len = morph.targets.length; i < len; i++) {
                target = morph.targets[i];
                if (target.vertexBuf) {
                    target.vertexBuf.destroy();
                }
                if (target.normalBuf) {
                    target.normalBuf.destroy();
                }
                if (target.uvBuf) {
                    target.uvBuf.destroy();
                }
                if (target.uvBuf2) {
                    target.uvBuf2.destroy();
                }
            }
            throw e;
        }
    }

    var MorphGeometry = SceneJS.createNodeType("morphGeometry");

    MorphGeometry.prototype._init = function(params) {

        if (this.core._nodeCount == 1) { // This node defines the resource

            if (params.create instanceof Function) {
                var data = this._createMorphData(params.create());
                SceneJS._apply(createMorphGeometry(this.scene, data, params.options), this.core);
            } else if (params.stream) {

                /* Load from stream
                 * TODO: Expose the arrays on the node
                 */
                this._stream = params.stream;
                this.core._loading = true;

                var self = this;
                createMorphGeometry(
                        this.scene,
                        this._stream,
                        params.options,
                        function(morph) {
                            SceneJS._apply(morph, self.core);
                            self.core._loading = false;
                            SceneJS_compileModule.nodeUpdated(self, "loaded"); // Compile again to apply freshly-loaded geometry
                        });
            } else {

                /* Create from arrays
                 */
                SceneJS._apply(createMorphGeometry(this.scene, this._createMorphData(params), params.options), this.core);
            }
            
            this.setFactor(params.factor);
        }

        this.core.factor = params.factor || 0;
        this.core.clamp = !!params.clamp;
    };

    MorphGeometry.prototype._createMorphData = function(params) {
        var targets = params.targets || [];
        if (targets.length < 2) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "morphGeometry node should have at least two targets");
        }
        var keys = params.keys || [];
        if (keys.length != targets.length) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.ILLEGAL_NODE_CONFIG,
                    "morphGeometry node mismatch in number of keys and targets");
        }

        /* First target's arrays are defaults for where not given on subsequent targets
         */

        var positions;
        var normals;
        var uv;
        var uv2;
        var target;

        for (var i = 0, len = targets.length; i < len; i++) {
            target = targets[i];
            if (!positions && target.positions) {
                positions = target.positions.slice(0);
            }
            if (!normals && target.normals) {
                normals = target.normals.slice(0);
            }
            if (!uv && target.uv) {
                uv = target.uv.slice(0);
            }
            if (!uv2 && target.uv2) {
                uv2 = target.uv2.slice(0);
            }
        }

        for (var i = 0, len = targets.length; i < len; i++) {
            target = targets[i];
            if (!target.positions) {
                target.positions = positions;  // Can be undefined
            }
            if (!target.normals) {
                target.normals = normals;
            }
            if (!target.uv) {
                target.uv = uv;
            }
            if (!target.uv2) {
                target.uv2 = uv2;
            }
        }
        return {
            keys : keys,
            targets : targets,
            key1 : 0,
            key2 : 1,
            factor: 0
        };
    };

    MorphGeometry.prototype.getState = function() {
        return this.core;
    };

    MorphGeometry.prototype.getStream = function() {
        return this._stream;
    };

    MorphGeometry.prototype.setFactor = function(factor) {
        factor = factor || 0.0;

        var core = this.core;

        var keys = core.keys;
        var key1 = core.key1;
        var key2 = core.key2;

        if (factor < keys[0]) {
            key1 = 0;
            key2 = 1;

        } else if (factor > keys[keys.length - 1]) {
            key1 = keys.length - 2;
            key2 = key1 + 1;

        } else {
            while (keys[key1] > factor) {
                key1--;
                key2--;
            }
            while (keys[key2] < factor) {
                key1++;
                key2++;
            }
        }

        /* Normalise factor to range [0.0..1.0] for the target frame
         */
        core.factor = (factor - keys[key1]) / (keys[key2] - keys[key1]);
        core.key1 = key1;
        core.key2 = key2;
    };

    MorphGeometry.prototype.getFactor = function() {
        return this.core.factor;
    };

    MorphGeometry.prototype._compile = function() {
        this._preCompile();
        this._compileNodes();
        this._postCompile();
    };

    MorphGeometry.prototype._preCompile = function() {
        if (!this.core._loading) {
            idStack[stackLen] = this.attr.id;
            morphStack[stackLen] = this.core;
            stackLen++;
            dirty = true;
        }
    };

    MorphGeometry.prototype._postCompile = function() {
        if (!this.core._loading) {
            stackLen--;
            dirty = true;
        }
    };

    MorphGeometry.prototype._destroy = function() {
        if (this.core._nodeCount == 1) { // Last resource user
            destroyMorph(this.core);
        }
    };

})();
(function() {

    var idStack = [];
    var nameStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function(params) {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setName(idStack[stackLen - 1], nameStack[stackLen - 1]);
                    } else {
                        SceneJS_DrawList.setName();
                    }
                    dirty = false;
                }
            });

    var Name = SceneJS.createNodeType("name");

    Name.prototype._init = function(params) {
     if (this.core._nodeCount == 1) {
            this.setName(params.name);
        }
    };

    Name.prototype.setName = function(name) {
        this.core.name = name || "unnamed";
    };

    Name.prototype._compile = function() {
        var id = this.attr.id;
        idStack[stackLen] = id;
        nameStack[stackLen] = this.core.name;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };
})();
new (function() {

    var sceneBufs = {};

    //------------------------------------------------------------
    // TODO: remove bufs when all video nodes deleted for a scene otherwise we'll have inifite redraw
    //--------------------------------------------------------

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_IDLE,
            function(params) {
                var bufs = sceneBufs[params.sceneId];
                if (bufs) {
                    for (var bufId in bufs) {                       // Update video textures for each scene
                        if (bufs.hasOwnProperty(bufId)) {
                            bufs[bufId].update();
                        }
                    }
                    SceneJS_compileModule.redraw(params.sceneId);   // Trigger scene redraw after texture update
                }
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_DESTROYED,
            function(params) {
                sceneBufs[params.sceneId] = null;
            });

    var Video = SceneJS.createNodeType("video");

    Video.prototype._init = function(params) {
        if (!params.src) {
            throw SceneJS_errorModule.fatalError(
                    SceneJS.errors.NODE_CONFIG_EXPECTED,
                    "video node parameter expected: 'src'");
        }

        /* Create hidden video canvas
         */
        var video = this._video = document.createElement("video");
        video.style.display = "none";
        video.setAttribute("loop", "loop");
        video.autoplay = true;
        video.addEventListener("ended", // looping broken in FF
                function() {
                    this.play();
                },
                true);
        document.getElementsByTagName("body")[0].appendChild(video);
        this._canvas = document.createElement("canvas"); // for webkit
        this._ctx = this._canvas.getContext("2d");
        video.src = params.src;

        /* Create video texture
         */
        var gl = this._gl = this.scene.canvas.context;
        this._texture = gl.createTexture();

        /* Create handle to video texture
         */
        var bufId = this.attr.id;

        var self = this;

        var buf = {

            id: bufId,

            update: function() {
                var video = self._video;
                var gl = self._gl;
                var canvas = self._canvas;
                var texture = self._texture;
                var ctx = self._ctx;

                gl.bindTexture(gl.TEXTURE_2D, texture);

                // TODO: fix when minefield is up to spec - thanks GLGE

                if (video.readyState > 0) {

                    if (video.height <= 0) {
                        video.style.display = "";
                        video.height = video.offsetHeight;
                        video.width = video.offsetWidth;
                        video.style.display = "none";
                    }

                    canvas.height = video.height;
                    canvas.width = video.width;

                    ctx.drawImage(video, 0, 0);

                    try {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                    }
                    catch(e) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas, null);
                    }

                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

                    gl.generateMipmap(gl.TEXTURE_2D);

                    /*

                     For when webkit works - thanks GLGE

                     try{gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);}
                     catch(e){gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video,null);}
                     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                     gl.generateMipmap(gl.TEXTURE_2D);
                     */
                }
            },

            getTexture: function() {
                return {

                    bind: function(unit) {
                        var gl = self._gl;
                        gl.activeTexture(gl["TEXTURE" + unit]);
                        gl.bindTexture(gl.TEXTURE_2D, self._texture);
                    },

                    unbind : function(unit) {
                        var gl = self._gl;
                        gl.activeTexture(gl["TEXTURE" + unit]);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                    }
                };
            }
        };

        buf.update();

        /* Register the buffer
         */
        var sceneId = this.scene.attr.id;
        var bufs = sceneBufs[sceneId];
        if (!bufs) {
            bufs = sceneBufs[sceneId] = {};
        }
        this._buf = bufs[bufId] = buf;
    };

    SceneJS._compilationStates.setSupplier("video", {
        get: function(sceneId, id) {
            var bufs = sceneBufs[sceneId];
            return {
                bind: function(unit) {
                    var buf = bufs[id];
                    if (buf) {                              // Lazy-bind when video node shows up
                        buf.getTexture().bind(unit);
                    }
                },

                unbind: function(unit) {
                    var buf = bufs[id];
                    if (buf) {
                        buf.getTexture().unbind(unit);
                    }
                }
            };
        }
    });

    Video.prototype._compile = function() {
        this._compileNodes();
    };

    Video.prototype._destroy = function() {
        if (this._buf) {
            var bufs = sceneBufs[this.scene.attr.id];

        }
    };
})();
new (function() {

    var sceneBufs = {};

    var idStack = [];
    var bufStack = [];
    var stackLen = 0;

    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setFrameBuf(idStack[stackLen - 1], bufStack[stackLen - 1]);
                    } else { // Full compile supplies it's own default states
                        SceneJS_DrawList.setFrameBuf(); // No frameBuf
                    }
                    dirty = false;
                }
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_DESTROYED,
            function(params) {
                sceneBufs[params.sceneId] = null;
            });

    /** Creates image buffer, registers it under the given ID
     */
    function createFrameBuffer(scene, bufId) {

        var canvas = scene.canvas;
        var gl = canvas.context;
        var width = canvas.canvas.width;
        var height = canvas.canvas.height;
        var frameBuf = gl.createFramebuffer();
        var renderBuf = gl.createRenderbuffer();
        var texture = gl.createTexture() ;
        var rendered = false;

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuf);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        try {
            // Do it the way the spec requires
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        } catch (exception) {
            // Workaround for what appears to be a Minefield bug.
            var textureStorage = new WebGLUnsignedByteArray(width * height * 4);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureStorage);
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuf);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuf);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        /* Verify framebuffer is OK
         */
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuf);
        if (!gl.isFramebuffer(frameBuf)) {
            throw SceneJS_errorModule.fatalError("Invalid framebuffer");
        }
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw SceneJS_errorModule.fatalError("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
            default:
                throw SceneJS_errorModule.fatalError("Incomplete framebuffer: " + status);
        }

        /* Create handle to image buffer
         */
        var buf = {
            id: bufId,

            /** Binds the image buffer as target for subsequent geometry renders
             */
            bind: function() {
                // gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuf);
                gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuf);
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.depthRange(0, 1);
                gl.disable(gl.SCISSOR_TEST);
                //  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.disable(gl.BLEND);
            },

            /** Unbinds image buffer, the default buffer then becomes the rendering target
             */
            unbind:function() {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
                gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuf);
                rendered = true;
            },

            /** Returns true if this texture has been rendered
             */
            isRendered: function() {
                return rendered;
            },

            /** Gets the texture from this image buffer
             */
            getTexture: function() {
                return {

                    bind: function(unit) {
                        gl.activeTexture(gl["TEXTURE" + unit]);
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                    },

                    unbind : function(unit) {
                        gl.activeTexture(gl["TEXTURE" + unit]);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                    }
                };
            }
        };

        /* Register the buffer
         */
        var bufs = sceneBufs[scene.attr.id];
        if (!bufs) {
            bufs = sceneBufs[scene.attr.id] = {};
        }
        bufs[bufId] = buf;
        return buf;
    }

    function destroyFrameBuffer(buf) {

    }

    SceneJS._compilationStates.setSupplier("frameBuf", {
        get: function(sceneId, id) {
            var bufs = sceneBufs[sceneId];
            return {
                bind: function(unit) {
                    var buf = bufs[id];
                    if (buf && buf.isRendered()) {
                        buf.getTexture().bind(unit);
                    }
                },

                unbind: function(unit) {
                    var buf = bufs[id];
                    if (buf && buf.isRendered()) {
                        buf.getTexture().unbind(unit);
                    }
                }
            };
        }
    });

    var FrameBuf = SceneJS.createNodeType("frameBuf");

    FrameBuf.prototype._init = function() {
        this._buf = createFrameBuffer(this.scene, this.attr.id);
    };

    FrameBuf.prototype._compile = function() {
        idStack[stackLen] = this.attr.id;
        bufStack[stackLen] = this._buf;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;
        dirty = true;
    };

    FrameBuf.prototype._destroy = function() {
        if (this._buf) {
            destroyFrameBuffer(this._buf);
        }
    };
})();
new (function() {

    var idStack = [];

    var shaderVertexCodeStack = [];
    var shaderVertexHooksStack = [];

    var shaderVertexHooksStacks = {};

    var shaderFragmentCodeStack = [];
    var shaderFragmentHooksStack = [];

    var shaderParamsStack = [];

    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        var shader = {
                            shaders: {
                                fragment: {
                                    code: shaderFragmentCodeStack.slice(0, stackLen).join("\n"),
                                    hooks: combineMapStack(shaderFragmentHooksStack)
                                },
                                vertex: {
                                    code: shaderVertexCodeStack.slice(0, stackLen).join("\n"),
                                    hooks: combineMapStack(shaderVertexHooksStack)
                                }
                            },
                            paramsStack: shaderParamsStack.slice(0, stackLen),
                            hash: idStack.slice(0, stackLen).join(".")
                        };

                        SceneJS_DrawList.setShader(idStack[stackLen - 1], shader);
                    } else {
                        SceneJS_DrawList.setShader();
                    }
                    dirty = false;
                }
            });

    function combineMapStack(maps) {
        var map1;
        var map2 = {};
        var name;
        for (var i = 0; i < stackLen; i++) {
            map1 = maps[i];
            for (name in map1) {
                if (map1.hasOwnProperty(name)) {
                    map2[name] = map1[name];
                }
            }
        }
        return map2;
    }

    function pushHooks(hooks, hookStacks) {
        var stack;
        for (var key in hooks) {
            if (hooks.hasOwnProperty(key)) {
                stack = hookStacks[key];
                if (!stack) {
                    stack = hookStacks[key] = [];
                }
                stack.push(hooks[key]);
            }
        }
    }

    var Shader = SceneJS.createNodeType("shader");

    Shader.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this._setShaders(params.shaders);
            this.setParams(params.params);
        }
    };

    Shader.prototype._setShaders = function(shaders) {
        shaders = shaders || [];
        this.core.shaders = {};
        var shader;
        for (var i = 0, len = shaders.length; i < len; i++) {
            shader = shaders[i];
            if (!shader.stage) {
                throw SceneJS_errorModule.fatalError(
                        SceneJS.errors.ILLEGAL_NODE_CONFIG,
                        "shader 'stage' attribute expected");
            }
            var code;
            if (shader.code) {
                if (SceneJS._isArray(shader.code)) {
                    code = shader.code.join("");
                } else {
                    code = shader.code;
                }
            }
            this.core.shaders[shader.stage] = {
                code: code,
                hooks: shader.hooks
            };
        }
    };

    Shader.prototype.setParams = function(params) {
        params = params || {};
        var coreParams = this.core.params;
        if (!coreParams) {
            coreParams = this.core.params = {};
        }
        for (var name in params) {
            if (params.hasOwnProperty(name)) {
                coreParams[name] = params[name];
            }
        }
    };

    Shader.prototype.getParams = function() {
        var coreParams = this.core.params;
        if (!coreParams) {
            return {};
        }
        var params = {};
        for (var name in coreParams) {
            if (coreParams.hasOwnProperty(name)) {
                params[name] = coreParams[name];
            }
        }
        return params;
    };

    Shader.prototype._compile = function() {

        /* Push
         */
        idStack[stackLen] = this.core._coreId; // Draw list node tied to core, not node

        var shaders = this.core.shaders;

        var fragment = shaders.fragment || {};
        var vertex = shaders.vertex || {};

        shaderFragmentCodeStack[stackLen] = fragment.code || "";
        shaderFragmentHooksStack[stackLen] = fragment.hooks || {};

        //        if (fragment.hooks) {
        //            pushHooks(fragment.hooks, shaderFragmentHooksStack);
        //        }

        shaderVertexCodeStack[stackLen] = vertex.code || "";
        shaderVertexHooksStack[stackLen] = vertex.hooks || {};

        //        if (vertex.hooks) {
        //            pushHooks(vertex.hooks, shaderVertexHooksStack);
        //        }

        shaderParamsStack[stackLen] = this.core.params || {};

        stackLen++;
        dirty = true;

        this._compileNodes();

        /* Pop
         */
        stackLen--;
        dirty = true;
    };

})();
new (function() {

    var idStack = [];
    var shaderParamsStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function() {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setShaderParams(idStack[stackLen - 1], shaderParamsStack.slice(0, stackLen));
                    } else { // Full compile supplies it's own default states
                        SceneJS_DrawList.setShaderParams();
                    }
                    dirty = false;
                }
            });

    var ShaderParams = SceneJS.createNodeType("shaderParams");

    ShaderParams.prototype._init = function(params) {
        if (this.core._nodeCount == 1) { // This node is the resource definer
            this.setParams(params.params);
        }
    };

    ShaderParams.prototype.setParams = function(params) {
        params = params || {};
        var core = this.core;
        if (!core.params) {
            core.params = {};
        }
        for (var name in params) {
            if (params.hasOwnProperty(name)) {
                core.params[name] = params[name];
            }
        }
    };

    ShaderParams.prototype._compile = function() {

        idStack[stackLen] = this.core._coreId; // Tie draw list state to core, not to scene node
        shaderParamsStack[stackLen] = this.core.params;
        stackLen++;
        dirty = true;

        this._compileNodes();

        stackLen--;                                 // pop params
        dirty = true;
    };
})();
var SceneJS_nodeEventsModule = new (function() {
    var idStack = [];
    var listenerStack = [];
    var stackLen = 0;
    var dirty;

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_COMPILING,
            function() {
                stackLen = 0;
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SHADER_ACTIVATED,
            function() {
                dirty = true;
            });

    SceneJS_eventModule.addListener(
            SceneJS_eventModule.SCENE_RENDERING,
            function(params) {
                if (dirty) {
                    if (stackLen > 0) {
                        SceneJS_DrawList.setRenderListeners(idStack[stackLen - 1], listenerStack.slice(0, stackLen));
                    } else {
                        SceneJS_DrawList.setRenderListeners();
                    }
                    dirty = false;
                }
            });

    this.preVisitNode = function(node) {
        var listeners = node.listeners["rendered"];
        if (listeners && listeners.length > 0) {

            idStack[stackLen] = node.attr.id;
            listenerStack[stackLen] = function (params) {
                node._fireEvent("rendered", params);
            };
            stackLen++;

            dirty = true;
        }
    };

    this.postVisitNode = function(node) {
        if (node.attr.id == idStack[stackLen - 1]) {
            stackLen--;
            dirty = true;
        }
    };
})();
