var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CANNON;
(function (CANNON) {
    CANNON.Vector3 = feng3d.Vector3;
    CANNON.Matrix3x3 = feng3d.Matrix3x3;
    CANNON.Quaternion = feng3d.Quaternion;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Transform = /** @class */ (function () {
        function Transform(position, quaternion) {
            if (position === void 0) { position = new CANNON.Vector3(); }
            if (quaternion === void 0) { quaternion = new CANNON.Quaternion(); }
            this.position = position;
            this.quaternion = quaternion;
        }
        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        Transform.pointToLocalFrame = function (position, quaternion, worldPoint, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            worldPoint.subTo(position, result);
            quaternion.inverseTo(tmpQuat);
            tmpQuat.vmult(result, result);
            return result;
        };
        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        Transform.prototype.pointToLocal = function (worldPoint, result) {
            return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
        };
        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        Transform.pointToWorldFrame = function (position, quaternion, localPoint, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            quaternion.vmult(localPoint, result);
            result.addTo(position, result);
            return result;
        };
        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        Transform.prototype.pointToWorld = function (localPoint, result) {
            return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
        };
        Transform.prototype.vectorToWorldFrame = function (localVector, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            this.quaternion.vmult(localVector, result);
            return result;
        };
        Transform.vectorToWorldFrame = function (quaternion, localVector, result) {
            quaternion.vmult(localVector, result);
            return result;
        };
        Transform.vectorToLocalFrame = function (position, quaternion, worldVector, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        };
        return Transform;
    }());
    CANNON.Transform = Transform;
    var tmpQuat = new CANNON.Quaternion();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var JacobianElement = /** @class */ (function () {
        /**
         * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
         */
        function JacobianElement() {
            this.spatial = new CANNON.Vector3();
            this.rotational = new CANNON.Vector3();
        }
        /**
         * Multiply with other JacobianElement
         * @param element
         */
        JacobianElement.prototype.multiplyElement = function (element) {
            return element.spatial.dot(this.spatial) + element.rotational.dot(this.rotational);
        };
        /**
         * Multiply with two vectors
         * @param spatial
         * @param rotational
         */
        JacobianElement.prototype.multiplyVectors = function (spatial, rotational) {
            return spatial.dot(this.spatial) + rotational.dot(this.rotational);
        };
        return JacobianElement;
    }());
    CANNON.JacobianElement = JacobianElement;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    /**
     * Base class for objects that dispatches events.
     */
    var EventTarget = /** @class */ (function () {
        function EventTarget() {
        }
        /**
         * Add an event listener
         * @param  type
         * @param  listener
         * @return The self object, for chainability.
         */
        EventTarget.prototype.addEventListener = function (type, listener) {
            if (this._listeners === undefined) {
                this._listeners = {};
            }
            var listeners = this._listeners;
            if (listeners[type] === undefined) {
                listeners[type] = [];
            }
            if (listeners[type].indexOf(listener) === -1) {
                listeners[type].push(listener);
            }
            return this;
        };
        /**
         * Check if an event listener is added
         * @param type
         * @param listener
         */
        EventTarget.prototype.hasEventListener = function (type, listener) {
            if (this._listeners === undefined) {
                return false;
            }
            var listeners = this._listeners;
            if (listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1) {
                return true;
            }
            return false;
        };
        /**
         * Check if any event listener of the given type is added
         * @param type
         */
        EventTarget.prototype.hasAnyEventListener = function (type) {
            if (this._listeners === undefined) {
                return false;
            }
            var listeners = this._listeners;
            return (listeners[type] !== undefined);
        };
        /**
         * Remove an event listener
         * @param type
         * @param listener
         * @return The self object, for chainability.
         */
        EventTarget.prototype.removeEventListener = function (type, listener) {
            if (this._listeners === undefined) {
                return this;
            }
            var listeners = this._listeners;
            if (listeners[type] === undefined) {
                return this;
            }
            var index = listeners[type].indexOf(listener);
            if (index !== -1) {
                listeners[type].splice(index, 1);
            }
            return this;
        };
        /**
         * Emit an event.
         * @param event
         * @return The self object, for chainability.
         */
        EventTarget.prototype.dispatchEvent = function (event) {
            if (this._listeners === undefined) {
                return this;
            }
            var listeners = this._listeners;
            var listenerArray = listeners[event.type];
            if (listenerArray !== undefined) {
                event.target = this;
                for (var i = 0, l = listenerArray.length; i < l; i++) {
                    listenerArray[i].call(this, event);
                }
            }
            return this;
        };
        return EventTarget;
    }());
    CANNON.EventTarget = EventTarget;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    /**
     * For pooling objects that can be reused.
     */
    var Pool = /** @class */ (function () {
        function Pool() {
            this.objects = [];
            this.type = Object;
        }
        /**
         * Release an object after use
         */
        Pool.prototype.release = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var Nargs = arguments.length;
            for (var i = 0; i !== Nargs; i++) {
                this.objects.push(arguments[i]);
            }
            return this;
        };
        /**
         * Get an object
         */
        Pool.prototype.get = function () {
            if (this.objects.length === 0) {
                return this.constructObject();
            }
            else {
                return this.objects.pop();
            }
        };
        /**
         * Construct an object. Should be implmented in each subclass.
         */
        Pool.prototype.constructObject = function () {
            throw new Error("constructObject() not implemented in this Pool subclass yet!");
        };
        /**
         * @param size
         * @return Self, for chaining
         */
        Pool.prototype.resize = function (size) {
            var objects = this.objects;
            while (objects.length > size) {
                objects.pop();
            }
            while (objects.length < size) {
                objects.push(this.constructObject());
            }
            return this;
        };
        return Pool;
    }());
    CANNON.Pool = Pool;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        /**
         * Extend an options object with default values.
         * @param  options The options object. May be falsy: in this case, a new object is created and returned.
         * @param  defaults An object containing default values.
         * @return The modified options object.
         */
        Utils.defaults = function (options, defaults) {
            options = options || {};
            for (var key in defaults) {
                if (!(key in options)) {
                    options[key] = defaults[key];
                }
            }
            return options;
        };
        return Utils;
    }());
    CANNON.Utils = Utils;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Vec3Pool = /** @class */ (function (_super) {
        __extends(Vec3Pool, _super);
        function Vec3Pool() {
            var _this = _super.call(this) || this;
            _this.type = CANNON.Vector3;
            return _this;
        }
        /**
         * Construct a vector
         */
        Vec3Pool.prototype.constructObject = function () {
            return new CANNON.Vector3();
        };
        return Vec3Pool;
    }(CANNON.Pool));
    CANNON.Vec3Pool = Vec3Pool;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var TupleDictionary = /** @class */ (function () {
        function TupleDictionary() {
            /**
             * The data storage
             */
            this.data = { keys: [] };
        }
        /**
         * @param i
         * @param j
         */
        TupleDictionary.prototype.get = function (i, j) {
            if (i > j) {
                // swap
                var temp = j;
                j = i;
                i = temp;
            }
            return this.data[i + '-' + j];
        };
        TupleDictionary.prototype.set = function (i, j, value) {
            if (i > j) {
                var temp = j;
                j = i;
                i = temp;
            }
            var key = i + '-' + j;
            // Check if key already exists
            if (!this.get(i, j)) {
                this.data.keys.push(key);
            }
            this.data[key] = value;
        };
        TupleDictionary.prototype.reset = function () {
            var data = this.data, keys = data.keys;
            while (keys.length > 0) {
                var key = keys.pop();
                delete data[key];
            }
        };
        return TupleDictionary;
    }());
    CANNON.TupleDictionary = TupleDictionary;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Constraint = /** @class */ (function () {
        /**
         * Constraint base class
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function Constraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            options = CANNON.Utils.defaults(options, {
                collideConnected: true,
                wakeUpBodies: true,
            });
            this.equations = [];
            this.bodyA = bodyA;
            this.bodyB = bodyB;
            this.id = Constraint.idCounter++;
            this.collideConnected = options.collideConnected;
            if (options.wakeUpBodies) {
                if (bodyA) {
                    bodyA.wakeUp();
                }
                if (bodyB) {
                    bodyB.wakeUp();
                }
            }
        }
        /**
         * Update all the equations with data.
         */
        Constraint.prototype.update = function () {
            throw new Error("method update() not implmemented in this Constraint subclass!");
        };
        /**
         * Enables all equations in the constraint.
         */
        Constraint.prototype.enable = function () {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++) {
                eqs[i].enabled = true;
            }
        };
        /**
         * Disables all equations in the constraint.
         */
        Constraint.prototype.disable = function () {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++) {
                eqs[i].enabled = false;
            }
        };
        Constraint.idCounter = 0;
        return Constraint;
    }());
    CANNON.Constraint = Constraint;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var DistanceConstraint = /** @class */ (function (_super) {
        __extends(DistanceConstraint, _super);
        /**
         * Constrains two bodies to be at a constant distance from each others center of mass.
         *
         * @param bodyA
         * @param bodyB
         * @param distance The distance to keep. If undefined, it will be set to the current distance between bodyA and bodyB
         * @param maxForce
         * @param number
         *
         * @author schteppe
         */
        function DistanceConstraint(bodyA, bodyB, distance, maxForce) {
            var _this = _super.call(this, bodyA, bodyB) || this;
            if (typeof (distance) === "undefined") {
                distance = bodyA.position.distance(bodyB.position);
            }
            if (typeof (maxForce) === "undefined") {
                maxForce = 1e6;
            }
            _this.distance = distance;
            /**
             * @property {ContactEquation} distanceEquation
             */
            var eq = _this.distanceEquation = new CANNON.ContactEquation(bodyA, bodyB);
            _this.equations.push(eq);
            // Make it bidirectional
            eq.minForce = -maxForce;
            eq.maxForce = maxForce;
            return _this;
        }
        DistanceConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var eq = this.distanceEquation;
            var halfDist = this.distance * 0.5;
            var normal = eq.ni;
            bodyB.position.subTo(bodyA.position, normal);
            normal.normalize();
            normal.scaleNumberTo(halfDist, eq.ri);
            normal.scaleNumberTo(-halfDist, eq.rj);
        };
        return DistanceConstraint;
    }(CANNON.Constraint));
    CANNON.DistanceConstraint = DistanceConstraint;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var PointToPointConstraint = /** @class */ (function (_super) {
        __extends(PointToPointConstraint, _super);
        /**
         * Connects two bodies at given offset points.
         *
         * @param bodyA
         * @param pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
         * @param bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
         * @param pivotB See pivotA.
         * @param maxForce The maximum force that should be applied to constrain the bodies.
         *
         * @example
         *     var bodyA = new Body({ mass: 1 });
         *     var bodyB = new Body({ mass: 1 });
         *     bodyA.position.set(-1, 0, 0);
         *     bodyB.position.set(1, 0, 0);
         *     bodyA.addShape(shapeA);
         *     bodyB.addShape(shapeB);
         *     world.addBody(bodyA);
         *     world.addBody(bodyB);
         *     var localPivotA = new Vector3(1, 0, 0);
         *     var localPivotB = new Vector3(-1, 0, 0);
         *     var constraint = new PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
         *     world.addConstraint(constraint);
         */
        function PointToPointConstraint(bodyA, pivotA, bodyB, pivotB, maxForce) {
            var _this = _super.call(this, bodyA, bodyB) || this;
            maxForce = typeof (maxForce) !== 'undefined' ? maxForce : 1e6;
            _this.pivotA = pivotA ? pivotA.clone() : new CANNON.Vector3();
            _this.pivotB = pivotB ? pivotB.clone() : new CANNON.Vector3();
            var x = _this.equationX = new CANNON.ContactEquation(bodyA, bodyB);
            var y = _this.equationY = new CANNON.ContactEquation(bodyA, bodyB);
            var z = _this.equationZ = new CANNON.ContactEquation(bodyA, bodyB);
            // Equations to be fed to the solver
            _this.equations.push(x, y, z);
            // Make the equations bidirectional
            x.minForce = y.minForce = z.minForce = -maxForce;
            x.maxForce = y.maxForce = z.maxForce = maxForce;
            x.ni.set(1, 0, 0);
            y.ni.set(0, 1, 0);
            z.ni.set(0, 0, 1);
            return _this;
        }
        PointToPointConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var x = this.equationX;
            var y = this.equationY;
            var z = this.equationZ;
            // Rotate the pivots to world space
            bodyA.quaternion.vmult(this.pivotA, x.ri);
            bodyB.quaternion.vmult(this.pivotB, x.rj);
            y.ri.copy(x.ri);
            y.rj.copy(x.rj);
            z.ri.copy(x.ri);
            z.rj.copy(x.rj);
        };
        return PointToPointConstraint;
    }(CANNON.Constraint));
    CANNON.PointToPointConstraint = PointToPointConstraint;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ConeTwistConstraint = /** @class */ (function (_super) {
        __extends(ConeTwistConstraint, _super);
        /**
         * @class ConeTwistConstraint
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function ConeTwistConstraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, bodyA, options.pivotA ? options.pivotA.clone() : new CANNON.Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new CANNON.Vector3(), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            _this.axisA = options.axisA ? options.axisA.clone() : new CANNON.Vector3();
            _this.axisB = options.axisB ? options.axisB.clone() : new CANNON.Vector3();
            var maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;
            _this.collideConnected = !!options.collideConnected;
            _this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;
            /**
             * @property {ConeEquation} coneEquation
             */
            var c = _this.coneEquation = new CANNON.ConeEquation(bodyA, bodyB, options);
            /**
             * @property {RotationalEquation} twistEquation
             */
            var t = _this.twistEquation = new CANNON.RotationalEquation(bodyA, bodyB, options);
            _this.twistAngle = typeof (options.twistAngle) !== 'undefined' ? options.twistAngle : 0;
            // Make the cone equation push the bodies toward the cone axis, not outward
            c.maxForce = 0;
            c.minForce = -maxForce;
            // Make the twist equation add torque toward the initial position
            t.maxForce = 0;
            t.minForce = -maxForce;
            _this.equations.push(c, t);
            return _this;
        }
        ConeTwistConstraint.prototype.update = function () {
            var bodyA = this.bodyA, bodyB = this.bodyB, cone = this.coneEquation, twist = this.twistEquation;
            _super.prototype.update.call(this);
            // Update the axes to the cone constraint
            bodyA.vectorToWorldFrame(this.axisA, cone.axisA);
            bodyB.vectorToWorldFrame(this.axisB, cone.axisB);
            // Update the world axes in the twist constraint
            this.axisA.tangents(twist.axisA, twist.axisA);
            bodyA.vectorToWorldFrame(twist.axisA, twist.axisA);
            this.axisB.tangents(twist.axisB, twist.axisB);
            bodyB.vectorToWorldFrame(twist.axisB, twist.axisB);
            cone.angle = this.angle;
            twist.maxAngle = this.twistAngle;
        };
        return ConeTwistConstraint;
    }(CANNON.PointToPointConstraint));
    CANNON.ConeTwistConstraint = ConeTwistConstraint;
    var ConeTwistConstraint_update_tmpVec1 = new CANNON.Vector3();
    var ConeTwistConstraint_update_tmpVec2 = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var HingeConstraint = /** @class */ (function (_super) {
        __extends(HingeConstraint, _super);
        /**
         * Hinge constraint. Think of it as a door hinge. It tries to keep the door in the correct place and with the correct orientation.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function HingeConstraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            var maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;
            _this = _super.call(this, bodyA, options.pivotA ? options.pivotA.clone() : new CANNON.Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new CANNON.Vector3(), maxForce) || this;
            var axisA = _this.axisA = options.axisA ? options.axisA.clone() : new CANNON.Vector3(1, 0, 0);
            axisA.normalize();
            var axisB = _this.axisB = options.axisB ? options.axisB.clone() : new CANNON.Vector3(1, 0, 0);
            axisB.normalize();
            var r1 = _this.rotationalEquation1 = new CANNON.RotationalEquation(bodyA, bodyB, options);
            var r2 = _this.rotationalEquation2 = new CANNON.RotationalEquation(bodyA, bodyB, options);
            var motor = _this.motorEquation = new CANNON.RotationalMotorEquation(bodyA, bodyB, maxForce);
            motor.enabled = false; // Not enabled by default
            // Equations to be fed to the solver
            _this.equations.push(r1, // rotational1
            r2, // rotational2
            motor);
            return _this;
        }
        HingeConstraint.prototype.enableMotor = function () {
            this.motorEquation.enabled = true;
        };
        HingeConstraint.prototype.disableMotor = function () {
            this.motorEquation.enabled = false;
        };
        HingeConstraint.prototype.setMotorSpeed = function (speed) {
            this.motorEquation.targetVelocity = speed;
        };
        HingeConstraint.prototype.setMotorMaxForce = function (maxForce) {
            this.motorEquation.maxForce = maxForce;
            this.motorEquation.minForce = -maxForce;
        };
        HingeConstraint.prototype.update = function () {
            var bodyA = this.bodyA, bodyB = this.bodyB, motor = this.motorEquation, r1 = this.rotationalEquation1, r2 = this.rotationalEquation2, worldAxisA = HingeConstraint_update_tmpVec1, worldAxisB = HingeConstraint_update_tmpVec2;
            var axisA = this.axisA;
            var axisB = this.axisB;
            _super.prototype.update.call(this);
            // Get world axes
            bodyA.quaternion.vmult(axisA, worldAxisA);
            bodyB.quaternion.vmult(axisB, worldAxisB);
            worldAxisA.tangents(r1.axisA, r2.axisA);
            r1.axisB.copy(worldAxisB);
            r2.axisB.copy(worldAxisB);
            if (this.motorEquation.enabled) {
                bodyA.quaternion.vmult(this.axisA, motor.axisA);
                bodyB.quaternion.vmult(this.axisB, motor.axisB);
            }
        };
        return HingeConstraint;
    }(CANNON.PointToPointConstraint));
    CANNON.HingeConstraint = HingeConstraint;
    var HingeConstraint_update_tmpVec1 = new CANNON.Vector3();
    var HingeConstraint_update_tmpVec2 = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var LockConstraint = /** @class */ (function (_super) {
        __extends(LockConstraint, _super);
        /**
         * Lock constraint. Will remove all degrees of freedom between the bodies.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function LockConstraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = 
            // The point-to-point constraint will keep a point shared between the bodies
            _super.call(this, bodyA, new CANNON.Vector3(), bodyB, new CANNON.Vector3(), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            // Set pivot point in between
            var pivotA = _this.pivotA;
            var pivotB = _this.pivotB;
            var halfWay = new CANNON.Vector3();
            bodyA.position.addTo(bodyB.position, halfWay);
            halfWay.scaleNumberTo(0.5, halfWay);
            bodyB.pointToLocalFrame(halfWay, pivotB);
            bodyA.pointToLocalFrame(halfWay, pivotA);
            // Store initial rotation of the bodies as unit vectors in the local body spaces
            _this.xA = bodyA.vectorToLocalFrame(CANNON.Vector3.X_AXIS);
            _this.xB = bodyB.vectorToLocalFrame(CANNON.Vector3.X_AXIS);
            _this.yA = bodyA.vectorToLocalFrame(CANNON.Vector3.Y_AXIS);
            _this.yB = bodyB.vectorToLocalFrame(CANNON.Vector3.Y_AXIS);
            _this.zA = bodyA.vectorToLocalFrame(CANNON.Vector3.Z_AXIS);
            _this.zB = bodyB.vectorToLocalFrame(CANNON.Vector3.Z_AXIS);
            // ...and the following rotational equations will keep all rotational DOF's in place
            var r1 = _this.rotationalEquation1 = new CANNON.RotationalEquation(bodyA, bodyB, options);
            var r2 = _this.rotationalEquation2 = new CANNON.RotationalEquation(bodyA, bodyB, options);
            var r3 = _this.rotationalEquation3 = new CANNON.RotationalEquation(bodyA, bodyB, options);
            _this.equations.push(r1, r2, r3);
            return _this;
        }
        LockConstraint.prototype.update = function () {
            var bodyA = this.bodyA, bodyB = this.bodyB, motor = this.motorEquation, r1 = this.rotationalEquation1, r2 = this.rotationalEquation2, r3 = this.rotationalEquation3, worldAxisA = LockConstraint_update_tmpVec1, worldAxisB = LockConstraint_update_tmpVec2;
            _super.prototype.update.call(this);
            // These vector pairs must be orthogonal
            bodyA.vectorToWorldFrame(this.xA, r1.axisA);
            bodyB.vectorToWorldFrame(this.yB, r1.axisB);
            bodyA.vectorToWorldFrame(this.yA, r2.axisA);
            bodyB.vectorToWorldFrame(this.zB, r2.axisB);
            bodyA.vectorToWorldFrame(this.zA, r3.axisA);
            bodyB.vectorToWorldFrame(this.xB, r3.axisB);
        };
        ;
        return LockConstraint;
    }(CANNON.PointToPointConstraint));
    CANNON.LockConstraint = LockConstraint;
    var LockConstraint_update_tmpVec1 = new CANNON.Vector3();
    var LockConstraint_update_tmpVec2 = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Shape = /** @class */ (function () {
        /**
         * Base class for shapes
         *
         * @param options
         * @author schteppe
         */
        function Shape(options) {
            if (options === void 0) { options = {}; }
            this.id = Shape.idCounter++;
            this.type = options.type || 0;
            this.boundingSphereRadius = 0;
            this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;
            this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;
            this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;
            this.material = options.material ? options.material : null;
            this.body = null;
        }
        /**
         * Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
         */
        Shape.prototype.updateBoundingSphereRadius = function () {
            throw "computeBoundingSphereRadius() not implemented for shape type " + this.type;
        };
        /**
         * Get the volume of this shape
         */
        Shape.prototype.volume = function () {
            throw "volume() not implemented for shape type " + this.type;
        };
        /**
         * Calculates the inertia in the local frame for this shape.
         * @param mass
         * @param target
         * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
         */
        Shape.prototype.calculateLocalInertia = function (mass, target) {
            throw "calculateLocalInertia() not implemented for shape type " + this.type;
        };
        Shape.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            throw "未实现";
        };
        Shape.idCounter = 0;
        /**
         * The available shape types.
         */
        Shape.types = {
            SPHERE: 1,
            PLANE: 2,
            BOX: 4,
            COMPOUND: 8,
            CONVEXPOLYHEDRON: 16,
            HEIGHTFIELD: 32,
            PARTICLE: 64,
            CYLINDER: 128,
            TRIMESH: 256
        };
        return Shape;
    }());
    CANNON.Shape = Shape;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ConvexPolyhedron = /** @class */ (function (_super) {
        __extends(ConvexPolyhedron, _super);
        /**
         * A set of polygons describing a convex shape.
         * @class ConvexPolyhedron
         * @constructor
         * @extends Shape
         * @description The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
         * in the same 3D plane), instead these should be merged into one polygon.
         *
         * @param {array} points An array of Vec3's
         * @param {array} faces Array of integer arrays, describing which vertices that is included in each face.
         *
         * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
         * @author schteppe / https://github.com/schteppe
         * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         *
         * @todo Move the clipping functions to ContactGenerator?
         * @todo Automatically merge coplanar polygons in constructor.
         */
        function ConvexPolyhedron(points, faces, uniqueAxes) {
            var _this = _super.call(this, {
                type: CANNON.Shape.types.CONVEXPOLYHEDRON
            }) || this;
            _this.vertices = points || [];
            _this.worldVertices = []; // World transformed version of .vertices
            _this.worldVerticesNeedsUpdate = true;
            _this.faces = faces || [];
            _this.faceNormals = [];
            _this.computeNormals();
            _this.worldFaceNormalsNeedsUpdate = true;
            _this.worldFaceNormals = []; // World transformed version of .faceNormals
            _this.uniqueEdges = [];
            _this.uniqueAxes = uniqueAxes ? uniqueAxes.slice() : null;
            _this.computeEdges();
            _this.updateBoundingSphereRadius();
            return _this;
        }
        /**
         * Computes uniqueEdges
         */
        ConvexPolyhedron.prototype.computeEdges = function () {
            var faces = this.faces;
            var vertices = this.vertices;
            var nv = vertices.length;
            var edges = this.uniqueEdges;
            edges.length = 0;
            var edge = computeEdges_tmpEdge;
            for (var i = 0; i !== faces.length; i++) {
                var face = faces[i];
                var numVertices = face.length;
                for (var j = 0; j !== numVertices; j++) {
                    var k = (j + 1) % numVertices;
                    vertices[face[j]].subTo(vertices[face[k]], edge);
                    edge.normalize();
                    var found = false;
                    for (var p = 0; p !== edges.length; p++) {
                        if (edges[p].equals(edge) || edges[p].equals(edge)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        edges.push(edge.clone());
                    }
                }
            }
        };
        /**
         * Compute the normals of the faces. Will reuse existing Vec3 objects in the .faceNormals array if they exist.
         */
        ConvexPolyhedron.prototype.computeNormals = function () {
            this.faceNormals.length = this.faces.length;
            // Generate normals
            for (var i = 0; i < this.faces.length; i++) {
                // Check so all vertices exists for this face
                for (var j = 0; j < this.faces[i].length; j++) {
                    if (!this.vertices[this.faces[i][j]]) {
                        throw new Error("Vertex " + this.faces[i][j] + " not found!");
                    }
                }
                var n = this.faceNormals[i] || new CANNON.Vector3();
                this.getFaceNormal(i, n);
                n.negateTo(n);
                this.faceNormals[i] = n;
                var vertex = this.vertices[this.faces[i][0]];
                if (n.dot(vertex) < 0) {
                    console.error(".faceNormals[" + i + "] = Vec3(" + n.toString() + ") looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.");
                    for (var j = 0; j < this.faces[i].length; j++) {
                        console.warn(".vertices[" + this.faces[i][j] + "] = Vec3(" + this.vertices[this.faces[i][j]].toString() + ")");
                    }
                }
            }
        };
        /**
         * Get face normal given 3 vertices
         *
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        ConvexPolyhedron.computeNormal = function (va, vb, vc, target) {
            vb.subTo(va, ab);
            vc.subTo(vb, cb);
            cb.crossTo(ab, target);
            if (!target.isZero()) {
                target.normalize();
            }
        };
        /**
         * Compute the normal of a face from its vertices
         *
         * @param i
         * @param target
         */
        ConvexPolyhedron.prototype.getFaceNormal = function (i, target) {
            var f = this.faces[i];
            var va = this.vertices[f[0]];
            var vb = this.vertices[f[1]];
            var vc = this.vertices[f[2]];
            return ConvexPolyhedron.computeNormal(va, vb, vc, target);
        };
        /**
         * @param posA
         * @param quatA
         * @param hullB
         * @param posB
         * @param quatB
         * @param separatingNormal
         * @param minDist Clamp distance
         * @param maxDist
         * @param result The an array of contact point objects, see clipFaceAgainstHull
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         */
        ConvexPolyhedron.prototype.clipAgainstHull = function (posA, quatA, hullB, posB, quatB, separatingNormal, minDist, maxDist, result) {
            var WorldNormal = cah_WorldNormal;
            var hullA = this;
            var curMaxDist = maxDist;
            var closestFaceB = -1;
            var dmax = -Number.MAX_VALUE;
            for (var face = 0; face < hullB.faces.length; face++) {
                WorldNormal.copy(hullB.faceNormals[face]);
                quatB.vmult(WorldNormal, WorldNormal);
                //posB.addTo(WorldNormal,WorldNormal);
                var d = WorldNormal.dot(separatingNormal);
                if (d > dmax) {
                    dmax = d;
                    closestFaceB = face;
                }
            }
            var worldVertsB1 = [];
            var polyB = hullB.faces[closestFaceB];
            var numVertices = polyB.length;
            for (var e0 = 0; e0 < numVertices; e0++) {
                var b = hullB.vertices[polyB[e0]];
                var worldb = new CANNON.Vector3();
                worldb.copy(b);
                quatB.vmult(worldb, worldb);
                posB.addTo(worldb, worldb);
                worldVertsB1.push(worldb);
            }
            if (closestFaceB >= 0) {
                this.clipFaceAgainstHull(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result);
            }
        };
        /**
         * Find the separating axis between this hull and another
         *
         * @param hullB
         * @param posA
         * @param quatA
         * @param posB
         * @param quatB
         * @param target The target vector to save the axis in
         * @param faceListA
         * @param faceListB
         * @returns Returns false if a separation is found, else true
         */
        ConvexPolyhedron.prototype.findSeparatingAxis = function (hullB, posA, quatA, posB, quatB, target, faceListA, faceListB) {
            var faceANormalWS3 = fsa_faceANormalWS3, Worldnormal1 = fsa_Worldnormal1, deltaC = fsa_deltaC, worldEdge0 = fsa_worldEdge0, worldEdge1 = fsa_worldEdge1, Cross = fsa_Cross;
            var dmin = Number.MAX_VALUE;
            var hullA = this;
            var curPlaneTests = 0;
            if (!hullA.uniqueAxes) {
                var numFacesA = faceListA ? faceListA.length : hullA.faces.length;
                // Test face normals from hullA
                for (var i = 0; i < numFacesA; i++) {
                    var fi = faceListA ? faceListA[i] : i;
                    // Get world face normal
                    faceANormalWS3.copy(hullA.faceNormals[fi]);
                    quatA.vmult(faceANormalWS3, faceANormalWS3);
                    var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(faceANormalWS3);
                    }
                }
            }
            else {
                // Test unique axes
                for (var i = 0; i !== hullA.uniqueAxes.length; i++) {
                    // Get world axis
                    quatA.vmult(hullA.uniqueAxes[i], faceANormalWS3);
                    var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(faceANormalWS3);
                    }
                }
            }
            if (!hullB.uniqueAxes) {
                // Test face normals from hullB
                var numFacesB = faceListB ? faceListB.length : hullB.faces.length;
                for (var i = 0; i < numFacesB; i++) {
                    var fi = faceListB ? faceListB[i] : i;
                    Worldnormal1.copy(hullB.faceNormals[fi]);
                    quatB.vmult(Worldnormal1, Worldnormal1);
                    curPlaneTests++;
                    var d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(Worldnormal1);
                    }
                }
            }
            else {
                // Test unique axes in B
                for (var i = 0; i !== hullB.uniqueAxes.length; i++) {
                    quatB.vmult(hullB.uniqueAxes[i], Worldnormal1);
                    curPlaneTests++;
                    var d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(Worldnormal1);
                    }
                }
            }
            // Test edges
            for (var e0 = 0; e0 !== hullA.uniqueEdges.length; e0++) {
                // Get world edge
                quatA.vmult(hullA.uniqueEdges[e0], worldEdge0);
                for (var e1 = 0; e1 !== hullB.uniqueEdges.length; e1++) {
                    // Get world edge 2
                    quatB.vmult(hullB.uniqueEdges[e1], worldEdge1);
                    worldEdge0.crossTo(worldEdge1, Cross);
                    if (!Cross.equals(CANNON.Vector3.ZERO)) {
                        Cross.normalize();
                        var dist = hullA.testSepAxis(Cross, hullB, posA, quatA, posB, quatB);
                        if (dist === false) {
                            return false;
                        }
                        if (dist < dmin) {
                            dmin = dist;
                            target.copy(Cross);
                        }
                    }
                }
            }
            posB.subTo(posA, deltaC);
            if ((deltaC.dot(target)) > 0.0) {
                target.negateTo(target);
            }
            return true;
        };
        /**
         * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
         *
         * @param axis
         * @param hullB
         * @param posA
         * @param quatA
         * @param posB
         * @param quatB
         * @return The overlap depth, or FALSE if no penetration.
         */
        ConvexPolyhedron.prototype.testSepAxis = function (axis, hullB, posA, quatA, posB, quatB) {
            var hullA = this;
            ConvexPolyhedron.project(hullA, axis, posA, quatA, maxminA);
            ConvexPolyhedron.project(hullB, axis, posB, quatB, maxminB);
            var maxA = maxminA[0];
            var minA = maxminA[1];
            var maxB = maxminB[0];
            var minB = maxminB[1];
            if (maxA < minB || maxB < minA) {
                return false; // Separated
            }
            var d0 = maxA - minB;
            var d1 = maxB - minA;
            var depth = d0 < d1 ? d0 : d1;
            return depth;
        };
        /**
         *
         * @param mass
         * @param target
         */
        ConvexPolyhedron.prototype.calculateLocalInertia = function (mass, target) {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            this.computeLocalAABB(cli_aabbmin, cli_aabbmax);
            var x = cli_aabbmax.x - cli_aabbmin.x, y = cli_aabbmax.y - cli_aabbmin.y, z = cli_aabbmax.z - cli_aabbmin.z;
            target.x = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z);
            target.y = 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z);
            target.z = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x);
        };
        /**
         *
         * @param face_i Index of the face
         */
        ConvexPolyhedron.prototype.getPlaneConstantOfFace = function (face_i) {
            var f = this.faces[face_i];
            var n = this.faceNormals[face_i];
            var v = this.vertices[f[0]];
            var c = -n.dot(v);
            return c;
        };
        /**
         * Clip a face against a hull.
         *
         * @param separatingNormal
         * @param posA
         * @param quatA
         * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
         * @param minDist Distance clamping
         * @param maxDist
         * @param result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
         */
        ConvexPolyhedron.prototype.clipFaceAgainstHull = function (separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result) {
            var faceANormalWS = cfah_faceANormalWS, edge0 = cfah_edge0, WorldEdge0 = cfah_WorldEdge0, worldPlaneAnormal1 = cfah_worldPlaneAnormal1, planeNormalWS1 = cfah_planeNormalWS1, worldA1 = cfah_worldA1, localPlaneNormal = cfah_localPlaneNormal, planeNormalWS = cfah_planeNormalWS;
            var hullA = this;
            var worldVertsB2 = [];
            var pVtxIn = worldVertsB1;
            var pVtxOut = worldVertsB2;
            // Find the face with normal closest to the separating axis
            var closestFaceA = -1;
            var dmin = Number.MAX_VALUE;
            for (var face = 0; face < hullA.faces.length; face++) {
                faceANormalWS.copy(hullA.faceNormals[face]);
                quatA.vmult(faceANormalWS, faceANormalWS);
                //posA.addTo(faceANormalWS,faceANormalWS);
                var d = faceANormalWS.dot(separatingNormal);
                if (d < dmin) {
                    dmin = d;
                    closestFaceA = face;
                }
            }
            if (closestFaceA < 0) {
                // console.log("--- did not find any closest face... ---");
                return;
            }
            //console.log("closest A: ",closestFaceA);
            // Get the face and construct connected faces
            var polyA = hullA.faces[closestFaceA];
            polyA.connectedFaces = [];
            for (var i = 0; i < hullA.faces.length; i++) {
                for (var j = 0; j < hullA.faces[i].length; j++) {
                    if (polyA.indexOf(hullA.faces[i][j]) !== -1 /* Sharing a vertex*/ && i !== closestFaceA /* Not the one we are looking for connections from */ && polyA.connectedFaces.indexOf(i) === -1 /* Not already added */) {
                        polyA.connectedFaces.push(i);
                    }
                }
            }
            // Clip the polygon to the back of the planes of all faces of hull A, that are adjacent to the witness face
            var numContacts = pVtxIn.length;
            var numVerticesA = polyA.length;
            var res = [];
            for (var e0 = 0; e0 < numVerticesA; e0++) {
                var a = hullA.vertices[polyA[e0]];
                var b = hullA.vertices[polyA[(e0 + 1) % numVerticesA]];
                a.subTo(b, edge0);
                WorldEdge0.copy(edge0);
                quatA.vmult(WorldEdge0, WorldEdge0);
                posA.addTo(WorldEdge0, WorldEdge0);
                worldPlaneAnormal1.copy(this.faceNormals[closestFaceA]); //transA.getBasis()* btVector3(polyA.m_plane[0],polyA.m_plane[1],polyA.m_plane[2]);
                quatA.vmult(worldPlaneAnormal1, worldPlaneAnormal1);
                posA.addTo(worldPlaneAnormal1, worldPlaneAnormal1);
                WorldEdge0.crossTo(worldPlaneAnormal1, planeNormalWS1);
                planeNormalWS1.negateTo(planeNormalWS1);
                worldA1.copy(a);
                quatA.vmult(worldA1, worldA1);
                posA.addTo(worldA1, worldA1);
                var planeEqWS1 = -worldA1.dot(planeNormalWS1);
                var planeEqWS;
                if (true) {
                    var otherFace = polyA.connectedFaces[e0];
                    localPlaneNormal.copy(this.faceNormals[otherFace]);
                    var localPlaneEq = this.getPlaneConstantOfFace(otherFace);
                    planeNormalWS.copy(localPlaneNormal);
                    quatA.vmult(planeNormalWS, planeNormalWS);
                    //posA.addTo(planeNormalWS,planeNormalWS);
                    var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
                }
                else {
                    planeNormalWS.copy(planeNormalWS1);
                    planeEqWS = planeEqWS1;
                }
                // Clip face against our constructed plane
                this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);
                // Throw away all clipped points, but save the reamining until next clip
                while (pVtxIn.length) {
                    pVtxIn.shift();
                }
                while (pVtxOut.length) {
                    pVtxIn.push(pVtxOut.shift());
                }
            }
            //console.log("Resulting points after clip:",pVtxIn);
            // only keep contact points that are behind the witness face
            localPlaneNormal.copy(this.faceNormals[closestFaceA]);
            var localPlaneEq = this.getPlaneConstantOfFace(closestFaceA);
            planeNormalWS.copy(localPlaneNormal);
            quatA.vmult(planeNormalWS, planeNormalWS);
            var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            for (var i = 0; i < pVtxIn.length; i++) {
                var depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; //???
                /*console.log("depth calc from normal=",planeNormalWS.toString()," and constant "+planeEqWS+" and vertex ",pVtxIn[i].toString()," gives "+depth);*/
                if (depth <= minDist) {
                    console.log("clamped: depth=" + depth + " to minDist=" + (minDist + ""));
                    depth = minDist;
                }
                if (depth <= maxDist) {
                    var point = pVtxIn[i];
                    if (depth <= 0) {
                        /*console.log("Got contact point ",point.toString(),
                          ", depth=",depth,
                          "contact normal=",separatingNormal.toString(),
                          "plane",planeNormalWS.toString(),
                          "planeConstant",planeEqWS);*/
                        var p = {
                            point: point,
                            normal: planeNormalWS,
                            depth: depth,
                        };
                        result.push(p);
                    }
                }
            }
        };
        /**
         * Clip a face in a hull against the back of a plane.
         *
         * @param inVertices
         * @param outVertices
         * @param planeNormal
         * @param planeConstant The constant in the mathematical plane equation
         */
        ConvexPolyhedron.prototype.clipFaceAgainstPlane = function (inVertices, outVertices, planeNormal, planeConstant) {
            var n_dot_first, n_dot_last;
            var numVerts = inVertices.length;
            if (numVerts < 2) {
                return outVertices;
            }
            var firstVertex = inVertices[inVertices.length - 1], lastVertex = inVertices[0];
            n_dot_first = planeNormal.dot(firstVertex) + planeConstant;
            for (var vi = 0; vi < numVerts; vi++) {
                lastVertex = inVertices[vi];
                n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
                if (n_dot_first < 0) {
                    if (n_dot_last < 0) {
                        // Start < 0, end < 0, so output lastVertex
                        var newv = new CANNON.Vector3();
                        newv.copy(lastVertex);
                        outVertices.push(newv);
                    }
                    else {
                        // Start < 0, end >= 0, so output intersection
                        var newv = new CANNON.Vector3();
                        firstVertex.lerpNumberTo(lastVertex, n_dot_first / (n_dot_first - n_dot_last), newv);
                        outVertices.push(newv);
                    }
                }
                else {
                    if (n_dot_last < 0) {
                        // Start >= 0, end < 0 so output intersection and end
                        var newv = new CANNON.Vector3();
                        firstVertex.lerpNumberTo(lastVertex, n_dot_first / (n_dot_first - n_dot_last), newv);
                        outVertices.push(newv);
                        outVertices.push(lastVertex);
                    }
                }
                firstVertex = lastVertex;
                n_dot_first = n_dot_last;
            }
            return outVertices;
        };
        // Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
        ConvexPolyhedron.prototype.computeWorldVertices = function (position, quat) {
            var N = this.vertices.length;
            while (this.worldVertices.length < N) {
                this.worldVertices.push(new CANNON.Vector3());
            }
            var verts = this.vertices, worldVerts = this.worldVertices;
            for (var i = 0; i !== N; i++) {
                quat.vmult(verts[i], worldVerts[i]);
                position.addTo(worldVerts[i], worldVerts[i]);
            }
            this.worldVerticesNeedsUpdate = false;
        };
        ConvexPolyhedron.prototype.computeLocalAABB = function (aabbmin, aabbmax) {
            var n = this.vertices.length, vertices = this.vertices, worldVert = computeLocalAABB_worldVert;
            aabbmin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            aabbmax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var i = 0; i < n; i++) {
                var v = vertices[i];
                if (v.x < aabbmin.x) {
                    aabbmin.x = v.x;
                }
                else if (v.x > aabbmax.x) {
                    aabbmax.x = v.x;
                }
                if (v.y < aabbmin.y) {
                    aabbmin.y = v.y;
                }
                else if (v.y > aabbmax.y) {
                    aabbmax.y = v.y;
                }
                if (v.z < aabbmin.z) {
                    aabbmin.z = v.z;
                }
                else if (v.z > aabbmax.z) {
                    aabbmax.z = v.z;
                }
            }
        };
        /**
         * Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
         *
         * @param quat
         */
        ConvexPolyhedron.prototype.computeWorldFaceNormals = function (quat) {
            var N = this.faceNormals.length;
            while (this.worldFaceNormals.length < N) {
                this.worldFaceNormals.push(new CANNON.Vector3());
            }
            var normals = this.faceNormals, worldNormals = this.worldFaceNormals;
            for (var i = 0; i !== N; i++) {
                quat.vmult(normals[i], worldNormals[i]);
            }
            this.worldFaceNormalsNeedsUpdate = false;
        };
        ;
        ConvexPolyhedron.prototype.updateBoundingSphereRadius = function () {
            // Assume points are distributed with local (0,0,0) as center
            var max2 = 0;
            var verts = this.vertices;
            for (var i = 0, N = verts.length; i !== N; i++) {
                var norm2 = verts[i].lengthSquared;
                if (norm2 > max2) {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        };
        /**
         *
         * @param  pos
         * @param quat
         * @param min
         * @param max
         */
        ConvexPolyhedron.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            var n = this.vertices.length, verts = this.vertices;
            var minx, miny, minz, maxx, maxy, maxz;
            for (var i = 0; i < n; i++) {
                tempWorldVertex.copy(verts[i]);
                quat.vmult(tempWorldVertex, tempWorldVertex);
                pos.addTo(tempWorldVertex, tempWorldVertex);
                var v = tempWorldVertex;
                if (v.x < minx || minx === undefined) {
                    minx = v.x;
                }
                else if (v.x > maxx || maxx === undefined) {
                    maxx = v.x;
                }
                if (v.y < miny || miny === undefined) {
                    miny = v.y;
                }
                else if (v.y > maxy || maxy === undefined) {
                    maxy = v.y;
                }
                if (v.z < minz || minz === undefined) {
                    minz = v.z;
                }
                else if (v.z > maxz || maxz === undefined) {
                    maxz = v.z;
                }
            }
            min.set(minx, miny, minz);
            max.set(maxx, maxy, maxz);
        };
        /**
         * Get approximate convex volume
         */
        ConvexPolyhedron.prototype.volume = function () {
            return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
        };
        /**
         * Get an average of all the vertices positions
         *
         * @param target
         */
        ConvexPolyhedron.prototype.getAveragePointLocal = function (target) {
            target = target || new CANNON.Vector3();
            var n = this.vertices.length, verts = this.vertices;
            for (var i = 0; i < n; i++) {
                target.addTo(verts[i], target);
            }
            target.scaleNumberTo(1 / n, target);
            return target;
        };
        /**
         * Transform all local points. Will change the .vertices
         *
         * @param  offset
         * @param quat
         */
        ConvexPolyhedron.prototype.transformAllPoints = function (offset, quat) {
            var n = this.vertices.length, verts = this.vertices;
            // Apply rotation
            if (quat) {
                // Rotate vertices
                for (var i = 0; i < n; i++) {
                    var v = verts[i];
                    quat.vmult(v, v);
                }
                // Rotate face normals
                for (var i = 0; i < this.faceNormals.length; i++) {
                    var v = this.faceNormals[i];
                    quat.vmult(v, v);
                }
                /*
                // Rotate edges
                for(var i=0; i<this.uniqueEdges.length; i++){
                    var v = this.uniqueEdges[i];
                    quat.vmult(v,v);
                }*/
            }
            // Apply offset
            if (offset) {
                for (var i = 0; i < n; i++) {
                    var v = verts[i];
                    v.addTo(offset, v);
                }
            }
        };
        /**
         * Checks whether p is inside the polyhedra. Must be in local coords. The point lies outside of the convex hull of the other points if and only if the direction of all the vectors from it to those other points are on less than one half of a sphere around it.
         *
         * @param p      A point given in local coordinates
         */
        ConvexPolyhedron.prototype.pointIsInside = function (p) {
            var n = this.vertices.length, verts = this.vertices, faces = this.faces, normals = this.faceNormals;
            var positiveResult = null;
            var N = this.faces.length;
            var pointInside = ConvexPolyhedron_pointIsInside;
            this.getAveragePointLocal(pointInside);
            for (var i = 0; i < N; i++) {
                var numVertices = this.faces[i].length;
                var n0 = normals[i];
                var v = verts[faces[i][0]]; // We only need one point in the face
                // This dot product determines which side of the edge the point is
                var vToP = ConvexPolyhedron_vToP;
                p.subTo(v, vToP);
                var r1 = n0.dot(vToP);
                var vToPointInside = ConvexPolyhedron_vToPointInside;
                pointInside.subTo(v, vToPointInside);
                var r2 = n0.dot(vToPointInside);
                if ((r1 < 0 && r2 > 0) || (r1 > 0 && r2 < 0)) {
                    return false; // Encountered some other sign. Exit.
                }
                else {
                }
            }
            // If we got here, all dot products were of the same sign.
            return positiveResult ? 1 : -1;
        };
        /**
         * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
         *
         * @param hull
         * @param axis
         * @param pos
         * @param quat
         * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
         */
        ConvexPolyhedron.project = function (hull, axis, pos, quat, result) {
            var n = hull.vertices.length, worldVertex = project_worldVertex, localAxis = project_localAxis, max = 0, min = 0, localOrigin = project_localOrigin, vs = hull.vertices;
            localOrigin.setZero();
            // Transform the axis to local
            CANNON.Transform.vectorToLocalFrame(pos, quat, axis, localAxis);
            CANNON.Transform.pointToLocalFrame(pos, quat, localOrigin, localOrigin);
            var add = localOrigin.dot(localAxis);
            min = max = vs[0].dot(localAxis);
            for (var i = 1; i < n; i++) {
                var val = vs[i].dot(localAxis);
                if (val > max) {
                    max = val;
                }
                if (val < min) {
                    min = val;
                }
            }
            min -= add;
            max -= add;
            if (min > max) {
                // Inconsistent - swap
                var temp = min;
                min = max;
                max = temp;
            }
            // Output
            result[0] = max;
            result[1] = min;
        };
        ;
        return ConvexPolyhedron;
    }(CANNON.Shape));
    CANNON.ConvexPolyhedron = ConvexPolyhedron;
    var computeEdges_tmpEdge = new CANNON.Vector3();
    var cb = new CANNON.Vector3();
    var ab = new CANNON.Vector3();
    var cah_WorldNormal = new CANNON.Vector3();
    var fsa_faceANormalWS3 = new CANNON.Vector3();
    var fsa_Worldnormal1 = new CANNON.Vector3();
    var fsa_deltaC = new CANNON.Vector3();
    var fsa_worldEdge0 = new CANNON.Vector3();
    var fsa_worldEdge1 = new CANNON.Vector3();
    var fsa_Cross = new CANNON.Vector3();
    var maxminA = [], maxminB = [];
    var cli_aabbmin = new CANNON.Vector3();
    var cli_aabbmax = new CANNON.Vector3();
    var cfah_faceANormalWS = new CANNON.Vector3();
    var cfah_edge0 = new CANNON.Vector3();
    var cfah_WorldEdge0 = new CANNON.Vector3();
    var cfah_worldPlaneAnormal1 = new CANNON.Vector3();
    var cfah_planeNormalWS1 = new CANNON.Vector3();
    var cfah_worldA1 = new CANNON.Vector3();
    var cfah_localPlaneNormal = new CANNON.Vector3();
    var cfah_planeNormalWS = new CANNON.Vector3();
    var computeLocalAABB_worldVert = new CANNON.Vector3();
    var tempWorldVertex = new CANNON.Vector3();
    var ConvexPolyhedron_pointIsInside = new CANNON.Vector3();
    var ConvexPolyhedron_vToP = new CANNON.Vector3();
    var ConvexPolyhedron_vToPointInside = new CANNON.Vector3();
    var project_worldVertex = new CANNON.Vector3();
    var project_localAxis = new CANNON.Vector3();
    var project_localOrigin = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Box = /** @class */ (function (_super) {
        __extends(Box, _super);
        /**
         * A 3d box shape.
         * @param halfExtents
         * @author schteppe
         */
        function Box(halfExtents) {
            var _this = _super.call(this, {
                type: CANNON.Shape.types.BOX
            }) || this;
            _this.halfExtents = halfExtents;
            _this.convexPolyhedronRepresentation = null;
            _this.updateConvexPolyhedronRepresentation();
            _this.updateBoundingSphereRadius();
            return _this;
        }
        /**
         * Updates the local convex polyhedron representation used for some collisions.
         */
        Box.prototype.updateConvexPolyhedronRepresentation = function () {
            var sx = this.halfExtents.x;
            var sy = this.halfExtents.y;
            var sz = this.halfExtents.z;
            var V = CANNON.Vector3;
            var vertices = [
                new V(-sx, -sy, -sz),
                new V(sx, -sy, -sz),
                new V(sx, sy, -sz),
                new V(-sx, sy, -sz),
                new V(-sx, -sy, sz),
                new V(sx, -sy, sz),
                new V(sx, sy, sz),
                new V(-sx, sy, sz)
            ];
            var indices = [
                [3, 2, 1, 0],
                [4, 5, 6, 7],
                [5, 4, 0, 1],
                [2, 3, 7, 6],
                [0, 4, 7, 3],
                [1, 2, 6, 5],
            ];
            var axes = [
                new V(0, 0, 1),
                new V(0, 1, 0),
                new V(1, 0, 0)
            ];
            var h = new CANNON.ConvexPolyhedron(vertices, indices);
            this.convexPolyhedronRepresentation = h;
            h.material = this.material;
        };
        Box.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new CANNON.Vector3(); }
            Box.calculateInertia(this.halfExtents, mass, target);
            return target;
        };
        Box.calculateInertia = function (halfExtents, mass, target) {
            var e = halfExtents;
            target.x = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z);
            target.y = 1.0 / 12.0 * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z);
            target.z = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x);
        };
        /**
         * Get the box 6 side normals
         * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
         * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
         */
        Box.prototype.getSideNormals = function (sixTargetVectors, quat) {
            var sides = sixTargetVectors;
            var ex = this.halfExtents;
            sides[0].set(ex.x, 0, 0);
            sides[1].set(0, ex.y, 0);
            sides[2].set(0, 0, ex.z);
            sides[3].set(-ex.x, 0, 0);
            sides[4].set(0, -ex.y, 0);
            sides[5].set(0, 0, -ex.z);
            if (quat !== undefined) {
                for (var i = 0; i !== sides.length; i++) {
                    quat.vmult(sides[i], sides[i]);
                }
            }
            return sides;
        };
        Box.prototype.volume = function () {
            return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
        };
        Box.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = this.halfExtents.length;
        };
        Box.prototype.forEachWorldCorner = function (pos, quat, callback) {
            var e = this.halfExtents;
            var corners = [[e.x, e.y, e.z],
                [-e.x, e.y, e.z],
                [-e.x, -e.y, e.z],
                [-e.x, -e.y, -e.z],
                [e.x, -e.y, -e.z],
                [e.x, e.y, -e.z],
                [-e.x, e.y, -e.z],
                [e.x, -e.y, e.z]];
            for (var i = 0; i < corners.length; i++) {
                worldCornerTempPos.set(corners[i][0], corners[i][1], corners[i][2]);
                quat.vmult(worldCornerTempPos, worldCornerTempPos);
                pos.addTo(worldCornerTempPos, worldCornerTempPos);
                callback(worldCornerTempPos.x, worldCornerTempPos.y, worldCornerTempPos.z);
            }
        };
        Box.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            var e = this.halfExtents;
            worldCornersTemp[0].set(e.x, e.y, e.z);
            worldCornersTemp[1].set(-e.x, e.y, e.z);
            worldCornersTemp[2].set(-e.x, -e.y, e.z);
            worldCornersTemp[3].set(-e.x, -e.y, -e.z);
            worldCornersTemp[4].set(e.x, -e.y, -e.z);
            worldCornersTemp[5].set(e.x, e.y, -e.z);
            worldCornersTemp[6].set(-e.x, e.y, -e.z);
            worldCornersTemp[7].set(e.x, -e.y, e.z);
            var wc = worldCornersTemp[0];
            quat.vmult(wc, wc);
            pos.addTo(wc, wc);
            max.copy(wc);
            min.copy(wc);
            for (var i = 1; i < 8; i++) {
                var wc = worldCornersTemp[i];
                quat.vmult(wc, wc);
                pos.addTo(wc, wc);
                var x = wc.x;
                var y = wc.y;
                var z = wc.z;
                if (x > max.x) {
                    max.x = x;
                }
                if (y > max.y) {
                    max.y = y;
                }
                if (z > max.z) {
                    max.z = z;
                }
                if (x < min.x) {
                    min.x = x;
                }
                if (y < min.y) {
                    min.y = y;
                }
                if (z < min.z) {
                    min.z = z;
                }
            }
            // Get each axis max
            // min.set(Infinity,Infinity,Infinity);
            // max.set(-Infinity,-Infinity,-Infinity);
            // this.forEachWorldCorner(pos,quat,function(x,y,z){
            //     if(x > max.x){
            //         max.x = x;
            //     }
            //     if(y > max.y){
            //         max.y = y;
            //     }
            //     if(z > max.z){
            //         max.z = z;
            //     }
            //     if(x < min.x){
            //         min.x = x;
            //     }
            //     if(y < min.y){
            //         min.y = y;
            //     }
            //     if(z < min.z){
            //         min.z = z;
            //     }
            // });
        };
        return Box;
    }(CANNON.Shape));
    CANNON.Box = Box;
    var worldCornerTempPos = new CANNON.Vector3();
    var worldCornerTempNeg = new CANNON.Vector3();
    var worldCornersTemp = [
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3()
    ];
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Cylinder = /** @class */ (function (_super) {
        __extends(Cylinder, _super);
        /**
         * @param radiusTop
         * @param radiusBottom
         * @param height
         * @param numSegments The number of segments to build the cylinder out of
         *
         * @author schteppe / https://github.com/schteppe
         */
        function Cylinder(radiusTop, radiusBottom, height, numSegments) {
            var _this = this;
            var N = numSegments, verts = [], axes = [], faces = [], bottomface = [], topface = [], cos = Math.cos, sin = Math.sin;
            // First bottom point
            verts.push(new CANNON.Vector3(radiusBottom * cos(0), radiusBottom * sin(0), -height * 0.5));
            bottomface.push(0);
            // First top point
            verts.push(new CANNON.Vector3(radiusTop * cos(0), radiusTop * sin(0), height * 0.5));
            topface.push(1);
            for (var i = 0; i < N; i++) {
                var theta = 2 * Math.PI / N * (i + 1);
                var thetaN = 2 * Math.PI / N * (i + 0.5);
                if (i < N - 1) {
                    // Bottom
                    verts.push(new CANNON.Vector3(radiusBottom * cos(theta), radiusBottom * sin(theta), -height * 0.5));
                    bottomface.push(2 * i + 2);
                    // Top
                    verts.push(new CANNON.Vector3(radiusTop * cos(theta), radiusTop * sin(theta), height * 0.5));
                    topface.push(2 * i + 3);
                    // Face
                    faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
                }
                else {
                    faces.push([0, 1, 2 * i + 1, 2 * i]); // Connect
                }
                // Axis: we can cut off half of them if we have even number of segments
                if (N % 2 === 1 || i < N / 2) {
                    axes.push(new CANNON.Vector3(cos(thetaN), sin(thetaN), 0));
                }
            }
            faces.push(topface);
            axes.push(new CANNON.Vector3(0, 0, 1));
            // Reorder bottom face
            var temp = [];
            for (var i = 0; i < bottomface.length; i++) {
                temp.push(bottomface[bottomface.length - i - 1]);
            }
            faces.push(temp);
            _this = _super.call(this, verts, faces, axes) || this;
            return _this;
        }
        return Cylinder;
    }(CANNON.ConvexPolyhedron));
    CANNON.Cylinder = Cylinder;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Heightfield = /** @class */ (function (_super) {
        __extends(Heightfield, _super);
        /**
         * Heightfield shape class. Height data is given as an array. These data points are spread out evenly with a given distance.
         *
         * @param data An array of Y values that will be used to construct the terrain.
         * @param options
         * @param options.minValue] Minimum value of the data points in the data array. Will be computed automatically if not given.
         * @param options.maxValue Maximum value.
         * @param options.elementSize=0.1 World spacing between the data points in X direction.
         * @todo Should be possible to use along all axes, not just y
         * @todo should be possible to scale along all axes
         *
         * @example
         *     // Generate some height data (y-values).
         *     var data = [];
         *     for(var i = 0; i < 1000; i++){
         *         var y = 0.5 * Math.cos(0.2 * i);
         *         data.push(y);
         *     }
         *
         *     // Create the heightfield shape
         *     var heightfieldShape = new Heightfield(data, {
         *         elementSize: 1 // Distance between the data points in X and Y directions
         *     });
         *     var heightfieldBody = new Body();
         *     heightfieldBody.addShape(heightfieldShape);
         *     world.addBody(heightfieldBody);
         */
        /**
         *
         * @param data
         * @param options
         */
        function Heightfield(data, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this) || this;
            options = CANNON.Utils.defaults(options, {
                maxValue: null,
                minValue: null,
                elementSize: 1
            });
            _this.data = data;
            _this.maxValue = options.maxValue;
            _this.minValue = options.minValue;
            _this.elementSize = options.elementSize;
            if (options.minValue === null) {
                _this.updateMinValue();
            }
            if (options.maxValue === null) {
                _this.updateMaxValue();
            }
            _this.cacheEnabled = true;
            CANNON.Shape.call(_this, {
                type: CANNON.Shape.types.HEIGHTFIELD
            });
            _this.pillarConvex = new CANNON.ConvexPolyhedron();
            _this.pillarOffset = new CANNON.Vector3();
            _this.updateBoundingSphereRadius();
            // "i_j_isUpper" => { convex: ..., offset: ... }
            // for example:
            // _cachedPillars["0_2_1"]
            _this._cachedPillars = {};
            return _this;
        }
        /**
         * Call whenever you change the data array.
         */
        Heightfield.prototype.update = function () {
            this._cachedPillars = {};
        };
        /**
         * Update the .minValue property
         */
        Heightfield.prototype.updateMinValue = function () {
            var data = this.data;
            var minValue = data[0][0];
            for (var i = 0; i !== data.length; i++) {
                for (var j = 0; j !== data[i].length; j++) {
                    var v = data[i][j];
                    if (v < minValue) {
                        minValue = v;
                    }
                }
            }
            this.minValue = minValue;
        };
        /**
         * Update the .maxValue property
         */
        Heightfield.prototype.updateMaxValue = function () {
            var data = this.data;
            var maxValue = data[0][0];
            for (var i = 0; i !== data.length; i++) {
                for (var j = 0; j !== data[i].length; j++) {
                    var v = data[i][j];
                    if (v > maxValue) {
                        maxValue = v;
                    }
                }
            }
            this.maxValue = maxValue;
        };
        /**
         * Set the height value at an index. Don't forget to update maxValue and minValue after you're done.
         *
         * @param xi
         * @param yi
         * @param value
         */
        Heightfield.prototype.setHeightValueAtIndex = function (xi, yi, value) {
            var data = this.data;
            data[xi][yi] = value;
            // Invalidate cache
            this.clearCachedConvexTrianglePillar(xi, yi, false);
            if (xi > 0) {
                this.clearCachedConvexTrianglePillar(xi - 1, yi, true);
                this.clearCachedConvexTrianglePillar(xi - 1, yi, false);
            }
            if (yi > 0) {
                this.clearCachedConvexTrianglePillar(xi, yi - 1, true);
                this.clearCachedConvexTrianglePillar(xi, yi - 1, false);
            }
            if (yi > 0 && xi > 0) {
                this.clearCachedConvexTrianglePillar(xi - 1, yi - 1, true);
            }
        };
        /**
         * Get max/min in a rectangle in the matrix data
         *
         * @param iMinX
         * @param iMinY
         * @param iMaxX
         * @param iMaxY
         * @param result An array to store the results in.
         * @return The result array, if it was passed in. Minimum will be at position 0 and max at 1.
         */
        Heightfield.prototype.getRectMinMax = function (iMinX, iMinY, iMaxX, iMaxY, result) {
            result = result || [];
            // Get max and min of the data
            var data = this.data, max = this.minValue; // Set first value
            for (var i = iMinX; i <= iMaxX; i++) {
                for (var j = iMinY; j <= iMaxY; j++) {
                    var height = data[i][j];
                    if (height > max) {
                        max = height;
                    }
                }
            }
            result[0] = this.minValue;
            result[1] = max;
        };
        /**
         * Get the index of a local position on the heightfield. The indexes indicate the rectangles, so if your terrain is made of N x N height data points, you will have rectangle indexes ranging from 0 to N-1.
         *
         * @param x
         * @param y
         * @param result Two-element array
         * @param clamp If the position should be clamped to the heightfield edge.
         */
        Heightfield.prototype.getIndexOfPosition = function (x, y, result, clamp) {
            // Get the index of the data points to test against
            var w = this.elementSize;
            var data = this.data;
            var xi = Math.floor(x / w);
            var yi = Math.floor(y / w);
            result[0] = xi;
            result[1] = yi;
            if (clamp) {
                // Clamp index to edges
                if (xi < 0) {
                    xi = 0;
                }
                if (yi < 0) {
                    yi = 0;
                }
                if (xi >= data.length - 1) {
                    xi = data.length - 1;
                }
                if (yi >= data[0].length - 1) {
                    yi = data[0].length - 1;
                }
            }
            // Bail out if we are out of the terrain
            if (xi < 0 || yi < 0 || xi >= data.length - 1 || yi >= data[0].length - 1) {
                return false;
            }
            return true;
        };
        Heightfield.prototype.getTriangleAt = function (x, y, edgeClamp, a, b, c) {
            var idx = getHeightAt_idx;
            this.getIndexOfPosition(x, y, idx, edgeClamp);
            var xi = idx[0];
            var yi = idx[1];
            var data = this.data;
            if (edgeClamp) {
                xi = Math.min(data.length - 2, Math.max(0, xi));
                yi = Math.min(data[0].length - 2, Math.max(0, yi));
            }
            var elementSize = this.elementSize;
            var lowerDist2 = Math.pow(x / elementSize - xi, 2) + Math.pow(y / elementSize - yi, 2);
            var upperDist2 = Math.pow(x / elementSize - (xi + 1), 2) + Math.pow(y / elementSize - (yi + 1), 2);
            var upper = lowerDist2 > upperDist2;
            this.getTriangle(xi, yi, upper, a, b, c);
            return upper;
        };
        Heightfield.prototype.getNormalAt = function (x, y, edgeClamp, result) {
            var a = getNormalAt_a;
            var b = getNormalAt_b;
            var c = getNormalAt_c;
            var e0 = getNormalAt_e0;
            var e1 = getNormalAt_e1;
            this.getTriangleAt(x, y, edgeClamp, a, b, c);
            b.subTo(a, e0);
            c.subTo(a, e1);
            e0.crossTo(e1, result);
            result.normalize();
        };
        /**
         * Get an AABB of a square in the heightfield
         *
         * @param xi
         * @param yi
         * @param result
         */
        Heightfield.prototype.getAabbAtIndex = function (xi, yi, result) {
            var data = this.data;
            var elementSize = this.elementSize;
            result.lowerBound.set(xi * elementSize, yi * elementSize, data[xi][yi]);
            result.upperBound.set((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1]);
        };
        /**
         * Get the height in the heightfield at a given position
         *
         * @param x
         * @param y
         * @param edgeClamp
         */
        Heightfield.prototype.getHeightAt = function (x, y, edgeClamp) {
            var data = this.data;
            var a = getHeightAt_a;
            var b = getHeightAt_b;
            var c = getHeightAt_c;
            var idx = getHeightAt_idx;
            this.getIndexOfPosition(x, y, idx, edgeClamp);
            var xi = idx[0];
            var yi = idx[1];
            if (edgeClamp) {
                xi = Math.min(data.length - 2, Math.max(0, xi));
                yi = Math.min(data[0].length - 2, Math.max(0, yi));
            }
            var upper = this.getTriangleAt(x, y, edgeClamp, a, b, c);
            barycentricWeights(x, y, a.x, a.y, b.x, b.y, c.x, c.y, getHeightAt_weights);
            var w = getHeightAt_weights;
            if (upper) {
                // Top triangle verts
                return data[xi + 1][yi + 1] * w.x + data[xi][yi + 1] * w.y + data[xi + 1][yi] * w.z;
            }
            else {
                // Top triangle verts
                return data[xi][yi] * w.x + data[xi + 1][yi] * w.y + data[xi][yi + 1] * w.z;
            }
        };
        Heightfield.prototype.getCacheConvexTrianglePillarKey = function (xi, yi, getUpperTriangle) {
            return xi + '_' + yi + '_' + (getUpperTriangle ? 1 : 0);
        };
        Heightfield.prototype.getCachedConvexTrianglePillar = function (xi, yi, getUpperTriangle) {
            return this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)];
        };
        Heightfield.prototype.setCachedConvexTrianglePillar = function (xi, yi, getUpperTriangle, convex, offset) {
            this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)] = {
                convex: convex,
                offset: offset
            };
        };
        Heightfield.prototype.clearCachedConvexTrianglePillar = function (xi, yi, getUpperTriangle) {
            delete this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)];
        };
        /**
         * Get a triangle from the heightfield
         *
         * @param xi
         * @param yi
         * @param upper
         * @param a
         * @param b
         * @param c
         */
        Heightfield.prototype.getTriangle = function (xi, yi, upper, a, b, c) {
            var data = this.data;
            var elementSize = this.elementSize;
            if (upper) {
                // Top triangle verts
                a.set((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1]);
                b.set(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1]);
                c.set((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi]);
            }
            else {
                // Top triangle verts
                a.set(xi * elementSize, yi * elementSize, data[xi][yi]);
                b.set((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi]);
                c.set(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1]);
            }
        };
        ;
        /**
         * Get a triangle in the terrain in the form of a triangular convex shape.
         *
         * @param i
         * @param j
         * @param getUpperTriangle
         */
        Heightfield.prototype.getConvexTrianglePillar = function (xi, yi, getUpperTriangle) {
            var result = this.pillarConvex;
            var offsetResult = this.pillarOffset;
            if (this.cacheEnabled) {
                var data0 = this.getCachedConvexTrianglePillar(xi, yi, getUpperTriangle);
                if (data0) {
                    this.pillarConvex = data0.convex;
                    this.pillarOffset = data0.offset;
                    return;
                }
                result = new CANNON.ConvexPolyhedron();
                offsetResult = new CANNON.Vector3();
                this.pillarConvex = result;
                this.pillarOffset = offsetResult;
            }
            var data = this.data;
            var elementSize = this.elementSize;
            var faces = result.faces;
            // Reuse verts if possible
            result.vertices.length = 6;
            for (var i = 0; i < 6; i++) {
                if (!result.vertices[i]) {
                    result.vertices[i] = new CANNON.Vector3();
                }
            }
            // Reuse faces if possible
            faces.length = 5;
            for (var i = 0; i < 5; i++) {
                if (!faces[i]) {
                    faces[i] = [];
                }
            }
            var verts = result.vertices;
            var h = (Math.min(data[xi][yi], data[xi + 1][yi], data[xi][yi + 1], data[xi + 1][yi + 1]) - this.minValue) / 2 + this.minValue;
            if (!getUpperTriangle) {
                // Center of the triangle pillar - all polygons are given relative to this one
                offsetResult.set((xi + 0.25) * elementSize, // sort of center of a triangle
                (yi + 0.25) * elementSize, h // vertical center
                );
                // Top triangle verts
                verts[0].set(-0.25 * elementSize, -0.25 * elementSize, data[xi][yi] - h);
                verts[1].set(0.75 * elementSize, -0.25 * elementSize, data[xi + 1][yi] - h);
                verts[2].set(-0.25 * elementSize, 0.75 * elementSize, data[xi][yi + 1] - h);
                // bottom triangle verts
                verts[3].set(-0.25 * elementSize, -0.25 * elementSize, -h - 1);
                verts[4].set(0.75 * elementSize, -0.25 * elementSize, -h - 1);
                verts[5].set(-0.25 * elementSize, 0.75 * elementSize, -h - 1);
                // top triangle
                faces[0][0] = 0;
                faces[0][1] = 1;
                faces[0][2] = 2;
                // bottom triangle
                faces[1][0] = 5;
                faces[1][1] = 4;
                faces[1][2] = 3;
                // -x facing quad
                faces[2][0] = 0;
                faces[2][1] = 2;
                faces[2][2] = 5;
                faces[2][3] = 3;
                // -y facing quad
                faces[3][0] = 1;
                faces[3][1] = 0;
                faces[3][2] = 3;
                faces[3][3] = 4;
                // +xy facing quad
                faces[4][0] = 4;
                faces[4][1] = 5;
                faces[4][2] = 2;
                faces[4][3] = 1;
            }
            else {
                // Center of the triangle pillar - all polygons are given relative to this one
                offsetResult.set((xi + 0.75) * elementSize, // sort of center of a triangle
                (yi + 0.75) * elementSize, h // vertical center
                );
                // Top triangle verts
                verts[0].set(0.25 * elementSize, 0.25 * elementSize, data[xi + 1][yi + 1] - h);
                verts[1].set(-0.75 * elementSize, 0.25 * elementSize, data[xi][yi + 1] - h);
                verts[2].set(0.25 * elementSize, -0.75 * elementSize, data[xi + 1][yi] - h);
                // bottom triangle verts
                verts[3].set(0.25 * elementSize, 0.25 * elementSize, -h - 1);
                verts[4].set(-0.75 * elementSize, 0.25 * elementSize, -h - 1);
                verts[5].set(0.25 * elementSize, -0.75 * elementSize, -h - 1);
                // Top triangle
                faces[0][0] = 0;
                faces[0][1] = 1;
                faces[0][2] = 2;
                // bottom triangle
                faces[1][0] = 5;
                faces[1][1] = 4;
                faces[1][2] = 3;
                // +x facing quad
                faces[2][0] = 2;
                faces[2][1] = 5;
                faces[2][2] = 3;
                faces[2][3] = 0;
                // +y facing quad
                faces[3][0] = 3;
                faces[3][1] = 4;
                faces[3][2] = 1;
                faces[3][3] = 0;
                // -xy facing quad
                faces[4][0] = 1;
                faces[4][1] = 4;
                faces[4][2] = 5;
                faces[4][3] = 2;
            }
            result.computeNormals();
            result.computeEdges();
            result.updateBoundingSphereRadius();
            this.setCachedConvexTrianglePillar(xi, yi, getUpperTriangle, result, offsetResult);
        };
        ;
        Heightfield.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new CANNON.Vector3(); }
            target.set(0, 0, 0);
            return target;
        };
        Heightfield.prototype.volume = function () {
            return Number.MAX_VALUE; // The terrain is infinite
        };
        Heightfield.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            // TODO: do it properly
            min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        };
        Heightfield.prototype.updateBoundingSphereRadius = function () {
            // Use the bounding box of the min/max values
            var data = this.data, s = this.elementSize;
            this.boundingSphereRadius = new CANNON.Vector3(data.length * s, data[0].length * s, Math.max(Math.abs(this.maxValue), Math.abs(this.minValue))).length;
        };
        /**
         * Sets the height values from an image. Currently only supported in browser.
         *
         * @param image
         * @param scale
         */
        Heightfield.prototype.setHeightsFromImage = function (image, scale) {
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var imageData = context.getImageData(0, 0, image.width, image.height);
            var matrix = this.data;
            matrix.length = 0;
            this.elementSize = Math.abs(scale.x) / imageData.width;
            for (var i = 0; i < imageData.height; i++) {
                var row = [];
                for (var j = 0; j < imageData.width; j++) {
                    var a = imageData.data[(i * imageData.height + j) * 4];
                    var b = imageData.data[(i * imageData.height + j) * 4 + 1];
                    var c = imageData.data[(i * imageData.height + j) * 4 + 2];
                    var height = (a + b + c) / 4 / 255 * scale.z;
                    if (scale.x < 0) {
                        row.push(height);
                    }
                    else {
                        row.unshift(height);
                    }
                }
                if (scale.y < 0) {
                    matrix.unshift(row);
                }
                else {
                    matrix.push(row);
                }
            }
            this.updateMaxValue();
            this.updateMinValue();
            this.update();
        };
        return Heightfield;
    }(CANNON.Shape));
    CANNON.Heightfield = Heightfield;
    var getHeightAt_idx = [];
    var getHeightAt_weights = new CANNON.Vector3();
    var getHeightAt_a = new CANNON.Vector3();
    var getHeightAt_b = new CANNON.Vector3();
    var getHeightAt_c = new CANNON.Vector3();
    var getNormalAt_a = new CANNON.Vector3();
    var getNormalAt_b = new CANNON.Vector3();
    var getNormalAt_c = new CANNON.Vector3();
    var getNormalAt_e0 = new CANNON.Vector3();
    var getNormalAt_e1 = new CANNON.Vector3();
    // from https://en.wikipedia.org/wiki/Barycentric_coordinate_system
    function barycentricWeights(x, y, ax, ay, bx, by, cx, cy, result) {
        result.x = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy));
        result.y = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy));
        result.z = 1 - result.x - result.y;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Particle = /** @class */ (function (_super) {
        __extends(Particle, _super);
        /**
         * Particle shape.
         *
         * @author schteppe
         */
        function Particle() {
            return _super.call(this, {
                type: CANNON.Shape.types.PARTICLE
            }) || this;
        }
        /**
         * @param mass
         * @param target
         */
        Particle.prototype.calculateLocalInertia = function (mass, target) {
            target = target || new CANNON.Vector3();
            target.set(0, 0, 0);
            return target;
        };
        Particle.prototype.volume = function () {
            return 0;
        };
        Particle.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = 0;
        };
        Particle.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            // Get each axis max
            min.copy(pos);
            max.copy(pos);
        };
        return Particle;
    }(CANNON.Shape));
    CANNON.Particle = Particle;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Plane = /** @class */ (function (_super) {
        __extends(Plane, _super);
        /**
         * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
         *
         * @author schteppe
         */
        function Plane() {
            var _this = _super.call(this, {
                type: CANNON.Shape.types.PLANE
            }) || this;
            // World oriented normal
            _this.worldNormal = new CANNON.Vector3();
            _this.worldNormalNeedsUpdate = true;
            _this.boundingSphereRadius = Number.MAX_VALUE;
            return _this;
        }
        Plane.prototype.computeWorldNormal = function (quat) {
            var n = this.worldNormal;
            n.copy(CANNON.World.worldNormal);
            quat.vmult(n, n);
            this.worldNormalNeedsUpdate = false;
        };
        Plane.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new CANNON.Vector3(); }
            return target;
        };
        Plane.prototype.volume = function () {
            return Number.MAX_VALUE; // The plane is infinite...
        };
        Plane.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            // The plane AABB is infinite, except if the normal is pointing along any axis
            tempNormal.copy(CANNON.World.worldNormal); // Default plane normal is z
            quat.vmult(tempNormal, tempNormal);
            var maxVal = Number.MAX_VALUE;
            min.set(-maxVal, -maxVal, -maxVal);
            max.set(maxVal, maxVal, maxVal);
            if (tempNormal.x === 1) {
                max.x = pos.x;
            }
            if (tempNormal.y === 1) {
                max.y = pos.y;
            }
            if (tempNormal.z === 1) {
                max.z = pos.z;
            }
            if (tempNormal.x === -1) {
                min.x = pos.x;
            }
            if (tempNormal.y === -1) {
                min.y = pos.y;
            }
            if (tempNormal.z === -1) {
                min.z = pos.z;
            }
        };
        Plane.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = Number.MAX_VALUE;
        };
        return Plane;
    }(CANNON.Shape));
    CANNON.Plane = Plane;
    var tempNormal = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Sphere = /** @class */ (function (_super) {
        __extends(Sphere, _super);
        /**
         * Spherical shape
         *
         * @param radius The radius of the sphere, a non-negative number.
         * @author schteppe / http://github.com/schteppe
         */
        function Sphere(radius) {
            var _this = _super.call(this, {
                type: CANNON.Shape.types.SPHERE
            }) || this;
            _this.radius = radius !== undefined ? radius : 1.0;
            if (_this.radius < 0) {
                throw new Error('The sphere radius cannot be negative.');
            }
            _this.updateBoundingSphereRadius();
            return _this;
        }
        Sphere.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new CANNON.Vector3(); }
            var I = 2.0 * mass * this.radius * this.radius / 5.0;
            target.x = I;
            target.y = I;
            target.z = I;
            return target;
        };
        Sphere.prototype.volume = function () {
            return 4.0 * Math.PI * this.radius / 3.0;
        };
        Sphere.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = this.radius;
        };
        Sphere.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            var r = this.radius;
            var axes = ['x', 'y', 'z'];
            for (var i = 0; i < axes.length; i++) {
                var ax = axes[i];
                min[ax] = pos[ax] - r;
                max[ax] = pos[ax] + r;
            }
        };
        return Sphere;
    }(CANNON.Shape));
    CANNON.Sphere = Sphere;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var AABB = /** @class */ (function () {
        /**
         *
         * @param options
         *
         * Axis aligned bounding box class.
         */
        function AABB(lowerBound, upperBound) {
            if (lowerBound === void 0) { lowerBound = new CANNON.Vector3(); }
            if (upperBound === void 0) { upperBound = new CANNON.Vector3(); }
            /**
             * The lower bound of the bounding box.
             */
            this.lowerBound = new CANNON.Vector3();
            /**
             * The upper bound of the bounding box.
             */
            this.upperBound = new CANNON.Vector3();
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
        }
        /**
         * Set the AABB bounds from a set of points.
         * @param points An array of Vec3's.
         * @param position
         * @param quaternion
         * @param skinSize
         * @return The self object
         */
        AABB.prototype.setFromPoints = function (points, position, quaternion, skinSize) {
            var l = this.lowerBound, u = this.upperBound, q = quaternion;
            // Set to the first point
            l.copy(points[0]);
            if (q) {
                q.vmult(l, l);
            }
            u.copy(l);
            for (var i = 1; i < points.length; i++) {
                var p = points[i];
                if (q) {
                    q.vmult(p, tmp);
                    p = tmp;
                }
                if (p.x > u.x) {
                    u.x = p.x;
                }
                if (p.x < l.x) {
                    l.x = p.x;
                }
                if (p.y > u.y) {
                    u.y = p.y;
                }
                if (p.y < l.y) {
                    l.y = p.y;
                }
                if (p.z > u.z) {
                    u.z = p.z;
                }
                if (p.z < l.z) {
                    l.z = p.z;
                }
            }
            // Add offset
            if (position) {
                position.addTo(l, l);
                position.addTo(u, u);
            }
            if (skinSize) {
                l.x -= skinSize;
                l.y -= skinSize;
                l.z -= skinSize;
                u.x += skinSize;
                u.y += skinSize;
                u.z += skinSize;
            }
            return this;
        };
        /**
         * Copy bounds from an AABB to this AABB
         * @param aabb Source to copy from
         * @return The this object, for chainability
         */
        AABB.prototype.copy = function (aabb) {
            this.lowerBound.copy(aabb.lowerBound);
            this.upperBound.copy(aabb.upperBound);
            return this;
        };
        /**
         * Clone an AABB
         */
        AABB.prototype.clone = function () {
            return new AABB().copy(this);
        };
        /**
         * Extend this AABB so that it covers the given AABB too.
         * @param aabb
         */
        AABB.prototype.extend = function (aabb) {
            this.lowerBound.x = Math.min(this.lowerBound.x, aabb.lowerBound.x);
            this.upperBound.x = Math.max(this.upperBound.x, aabb.upperBound.x);
            this.lowerBound.y = Math.min(this.lowerBound.y, aabb.lowerBound.y);
            this.upperBound.y = Math.max(this.upperBound.y, aabb.upperBound.y);
            this.lowerBound.z = Math.min(this.lowerBound.z, aabb.lowerBound.z);
            this.upperBound.z = Math.max(this.upperBound.z, aabb.upperBound.z);
        };
        /**
         * Returns true if the given AABB overlaps this AABB.
         * @param aabb
         */
        AABB.prototype.overlaps = function (aabb) {
            var l1 = this.lowerBound, u1 = this.upperBound, l2 = aabb.lowerBound, u2 = aabb.upperBound;
            //      l2        u2
            //      |---------|
            // |--------|
            // l1       u1
            var overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
            var overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
            var overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));
            return overlapsX && overlapsY && overlapsZ;
        };
        /**
         * Mostly for debugging
         */
        AABB.prototype.volume = function () {
            var l = this.lowerBound, u = this.upperBound;
            return (u.x - l.x) * (u.y - l.y) * (u.z - l.z);
        };
        /**
         * Returns true if the given AABB is fully contained in this AABB.
         * @param aabb
         */
        AABB.prototype.contains = function (aabb) {
            var l1 = this.lowerBound, u1 = this.upperBound, l2 = aabb.lowerBound, u2 = aabb.upperBound;
            //      l2        u2
            //      |---------|
            // |---------------|
            // l1              u1
            return ((l1.x <= l2.x && u1.x >= u2.x) &&
                (l1.y <= l2.y && u1.y >= u2.y) &&
                (l1.z <= l2.z && u1.z >= u2.z));
        };
        AABB.prototype.getCorners = function (a, b, c, d, e, f, g, h) {
            var l = this.lowerBound, u = this.upperBound;
            a.copy(l);
            b.set(u.x, l.y, l.z);
            c.set(u.x, u.y, l.z);
            d.set(l.x, u.y, u.z);
            e.set(u.x, l.y, l.z);
            f.set(l.x, u.y, l.z);
            g.set(l.x, l.y, u.z);
            h.copy(u);
        };
        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        AABB.prototype.toLocalFrame = function (frame, target) {
            var corners = transformIntoFrame_corners;
            var a = corners[0];
            var b = corners[1];
            var c = corners[2];
            var d = corners[3];
            var e = corners[4];
            var f = corners[5];
            var g = corners[6];
            var h = corners[7];
            // Get corners in current frame
            this.getCorners(a, b, c, d, e, f, g, h);
            // Transform them to new local frame
            for (var i = 0; i !== 8; i++) {
                var corner = corners[i];
                frame.pointToLocal(corner, corner);
            }
            return target.setFromPoints(corners);
        };
        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        AABB.prototype.toWorldFrame = function (frame, target) {
            var corners = transformIntoFrame_corners;
            var a = corners[0];
            var b = corners[1];
            var c = corners[2];
            var d = corners[3];
            var e = corners[4];
            var f = corners[5];
            var g = corners[6];
            var h = corners[7];
            // Get corners in current frame
            this.getCorners(a, b, c, d, e, f, g, h);
            // Transform them to new local frame
            for (var i = 0; i !== 8; i++) {
                var corner = corners[i];
                frame.pointToWorld(corner, corner);
            }
            return target.setFromPoints(corners);
        };
        /**
         * Check if the AABB is hit by a ray.
         */
        AABB.prototype.overlapsRay = function (ray) {
            var t = 0;
            // ray.direction is unit direction vector of ray
            var dirFracX = 1 / ray._direction.x;
            var dirFracY = 1 / ray._direction.y;
            var dirFracZ = 1 / ray._direction.z;
            // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
            var t1 = (this.lowerBound.x - ray.from.x) * dirFracX;
            var t2 = (this.upperBound.x - ray.from.x) * dirFracX;
            var t3 = (this.lowerBound.y - ray.from.y) * dirFracY;
            var t4 = (this.upperBound.y - ray.from.y) * dirFracY;
            var t5 = (this.lowerBound.z - ray.from.z) * dirFracZ;
            var t6 = (this.upperBound.z - ray.from.z) * dirFracZ;
            // var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
            // var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
            var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
            // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
            if (tmax < 0) {
                //t = tmax;
                return false;
            }
            // if tmin > tmax, ray doesn't intersect AABB
            if (tmin > tmax) {
                //t = tmax;
                return false;
            }
            return true;
        };
        return AABB;
    }());
    CANNON.AABB = AABB;
    var tmp = new CANNON.Vector3();
    var transformIntoFrame_corners = [
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3(),
        new CANNON.Vector3()
    ];
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Trimesh = /** @class */ (function (_super) {
        __extends(Trimesh, _super);
        /**
         * @param vertices
         * @param indices
         *
         * @example
         *     // How to make a mesh with a single triangle
         *     var vertices = [
         *         0, 0, 0, // vertex 0
         *         1, 0, 0, // vertex 1
         *         0, 1, 0  // vertex 2
         *     ];
         *     var indices = [
         *         0, 1, 2  // triangle 0
         *     ];
         *     var trimeshShape = new Trimesh(vertices, indices);
         */
        function Trimesh(vertices, indices) {
            var _this = _super.call(this, {
                type: CANNON.Shape.types.TRIMESH
            }) || this;
            _this.vertices = new Float32Array(vertices);
            /**
             * Array of integers, indicating which vertices each triangle consists of. The length of this array is thus 3 times the number of triangles.
             */
            _this.indices = new Int16Array(indices);
            _this.normals = new Float32Array(indices.length);
            _this.aabb = new CANNON.AABB();
            _this.edges = null;
            _this.scale = new CANNON.Vector3(1, 1, 1);
            _this.tree = new CANNON.Octree();
            _this.updateEdges();
            _this.updateNormals();
            _this.updateAABB();
            _this.updateBoundingSphereRadius();
            _this.updateTree();
            return _this;
        }
        Trimesh.prototype.updateTree = function () {
            var tree = this.tree;
            tree.reset();
            tree.aabb.copy(this.aabb);
            var scale = this.scale; // The local mesh AABB is scaled, but the octree AABB should be unscaled
            tree.aabb.lowerBound.x *= 1 / scale.x;
            tree.aabb.lowerBound.y *= 1 / scale.y;
            tree.aabb.lowerBound.z *= 1 / scale.z;
            tree.aabb.upperBound.x *= 1 / scale.x;
            tree.aabb.upperBound.y *= 1 / scale.y;
            tree.aabb.upperBound.z *= 1 / scale.z;
            // Insert all triangles
            var triangleAABB = new CANNON.AABB();
            var a = new CANNON.Vector3();
            var b = new CANNON.Vector3();
            var c = new CANNON.Vector3();
            var points = [a, b, c];
            for (var i = 0; i < this.indices.length / 3; i++) {
                //this.getTriangleVertices(i, a, b, c);
                // Get unscaled triangle verts
                var i3 = i * 3;
                this._getUnscaledVertex(this.indices[i3], a);
                this._getUnscaledVertex(this.indices[i3 + 1], b);
                this._getUnscaledVertex(this.indices[i3 + 2], c);
                triangleAABB.setFromPoints(points);
                tree.insert(triangleAABB, i);
            }
            tree.removeEmptyNodes();
        };
        /**
         * Get triangles in a local AABB from the trimesh.
         *
         * @param aabb
         * @param result An array of integers, referencing the queried triangles.
         */
        Trimesh.prototype.getTrianglesInAABB = function (aabb, result) {
            unscaledAABB.copy(aabb);
            // Scale it to local
            var scale = this.scale;
            var isx = scale.x;
            var isy = scale.y;
            var isz = scale.z;
            var l = unscaledAABB.lowerBound;
            var u = unscaledAABB.upperBound;
            l.x /= isx;
            l.y /= isy;
            l.z /= isz;
            u.x /= isx;
            u.y /= isy;
            u.z /= isz;
            return this.tree.aabbQuery(unscaledAABB, result);
        };
        /**
         * @param scale
         */
        Trimesh.prototype.setScale = function (scale) {
            // var wasUniform = this.scale.x === this.scale.y === this.scale.z;// 等价下面代码?
            var wasUniform = this.scale.x === this.scale.y && this.scale.y === this.scale.z; //?
            // var isUniform = scale.x === scale.y === scale.z;// 等价下面代码?
            var isUniform = scale.x === scale.y && scale.y === scale.z; //?
            if (!(wasUniform && isUniform)) {
                // Non-uniform scaling. Need to update normals.
                this.updateNormals();
            }
            this.scale.copy(scale);
            this.updateAABB();
            this.updateBoundingSphereRadius();
        };
        /**
         * Compute the normals of the faces. Will save in the .normals array.
         */
        Trimesh.prototype.updateNormals = function () {
            var n = computeNormals_n;
            // Generate normals
            var normals = this.normals;
            for (var i = 0; i < this.indices.length / 3; i++) {
                var i3 = i * 3;
                var a = this.indices[i3], b = this.indices[i3 + 1], c = this.indices[i3 + 2];
                this.getVertex(a, va);
                this.getVertex(b, vb);
                this.getVertex(c, vc);
                Trimesh.computeNormal(vb, va, vc, n);
                normals[i3] = n.x;
                normals[i3 + 1] = n.y;
                normals[i3 + 2] = n.z;
            }
        };
        /**
         * Update the .edges property
         */
        Trimesh.prototype.updateEdges = function () {
            var edges = {};
            var add = function (indexA, indexB) {
                var key = a < b ? a + '_' + b : b + '_' + a;
                edges[key] = true;
            };
            for (var i = 0; i < this.indices.length / 3; i++) {
                var i3 = i * 3;
                var a = this.indices[i3], b = this.indices[i3 + 1], c = this.indices[i3 + 2];
                add(a, b);
                add(b, c);
                add(c, a);
            }
            var keys = Object.keys(edges);
            this.edges = new Int16Array(keys.length * 2);
            for (var i = 0; i < keys.length; i++) {
                var indices = keys[i].split('_');
                this.edges[2 * i] = parseInt(indices[0], 10);
                this.edges[2 * i + 1] = parseInt(indices[1], 10);
            }
        };
        /**
         * Get an edge vertex
         *
         * @param edgeIndex
         * @param firstOrSecond 0 or 1, depending on which one of the vertices you need.
         * @param vertexStore Where to store the result
         */
        Trimesh.prototype.getEdgeVertex = function (edgeIndex, firstOrSecond, vertexStore) {
            var vertexIndex = this.edges[edgeIndex * 2 + (firstOrSecond ? 1 : 0)];
            this.getVertex(vertexIndex, vertexStore);
        };
        /**
         * Get a vector along an edge.
         *
         * @param edgeIndex
         * @param vectorStore
         */
        Trimesh.prototype.getEdgeVector = function (edgeIndex, vectorStore) {
            var va = getEdgeVector_va;
            var vb = getEdgeVector_vb;
            this.getEdgeVertex(edgeIndex, 0, va);
            this.getEdgeVertex(edgeIndex, 1, vb);
            vb.subTo(va, vectorStore);
        };
        /**
         * Get face normal given 3 vertices
         *
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        Trimesh.computeNormal = function (va, vb, vc, target) {
            vb.subTo(va, ab);
            vc.subTo(vb, cb);
            cb.crossTo(ab, target);
            if (!target.isZero()) {
                target.normalize();
            }
        };
        /**
         * Get vertex i.
         *
         * @param i
         * @param out
         * @return The "out" vector object
         */
        Trimesh.prototype.getVertex = function (i, out) {
            var scale = this.scale;
            this._getUnscaledVertex(i, out);
            out.x *= scale.x;
            out.y *= scale.y;
            out.z *= scale.z;
            return out;
        };
        /**
         * Get raw vertex i
         *
         * @param i
         * @param out
         * @return The "out" vector object
         */
        Trimesh.prototype._getUnscaledVertex = function (i, out) {
            var i3 = i * 3;
            var vertices = this.vertices;
            return out.set(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
        };
        /**
         * Get a vertex from the trimesh,transformed by the given position and quaternion.
         *
         * @param i
         * @param pos
         * @param quat
         * @param out
         * @return The "out" vector object
         */
        Trimesh.prototype.getWorldVertex = function (i, pos, quat, out) {
            this.getVertex(i, out);
            CANNON.Transform.pointToWorldFrame(pos, quat, out, out);
            return out;
        };
        /**
         * Get the three vertices for triangle i.
         *
         * @param i
         * @param a
         * @param b
         * @param c
         */
        Trimesh.prototype.getTriangleVertices = function (i, a, b, c) {
            var i3 = i * 3;
            this.getVertex(this.indices[i3], a);
            this.getVertex(this.indices[i3 + 1], b);
            this.getVertex(this.indices[i3 + 2], c);
        };
        /**
         * Compute the normal of triangle i.
         *
         * @param i
         * @param target
         * @return The "target" vector object
         */
        Trimesh.prototype.getNormal = function (i, target) {
            var i3 = i * 3;
            return target.set(this.normals[i3], this.normals[i3 + 1], this.normals[i3 + 2]);
        };
        /**
         *
         * @param mass
         * @param target
         * @return The "target" vector object
         */
        Trimesh.prototype.calculateLocalInertia = function (mass, target) {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            this.computeLocalAABB(cli_aabb);
            var x = cli_aabb.upperBound.x - cli_aabb.lowerBound.x, y = cli_aabb.upperBound.y - cli_aabb.lowerBound.y, z = cli_aabb.upperBound.z - cli_aabb.lowerBound.z;
            return target.set(1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z), 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z), 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x));
        };
        /**
         * Compute the local AABB for the trimesh
         *
         * @param aabb
         */
        Trimesh.prototype.computeLocalAABB = function (aabb) {
            var l = aabb.lowerBound, u = aabb.upperBound, n = this.vertices.length, vertices = this.vertices, v = computeLocalAABB_worldVert;
            this.getVertex(0, v);
            l.copy(v);
            u.copy(v);
            for (var i = 0; i !== n; i++) {
                this.getVertex(i, v);
                if (v.x < l.x) {
                    l.x = v.x;
                }
                else if (v.x > u.x) {
                    u.x = v.x;
                }
                if (v.y < l.y) {
                    l.y = v.y;
                }
                else if (v.y > u.y) {
                    u.y = v.y;
                }
                if (v.z < l.z) {
                    l.z = v.z;
                }
                else if (v.z > u.z) {
                    u.z = v.z;
                }
            }
        };
        /**
         * Update the .aabb property
         */
        Trimesh.prototype.updateAABB = function () {
            this.computeLocalAABB(this.aabb);
        };
        /**
         * Will update the .boundingSphereRadius property
         */
        Trimesh.prototype.updateBoundingSphereRadius = function () {
            // Assume points are distributed with local (0,0,0) as center
            var max2 = 0;
            var vertices = this.vertices;
            var v = new CANNON.Vector3();
            for (var i = 0, N = vertices.length / 3; i !== N; i++) {
                this.getVertex(i, v);
                var norm2 = v.lengthSquared;
                if (norm2 > max2) {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        };
        Trimesh.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            /*
            var n = this.vertices.length / 3,
                verts = this.vertices;
            var minx,miny,minz,maxx,maxy,maxz;
        
            var v = tempWorldVertex;
            for(var i=0; i<n; i++){
                this.getVertex(i, v);
                quat.vmult(v, v);
                pos.addTo(v, v);
                if (v.x < minx || minx===undefined){
                    minx = v.x;
                } else if(v.x > maxx || maxx===undefined){
                    maxx = v.x;
                }
        
                if (v.y < miny || miny===undefined){
                    miny = v.y;
                } else if(v.y > maxy || maxy===undefined){
                    maxy = v.y;
                }
        
                if (v.z < minz || minz===undefined){
                    minz = v.z;
                } else if(v.z > maxz || maxz===undefined){
                    maxz = v.z;
                }
            }
            min.set(minx,miny,minz);
            max.set(maxx,maxy,maxz);
            */
            // Faster approximation using local AABB
            var frame = calculateWorldAABB_frame;
            var result = calculateWorldAABB_aabb;
            frame.position = pos;
            frame.quaternion = quat;
            this.aabb.toWorldFrame(frame, result);
            min.copy(result.lowerBound);
            max.copy(result.upperBound);
        };
        ;
        /**
         * Get approximate volume
         */
        Trimesh.prototype.volume = function () {
            return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
        };
        /**
         * Create a Trimesh instance, shaped as a torus.
         *
         * @param radius
         * @param tube
         * @param radialSegments
         * @param tubularSegments
         * @param arc
         *
         * @return A torus
         */
        Trimesh.createTorus = function (radius, tube, radialSegments, tubularSegments, arc) {
            if (radius === void 0) { radius = 1; }
            if (tube === void 0) { tube = 0.5; }
            if (radialSegments === void 0) { radialSegments = 8; }
            if (tubularSegments === void 0) { tubularSegments = 6; }
            if (arc === void 0) { arc = Math.PI * 2; }
            var vertices = [];
            var indices = [];
            for (var j = 0; j <= radialSegments; j++) {
                for (var i = 0; i <= tubularSegments; i++) {
                    var u = i / tubularSegments * arc;
                    var v = j / radialSegments * Math.PI * 2;
                    var x = (radius + tube * Math.cos(v)) * Math.cos(u);
                    var y = (radius + tube * Math.cos(v)) * Math.sin(u);
                    var z = tube * Math.sin(v);
                    vertices.push(x, y, z);
                }
            }
            for (var j = 1; j <= radialSegments; j++) {
                for (var i = 1; i <= tubularSegments; i++) {
                    var a = (tubularSegments + 1) * j + i - 1;
                    var b = (tubularSegments + 1) * (j - 1) + i - 1;
                    var c = (tubularSegments + 1) * (j - 1) + i;
                    var d = (tubularSegments + 1) * j + i;
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
            return new Trimesh(vertices, indices);
        };
        ;
        return Trimesh;
    }(CANNON.Shape));
    CANNON.Trimesh = Trimesh;
    var computeNormals_n = new CANNON.Vector3();
    var unscaledAABB = new CANNON.AABB();
    var getEdgeVector_va = new CANNON.Vector3();
    var getEdgeVector_vb = new CANNON.Vector3();
    var cb = new CANNON.Vector3();
    var ab = new CANNON.Vector3();
    var va = new CANNON.Vector3();
    var vb = new CANNON.Vector3();
    var vc = new CANNON.Vector3();
    var cli_aabb = new CANNON.AABB();
    var computeLocalAABB_worldVert = new CANNON.Vector3();
    var tempWorldVertex = new CANNON.Vector3();
    var calculateWorldAABB_frame = new CANNON.Transform();
    var calculateWorldAABB_aabb = new CANNON.AABB();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var OctreeNode = /** @class */ (function () {
        /**
         *
         * @param options
         */
        function OctreeNode(options) {
            if (options === void 0) { options = {}; }
            this.root = options.root || null;
            this.aabb = options.aabb ? options.aabb.clone() : new CANNON.AABB();
            this.data = [];
            this.children = [];
        }
        OctreeNode.prototype.reset = function () {
            this.children.length = this.data.length = 0;
        };
        /**
         * Insert data into this node
         *
         * @param aabb
         * @param elementData
         * @return True if successful, otherwise false
         */
        OctreeNode.prototype.insert = function (aabb, elementData, level) {
            if (level === void 0) { level = 0; }
            var nodeData = this.data;
            // Ignore objects that do not belong in this node
            if (!this.aabb.contains(aabb)) {
                return false; // object cannot be added
            }
            var children = this.children;
            if (level < (this.maxDepth || this.root.maxDepth)) {
                // Subdivide if there are no children yet
                var subdivided = false;
                if (!children.length) {
                    this.subdivide();
                    subdivided = true;
                }
                // add to whichever node will accept it
                for (var i = 0; i !== 8; i++) {
                    if (children[i].insert(aabb, elementData, level + 1)) {
                        return true;
                    }
                }
                if (subdivided) {
                    // No children accepted! Might as well just remove em since they contain none
                    children.length = 0;
                }
            }
            // Too deep, or children didnt want it. add it in current node
            nodeData.push(elementData);
            return true;
        };
        /**
         * Create 8 equally sized children nodes and put them in the .children array.
         */
        OctreeNode.prototype.subdivide = function () {
            var aabb = this.aabb;
            var l = aabb.lowerBound;
            var u = aabb.upperBound;
            var children = this.children;
            children.push(new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(0, 0, 0)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(1, 0, 0)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(1, 1, 0)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(1, 1, 1)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(0, 1, 1)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(0, 0, 1)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(1, 0, 1)) }), new OctreeNode({ aabb: new CANNON.AABB(new CANNON.Vector3(0, 1, 0)) }));
            u.subTo(l, halfDiagonal);
            halfDiagonal.scaleNumberTo(0.5, halfDiagonal);
            var root = this.root || this;
            for (var i = 0; i !== 8; i++) {
                var child = children[i];
                // Set current node as root
                child.root = root;
                // Compute bounds
                var lowerBound = child.aabb.lowerBound;
                lowerBound.x *= halfDiagonal.x;
                lowerBound.y *= halfDiagonal.y;
                lowerBound.z *= halfDiagonal.z;
                lowerBound.addTo(l, lowerBound);
                // Upper bound is always lower bound + halfDiagonal
                lowerBound.addTo(halfDiagonal, child.aabb.upperBound);
            }
        };
        /**
         * Get all data, potentially within an AABB
         *
         * @param aabb
         * @param result
         * @return The "result" object
         */
        OctreeNode.prototype.aabbQuery = function (aabb, result) {
            var nodeData = this.data;
            // abort if the range does not intersect this node
            // if (!this.aabb.overlaps(aabb)){
            //     return result;
            // }
            // Add objects at this level
            // Array.prototype.push.apply(result, nodeData);
            // Add child data
            // @todo unwrap recursion into a queue / loop, that's faster in JS
            var children = this.children;
            // for (var i = 0, N = this.children.length; i !== N; i++) {
            //     children[i].aabbQuery(aabb, result);
            // }
            var queue = [this];
            while (queue.length) {
                var node = queue.pop();
                if (node.aabb.overlaps(aabb)) {
                    Array.prototype.push.apply(result, node.data);
                }
                Array.prototype.push.apply(queue, node.children);
            }
            return result;
        };
        /**
         * Get all data, potentially intersected by a ray.
         *
         * @param ray
         * @param treeTransform
         * @param result
         * @return The "result" object
         */
        OctreeNode.prototype.rayQuery = function (ray, treeTransform, result) {
            // Use aabb query for now.
            // @todo implement real ray query which needs less lookups
            ray.getAABB(tmpAABB);
            tmpAABB.toLocalFrame(treeTransform, tmpAABB);
            this.aabbQuery(tmpAABB, result);
            return result;
        };
        OctreeNode.prototype.removeEmptyNodes = function () {
            var queue = [this];
            while (queue.length) {
                var node = queue.pop();
                for (var i = node.children.length - 1; i >= 0; i--) {
                    if (!node.children[i].data.length) {
                        node.children.splice(i, 1);
                    }
                }
                Array.prototype.push.apply(queue, node.children);
            }
        };
        return OctreeNode;
    }());
    CANNON.OctreeNode = OctreeNode;
    var Octree = /** @class */ (function (_super) {
        __extends(Octree, _super);
        /**
         * @class Octree
         * @param {AABB} aabb The total AABB of the tree
         * @param {object} [options]
         * @param {number} [options.maxDepth=8]
         * @extends OctreeNode
         */
        function Octree(aabb, options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            options.root = null;
            options.aabb = aabb;
            _this = _super.call(this, options) || this;
            _this.maxDepth = typeof (options.maxDepth) !== 'undefined' ? options.maxDepth : 8;
            return _this;
        }
        return Octree;
    }(OctreeNode));
    CANNON.Octree = Octree;
    var halfDiagonal = new CANNON.Vector3();
    var tmpAABB = new CANNON.AABB();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ArrayCollisionMatrix = /** @class */ (function () {
        /**
         * Collision "matrix". It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
         */
        function ArrayCollisionMatrix() {
            this.matrix = [];
        }
        /**
         * Get an element
         *
         * @param i
         * @param j
         */
        ArrayCollisionMatrix.prototype.get = function (i0, j0) {
            var i = i0.index;
            var j = j0.index;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return this.matrix[(i * (i + 1) >> 1) + j - 1];
        };
        /**
         * Set an element
         *
         * @param i0
         * @param j0
         * @param value
         */
        ArrayCollisionMatrix.prototype.set = function (i0, j0, value) {
            var i = i0.index;
            var j = j0.index;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            this.matrix[(i * (i + 1) >> 1) + j - 1] = value ? 1 : 0;
        };
        /**
         * Sets all elements to zero
         */
        ArrayCollisionMatrix.prototype.reset = function () {
            for (var i = 0, l = this.matrix.length; i !== l; i++) {
                this.matrix[i] = 0;
            }
        };
        /**
         * Sets the max number of objects
         */
        ArrayCollisionMatrix.prototype.setNumObjects = function (n) {
            this.matrix.length = n * (n - 1) >> 1;
        };
        return ArrayCollisionMatrix;
    }());
    CANNON.ArrayCollisionMatrix = ArrayCollisionMatrix;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ObjectCollisionMatrix = /** @class */ (function () {
        /**
         * Records what objects are colliding with each other
         */
        function ObjectCollisionMatrix() {
            /**
             * The matrix storage
             */
            this.matrix = {};
            this.matrix = {};
        }
        ObjectCollisionMatrix.prototype.get = function (i0, j0) {
            var i = i0.id;
            var j = j0.id;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return i + '-' + j in this.matrix;
        };
        ObjectCollisionMatrix.prototype.set = function (i0, j0, value) {
            var i = i0.id;
            var j = j0.id;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            if (value) {
                this.matrix[i + '-' + j] = true;
            }
            else {
                delete this.matrix[i + '-' + j];
            }
        };
        /**
         * Empty the matrix
         */
        ObjectCollisionMatrix.prototype.reset = function () {
            this.matrix = {};
        };
        /**
         * Set max number of objects
         *
         * @param n
         */
        ObjectCollisionMatrix.prototype.setNumObjects = function (n) {
        };
        return ObjectCollisionMatrix;
    }());
    CANNON.ObjectCollisionMatrix = ObjectCollisionMatrix;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var OverlapKeeper = /** @class */ (function () {
        function OverlapKeeper() {
            this.current = [];
            this.previous = [];
            this.current = [];
            this.previous = [];
        }
        OverlapKeeper.prototype.getKey = function (i, j) {
            if (j < i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return (i << 16) | j;
        };
        OverlapKeeper.prototype.set = function (i, j) {
            // Insertion sort. This way the diff will have linear complexity.
            var key = this.getKey(i, j);
            var current = this.current;
            var index = 0;
            while (key > current[index]) {
                index++;
            }
            if (key === current[index]) {
                return; // Pair was already added
            }
            for (var j = current.length - 1; j >= index; j--) {
                current[j + 1] = current[j];
            }
            current[index] = key;
        };
        OverlapKeeper.prototype.tick = function () {
            var tmp = this.current;
            this.current = this.previous;
            this.previous = tmp;
            this.current.length = 0;
        };
        OverlapKeeper.prototype.unpackAndPush = function (array, key) {
            array.push((key & 0xFFFF0000) >> 16, key & 0x0000FFFF);
        };
        OverlapKeeper.prototype.getDiff = function (additions, removals) {
            var a = this.current;
            var b = this.previous;
            var al = a.length;
            var bl = b.length;
            var j = 0;
            for (var i = 0; i < al; i++) {
                var found = false;
                var keyA = a[i];
                while (keyA > b[j]) {
                    j++;
                }
                found = keyA === b[j];
                if (!found) {
                    this.unpackAndPush(additions, keyA);
                }
            }
            j = 0;
            for (var i = 0; i < bl; i++) {
                var found = false;
                var keyB = b[i];
                while (keyB > a[j]) {
                    j++;
                }
                found = a[j] === keyB;
                if (!found) {
                    this.unpackAndPush(removals, keyB);
                }
            }
        };
        return OverlapKeeper;
    }());
    CANNON.OverlapKeeper = OverlapKeeper;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var RaycastResult = /** @class */ (function () {
        /**
         * Storage for Ray casting data.
         */
        function RaycastResult() {
            this.rayFromWorld = new CANNON.Vector3();
            this.rayToWorld = new CANNON.Vector3();
            this.hitNormalWorld = new CANNON.Vector3();
            this.hitPointWorld = new CANNON.Vector3();
            this.hasHit = false;
            this.shape = null;
            this.body = null;
            /**
             * The index of the hit triangle, if the hit shape was a trimesh.
             */
            this.hitFaceIndex = -1;
            /**
             * Distance to the hit. Will be set to -1 if there was no hit.
             */
            this.distance = -1;
            /**
             * If the ray should stop traversing the bodies.
             */
            this._shouldStop = false;
        }
        /**
         * Reset all result data.
         */
        RaycastResult.prototype.reset = function () {
            this.rayFromWorld.setZero();
            this.rayToWorld.setZero();
            this.hitNormalWorld.setZero();
            this.hitPointWorld.setZero();
            this.hasHit = false;
            this.shape = null;
            this.body = null;
            this.hitFaceIndex = -1;
            this.distance = -1;
            this._shouldStop = false;
        };
        RaycastResult.prototype.abort = function () {
            this._shouldStop = true;
        };
        RaycastResult.prototype.set = function (rayFromWorld, rayToWorld, hitNormalWorld, hitPointWorld, shape, body, distance) {
            this.rayFromWorld.copy(rayFromWorld);
            this.rayToWorld.copy(rayToWorld);
            this.hitNormalWorld.copy(hitNormalWorld);
            this.hitPointWorld.copy(hitPointWorld);
            this.shape = shape;
            this.body = body;
            this.distance = distance;
        };
        return RaycastResult;
    }());
    CANNON.RaycastResult = RaycastResult;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Broadphase = /** @class */ (function () {
        /**
         * Base class for broadphase implementations
         *
         * @author schteppe
         */
        function Broadphase() {
            this.world = null;
            this.useBoundingBoxes = false;
            this.dirty = true;
        }
        /**
         * Get the collision pairs from the world
         *
         * @param world The world to search in
         * @param p1 Empty array to be filled with body objects
         * @param p2 Empty array to be filled with body objects
         */
        Broadphase.prototype.collisionPairs = function (world, p1, p2) {
            throw new Error("collisionPairs not implemented for this BroadPhase class!");
        };
        /**
         * Check if a body pair needs to be intersection tested at all.
         *
         * @param bodyA
         * @param bodyB
         */
        Broadphase.prototype.needBroadphaseCollision = function (bodyA, bodyB) {
            // Check collision filter masks
            if ((bodyA.collisionFilterGroup & bodyB.collisionFilterMask) === 0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask) === 0) {
                return false;
            }
            // Check types
            if (((bodyA.type & CANNON.Body.STATIC) !== 0 || bodyA.sleepState === CANNON.Body.SLEEPING) &&
                ((bodyB.type & CANNON.Body.STATIC) !== 0 || bodyB.sleepState === CANNON.Body.SLEEPING)) {
                // Both bodies are static or sleeping. Skip.
                return false;
            }
            return true;
        };
        /**
         * Check if the bounding volumes of two bodies intersect.
          *
          * @param bodyA
          * @param bodyB
          * @param pairs1
          * @param pairs2
          */
        Broadphase.prototype.intersectionTest = function (bodyA, bodyB, pairs1, pairs2) {
            if (this.useBoundingBoxes) {
                this.doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2);
            }
            else {
                this.doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2);
            }
        };
        /**
         * Check if the bounding spheres of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1 bodyA is appended to this array if intersection
         * @param pairs2 bodyB is appended to this array if intersection
         */
        Broadphase.prototype.doBoundingSphereBroadphase = function (bodyA, bodyB, pairs1, pairs2) {
            var r = Broadphase_collisionPairs_r;
            bodyB.position.subTo(bodyA.position, r);
            var boundingRadiusSum2 = Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2);
            var norm2 = r.lengthSquared;
            if (norm2 < boundingRadiusSum2) {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        };
        /**
         * Check if the bounding boxes of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1
         * @param pairs2
         */
        Broadphase.prototype.doBoundingBoxBroadphase = function (bodyA, bodyB, pairs1, pairs2) {
            if (bodyA.aabbNeedsUpdate) {
                bodyA.computeAABB();
            }
            if (bodyB.aabbNeedsUpdate) {
                bodyB.computeAABB();
            }
            // Check AABB / AABB
            if (bodyA.aabb.overlaps(bodyB.aabb)) {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        };
        /**
         * Removes duplicate pairs from the pair arrays.
         * @param pairs1
         * @param pairs2
         */
        Broadphase.prototype.makePairsUnique = function (pairs1, pairs2) {
            var t = Broadphase_makePairsUnique_temp, p1 = Broadphase_makePairsUnique_p1, p2 = Broadphase_makePairsUnique_p2, N = pairs1.length;
            for (var i = 0; i !== N; i++) {
                p1[i] = pairs1[i];
                p2[i] = pairs2[i];
            }
            pairs1.length = 0;
            pairs2.length = 0;
            for (var i = 0; i !== N; i++) {
                var id1 = p1[i].id, id2 = p2[i].id;
                var key = id1 < id2 ? id1 + "," + id2 : id2 + "," + id1;
                t[key] = i;
                t.keys.push(key);
            }
            for (var i = 0; i !== t.keys.length; i++) {
                var key = t.keys.pop();
                var pairIndex = t[key];
                pairs1.push(p1[pairIndex]);
                pairs2.push(p2[pairIndex]);
                delete t[key];
            }
        };
        /**
         * To be implemented by subcasses
         * @method setWorld
         * @param {World} world
         */
        Broadphase.prototype.setWorld = function (world) {
        };
        /**
         * Check if the bounding spheres of two bodies overlap.
         * @param bodyA
         * @param bodyB
         */
        Broadphase.boundingSphereCheck = function (bodyA, bodyB) {
            var dist = bsc_dist;
            bodyA.position.subTo(bodyB.position, dist);
            return Math.pow(bodyA.shape.boundingSphereRadius + bodyB.shape.boundingSphereRadius, 2) > dist.lengthSquared;
        };
        /**
         * Returns all the bodies within the AABB.
         *
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        Broadphase.prototype.aabbQuery = function (world, aabb, result) {
            console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
            return [];
        };
        return Broadphase;
    }());
    CANNON.Broadphase = Broadphase;
    var Broadphase_collisionPairs_r = new CANNON.Vector3(); // Temp objects
    var Broadphase_collisionPairs_normal = new CANNON.Vector3();
    var Broadphase_collisionPairs_quat = new CANNON.Quaternion();
    var Broadphase_collisionPairs_relpos = new CANNON.Vector3();
    var Broadphase_makePairsUnique_temp = { keys: [] };
    var Broadphase_makePairsUnique_p1 = [];
    var Broadphase_makePairsUnique_p2 = [];
    var bsc_dist = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var GridBroadphase = /** @class */ (function (_super) {
        __extends(GridBroadphase, _super);
        /**
         * Axis aligned uniform grid broadphase.
         *
         * @param aabbMin
         * @param aabbMax
         * @param nx Number of boxes along x
         * @param ny Number of boxes along y
         * @param nz Number of boxes along z
         *
         * @todo Needs support for more than just planes and spheres.
         */
        function GridBroadphase(aabbMin, aabbMax, nx, ny, nz) {
            var _this = _super.call(this) || this;
            _this.nx = nx || 10;
            _this.ny = ny || 10;
            _this.nz = nz || 10;
            _this.aabbMin = aabbMin || new CANNON.Vector3(100, 100, 100);
            _this.aabbMax = aabbMax || new CANNON.Vector3(-100, -100, -100);
            var nbins = _this.nx * _this.ny * _this.nz;
            if (nbins <= 0) {
                throw "GridBroadphase: Each dimension's n must be >0";
            }
            _this.bins = [];
            _this.binLengths = []; //Rather than continually resizing arrays (thrashing the memory), just record length and allow them to grow
            _this.bins.length = nbins;
            _this.binLengths.length = nbins;
            for (var i = 0; i < nbins; i++) {
                _this.bins[i] = [];
                _this.binLengths[i] = 0;
            }
            return _this;
        }
        /**
         * Get all the collision pairs in the physics world
         *
         * @param world
         * @param pairs1
         * @param pairs2
         */
        GridBroadphase.prototype.collisionPairs = function (world, pairs1, pairs2) {
            var N = world.numObjects(), bodies = world.bodies;
            var max = this.aabbMax, min = this.aabbMin, nx = this.nx, ny = this.ny, nz = this.nz;
            var xstep = ny * nz;
            var ystep = nz;
            var zstep = 1;
            var xmax = max.x, ymax = max.y, zmax = max.z, xmin = min.x, ymin = min.y, zmin = min.z;
            var xmult = nx / (xmax - xmin), ymult = ny / (ymax - ymin), zmult = nz / (zmax - zmin);
            var binsizeX = (xmax - xmin) / nx, binsizeY = (ymax - ymin) / ny, binsizeZ = (zmax - zmin) / nz;
            var binRadius = Math.sqrt(binsizeX * binsizeX + binsizeY * binsizeY + binsizeZ * binsizeZ) * 0.5;
            var types = CANNON.Shape.types;
            var SPHERE = types.SPHERE, PLANE = types.PLANE, BOX = types.BOX, COMPOUND = types.COMPOUND, CONVEXPOLYHEDRON = types.CONVEXPOLYHEDRON;
            var bins = this.bins, binLengths = this.binLengths, Nbins = this.bins.length;
            // Reset bins
            for (var i = 0; i !== Nbins; i++) {
                binLengths[i] = 0;
            }
            var ceil = Math.ceil;
            // var min = Math.min;
            // var max = Math.max;
            function addBoxToBins(x0, y0, z0, x1, y1, z1, bi) {
                var xoff0 = ((x0 - xmin) * xmult) | 0, yoff0 = ((y0 - ymin) * ymult) | 0, zoff0 = ((z0 - zmin) * zmult) | 0, xoff1 = ceil((x1 - xmin) * xmult), yoff1 = ceil((y1 - ymin) * ymult), zoff1 = ceil((z1 - zmin) * zmult);
                if (xoff0 < 0) {
                    xoff0 = 0;
                }
                else if (xoff0 >= nx) {
                    xoff0 = nx - 1;
                }
                if (yoff0 < 0) {
                    yoff0 = 0;
                }
                else if (yoff0 >= ny) {
                    yoff0 = ny - 1;
                }
                if (zoff0 < 0) {
                    zoff0 = 0;
                }
                else if (zoff0 >= nz) {
                    zoff0 = nz - 1;
                }
                if (xoff1 < 0) {
                    xoff1 = 0;
                }
                else if (xoff1 >= nx) {
                    xoff1 = nx - 1;
                }
                if (yoff1 < 0) {
                    yoff1 = 0;
                }
                else if (yoff1 >= ny) {
                    yoff1 = ny - 1;
                }
                if (zoff1 < 0) {
                    zoff1 = 0;
                }
                else if (zoff1 >= nz) {
                    zoff1 = nz - 1;
                }
                xoff0 *= xstep;
                yoff0 *= ystep;
                zoff0 *= zstep;
                xoff1 *= xstep;
                yoff1 *= ystep;
                zoff1 *= zstep;
                for (var xoff = xoff0; xoff <= xoff1; xoff += xstep) {
                    for (var yoff = yoff0; yoff <= yoff1; yoff += ystep) {
                        for (var zoff = zoff0; zoff <= zoff1; zoff += zstep) {
                            var idx = xoff + yoff + zoff;
                            bins[idx][binLengths[idx]++] = bi;
                        }
                    }
                }
            }
            // Put all bodies into the bins
            for (var i = 0; i !== N; i++) {
                var bi = bodies[i];
                var si = bi.shape;
                switch (si.type) {
                    case SPHERE:
                        // Put in bin
                        // check if overlap with other bins
                        var x = bi.position.x, y = bi.position.y, z = bi.position.z;
                        var r = si.radius;
                        addBoxToBins(x - r, y - r, z - r, x + r, y + r, z + r, bi);
                        break;
                    case PLANE:
                        var plane = si;
                        if (plane.worldNormalNeedsUpdate) {
                            plane.computeWorldNormal(bi.quaternion);
                        }
                        var planeNormal = plane.worldNormal;
                        //Relative position from origin of plane object to the first bin
                        //Incremented as we iterate through the bins
                        var xreset = xmin + binsizeX * 0.5 - bi.position.x, yreset = ymin + binsizeY * 0.5 - bi.position.y, zreset = zmin + binsizeZ * 0.5 - bi.position.z;
                        var d = GridBroadphase_collisionPairs_d;
                        d.set(xreset, yreset, zreset);
                        for (var xi = 0, xoff = 0; xi !== nx; xi++, xoff += xstep, d.y = yreset, d.x += binsizeX) {
                            for (var yi = 0, yoff = 0; yi !== ny; yi++, yoff += ystep, d.z = zreset, d.y += binsizeY) {
                                for (var zi = 0, zoff = 0; zi !== nz; zi++, zoff += zstep, d.z += binsizeZ) {
                                    if (d.dot(planeNormal) < binRadius) {
                                        var idx = xoff + yoff + zoff;
                                        bins[idx][binLengths[idx]++] = bi;
                                    }
                                }
                            }
                        }
                        break;
                    default:
                        if (bi.aabbNeedsUpdate) {
                            bi.computeAABB();
                        }
                        addBoxToBins(bi.aabb.lowerBound.x, bi.aabb.lowerBound.y, bi.aabb.lowerBound.z, bi.aabb.upperBound.x, bi.aabb.upperBound.y, bi.aabb.upperBound.z, bi);
                        break;
                }
            }
            // Check each bin
            for (var i = 0; i !== Nbins; i++) {
                var binLength = binLengths[i];
                //Skip bins with no potential collisions
                if (binLength > 1) {
                    var bin = bins[i];
                    // Do N^2 broadphase inside
                    for (var xi = 0; xi !== binLength; xi++) {
                        var bi_1 = bin[xi];
                        for (var yi = 0; yi !== xi; yi++) {
                            var bj = bin[yi];
                            if (this.needBroadphaseCollision(bi_1, bj)) {
                                this.intersectionTest(bi_1, bj, pairs1, pairs2);
                            }
                        }
                    }
                }
            }
            //	for (var zi = 0, zoff=0; zi < nz; zi++, zoff+= zstep) {
            //		console.log("layer "+zi);
            //		for (var yi = 0, yoff=0; yi < ny; yi++, yoff += ystep) {
            //			var row = '';
            //			for (var xi = 0, xoff=0; xi < nx; xi++, xoff += xstep) {
            //				var idx = xoff + yoff + zoff;
            //				row += ' ' + binLengths[idx];
            //			}
            //			console.log(row);
            //		}
            //	}
            this.makePairsUnique(pairs1, pairs2);
        };
        return GridBroadphase;
    }(CANNON.Broadphase));
    CANNON.GridBroadphase = GridBroadphase;
    var GridBroadphase_collisionPairs_d = new CANNON.Vector3();
    var GridBroadphase_collisionPairs_binPos = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var NaiveBroadphase = /** @class */ (function (_super) {
        __extends(NaiveBroadphase, _super);
        /**
         * Naive broadphase implementation, used in lack of better ones.
         * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
         */
        function NaiveBroadphase() {
            return _super.call(this) || this;
        }
        /**
         * Get all the collision pairs in the physics world
         * @param world
         * @param pairs1
         * @param pairs2
         */
        NaiveBroadphase.prototype.collisionPairs = function (world, pairs1, pairs2) {
            var bodies = world.bodies, n = bodies.length, i, j, bi, bj;
            // Naive N^2 ftw!
            for (i = 0; i !== n; i++) {
                for (j = 0; j !== i; j++) {
                    bi = bodies[i];
                    bj = bodies[j];
                    if (!this.needBroadphaseCollision(bi, bj)) {
                        continue;
                    }
                    this.intersectionTest(bi, bj, pairs1, pairs2);
                }
            }
        };
        /**
         * Returns all the bodies within an AABB.
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        NaiveBroadphase.prototype.aabbQuery = function (world, aabb, result) {
            result = result || [];
            for (var i = 0; i < world.bodies.length; i++) {
                var b = world.bodies[i];
                if (b.aabbNeedsUpdate) {
                    b.computeAABB();
                }
                // Ugly hack until Body gets aabb
                if (b.aabb.overlaps(aabb)) {
                    result.push(b);
                }
            }
            return result;
        };
        return NaiveBroadphase;
    }(CANNON.Broadphase));
    CANNON.NaiveBroadphase = NaiveBroadphase;
    var tmpAABB = new CANNON.AABB();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var SAPBroadphase = /** @class */ (function (_super) {
        __extends(SAPBroadphase, _super);
        /**
         * Sweep and prune broadphase along one axis.
         *
         * @param world
         */
        function SAPBroadphase(world) {
            var _this = _super.call(this) || this;
            _this.axisList = [];
            _this.world = null;
            _this.axisIndex = 0;
            var axisList = _this.axisList;
            _this._addBodyHandler = function (e) {
                axisList.push(e.body);
            };
            _this._removeBodyHandler = function (e) {
                var idx = axisList.indexOf(e.body);
                if (idx !== -1) {
                    axisList.splice(idx, 1);
                }
            };
            if (world) {
                _this.setWorld(world);
            }
            return _this;
        }
        /**
         * Change the world
         * @param world
         */
        SAPBroadphase.prototype.setWorld = function (world) {
            // Clear the old axis array
            this.axisList.length = 0;
            // Add all bodies from the new world
            for (var i = 0; i < world.bodies.length; i++) {
                this.axisList.push(world.bodies[i]);
            }
            // Remove old handlers, if any
            world.removeEventListener("addBody", this._addBodyHandler);
            world.removeEventListener("removeBody", this._removeBodyHandler);
            // Add handlers to update the list of bodies.
            world.addEventListener("addBody", this._addBodyHandler);
            world.addEventListener("removeBody", this._removeBodyHandler);
            this.world = world;
            this.dirty = true;
        };
        SAPBroadphase.insertionSortX = function (a) {
            for (var i = 1, l = a.length; i < l; i++) {
                var v = a[i];
                for (var j = i - 1; j >= 0; j--) {
                    if (a[j].aabb.lowerBound.x <= v.aabb.lowerBound.x) {
                        break;
                    }
                    a[j + 1] = a[j];
                }
                a[j + 1] = v;
            }
            return a;
        };
        SAPBroadphase.insertionSortY = function (a) {
            for (var i = 1, l = a.length; i < l; i++) {
                var v = a[i];
                for (var j = i - 1; j >= 0; j--) {
                    if (a[j].aabb.lowerBound.y <= v.aabb.lowerBound.y) {
                        break;
                    }
                    a[j + 1] = a[j];
                }
                a[j + 1] = v;
            }
            return a;
        };
        SAPBroadphase.insertionSortZ = function (a) {
            for (var i = 1, l = a.length; i < l; i++) {
                var v = a[i];
                for (var j = i - 1; j >= 0; j--) {
                    if (a[j].aabb.lowerBound.z <= v.aabb.lowerBound.z) {
                        break;
                    }
                    a[j + 1] = a[j];
                }
                a[j + 1] = v;
            }
            return a;
        };
        /**
         * Collect all collision pairs
         * @param world
         * @param p1
         * @param p2
         */
        SAPBroadphase.prototype.collisionPairs = function (world, p1, p2) {
            var bodies = this.axisList, N = bodies.length, axisIndex = this.axisIndex, i, j;
            if (this.dirty) {
                this.sortList();
                this.dirty = false;
            }
            // Look through the list
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                for (j = i + 1; j < N; j++) {
                    var bj = bodies[j];
                    if (!this.needBroadphaseCollision(bi, bj)) {
                        continue;
                    }
                    if (!SAPBroadphase.checkBounds(bi, bj, axisIndex)) {
                        break;
                    }
                    this.intersectionTest(bi, bj, p1, p2);
                }
            }
        };
        SAPBroadphase.prototype.sortList = function () {
            var axisList = this.axisList;
            var axisIndex = this.axisIndex;
            var N = axisList.length;
            // Update AABBs
            for (var i = 0; i !== N; i++) {
                var bi = axisList[i];
                if (bi.aabbNeedsUpdate) {
                    bi.computeAABB();
                }
            }
            // Sort the list
            if (axisIndex === 0) {
                SAPBroadphase.insertionSortX(axisList);
            }
            else if (axisIndex === 1) {
                SAPBroadphase.insertionSortY(axisList);
            }
            else if (axisIndex === 2) {
                SAPBroadphase.insertionSortZ(axisList);
            }
        };
        /**
         * Check if the bounds of two bodies overlap, along the given SAP axis.
         * @param bi
         * @param bj
         * @param axisIndex
         */
        SAPBroadphase.checkBounds = function (bi, bj, axisIndex) {
            var biPos;
            var bjPos;
            if (axisIndex === 0) {
                biPos = bi.position.x;
                bjPos = bj.position.x;
            }
            else if (axisIndex === 1) {
                biPos = bi.position.y;
                bjPos = bj.position.y;
            }
            else if (axisIndex === 2) {
                biPos = bi.position.z;
                bjPos = bj.position.z;
            }
            var ri = bi.boundingRadius, rj = bj.boundingRadius, boundA1 = biPos - ri, boundA2 = biPos + ri, boundB1 = bjPos - rj, boundB2 = bjPos + rj;
            return boundB1 < boundA2;
        };
        /**
         * Computes the variance of the body positions and estimates the best
         * axis to use. Will automatically set property .axisIndex.
         */
        SAPBroadphase.prototype.autoDetectAxis = function () {
            var sumX = 0, sumX2 = 0, sumY = 0, sumY2 = 0, sumZ = 0, sumZ2 = 0, bodies = this.axisList, N = bodies.length, invN = 1 / N;
            for (var i = 0; i !== N; i++) {
                var b = bodies[i];
                var centerX = b.position.x;
                sumX += centerX;
                sumX2 += centerX * centerX;
                var centerY = b.position.y;
                sumY += centerY;
                sumY2 += centerY * centerY;
                var centerZ = b.position.z;
                sumZ += centerZ;
                sumZ2 += centerZ * centerZ;
            }
            var varianceX = sumX2 - sumX * sumX * invN, varianceY = sumY2 - sumY * sumY * invN, varianceZ = sumZ2 - sumZ * sumZ * invN;
            if (varianceX > varianceY) {
                if (varianceX > varianceZ) {
                    this.axisIndex = 0;
                }
                else {
                    this.axisIndex = 2;
                }
            }
            else if (varianceY > varianceZ) {
                this.axisIndex = 1;
            }
            else {
                this.axisIndex = 2;
            }
        };
        /**
         * Returns all the bodies within an AABB.
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        SAPBroadphase.prototype.aabbQuery = function (world, aabb, result) {
            result = result || [];
            if (this.dirty) {
                this.sortList();
                this.dirty = false;
            }
            var axisIndex = this.axisIndex, axis = 'x';
            if (axisIndex === 1) {
                axis = 'y';
            }
            if (axisIndex === 2) {
                axis = 'z';
            }
            var axisList = this.axisList;
            var lower = aabb.lowerBound[axis];
            var upper = aabb.upperBound[axis];
            for (var i = 0; i < axisList.length; i++) {
                var b = axisList[i];
                if (b.aabbNeedsUpdate) {
                    b.computeAABB();
                }
                if (b.aabb.overlaps(aabb)) {
                    result.push(b);
                }
            }
            return result;
        };
        return SAPBroadphase;
    }(CANNON.Broadphase));
    CANNON.SAPBroadphase = SAPBroadphase;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Ray = /** @class */ (function () {
        /**
         * A line in 3D space that intersects bodies and return points.
         * @param from
         * @param to
         */
        function Ray(from, to) {
            this.from = from ? from.clone() : new CANNON.Vector3();
            this.to = to ? to.clone() : new CANNON.Vector3();
            this._direction = new CANNON.Vector3();
            this.precision = 0.0001;
            this.checkCollisionResponse = true;
            this.skipBackfaces = false;
            this.collisionFilterMask = -1;
            this.collisionFilterGroup = -1;
            this.mode = Ray.ANY;
            this.result = new CANNON.RaycastResult();
            this.hasHit = false;
            this.callback = function (result) { };
        }
        /**
         * Do itersection against all bodies in the given World.
         * @param world
         * @param options
         * @return True if the ray hit anything, otherwise false.
         */
        Ray.prototype.intersectWorld = function (world, options) {
            this.mode = options.mode || Ray.ANY;
            this.result = options.result || new CANNON.RaycastResult();
            this.skipBackfaces = !!options.skipBackfaces;
            this.collisionFilterMask = typeof (options.collisionFilterMask) !== 'undefined' ? options.collisionFilterMask : -1;
            this.collisionFilterGroup = typeof (options.collisionFilterGroup) !== 'undefined' ? options.collisionFilterGroup : -1;
            if (options.from) {
                this.from.copy(options.from);
            }
            if (options.to) {
                this.to.copy(options.to);
            }
            this.callback = options.callback || function () { };
            this.hasHit = false;
            this.result.reset();
            this._updateDirection();
            this.getAABB(tmpAABB);
            tmpArray.length = 0;
            world.broadphase.aabbQuery(world, tmpAABB, tmpArray);
            this.intersectBodies(tmpArray);
            return this.hasHit;
        };
        /**
         * Shoot a ray at a body, get back information about the hit.
         * @param body
         * @param result Deprecated - set the result property of the Ray instead.
         */
        Ray.prototype.intersectBody = function (body, result) {
            if (result) {
                this.result = result;
                this._updateDirection();
            }
            var checkCollisionResponse = this.checkCollisionResponse;
            if (checkCollisionResponse && !body.collisionResponse) {
                return;
            }
            if ((this.collisionFilterGroup & body.collisionFilterMask) === 0 || (body.collisionFilterGroup & this.collisionFilterMask) === 0) {
                return;
            }
            var xi = intersectBody_xi;
            var qi = intersectBody_qi;
            for (var i = 0, N = body.shapes.length; i < N; i++) {
                var shape = body.shapes[i];
                if (checkCollisionResponse && !shape.collisionResponse) {
                    continue; // Skip
                }
                body.quaternion.multTo(body.shapeOrientations[i], qi);
                body.quaternion.vmult(body.shapeOffsets[i], xi);
                xi.addTo(body.position, xi);
                this.intersectShape(shape, qi, xi, body);
                if (this.result._shouldStop) {
                    break;
                }
            }
        };
        /**
         * @param bodies An array of Body objects.
         * @param result Deprecated
         */
        Ray.prototype.intersectBodies = function (bodies, result) {
            if (result) {
                this.result = result;
                this._updateDirection();
            }
            for (var i = 0, l = bodies.length; !this.result._shouldStop && i < l; i++) {
                this.intersectBody(bodies[i]);
            }
        };
        ;
        /**
         * Updates the _direction vector.
         */
        Ray.prototype._updateDirection = function () {
            this.to.subTo(this.from, this._direction);
            this._direction.normalize();
        };
        ;
        Ray.prototype.intersectShape = function (shape, quat, position, body) {
            var from = this.from;
            // Checking boundingSphere
            var distance = distanceFromIntersection(from, this._direction, position);
            if (distance > shape.boundingSphereRadius) {
                return;
            }
            var intersectMethod = this[shape.type];
            if (intersectMethod) {
                intersectMethod.call(this, shape, quat, position, body, shape);
            }
        };
        Ray.prototype.intersectBox = function (shape, quat, position, body, reportedShape) {
            return this.intersectConvex(shape.convexPolyhedronRepresentation, quat, position, body, reportedShape);
        };
        Ray.prototype.intersectPlane = function (shape, quat, position, body, reportedShape) {
            var from = this.from;
            var to = this.to;
            var direction = this._direction;
            // Get plane normal
            var worldNormal = CANNON.World.worldNormal.clone();
            quat.vmult(worldNormal, worldNormal);
            var len = new CANNON.Vector3();
            from.subTo(position, len);
            var planeToFrom = len.dot(worldNormal);
            to.subTo(position, len);
            var planeToTo = len.dot(worldNormal);
            if (planeToFrom * planeToTo > 0) {
                // "from" and "to" are on the same side of the plane... bail out
                return;
            }
            if (from.distance(to) < planeToFrom) {
                return;
            }
            var n_dot_dir = worldNormal.dot(direction);
            if (Math.abs(n_dot_dir) < this.precision) {
                // No intersection
                return;
            }
            var planePointToFrom = new CANNON.Vector3();
            var dir_scaled_with_t = new CANNON.Vector3();
            var hitPointWorld = new CANNON.Vector3();
            from.subTo(position, planePointToFrom);
            var t = -worldNormal.dot(planePointToFrom) / n_dot_dir;
            direction.scaleNumberTo(t, dir_scaled_with_t);
            from.addTo(dir_scaled_with_t, hitPointWorld);
            this.reportIntersection(worldNormal, hitPointWorld, reportedShape, body, -1);
        };
        /**
         * Get the world AABB of the ray.
         */
        Ray.prototype.getAABB = function (result) {
            var to = this.to;
            var from = this.from;
            result.lowerBound.x = Math.min(to.x, from.x);
            result.lowerBound.y = Math.min(to.y, from.y);
            result.lowerBound.z = Math.min(to.z, from.z);
            result.upperBound.x = Math.max(to.x, from.x);
            result.upperBound.y = Math.max(to.y, from.y);
            result.upperBound.z = Math.max(to.z, from.z);
        };
        Ray.prototype.intersectHeightfield = function (shape, quat, position, body, reportedShape) {
            var data = shape.data, w = shape.elementSize;
            // Convert the ray to local heightfield coordinates
            var localRay = intersectHeightfield_localRay; //new Ray(this.from, this.to);
            localRay.from.copy(this.from);
            localRay.to.copy(this.to);
            CANNON.Transform.pointToLocalFrame(position, quat, localRay.from, localRay.from);
            CANNON.Transform.pointToLocalFrame(position, quat, localRay.to, localRay.to);
            localRay._updateDirection();
            // Get the index of the data points to test against
            var index = intersectHeightfield_index;
            var iMinX, iMinY, iMaxX, iMaxY;
            // Set to max
            iMinX = iMinY = 0;
            iMaxX = iMaxY = shape.data.length - 1;
            var aabb = new CANNON.AABB();
            localRay.getAABB(aabb);
            shape.getIndexOfPosition(aabb.lowerBound.x, aabb.lowerBound.y, index, true);
            iMinX = Math.max(iMinX, index[0]);
            iMinY = Math.max(iMinY, index[1]);
            shape.getIndexOfPosition(aabb.upperBound.x, aabb.upperBound.y, index, true);
            iMaxX = Math.min(iMaxX, index[0] + 1);
            iMaxY = Math.min(iMaxY, index[1] + 1);
            for (var i = iMinX; i < iMaxX; i++) {
                for (var j = iMinY; j < iMaxY; j++) {
                    if (this.result._shouldStop) {
                        return;
                    }
                    shape.getAabbAtIndex(i, j, aabb);
                    if (!aabb.overlapsRay(localRay)) {
                        continue;
                    }
                    // Lower triangle
                    shape.getConvexTrianglePillar(i, j, false);
                    CANNON.Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
                    this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
                    if (this.result._shouldStop) {
                        return;
                    }
                    // Upper triangle
                    shape.getConvexTrianglePillar(i, j, true);
                    CANNON.Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
                    this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
                }
            }
        };
        Ray.prototype.intersectSphere = function (shape, quat, position, body, reportedShape) {
            var from = this.from, to = this.to, r = shape.radius;
            var a = Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2) + Math.pow(to.z - from.z, 2);
            var b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
            var c = Math.pow(from.x - position.x, 2) + Math.pow(from.y - position.y, 2) + Math.pow(from.z - position.z, 2) - Math.pow(r, 2);
            var delta = Math.pow(b, 2) - 4 * a * c;
            var intersectionPoint = Ray_intersectSphere_intersectionPoint;
            var normal = Ray_intersectSphere_normal;
            if (delta < 0) {
                // No intersection
                return;
            }
            else if (delta === 0) {
                // single intersection point
                from.lerpNumberTo(to, delta, intersectionPoint);
                intersectionPoint.subTo(position, normal);
                normal.normalize();
                this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
            }
            else {
                var d1 = (-b - Math.sqrt(delta)) / (2 * a);
                var d2 = (-b + Math.sqrt(delta)) / (2 * a);
                if (d1 >= 0 && d1 <= 1) {
                    from.lerpNumberTo(to, d1, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }
                if (this.result._shouldStop) {
                    return;
                }
                if (d2 >= 0 && d2 <= 1) {
                    from.lerpNumberTo(to, d2, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }
            }
        };
        Ray.prototype.intersectConvex = function (shape, quat, position, body, reportedShape, options) {
            if (options === void 0) { options = {}; }
            var minDistNormal = intersectConvex_minDistNormal;
            var normal = intersectConvex_normal;
            var vector = intersectConvex_vector;
            var minDistIntersect = intersectConvex_minDistIntersect;
            var faceList = (options && options.faceList) || null;
            // Checking faces
            var faces = shape.faces, vertices = shape.vertices, normals = shape.faceNormals;
            var direction = this._direction;
            var from = this.from;
            var to = this.to;
            var fromToDistance = from.distance(to);
            var minDist = -1;
            var Nfaces = faceList ? faceList.length : faces.length;
            var result = this.result;
            for (var j = 0; !result._shouldStop && j < Nfaces; j++) {
                var fi = faceList ? faceList[j] : j;
                var face = faces[fi];
                var faceNormal = normals[fi];
                var q = quat;
                var x = position;
                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal
                // Get plane point in world coordinates...
                vector.copy(vertices[face[0]]);
                q.vmult(vector, vector);
                vector.addTo(x, vector);
                // ...but make it relative to the ray from. We'll fix this later.
                vector.subTo(from, vector);
                // Get plane normal
                q.vmult(faceNormal, normal);
                // If this dot product is negative, we have something interesting
                var dot = direction.dot(normal);
                // Bail out if ray and plane are parallel
                if (Math.abs(dot) < this.precision) {
                    continue;
                }
                // calc distance to plane
                var scalar = normal.dot(vector) / dot;
                // if negative distance, then plane is behind ray
                if (scalar < 0) {
                    continue;
                }
                // if (dot < 0) {
                // Intersection point is from + direction * scalar
                direction.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(from, intersectPoint);
                // a is the point we compare points b and c with.
                a.copy(vertices[face[0]]);
                q.vmult(a, a);
                x.addTo(a, a);
                for (var i = 1; !result._shouldStop && i < face.length - 1; i++) {
                    // Transform 3 vertices to world coords
                    b.copy(vertices[face[i]]);
                    c.copy(vertices[face[i + 1]]);
                    q.vmult(b, b);
                    q.vmult(c, c);
                    x.addTo(b, b);
                    x.addTo(c, c);
                    var distance = intersectPoint.distance(from);
                    if (!(Ray.pointInTriangle(intersectPoint, a, b, c) || Ray.pointInTriangle(intersectPoint, b, a, c)) || distance > fromToDistance) {
                        continue;
                    }
                    this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
                }
                // }
            }
        };
        /**
         * @method intersectTrimesh
         * @private
         * @param  {Shape} shape
         * @param  {Quaternion} quat
         * @param  {Vector3} position
         * @param  {Body} body
         * @param {object} [options]
         */
        /**
         *
         * @param mesh
         * @param quat
         * @param position
         * @param body
         * @param reportedShape
         * @param options
         *
         * @todo Optimize by transforming the world to local space first.
         * @todo Use Octree lookup
         */
        Ray.prototype.intersectTrimesh = function (mesh, quat, position, body, reportedShape, options) {
            var normal = intersectTrimesh_normal;
            var triangles = intersectTrimesh_triangles;
            var treeTransform = intersectTrimesh_treeTransform;
            var minDistNormal = intersectConvex_minDistNormal;
            var vector = intersectConvex_vector;
            var minDistIntersect = intersectConvex_minDistIntersect;
            var localAABB = intersectTrimesh_localAABB;
            var localDirection = intersectTrimesh_localDirection;
            var localFrom = intersectTrimesh_localFrom;
            var localTo = intersectTrimesh_localTo;
            var worldIntersectPoint = intersectTrimesh_worldIntersectPoint;
            var worldNormal = intersectTrimesh_worldNormal;
            var faceList = (options && options.faceList) || null;
            // Checking faces
            var indices = mesh.indices, vertices = mesh.vertices, normals = mesh.faceNormals;
            var from = this.from;
            var to = this.to;
            var direction = this._direction;
            var minDist = -1;
            treeTransform.position.copy(position);
            treeTransform.quaternion.copy(quat);
            // Transform ray to local space!
            CANNON.Transform.vectorToLocalFrame(position, quat, direction, localDirection);
            CANNON.Transform.pointToLocalFrame(position, quat, from, localFrom);
            CANNON.Transform.pointToLocalFrame(position, quat, to, localTo);
            localTo.x *= mesh.scale.x;
            localTo.y *= mesh.scale.y;
            localTo.z *= mesh.scale.z;
            localFrom.x *= mesh.scale.x;
            localFrom.y *= mesh.scale.y;
            localFrom.z *= mesh.scale.z;
            localTo.subTo(localFrom, localDirection);
            localDirection.normalize();
            var fromToDistanceSquared = localFrom.distanceSquared(localTo);
            mesh.tree.rayQuery(this, treeTransform, triangles);
            for (var i = 0, N = triangles.length; !this.result._shouldStop && i !== N; i++) {
                var trianglesIndex = triangles[i];
                mesh.getNormal(trianglesIndex, normal);
                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal
                // Get plane point in world coordinates...
                mesh.getVertex(indices[trianglesIndex * 3], a);
                // ...but make it relative to the ray from. We'll fix this later.
                a.subTo(localFrom, vector);
                // If this dot product is negative, we have something interesting
                var dot = localDirection.dot(normal);
                // Bail out if ray and plane are parallel
                // if (Math.abs( dot ) < this.precision){
                //     continue;
                // }
                // calc distance to plane
                var scalar = normal.dot(vector) / dot;
                // if negative distance, then plane is behind ray
                if (scalar < 0) {
                    continue;
                }
                // Intersection point is from + direction * scalar
                localDirection.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(localFrom, intersectPoint);
                // Get triangle vertices
                mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
                mesh.getVertex(indices[trianglesIndex * 3 + 2], c);
                var squaredDistance = intersectPoint.distanceSquared(localFrom);
                if (!(Ray.pointInTriangle(intersectPoint, b, a, c) || Ray.pointInTriangle(intersectPoint, a, b, c)) || squaredDistance > fromToDistanceSquared) {
                    continue;
                }
                // transform intersectpoint and normal to world
                CANNON.Transform.vectorToWorldFrame(quat, normal, worldNormal);
                CANNON.Transform.pointToWorldFrame(position, quat, intersectPoint, worldIntersectPoint);
                this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
            }
            triangles.length = 0;
        };
        Ray.prototype.reportIntersection = function (normal, hitPointWorld, shape, body, hitFaceIndex) {
            var from = this.from;
            var to = this.to;
            var distance = from.distance(hitPointWorld);
            var result = this.result;
            // Skip back faces?
            if (this.skipBackfaces && normal.dot(this._direction) > 0) {
                return;
            }
            result.hitFaceIndex = typeof (hitFaceIndex) !== 'undefined' ? hitFaceIndex : -1;
            switch (this.mode) {
                case Ray.ALL:
                    this.hasHit = true;
                    result.set(from, to, normal, hitPointWorld, shape, body, distance);
                    result.hasHit = true;
                    this.callback(result);
                    break;
                case Ray.CLOSEST:
                    // Store if closer than current closest
                    if (distance < result.distance || !result.hasHit) {
                        this.hasHit = true;
                        result.hasHit = true;
                        result.set(from, to, normal, hitPointWorld, shape, body, distance);
                    }
                    break;
                case Ray.ANY:
                    // Report and stop.
                    this.hasHit = true;
                    result.hasHit = true;
                    result.set(from, to, normal, hitPointWorld, shape, body, distance);
                    result._shouldStop = true;
                    break;
            }
        };
        /*
         * As per "Barycentric Technique" as named here http://www.blackpawn.com/texts/pointinpoly/default.html But without the division
         */
        Ray.pointInTriangle = function (p, a, b, c) {
            c.subTo(a, v0);
            b.subTo(a, v1);
            p.subTo(a, v2);
            var dot00 = v0.dot(v0);
            var dot01 = v0.dot(v1);
            var dot02 = v0.dot(v2);
            var dot11 = v1.dot(v1);
            var dot12 = v1.dot(v2);
            var u, v;
            return ((u = dot11 * dot02 - dot01 * dot12) >= 0) &&
                ((v = dot00 * dot12 - dot01 * dot02) >= 0) &&
                (u + v < (dot00 * dot11 - dot01 * dot01));
        };
        Ray.CLOSEST = 1;
        Ray.ANY = 2;
        Ray.ALL = 4;
        return Ray;
    }());
    CANNON.Ray = Ray;
    var tmpAABB = new CANNON.AABB();
    var tmpArray = [];
    var v1 = new CANNON.Vector3();
    var v2 = new CANNON.Vector3();
    var intersectBody_xi = new CANNON.Vector3();
    var intersectBody_qi = new CANNON.Quaternion();
    var vector = new CANNON.Vector3();
    var normal = new CANNON.Vector3();
    var intersectPoint = new CANNON.Vector3();
    var a = new CANNON.Vector3();
    var b = new CANNON.Vector3();
    var c = new CANNON.Vector3();
    var d = new CANNON.Vector3();
    var tmpRaycastResult = new CANNON.RaycastResult();
    var v0 = new CANNON.Vector3();
    var intersect = new CANNON.Vector3();
    var intersectTrimesh_normal = new CANNON.Vector3();
    var intersectTrimesh_localDirection = new CANNON.Vector3();
    var intersectTrimesh_localFrom = new CANNON.Vector3();
    var intersectTrimesh_localTo = new CANNON.Vector3();
    var intersectTrimesh_worldNormal = new CANNON.Vector3();
    var intersectTrimesh_worldIntersectPoint = new CANNON.Vector3();
    var intersectTrimesh_localAABB = new CANNON.AABB();
    var intersectTrimesh_triangles = [];
    var intersectTrimesh_treeTransform = new CANNON.Transform();
    var intersectConvexOptions = {
        faceList: [0]
    };
    var worldPillarOffset = new CANNON.Vector3();
    var intersectHeightfield_localRay = new Ray();
    var intersectHeightfield_index = [];
    var intersectHeightfield_minMax = [];
    var Ray_intersectSphere_intersectionPoint = new CANNON.Vector3();
    var Ray_intersectSphere_normal = new CANNON.Vector3();
    var intersectConvex_normal = new CANNON.Vector3();
    var intersectConvex_minDistNormal = new CANNON.Vector3();
    var intersectConvex_minDistIntersect = new CANNON.Vector3();
    var intersectConvex_vector = new CANNON.Vector3();
    Ray.prototype[CANNON.Shape.types.BOX] = Ray.prototype["intersectBox"];
    Ray.prototype[CANNON.Shape.types.PLANE] = Ray.prototype["intersectPlane"];
    Ray.prototype[CANNON.Shape.types.HEIGHTFIELD] = Ray.prototype["intersectHeightfield"];
    Ray.prototype[CANNON.Shape.types.SPHERE] = Ray.prototype["intersectSphere"];
    Ray.prototype[CANNON.Shape.types.TRIMESH] = Ray.prototype["intersectTrimesh"];
    Ray.prototype[CANNON.Shape.types.CONVEXPOLYHEDRON] = Ray.prototype["intersectConvex"];
    function distanceFromIntersection(from, direction, position) {
        // v0 is vector from from to position
        position.subTo(from, v0);
        var dot = v0.dot(direction);
        // intersect = direction*dot + from
        direction.scaleNumberTo(dot, intersect);
        intersect.addTo(from, intersect);
        var distance = position.distance(intersect);
        return distance;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Material = /** @class */ (function () {
        /**
         * Defines a physics material.
         *
         * @param options
         * @author schteppe
         */
        function Material(options) {
            if (options === void 0) { options = {}; }
            var name = '';
            // Backwards compatibility fix
            if (typeof (options) === 'string') {
                name = options;
                options = {};
            }
            else if (typeof (options) === 'object') {
                name = '';
            }
            this.name = name;
            this.id = Material.idCounter++;
            this.friction = typeof (options.friction) !== 'undefined' ? options.friction : -1;
            this.restitution = typeof (options.restitution) !== 'undefined' ? options.restitution : -1;
        }
        Material.idCounter = 0;
        return Material;
    }());
    CANNON.Material = Material;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ContactMaterial = /** @class */ (function () {
        /**
         * Defines what happens when two materials meet.
         *
         * @param m1
         * @param m2
         * @param options
         */
        function ContactMaterial(m1, m2, options) {
            if (options === void 0) { options = {}; }
            options = CANNON.Utils.defaults(options, {
                friction: 0.3,
                restitution: 0.3,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e7,
                frictionEquationRelaxation: 3
            });
            this.id = ContactMaterial.idCounter++;
            this.materials = [m1, m2];
            this.friction = options.friction;
            this.restitution = options.restitution;
            this.contactEquationStiffness = options.contactEquationStiffness;
            this.contactEquationRelaxation = options.contactEquationRelaxation;
            this.frictionEquationStiffness = options.frictionEquationStiffness;
            this.frictionEquationRelaxation = options.frictionEquationRelaxation;
        }
        ContactMaterial.idCounter = 0;
        return ContactMaterial;
    }());
    CANNON.ContactMaterial = ContactMaterial;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Body = /** @class */ (function (_super) {
        __extends(Body, _super);
        /**
         * Base class for all body types.
         *
         * @param options
         * @param a
         *
         * @example
         *     var body = new Body({
         *         mass: 1
         *     });
         *     var shape = new Sphere(1);
         *     body.addShape(shape);
         *     world.addBody(body);
         */
        function Body(options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this) || this;
            _this.id = Body.idCounter++;
            _this.world = null;
            _this.preStep = null;
            _this.postStep = null;
            _this.vlambda = new CANNON.Vector3();
            _this.collisionFilterGroup = typeof (options.collisionFilterGroup) === 'number' ? options.collisionFilterGroup : 1;
            _this.collisionFilterMask = typeof (options.collisionFilterMask) === 'number' ? options.collisionFilterMask : -1;
            _this.collisionResponse = true;
            _this.position = new CANNON.Vector3();
            _this.previousPosition = new CANNON.Vector3();
            _this.interpolatedPosition = new CANNON.Vector3();
            _this.initPosition = new CANNON.Vector3();
            if (options.position) {
                _this.position.copy(options.position);
                _this.previousPosition.copy(options.position);
                _this.interpolatedPosition.copy(options.position);
                _this.initPosition.copy(options.position);
            }
            _this.velocity = new CANNON.Vector3();
            if (options.velocity) {
                _this.velocity.copy(options.velocity);
            }
            _this.initVelocity = new CANNON.Vector3();
            _this.force = new CANNON.Vector3();
            var mass = typeof (options.mass) === 'number' ? options.mass : 0;
            _this.mass = mass;
            _this.invMass = mass > 0 ? 1.0 / mass : 0;
            _this.material = options.material || null;
            _this.linearDamping = typeof (options.linearDamping) === 'number' ? options.linearDamping : 0.01;
            _this.type = (mass <= 0.0 ? Body.STATIC : Body.DYNAMIC);
            if (typeof (options.type) === typeof (Body.STATIC)) {
                _this.type = options.type;
            }
            _this.allowSleep = typeof (options.allowSleep) !== 'undefined' ? options.allowSleep : true;
            _this.sleepState = 0;
            _this.sleepSpeedLimit = typeof (options.sleepSpeedLimit) !== 'undefined' ? options.sleepSpeedLimit : 0.1;
            _this.sleepTimeLimit = typeof (options.sleepTimeLimit) !== 'undefined' ? options.sleepTimeLimit : 1;
            _this.timeLastSleepy = 0;
            _this._wakeUpAfterNarrowphase = false;
            _this.torque = new CANNON.Vector3();
            _this.quaternion = new CANNON.Quaternion();
            _this.initQuaternion = new CANNON.Quaternion();
            _this.previousQuaternion = new CANNON.Quaternion();
            _this.interpolatedQuaternion = new CANNON.Quaternion();
            if (options.quaternion) {
                _this.quaternion.copy(options.quaternion);
                _this.initQuaternion.copy(options.quaternion);
                _this.previousQuaternion.copy(options.quaternion);
                _this.interpolatedQuaternion.copy(options.quaternion);
            }
            _this.angularVelocity = new CANNON.Vector3();
            if (options.angularVelocity) {
                _this.angularVelocity.copy(options.angularVelocity);
            }
            _this.initAngularVelocity = new CANNON.Vector3();
            _this.shapes = [];
            _this.shapeOffsets = [];
            _this.shapeOrientations = [];
            _this.inertia = new CANNON.Vector3();
            _this.invInertia = new CANNON.Vector3();
            _this.invInertiaWorld = new CANNON.Matrix3x3();
            _this.invMassSolve = 0;
            _this.invInertiaSolve = new CANNON.Vector3();
            _this.invInertiaWorldSolve = new CANNON.Matrix3x3();
            _this.fixedRotation = typeof (options.fixedRotation) !== "undefined" ? options.fixedRotation : false;
            _this.angularDamping = typeof (options.angularDamping) !== 'undefined' ? options.angularDamping : 0.01;
            _this.linearFactor = new CANNON.Vector3(1, 1, 1);
            if (options.linearFactor) {
                _this.linearFactor.copy(options.linearFactor);
            }
            _this.angularFactor = new CANNON.Vector3(1, 1, 1);
            if (options.angularFactor) {
                _this.angularFactor.copy(options.angularFactor);
            }
            _this.aabb = new CANNON.AABB();
            _this.aabbNeedsUpdate = true;
            _this.boundingRadius = 0;
            _this.wlambda = new CANNON.Vector3();
            if (options.shape) {
                _this.addShape(options.shape);
            }
            _this.updateMassProperties();
            return _this;
        }
        /**
         * Wake the body up.
         */
        Body.prototype.wakeUp = function () {
            var s = this.sleepState;
            this.sleepState = 0;
            this._wakeUpAfterNarrowphase = false;
            if (s === Body.SLEEPING) {
                this.dispatchEvent(Body.wakeupEvent);
            }
        };
        /**
         * Force body sleep
         */
        Body.prototype.sleep = function () {
            this.sleepState = Body.SLEEPING;
            this.velocity.set(0, 0, 0);
            this.angularVelocity.set(0, 0, 0);
            this._wakeUpAfterNarrowphase = false;
        };
        /**
         * Called every timestep to update internal sleep timer and change sleep state if needed.
         */
        Body.prototype.sleepTick = function (time) {
            if (this.allowSleep) {
                var sleepState = this.sleepState;
                var speedSquared = this.velocity.lengthSquared + this.angularVelocity.lengthSquared;
                var speedLimitSquared = Math.pow(this.sleepSpeedLimit, 2);
                if (sleepState === Body.AWAKE && speedSquared < speedLimitSquared) {
                    this.sleepState = Body.SLEEPY; // Sleepy
                    this.timeLastSleepy = time;
                    this.dispatchEvent(Body.sleepyEvent);
                }
                else if (sleepState === Body.SLEEPY && speedSquared > speedLimitSquared) {
                    this.wakeUp(); // Wake up
                }
                else if (sleepState === Body.SLEEPY && (time - this.timeLastSleepy) > this.sleepTimeLimit) {
                    this.sleep(); // Sleeping
                    this.dispatchEvent(Body.sleepEvent);
                }
            }
        };
        /**
         * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
         */
        Body.prototype.updateSolveMassProperties = function () {
            if (this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC) {
                this.invMassSolve = 0;
                this.invInertiaSolve.setZero();
                this.invInertiaWorldSolve.setZero();
            }
            else {
                this.invMassSolve = this.invMass;
                this.invInertiaSolve.copy(this.invInertia);
                this.invInertiaWorldSolve.copy(this.invInertiaWorld);
            }
        };
        /**
         * Convert a world point to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        Body.prototype.pointToLocalFrame = function (worldPoint, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            worldPoint.subTo(this.position, result);
            this.quaternion.inverseTo().vmult(result, result);
            return result;
        };
        /**
         * Convert a world vector to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        Body.prototype.vectorToLocalFrame = function (worldVector, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            this.quaternion.inverseTo().vmult(worldVector, result);
            return result;
        };
        /**
         * Convert a local body point to world frame.
         *
         * @param localPoint
         * @param result
         */
        Body.prototype.pointToWorldFrame = function (localPoint, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            this.quaternion.vmult(localPoint, result);
            result.addTo(this.position, result);
            return result;
        };
        /**
         * Convert a local body point to world frame.
         *
         * @param localVector
         * @param result
         */
        Body.prototype.vectorToWorldFrame = function (localVector, result) {
            if (result === void 0) { result = new CANNON.Vector3(); }
            this.quaternion.vmult(localVector, result);
            return result;
        };
        /**
         * Add a shape to the body with a local offset and orientation.
         *
         * @param shape
         * @param _offset
         * @param_orientation
         * @return The body object, for chainability.
         */
        Body.prototype.addShape = function (shape, _offset, _orientation) {
            var offset = new CANNON.Vector3();
            var orientation = new CANNON.Quaternion();
            if (_offset) {
                offset.copy(_offset);
            }
            if (_orientation) {
                orientation.copy(_orientation);
            }
            this.shapes.push(shape);
            this.shapeOffsets.push(offset);
            this.shapeOrientations.push(orientation);
            this.updateMassProperties();
            this.updateBoundingRadius();
            this.aabbNeedsUpdate = true;
            shape.body = this;
            return this;
        };
        /**
         * Update the bounding radius of the body. Should be done if any of the shapes are changed.
         */
        Body.prototype.updateBoundingRadius = function () {
            var shapes = this.shapes, shapeOffsets = this.shapeOffsets, N = shapes.length, radius = 0;
            for (var i = 0; i !== N; i++) {
                var shape = shapes[i];
                shape.updateBoundingSphereRadius();
                var offset = shapeOffsets[i].length, r = shape.boundingSphereRadius;
                if (offset + r > radius) {
                    radius = offset + r;
                }
            }
            this.boundingRadius = radius;
        };
        /**
         * Updates the .aabb
         *
         * @todo rename to updateAABB()
         */
        Body.prototype.computeAABB = function () {
            var shapes = this.shapes, shapeOffsets = this.shapeOffsets, shapeOrientations = this.shapeOrientations, N = shapes.length, offset = tmpVec, orientation = tmpQuat, bodyQuat = this.quaternion, aabb = this.aabb, shapeAABB = computeAABB_shapeAABB;
            for (var i = 0; i !== N; i++) {
                var shape = shapes[i];
                // Get shape world position
                bodyQuat.vmult(shapeOffsets[i], offset);
                offset.addTo(this.position, offset);
                // Get shape world quaternion
                shapeOrientations[i].multTo(bodyQuat, orientation);
                // Get shape AABB
                shape.calculateWorldAABB(offset, orientation, shapeAABB.lowerBound, shapeAABB.upperBound);
                if (i === 0) {
                    aabb.copy(shapeAABB);
                }
                else {
                    aabb.extend(shapeAABB);
                }
            }
            this.aabbNeedsUpdate = false;
        };
        /**
         * Update .inertiaWorld and .invInertiaWorld
         */
        Body.prototype.updateInertiaWorld = function (force) {
            var I = this.invInertia;
            if (I.x === I.y && I.y === I.z && !force) {
                // If inertia M = s*I, where I is identity and s a scalar, then
                //    R*M*R' = R*(s*I)*R' = s*R*I*R' = s*R*R' = s*I = M
                // where R is the rotation matrix.
                // In other words, we don't have to transform the inertia if all
                // inertia diagonal entries are equal.
            }
            else {
                var m1 = uiw_m1, m2 = uiw_m2, m3 = uiw_m3;
                m1.setRotationFromQuaternion(this.quaternion);
                m1.transposeTo(m2);
                m1.scale(I, m1);
                m1.mmult(m2, this.invInertiaWorld);
            }
        };
        /**
         * Apply force to a world point. This could for example be a point on the Body surface. Applying force this way will add to Body.force and Body.torque.
         *
         * @param force The amount of force to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        Body.prototype.applyForce = function (force, relativePoint) {
            if (this.type !== Body.DYNAMIC) { // Needed?
                return;
            }
            // Compute produced rotational force
            var rotForce = Body_applyForce_rotForce;
            relativePoint.crossTo(force, rotForce);
            // Add linear force
            this.force.addTo(force, this.force);
            // Add rotational force
            this.torque.addTo(rotForce, this.torque);
        };
        /**
         * Apply force to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        Body.prototype.applyLocalForce = function (localForce, localPoint) {
            if (this.type !== Body.DYNAMIC) {
                return;
            }
            var worldForce = Body_applyLocalForce_worldForce;
            var relativePointWorld = Body_applyLocalForce_relativePointWorld;
            // Transform the force vector to world space
            this.vectorToWorldFrame(localForce, worldForce);
            this.vectorToWorldFrame(localPoint, relativePointWorld);
            this.applyForce(worldForce, relativePointWorld);
        };
        /**
         * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
         *
         * @param impulse The amount of impulse to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        Body.prototype.applyImpulse = function (impulse, relativePoint) {
            if (this.type !== Body.DYNAMIC) {
                return;
            }
            // Compute point position relative to the body center
            var r = relativePoint;
            // Compute produced central impulse velocity
            var velo = Body_applyImpulse_velo;
            velo.copy(impulse);
            velo.scaleNumberTo(this.invMass, velo);
            // Add linear impulse
            this.velocity.addTo(velo, this.velocity);
            // Compute produced rotational impulse velocity
            var rotVelo = Body_applyImpulse_rotVelo;
            r.crossTo(impulse, rotVelo);
            /*
            rotVelo.x *= this.invInertia.x;
            rotVelo.y *= this.invInertia.y;
            rotVelo.z *= this.invInertia.z;
            */
            this.invInertiaWorld.vmult(rotVelo, rotVelo);
            // Add rotational Impulse
            this.angularVelocity.addTo(rotVelo, this.angularVelocity);
        };
        /**
         * Apply locally-defined impulse to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        Body.prototype.applyLocalImpulse = function (localImpulse, localPoint) {
            if (this.type !== Body.DYNAMIC) {
                return;
            }
            var worldImpulse = Body_applyLocalImpulse_worldImpulse;
            var relativePointWorld = Body_applyLocalImpulse_relativePoint;
            // Transform the force vector to world space
            this.vectorToWorldFrame(localImpulse, worldImpulse);
            this.vectorToWorldFrame(localPoint, relativePointWorld);
            this.applyImpulse(worldImpulse, relativePointWorld);
        };
        /**
         * Should be called whenever you change the body shape or mass.
         */
        Body.prototype.updateMassProperties = function () {
            var halfExtents = Body_updateMassProperties_halfExtents;
            this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
            var I = this.inertia;
            var fixed = this.fixedRotation;
            // Approximate with AABB box
            this.computeAABB();
            halfExtents.set((this.aabb.upperBound.x - this.aabb.lowerBound.x) / 2, (this.aabb.upperBound.y - this.aabb.lowerBound.y) / 2, (this.aabb.upperBound.z - this.aabb.lowerBound.z) / 2);
            CANNON.Box.calculateInertia(halfExtents, this.mass, I);
            this.invInertia.set(I.x > 0 && !fixed ? 1.0 / I.x : 0, I.y > 0 && !fixed ? 1.0 / I.y : 0, I.z > 0 && !fixed ? 1.0 / I.z : 0);
            this.updateInertiaWorld(true);
        };
        /**
         * Get world velocity of a point in the body.
         * @method getVelocityAtWorldPoint
         * @param  {Vector3} worldPoint
         * @param  {Vector3} result
         * @return {Vector3} The result vector.
         */
        Body.prototype.getVelocityAtWorldPoint = function (worldPoint, result) {
            var r = new CANNON.Vector3();
            worldPoint.subTo(this.position, r);
            this.angularVelocity.crossTo(r, result);
            this.velocity.addTo(result, result);
            return result;
        };
        /**
         * Move the body forward in time.
         * @param dt Time step
         * @param quatNormalize Set to true to normalize the body quaternion
         * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
         */
        Body.prototype.integrate = function (dt, quatNormalize, quatNormalizeFast) {
            // Save previous position
            this.previousPosition.copy(this.position);
            this.previousQuaternion.copy(this.quaternion);
            if (!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC) || this.sleepState === Body.SLEEPING) { // Only for dynamic
                return;
            }
            var velo = this.velocity, angularVelo = this.angularVelocity, pos = this.position, force = this.force, torque = this.torque, quat = this.quaternion, invMass = this.invMass, invInertia = this.invInertiaWorld, linearFactor = this.linearFactor;
            var iMdt = invMass * dt;
            velo.x += force.x * iMdt * linearFactor.x;
            velo.y += force.y * iMdt * linearFactor.y;
            velo.z += force.z * iMdt * linearFactor.z;
            var e = invInertia.elements;
            var angularFactor = this.angularFactor;
            var tx = torque.x * angularFactor.x;
            var ty = torque.y * angularFactor.y;
            var tz = torque.z * angularFactor.z;
            angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz);
            angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz);
            angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz);
            // Use new velocity  - leap frog
            pos.x += velo.x * dt;
            pos.y += velo.y * dt;
            pos.z += velo.z * dt;
            quat.integrateTo(this.angularVelocity, dt, this.angularFactor, quat);
            if (quatNormalize) {
                if (quatNormalizeFast) {
                    quat.normalizeFast();
                }
                else {
                    quat.normalize();
                }
            }
            this.aabbNeedsUpdate = true;
            // Update world inertia
            this.updateInertiaWorld();
        };
        Body.COLLIDE_EVENT_NAME = "collide";
        /**
         * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
         */
        Body.DYNAMIC = 1;
        /**
         * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
         */
        Body.STATIC = 2;
        /**
         * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
         */
        Body.KINEMATIC = 4;
        Body.AWAKE = 0;
        Body.SLEEPY = 1;
        Body.SLEEPING = 2;
        Body.idCounter = 0;
        /**
         * Dispatched after a sleeping body has woken up.
         */
        Body.wakeupEvent = {
            type: "wakeup"
        };
        /**
         * Dispatched after a body has gone in to the sleepy state.
         */
        Body.sleepyEvent = {
            type: "sleepy"
        };
        /**
         * Dispatched after a body has fallen asleep.
         * @event sleep
         */
        Body.sleepEvent = {
            type: "sleep"
        };
        return Body;
    }(CANNON.EventTarget));
    CANNON.Body = Body;
    var tmpVec = new CANNON.Vector3();
    var tmpQuat = new CANNON.Quaternion();
    var torque = new CANNON.Vector3();
    var invI_tau_dt = new CANNON.Vector3();
    var w = new CANNON.Quaternion();
    var wq = new CANNON.Quaternion();
    var Body_updateMassProperties_halfExtents = new CANNON.Vector3();
    var Body_applyForce_r = new CANNON.Vector3();
    var Body_applyForce_rotForce = new CANNON.Vector3();
    var Body_applyLocalForce_worldForce = new CANNON.Vector3();
    var Body_applyLocalForce_relativePointWorld = new CANNON.Vector3();
    var Body_applyImpulse_r = new CANNON.Vector3();
    var Body_applyImpulse_velo = new CANNON.Vector3();
    var Body_applyImpulse_rotVelo = new CANNON.Vector3();
    var Body_applyLocalImpulse_worldImpulse = new CANNON.Vector3();
    var Body_applyLocalImpulse_relativePoint = new CANNON.Vector3();
    var uiw_m1 = new CANNON.Matrix3x3();
    var uiw_m2 = new CANNON.Matrix3x3();
    var uiw_m3 = new CANNON.Matrix3x3();
    var computeAABB_shapeAABB = new CANNON.AABB();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Spring = /** @class */ (function () {
        /**
         * A spring, connecting two bodies.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         */
        function Spring(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            this.restLength = typeof (options.restLength) === "number" ? options.restLength : 1;
            this.stiffness = options.stiffness || 100;
            this.damping = options.damping || 1;
            this.bodyA = bodyA;
            this.bodyB = bodyB;
            this.localAnchorA = new CANNON.Vector3();
            this.localAnchorB = new CANNON.Vector3();
            if (options.localAnchorA) {
                this.localAnchorA.copy(options.localAnchorA);
            }
            if (options.localAnchorB) {
                this.localAnchorB.copy(options.localAnchorB);
            }
            if (options.worldAnchorA) {
                this.setWorldAnchorA(options.worldAnchorA);
            }
            if (options.worldAnchorB) {
                this.setWorldAnchorB(options.worldAnchorB);
            }
        }
        /**
         * Set the anchor point on body A, using world coordinates.
         * @param worldAnchorA
         */
        Spring.prototype.setWorldAnchorA = function (worldAnchorA) {
            this.bodyA.pointToLocalFrame(worldAnchorA, this.localAnchorA);
        };
        /**
         * Set the anchor point on body B, using world coordinates.
         * @param worldAnchorB
         */
        Spring.prototype.setWorldAnchorB = function (worldAnchorB) {
            this.bodyB.pointToLocalFrame(worldAnchorB, this.localAnchorB);
        };
        /**
         * Get the anchor point on body A, in world coordinates.
         * @param result The vector to store the result in.
         */
        Spring.prototype.getWorldAnchorA = function (result) {
            this.bodyA.pointToWorldFrame(this.localAnchorA, result);
        };
        /**
         * Get the anchor point on body B, in world coordinates.
         * @param result The vector to store the result in.
         */
        Spring.prototype.getWorldAnchorB = function (result) {
            this.bodyB.pointToWorldFrame(this.localAnchorB, result);
        };
        /**
         * Apply the spring force to the connected bodies.
         */
        Spring.prototype.applyForce = function () {
            var k = this.stiffness, d = this.damping, l = this.restLength, bodyA = this.bodyA, bodyB = this.bodyB, r = applyForce_r, r_unit = applyForce_r_unit, u = applyForce_u, f = applyForce_f, tmp = applyForce_tmp;
            var worldAnchorA = applyForce_worldAnchorA, worldAnchorB = applyForce_worldAnchorB, ri = applyForce_ri, rj = applyForce_rj, ri_x_f = applyForce_ri_x_f, rj_x_f = applyForce_rj_x_f;
            // Get world anchors
            this.getWorldAnchorA(worldAnchorA);
            this.getWorldAnchorB(worldAnchorB);
            // Get offset points
            worldAnchorA.subTo(bodyA.position, ri);
            worldAnchorB.subTo(bodyB.position, rj);
            // Compute distance vector between world anchor points
            worldAnchorB.subTo(worldAnchorA, r);
            var rlen = r.length;
            r_unit.copy(r);
            r_unit.normalize();
            // Compute relative velocity of the anchor points, u
            bodyB.velocity.subTo(bodyA.velocity, u);
            // Add rotational velocity
            bodyB.angularVelocity.crossTo(rj, tmp);
            u.addTo(tmp, u);
            bodyA.angularVelocity.crossTo(ri, tmp);
            u.subTo(tmp, u);
            // F = - k * ( x - L ) - D * ( u )
            r_unit.scaleNumberTo(-k * (rlen - l) - d * u.dot(r_unit), f);
            // Add forces to bodies
            bodyA.force.subTo(f, bodyA.force);
            bodyB.force.addTo(f, bodyB.force);
            // Angular force
            ri.crossTo(f, ri_x_f);
            rj.crossTo(f, rj_x_f);
            bodyA.torque.subTo(ri_x_f, bodyA.torque);
            bodyB.torque.addTo(rj_x_f, bodyB.torque);
        };
        return Spring;
    }());
    CANNON.Spring = Spring;
    var applyForce_r = new CANNON.Vector3();
    var applyForce_r_unit = new CANNON.Vector3();
    var applyForce_u = new CANNON.Vector3();
    var applyForce_f = new CANNON.Vector3();
    var applyForce_worldAnchorA = new CANNON.Vector3();
    var applyForce_worldAnchorB = new CANNON.Vector3();
    var applyForce_ri = new CANNON.Vector3();
    var applyForce_rj = new CANNON.Vector3();
    var applyForce_ri_x_f = new CANNON.Vector3();
    var applyForce_rj_x_f = new CANNON.Vector3();
    var applyForce_tmp = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var WheelInfo = /** @class */ (function () {
        /**
         *
         * @param options
         */
        function WheelInfo(options) {
            if (options === void 0) { options = {}; }
            options = CANNON.Utils.defaults(options, {
                chassisConnectionPointLocal: new CANNON.Vector3(),
                chassisConnectionPointWorld: new CANNON.Vector3(),
                directionLocal: new CANNON.Vector3(),
                directionWorld: new CANNON.Vector3(),
                axleLocal: new CANNON.Vector3(),
                axleWorld: new CANNON.Vector3(),
                suspensionRestLength: 1,
                suspensionMaxLength: 2,
                radius: 1,
                suspensionStiffness: 100,
                dampingCompression: 10,
                dampingRelaxation: 10,
                frictionSlip: 10000,
                steering: 0,
                rotation: 0,
                deltaRotation: 0,
                rollInfluence: 0.01,
                maxSuspensionForce: Number.MAX_VALUE,
                isFrontWheel: true,
                clippedInvContactDotSuspension: 1,
                suspensionRelativeVelocity: 0,
                suspensionForce: 0,
                skidInfo: 0,
                suspensionLength: 0,
                maxSuspensionTravel: 1,
                useCustomSlidingRotationalSpeed: false,
                customSlidingRotationalSpeed: -0.1
            });
            this.maxSuspensionTravel = options.maxSuspensionTravel;
            this.customSlidingRotationalSpeed = options.customSlidingRotationalSpeed;
            this.useCustomSlidingRotationalSpeed = options.useCustomSlidingRotationalSpeed;
            this.sliding = false;
            this.chassisConnectionPointLocal = options.chassisConnectionPointLocal.clone();
            this.chassisConnectionPointWorld = options.chassisConnectionPointWorld.clone();
            this.directionLocal = options.directionLocal.clone();
            this.directionWorld = options.directionWorld.clone();
            this.axleLocal = options.axleLocal.clone();
            this.axleWorld = options.axleWorld.clone();
            this.suspensionRestLength = options.suspensionRestLength;
            this.suspensionMaxLength = options.suspensionMaxLength;
            this.radius = options.radius;
            this.suspensionStiffness = options.suspensionStiffness;
            this.dampingCompression = options.dampingCompression;
            this.dampingRelaxation = options.dampingRelaxation;
            this.frictionSlip = options.frictionSlip;
            this.steering = 0;
            this.rotation = 0;
            this.deltaRotation = 0;
            this.rollInfluence = options.rollInfluence;
            this.maxSuspensionForce = options.maxSuspensionForce;
            this.engineForce = 0;
            this.brake = 0;
            this.isFrontWheel = options.isFrontWheel;
            this.clippedInvContactDotSuspension = 1;
            this.suspensionRelativeVelocity = 0;
            this.suspensionForce = 0;
            this.skidInfo = 0;
            this.suspensionLength = 0;
            this.sideImpulse = 0;
            this.forwardImpulse = 0;
            this.raycastResult = new CANNON.RaycastResult();
            this.worldTransform = new CANNON.Transform();
            this.isInContact = false;
        }
        WheelInfo.prototype.updateWheel = function (chassis) {
            var raycastResult = this.raycastResult;
            if (this.isInContact) {
                var project = raycastResult.hitNormalWorld.dot(raycastResult.directionWorld);
                raycastResult.hitPointWorld.subTo(chassis.position, relpos);
                chassis.getVelocityAtWorldPoint(relpos, chassis_velocity_at_contactPoint);
                var projVel = raycastResult.hitNormalWorld.dot(chassis_velocity_at_contactPoint);
                if (project >= -0.1) {
                    this.suspensionRelativeVelocity = 0.0;
                    this.clippedInvContactDotSuspension = 1.0 / 0.1;
                }
                else {
                    var inv = -1 / project;
                    this.suspensionRelativeVelocity = projVel * inv;
                    this.clippedInvContactDotSuspension = inv;
                }
            }
            else {
                // Not in contact : position wheel in a nice (rest length) position
                raycastResult.suspensionLength = this.suspensionRestLength;
                this.suspensionRelativeVelocity = 0.0;
                raycastResult.directionWorld.scaleNumberTo(-1, raycastResult.hitNormalWorld);
                this.clippedInvContactDotSuspension = 1.0;
            }
        };
        return WheelInfo;
    }());
    CANNON.WheelInfo = WheelInfo;
    var chassis_velocity_at_contactPoint = new CANNON.Vector3();
    var relpos = new CANNON.Vector3();
    var chassis_velocity_at_contactPoint = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var RaycastVehicle = /** @class */ (function () {
        /**
         * Vehicle helper class that casts rays from the wheel positions towards the ground and applies forces.
         *
         * @param options
         */
        function RaycastVehicle(options) {
            if (options === void 0) { options = {}; }
            this.chassisBody = options.chassisBody;
            this.wheelInfos = [];
            this.sliding = false;
            this.world = null;
            this.indexRightAxis = typeof (options.indexRightAxis) !== 'undefined' ? options.indexRightAxis : 1;
            this.indexForwardAxis = typeof (options.indexForwardAxis) !== 'undefined' ? options.indexForwardAxis : 0;
            this.indexUpAxis = typeof (options.indexUpAxis) !== 'undefined' ? options.indexUpAxis : 2;
        }
        /**
         * Add a wheel. For information about the options, see WheelInfo.
         *
         * @param options
         */
        RaycastVehicle.prototype.addWheel = function (options) {
            if (options === void 0) { options = {}; }
            var info = new CANNON.WheelInfo(options);
            var index = this.wheelInfos.length;
            this.wheelInfos.push(info);
            return index;
        };
        /**
         * Set the steering value of a wheel.
         *
         * @param value
         * @param wheelIndex
         */
        RaycastVehicle.prototype.setSteeringValue = function (value, wheelIndex) {
            var wheel = this.wheelInfos[wheelIndex];
            wheel.steering = value;
        };
        /**
         * Set the wheel force to apply on one of the wheels each time step
         *
         * @param value
         * @param wheelIndex
         */
        RaycastVehicle.prototype.applyEngineForce = function (value, wheelIndex) {
            this.wheelInfos[wheelIndex].engineForce = value;
        };
        /**
         * Set the braking force of a wheel
         *
         * @param brake
         * @param wheelIndex
         */
        RaycastVehicle.prototype.setBrake = function (brake, wheelIndex) {
            this.wheelInfos[wheelIndex].brake = brake;
        };
        /**
         * Add the vehicle including its constraints to the world.
         *
         * @param world
         */
        RaycastVehicle.prototype.addToWorld = function (world) {
            var constraints = this.constraints;
            world.addBody(this.chassisBody);
            var that = this;
            this.preStepCallback = function () {
                that.updateVehicle(world.dt);
            };
            world.addEventListener('preStep', this.preStepCallback);
            this.world = world;
        };
        /**
         * Get one of the wheel axles, world-oriented.
         * @param axisIndex
         * @param result
         */
        RaycastVehicle.prototype.getVehicleAxisWorld = function (axisIndex, result) {
            result.set(axisIndex === 0 ? 1 : 0, axisIndex === 1 ? 1 : 0, axisIndex === 2 ? 1 : 0);
            this.chassisBody.vectorToWorldFrame(result, result);
        };
        RaycastVehicle.prototype.updateVehicle = function (timeStep) {
            var wheelInfos = this.wheelInfos;
            var numWheels = wheelInfos.length;
            var chassisBody = this.chassisBody;
            for (var i = 0; i < numWheels; i++) {
                this.updateWheelTransform(i);
            }
            this.currentVehicleSpeedKmHour = 3.6 * chassisBody.velocity.length;
            var forwardWorld = new CANNON.Vector3();
            this.getVehicleAxisWorld(this.indexForwardAxis, forwardWorld);
            if (forwardWorld.dot(chassisBody.velocity) < 0) {
                this.currentVehicleSpeedKmHour *= -1;
            }
            // simulate suspension
            for (var i = 0; i < numWheels; i++) {
                this.castRay(wheelInfos[i]);
            }
            this.updateSuspension(timeStep);
            var impulse = new CANNON.Vector3();
            var relpos = new CANNON.Vector3();
            for (var i = 0; i < numWheels; i++) {
                //apply suspension force
                var wheel = wheelInfos[i];
                var suspensionForce = wheel.suspensionForce;
                if (suspensionForce > wheel.maxSuspensionForce) {
                    suspensionForce = wheel.maxSuspensionForce;
                }
                wheel.raycastResult.hitNormalWorld.scaleNumberTo(suspensionForce * timeStep, impulse);
                wheel.raycastResult.hitPointWorld.subTo(chassisBody.position, relpos);
                chassisBody.applyImpulse(impulse, relpos);
            }
            this.updateFriction(timeStep);
            var hitNormalWorldScaledWithProj = new CANNON.Vector3();
            var fwd = new CANNON.Vector3();
            var vel = new CANNON.Vector3();
            for (i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                //var relpos = new Vector3();
                //wheel.chassisConnectionPointWorld.subTo(chassisBody.position, relpos);
                chassisBody.getVelocityAtWorldPoint(wheel.chassisConnectionPointWorld, vel);
                // Hack to get the rotation in the correct direction
                var m = 1;
                switch (this.indexUpAxis) {
                    case 1:
                        m = -1;
                        break;
                }
                if (wheel.isInContact) {
                    this.getVehicleAxisWorld(this.indexForwardAxis, fwd);
                    var proj = fwd.dot(wheel.raycastResult.hitNormalWorld);
                    wheel.raycastResult.hitNormalWorld.scaleNumberTo(proj, hitNormalWorldScaledWithProj);
                    fwd.subTo(hitNormalWorldScaledWithProj, fwd);
                    var proj2 = fwd.dot(vel);
                    wheel.deltaRotation = m * proj2 * timeStep / wheel.radius;
                }
                if ((wheel.sliding || !wheel.isInContact) && wheel.engineForce !== 0 && wheel.useCustomSlidingRotationalSpeed) {
                    // Apply custom rotation when accelerating and sliding
                    wheel.deltaRotation = (wheel.engineForce > 0 ? 1 : -1) * wheel.customSlidingRotationalSpeed * timeStep;
                }
                // Lock wheels
                if (Math.abs(wheel.brake) > Math.abs(wheel.engineForce)) {
                    wheel.deltaRotation = 0;
                }
                wheel.rotation += wheel.deltaRotation; // Use the old value
                wheel.deltaRotation *= 0.99; // damping of rotation when not in contact
            }
        };
        RaycastVehicle.prototype.updateSuspension = function (deltaTime) {
            var chassisBody = this.chassisBody;
            var chassisMass = chassisBody.mass;
            var wheelInfos = this.wheelInfos;
            var numWheels = wheelInfos.length;
            for (var w_it = 0; w_it < numWheels; w_it++) {
                var wheel = wheelInfos[w_it];
                if (wheel.isInContact) {
                    var force;
                    // Spring
                    var susp_length = wheel.suspensionRestLength;
                    var current_length = wheel.suspensionLength;
                    var length_diff = (susp_length - current_length);
                    force = wheel.suspensionStiffness * length_diff * wheel.clippedInvContactDotSuspension;
                    // Damper
                    var projected_rel_vel = wheel.suspensionRelativeVelocity;
                    var susp_damping;
                    if (projected_rel_vel < 0) {
                        susp_damping = wheel.dampingCompression;
                    }
                    else {
                        susp_damping = wheel.dampingRelaxation;
                    }
                    force -= susp_damping * projected_rel_vel;
                    wheel.suspensionForce = force * chassisMass;
                    if (wheel.suspensionForce < 0) {
                        wheel.suspensionForce = 0;
                    }
                }
                else {
                    wheel.suspensionForce = 0;
                }
            }
        };
        /**
         * Remove the vehicle including its constraints from the world.
         *
         * @param world
         */
        RaycastVehicle.prototype.removeFromWorld = function (world) {
            var constraints = this.constraints;
            world.remove(this.chassisBody);
            world.removeEventListener('preStep', this.preStepCallback);
            this.world = null;
        };
        RaycastVehicle.prototype.castRay = function (wheel) {
            var rayvector = castRay_rayvector;
            var target = castRay_target;
            this.updateWheelTransformWorld(wheel);
            var chassisBody = this.chassisBody;
            var depth = -1;
            var raylen = wheel.suspensionRestLength + wheel.radius;
            wheel.directionWorld.scaleNumberTo(raylen, rayvector);
            var source = wheel.chassisConnectionPointWorld;
            source.addTo(rayvector, target);
            var raycastResult = wheel.raycastResult;
            var param = 0;
            raycastResult.reset();
            // Turn off ray collision with the chassis temporarily
            var oldState = chassisBody.collisionResponse;
            chassisBody.collisionResponse = false;
            // Cast ray against world
            this.world.rayTest(source, target, raycastResult);
            chassisBody.collisionResponse = oldState;
            var object = raycastResult.body;
            wheel.raycastResult.groundObject = 0; //?
            if (object) {
                depth = raycastResult.distance;
                wheel.raycastResult.hitNormalWorld = raycastResult.hitNormalWorld;
                wheel.isInContact = true;
                var hitDistance = raycastResult.distance;
                wheel.suspensionLength = hitDistance - wheel.radius;
                // clamp on max suspension travel
                var minSuspensionLength = wheel.suspensionRestLength - wheel.maxSuspensionTravel;
                var maxSuspensionLength = wheel.suspensionRestLength + wheel.maxSuspensionTravel;
                if (wheel.suspensionLength < minSuspensionLength) {
                    wheel.suspensionLength = minSuspensionLength;
                }
                if (wheel.suspensionLength > maxSuspensionLength) {
                    wheel.suspensionLength = maxSuspensionLength;
                    wheel.raycastResult.reset();
                }
                var denominator = wheel.raycastResult.hitNormalWorld.dot(wheel.directionWorld);
                var chassis_velocity_at_contactPoint = new CANNON.Vector3();
                chassisBody.getVelocityAtWorldPoint(wheel.raycastResult.hitPointWorld, chassis_velocity_at_contactPoint);
                var projVel = wheel.raycastResult.hitNormalWorld.dot(chassis_velocity_at_contactPoint);
                if (denominator >= -0.1) {
                    wheel.suspensionRelativeVelocity = 0;
                    wheel.clippedInvContactDotSuspension = 1 / 0.1;
                }
                else {
                    var inv = -1 / denominator;
                    wheel.suspensionRelativeVelocity = projVel * inv;
                    wheel.clippedInvContactDotSuspension = inv;
                }
            }
            else {
                //put wheel info as in rest position
                wheel.suspensionLength = wheel.suspensionRestLength + 0 * wheel.maxSuspensionTravel;
                wheel.suspensionRelativeVelocity = 0.0;
                wheel.directionWorld.scaleNumberTo(-1, wheel.raycastResult.hitNormalWorld);
                wheel.clippedInvContactDotSuspension = 1.0;
            }
            return depth;
        };
        RaycastVehicle.prototype.updateWheelTransformWorld = function (wheel) {
            wheel.isInContact = false;
            var chassisBody = this.chassisBody;
            chassisBody.pointToWorldFrame(wheel.chassisConnectionPointLocal, wheel.chassisConnectionPointWorld);
            chassisBody.vectorToWorldFrame(wheel.directionLocal, wheel.directionWorld);
            chassisBody.vectorToWorldFrame(wheel.axleLocal, wheel.axleWorld);
        };
        /**
         * Update one of the wheel transform.
         * Note when rendering wheels: during each step, wheel transforms are updated BEFORE the chassis; ie. their position becomes invalid after the step. Thus when you render wheels, you must update wheel transforms before rendering them. See raycastVehicle demo for an example.
         *
         * @param wheelIndex The wheel index to update.
         */
        RaycastVehicle.prototype.updateWheelTransform = function (wheelIndex) {
            var up = tmpVec4;
            var right = tmpVec5;
            var fwd = tmpVec6;
            var wheel = this.wheelInfos[wheelIndex];
            this.updateWheelTransformWorld(wheel);
            wheel.directionLocal.scaleNumberTo(-1, up);
            right.copy(wheel.axleLocal);
            up.crossTo(right, fwd);
            fwd.normalize();
            right.normalize();
            // Rotate around steering over the wheelAxle
            var steering = wheel.steering;
            var steeringOrn = new CANNON.Quaternion();
            steeringOrn.fromAxisAngle(up, steering);
            var rotatingOrn = new CANNON.Quaternion();
            rotatingOrn.fromAxisAngle(right, wheel.rotation);
            // World rotation of the wheel
            var q = wheel.worldTransform.quaternion;
            this.chassisBody.quaternion.multTo(steeringOrn, q);
            q.multTo(rotatingOrn, q);
            q.normalize();
            // world position of the wheel
            var p = wheel.worldTransform.position;
            p.copy(wheel.directionWorld);
            p.scaleNumberTo(wheel.suspensionLength, p);
            p.addTo(wheel.chassisConnectionPointWorld, p);
        };
        /**
         * Get the world transform of one of the wheels
         *
         * @param wheelIndex
         */
        RaycastVehicle.prototype.getWheelTransformWorld = function (wheelIndex) {
            return this.wheelInfos[wheelIndex].worldTransform;
        };
        RaycastVehicle.prototype.updateFriction = function (timeStep) {
            var surfNormalWS_scaled_proj = updateFriction_surfNormalWS_scaled_proj;
            //calculate the impulse, so that the wheels don't move sidewards
            var wheelInfos = this.wheelInfos;
            var numWheels = wheelInfos.length;
            var chassisBody = this.chassisBody;
            var forwardWS = updateFriction_forwardWS;
            var axle = updateFriction_axle;
            var numWheelsOnGround = 0;
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var groundObject = wheel.raycastResult.body;
                if (groundObject) {
                    numWheelsOnGround++;
                }
                wheel.sideImpulse = 0;
                wheel.forwardImpulse = 0;
                if (!forwardWS[i]) {
                    forwardWS[i] = new CANNON.Vector3();
                }
                if (!axle[i]) {
                    axle[i] = new CANNON.Vector3();
                }
            }
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var groundObject = wheel.raycastResult.body;
                if (groundObject) {
                    var axlei = axle[i];
                    var wheelTrans = this.getWheelTransformWorld(i);
                    // Get world axle
                    wheelTrans.vectorToWorldFrame(directions[this.indexRightAxis], axlei);
                    var surfNormalWS = wheel.raycastResult.hitNormalWorld;
                    var proj = axlei.dot(surfNormalWS);
                    surfNormalWS.scaleNumberTo(proj, surfNormalWS_scaled_proj);
                    axlei.subTo(surfNormalWS_scaled_proj, axlei);
                    axlei.normalize();
                    surfNormalWS.crossTo(axlei, forwardWS[i]);
                    forwardWS[i].normalize();
                    wheel.sideImpulse = resolveSingleBilateral(chassisBody, wheel.raycastResult.hitPointWorld, groundObject, wheel.raycastResult.hitPointWorld, axlei);
                    wheel.sideImpulse *= sideFrictionStiffness2;
                }
            }
            var sideFactor = 1;
            var fwdFactor = 0.5;
            this.sliding = false;
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var groundObject = wheel.raycastResult.body;
                var rollingFriction = 0;
                wheel.slipInfo = 1;
                if (groundObject) {
                    var defaultRollingFrictionImpulse = 0;
                    var maxImpulse = wheel.brake ? wheel.brake : defaultRollingFrictionImpulse;
                    // btWheelContactPoint contactPt(chassisBody,groundObject,wheelInfraycastInfo.hitPointWorld,forwardWS[wheel],maxImpulse);
                    // rollingFriction = calcRollingFriction(contactPt);
                    rollingFriction = calcRollingFriction(chassisBody, groundObject, wheel.raycastResult.hitPointWorld, forwardWS[i], maxImpulse);
                    rollingFriction += wheel.engineForce * timeStep;
                    // rollingFriction = 0;
                    var factor = maxImpulse / rollingFriction;
                    wheel.slipInfo *= factor;
                }
                //switch between active rolling (throttle), braking and non-active rolling friction (nthrottle/break)
                wheel.forwardImpulse = 0;
                wheel.skidInfo = 1;
                if (groundObject) {
                    wheel.skidInfo = 1;
                    var maximp = wheel.suspensionForce * timeStep * wheel.frictionSlip;
                    var maximpSide = maximp;
                    var maximpSquared = maximp * maximpSide;
                    wheel.forwardImpulse = rollingFriction; //wheelInfo.engineForce* timeStep;
                    var x = wheel.forwardImpulse * fwdFactor;
                    var y = wheel.sideImpulse * sideFactor;
                    var impulseSquared = x * x + y * y;
                    wheel.sliding = false;
                    if (impulseSquared > maximpSquared) {
                        this.sliding = true;
                        wheel.sliding = true;
                        var factor = maximp / Math.sqrt(impulseSquared);
                        wheel.skidInfo *= factor;
                    }
                }
            }
            if (this.sliding) {
                for (var i = 0; i < numWheels; i++) {
                    var wheel = wheelInfos[i];
                    if (wheel.sideImpulse !== 0) {
                        if (wheel.skidInfo < 1) {
                            wheel.forwardImpulse *= wheel.skidInfo;
                            wheel.sideImpulse *= wheel.skidInfo;
                        }
                    }
                }
            }
            // apply the impulses
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var rel_pos = new CANNON.Vector3();
                wheel.raycastResult.hitPointWorld.subTo(chassisBody.position, rel_pos);
                // cannons applyimpulse is using world coord for the position
                //rel_pos.copy(wheel.raycastResult.hitPointWorld);
                if (wheel.forwardImpulse !== 0) {
                    var impulse = new CANNON.Vector3();
                    forwardWS[i].scaleNumberTo(wheel.forwardImpulse, impulse);
                    chassisBody.applyImpulse(impulse, rel_pos);
                }
                if (wheel.sideImpulse !== 0) {
                    var groundObject = wheel.raycastResult.body;
                    var rel_pos2 = new CANNON.Vector3();
                    wheel.raycastResult.hitPointWorld.subTo(groundObject.position, rel_pos2);
                    //rel_pos2.copy(wheel.raycastResult.hitPointWorld);
                    var sideImp = new CANNON.Vector3();
                    axle[i].scaleNumberTo(wheel.sideImpulse, sideImp);
                    // Scale the relative position in the up direction with rollInfluence.
                    // If rollInfluence is 1, the impulse will be applied on the hitPoint (easy to roll over), if it is zero it will be applied in the same plane as the center of mass (not easy to roll over).
                    chassisBody.vectorToLocalFrame(rel_pos, rel_pos);
                    rel_pos['xyz'[this.indexUpAxis]] *= wheel.rollInfluence;
                    chassisBody.vectorToWorldFrame(rel_pos, rel_pos);
                    chassisBody.applyImpulse(sideImp, rel_pos);
                    //apply friction impulse on the ground
                    sideImp.scaleNumberTo(-1, sideImp);
                    groundObject.applyImpulse(sideImp, rel_pos2);
                }
            }
        };
        return RaycastVehicle;
    }());
    CANNON.RaycastVehicle = RaycastVehicle;
    var tmpVec1 = new CANNON.Vector3();
    var tmpVec2 = new CANNON.Vector3();
    var tmpVec3 = new CANNON.Vector3();
    var tmpVec4 = new CANNON.Vector3();
    var tmpVec5 = new CANNON.Vector3();
    var tmpVec6 = new CANNON.Vector3();
    var tmpRay = new CANNON.Ray();
    var torque = new CANNON.Vector3();
    var castRay_rayvector = new CANNON.Vector3();
    var castRay_target = new CANNON.Vector3();
    var directions = [
        new CANNON.Vector3(1, 0, 0),
        new CANNON.Vector3(0, 1, 0),
        new CANNON.Vector3(0, 0, 1)
    ];
    var updateFriction_surfNormalWS_scaled_proj = new CANNON.Vector3();
    var updateFriction_axle = [];
    var updateFriction_forwardWS = [];
    var sideFrictionStiffness2 = 1;
    var calcRollingFriction_vel1 = new CANNON.Vector3();
    var calcRollingFriction_vel2 = new CANNON.Vector3();
    var calcRollingFriction_vel = new CANNON.Vector3();
    function calcRollingFriction(body0, body1, frictionPosWorld, frictionDirectionWorld, maxImpulse) {
        var j1 = 0;
        var contactPosWorld = frictionPosWorld;
        // var rel_pos1 = new Vector3();
        // var rel_pos2 = new Vector3();
        var vel1 = calcRollingFriction_vel1;
        var vel2 = calcRollingFriction_vel2;
        var vel = calcRollingFriction_vel;
        // contactPosWorld.subTo(body0.position, rel_pos1);
        // contactPosWorld.subTo(body1.position, rel_pos2);
        body0.getVelocityAtWorldPoint(contactPosWorld, vel1);
        body1.getVelocityAtWorldPoint(contactPosWorld, vel2);
        vel1.subTo(vel2, vel);
        var vrel = frictionDirectionWorld.dot(vel);
        var denom0 = computeImpulseDenominator(body0, frictionPosWorld, frictionDirectionWorld);
        var denom1 = computeImpulseDenominator(body1, frictionPosWorld, frictionDirectionWorld);
        var relaxation = 1;
        var jacDiagABInv = relaxation / (denom0 + denom1);
        // calculate j that moves us to zero relative velocity
        j1 = -vrel * jacDiagABInv;
        if (maxImpulse < j1) {
            j1 = maxImpulse;
        }
        if (j1 < -maxImpulse) {
            j1 = -maxImpulse;
        }
        return j1;
    }
    var computeImpulseDenominator_r0 = new CANNON.Vector3();
    var computeImpulseDenominator_c0 = new CANNON.Vector3();
    var computeImpulseDenominator_vec = new CANNON.Vector3();
    var computeImpulseDenominator_m = new CANNON.Vector3();
    function computeImpulseDenominator(body, pos, normal) {
        var r0 = computeImpulseDenominator_r0;
        var c0 = computeImpulseDenominator_c0;
        var vec = computeImpulseDenominator_vec;
        var m = computeImpulseDenominator_m;
        pos.subTo(body.position, r0);
        r0.crossTo(normal, c0);
        body.invInertiaWorld.vmult(c0, m);
        m.crossTo(r0, vec);
        return body.invMass + normal.dot(vec);
    }
    var resolveSingleBilateral_vel1 = new CANNON.Vector3();
    var resolveSingleBilateral_vel2 = new CANNON.Vector3();
    var resolveSingleBilateral_vel = new CANNON.Vector3();
    //bilateral constraint between two dynamic objects
    function resolveSingleBilateral(body1, pos1, body2, pos2, normal) {
        var normalLenSqr = normal.lengthSquared;
        if (normalLenSqr > 1.1) {
            return 0; // no impulse
        }
        // var rel_pos1 = new Vector3();
        // var rel_pos2 = new Vector3();
        // pos1.subTo(body1.position, rel_pos1);
        // pos2.subTo(body2.position, rel_pos2);
        var vel1 = resolveSingleBilateral_vel1;
        var vel2 = resolveSingleBilateral_vel2;
        var vel = resolveSingleBilateral_vel;
        body1.getVelocityAtWorldPoint(pos1, vel1);
        body2.getVelocityAtWorldPoint(pos2, vel2);
        vel1.subTo(vel2, vel);
        var rel_vel = normal.dot(vel);
        var contactDamping = 0.2;
        var massTerm = 1 / (body1.invMass + body2.invMass);
        var impulse = -contactDamping * rel_vel * massTerm;
        return impulse;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var RigidVehicle = /** @class */ (function () {
        /**
         * Simple vehicle helper class with spherical rigid body wheels.
         *
         * @param options
         */
        function RigidVehicle(options) {
            if (options === void 0) { options = {}; }
            this.wheelBodies = [];
            this.coordinateSystem = typeof (options.coordinateSystem) === 'undefined' ? new CANNON.Vector3(1, 2, 3) : options.coordinateSystem.clone();
            this.chassisBody = options.chassisBody;
            if (!this.chassisBody) {
                // No chassis body given. Create it!
                var chassisShape = new CANNON.Box(new CANNON.Vector3(5, 2, 0.5));
                throw "下一行代码有问题？！";
                // this.chassisBody = new Body(1, chassisShape);
            }
            this.constraints = [];
            this.wheelAxes = [];
            this.wheelForces = [];
        }
        /**
         * Add a wheel
         *
         * @param options
         */
        RigidVehicle.prototype.addWheel = function (options) {
            if (options === void 0) { options = {}; }
            var wheelBody = options.body;
            if (!wheelBody) {
                throw "下一行代码有问题？！";
                // wheelBody = new Body(1, new Sphere(1.2));
            }
            this.wheelBodies.push(wheelBody);
            this.wheelForces.push(0);
            // Position constrain wheels
            var zero = new CANNON.Vector3();
            var position = typeof (options.position) !== 'undefined' ? options.position.clone() : new CANNON.Vector3();
            // Set position locally to the chassis
            var worldPosition = new CANNON.Vector3();
            this.chassisBody.pointToWorldFrame(position, worldPosition);
            wheelBody.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
            // Constrain wheel
            var axis = typeof (options.axis) !== 'undefined' ? options.axis.clone() : new CANNON.Vector3(0, 1, 0);
            this.wheelAxes.push(axis);
            var hingeConstraint = new CANNON.HingeConstraint(this.chassisBody, wheelBody, {
                pivotA: position,
                axisA: axis,
                pivotB: CANNON.Vector3.ZERO,
                axisB: axis,
                collideConnected: false
            });
            this.constraints.push(hingeConstraint);
            return this.wheelBodies.length - 1;
        };
        /**
         * Set the steering value of a wheel.
         *
         * @param value
         * @param wheelIndex
         *
         * @todo check coordinateSystem
         */
        RigidVehicle.prototype.setSteeringValue = function (value, wheelIndex) {
            // Set angle of the hinge axis
            var axis = this.wheelAxes[wheelIndex];
            var c = Math.cos(value), s = Math.sin(value), x = axis.x, y = axis.y;
            this.constraints[wheelIndex].axisA.set(c * x - s * y, s * x + c * y, 0);
        };
        /**
         * Set the target rotational speed of the hinge constraint.
         *
         * @param value
         * @param wheelIndex
         */
        RigidVehicle.prototype.setMotorSpeed = function (value, wheelIndex) {
            var hingeConstraint = this.constraints[wheelIndex];
            hingeConstraint.enableMotor();
            hingeConstraint.motorTargetVelocity = value;
        };
        /**
         * Set the target rotational speed of the hinge constraint.
         *
         * @param wheelIndex
         */
        RigidVehicle.prototype.disableMotor = function (wheelIndex) {
            var hingeConstraint = this.constraints[wheelIndex];
            hingeConstraint.disableMotor();
        };
        /**
         * Set the wheel force to apply on one of the wheels each time step
         *
         * @param value
         * @param wheelIndex
         */
        RigidVehicle.prototype.setWheelForce = function (value, wheelIndex) {
            this.wheelForces[wheelIndex] = value;
        };
        /**
         * Apply a torque on one of the wheels.
         *
         * @param value
         * @param wheelIndex
         */
        RigidVehicle.prototype.applyWheelForce = function (value, wheelIndex) {
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var bodyTorque = wheelBody.torque;
            axis.scaleNumberTo(value, torque);
            wheelBody.vectorToWorldFrame(torque, torque);
            bodyTorque.addTo(torque, bodyTorque);
        };
        /**
         * Add the vehicle including its constraints to the world.
         *
         * @param world
         */
        RigidVehicle.prototype.addToWorld = function (world) {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);
            for (var i = 0; i < bodies.length; i++) {
                world.addBody(bodies[i]);
            }
            for (var i = 0; i < constraints.length; i++) {
                world.addConstraint(constraints[i]);
            }
            world.addEventListener('preStep', this._update.bind(this));
        };
        RigidVehicle.prototype._update = function () {
            var wheelForces = this.wheelForces;
            for (var i = 0; i < wheelForces.length; i++) {
                this.applyWheelForce(wheelForces[i], i);
            }
        };
        /**
         * Remove the vehicle including its constraints from the world.
         * @param world
         */
        RigidVehicle.prototype.removeFromWorld = function (world) {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);
            for (var i = 0; i < bodies.length; i++) {
                world.remove(bodies[i]);
            }
            for (var i = 0; i < constraints.length; i++) {
                world.removeConstraint(constraints[i]);
            }
        };
        /**
         * Get current rotational velocity of a wheel
         *
         * @param wheelIndex
         */
        RigidVehicle.prototype.getWheelSpeed = function (wheelIndex) {
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var w = wheelBody.angularVelocity;
            this.chassisBody.vectorToWorldFrame(axis, worldAxis);
            return w.dot(worldAxis);
        };
        return RigidVehicle;
    }());
    CANNON.RigidVehicle = RigidVehicle;
    var torque = new CANNON.Vector3();
    var worldAxis = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var SPHSystem = /** @class */ (function () {
        /**
         * Smoothed-particle hydrodynamics system
         */
        function SPHSystem() {
            this.particles = [];
            this.density = 1;
            this.smoothingRadius = 1;
            this.speedOfSound = 1;
            this.viscosity = 0.01;
            this.eps = 0.000001;
            // Stuff Computed per particle
            this.pressures = [];
            this.densities = [];
            this.neighbors = [];
        }
        /**
         * Add a particle to the system.
         *
         * @param particle
         */
        SPHSystem.prototype.add = function (particle) {
            this.particles.push(particle);
            if (this.neighbors.length < this.particles.length) {
                this.neighbors.push([]);
            }
        };
        /**
         * Remove a particle from the system.
         *
         * @param particle
         */
        SPHSystem.prototype.remove = function (particle) {
            var idx = this.particles.indexOf(particle);
            if (idx !== -1) {
                this.particles.splice(idx, 1);
                if (this.neighbors.length > this.particles.length) {
                    this.neighbors.pop();
                }
            }
        };
        /**
         * Get neighbors within smoothing volume, save in the array neighbors
         *
         * @param particle
         * @param neighbors
         */
        SPHSystem.prototype.getNeighbors = function (particle, neighbors) {
            var N = this.particles.length, id = particle.id, R2 = this.smoothingRadius * this.smoothingRadius, dist = SPHSystem_getNeighbors_dist;
            for (var i = 0; i !== N; i++) {
                var p = this.particles[i];
                p.position.subTo(particle.position, dist);
                if (id !== p.id && dist.lengthSquared < R2) {
                    neighbors.push(p);
                }
            }
        };
        SPHSystem.prototype.update = function () {
            var N = this.particles.length, dist = SPHSystem_update_dist, cs = this.speedOfSound, eps = this.eps;
            for (var i = 0; i !== N; i++) {
                var p = this.particles[i]; // Current particle
                var neighbors = this.neighbors[i];
                // Get neighbors
                neighbors.length = 0;
                this.getNeighbors(p, neighbors);
                neighbors.push(this.particles[i]); // Add current too
                var numNeighbors = neighbors.length;
                // Accumulate density for the particle
                var sum = 0.0;
                for (var j = 0; j !== numNeighbors; j++) {
                    //printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
                    p.position.subTo(neighbors[j].position, dist);
                    var len = dist.length;
                    var weight = this.w(len);
                    sum += neighbors[j].mass * weight;
                }
                // Save
                this.densities[i] = sum;
                this.pressures[i] = cs * cs * (this.densities[i] - this.density);
            }
            // Add forces
            // Sum to these accelerations
            var a_pressure = SPHSystem_update_a_pressure;
            var a_visc = SPHSystem_update_a_visc;
            var gradW = SPHSystem_update_gradW;
            var r_vec = SPHSystem_update_r_vec;
            var u = SPHSystem_update_u;
            for (var i = 0; i !== N; i++) {
                var particle = this.particles[i];
                a_pressure.set(0, 0, 0);
                a_visc.set(0, 0, 0);
                // Init vars
                var Pij;
                var nabla;
                var Vij;
                // Sum up for all other neighbors
                var neighbors = this.neighbors[i];
                var numNeighbors = neighbors.length;
                //printf("Neighbors: ");
                for (var j = 0; j !== numNeighbors; j++) {
                    var neighbor = neighbors[j];
                    //printf("%d ",nj);
                    // Get r once for all..
                    particle.position.subTo(neighbor.position, r_vec);
                    var r = r_vec.length;
                    // Pressure contribution
                    Pij = -neighbor.mass * (this.pressures[i] / (this.densities[i] * this.densities[i] + eps) + this.pressures[j] / (this.densities[j] * this.densities[j] + eps));
                    this.gradw(r_vec, gradW);
                    // Add to pressure acceleration
                    gradW.scaleNumberTo(Pij, gradW);
                    a_pressure.addTo(gradW, a_pressure);
                    // Viscosity contribution
                    neighbor.velocity.subTo(particle.velocity, u);
                    u.scaleNumberTo(1.0 / (0.0001 + this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass, u);
                    nabla = this.nablaw(r);
                    u.scaleNumberTo(nabla, u);
                    // Add to viscosity acceleration
                    a_visc.addTo(u, a_visc);
                }
                // Calculate force
                a_visc.scaleNumberTo(particle.mass, a_visc);
                a_pressure.scaleNumberTo(particle.mass, a_pressure);
                // Add force to particles
                particle.force.addTo(a_visc, particle.force);
                particle.force.addTo(a_pressure, particle.force);
            }
        };
        // Calculate the weight using the W(r) weightfunction
        SPHSystem.prototype.w = function (r) {
            // 315
            var h = this.smoothingRadius;
            return 315.0 / (64.0 * Math.PI * Math.pow(h, 9)) * Math.pow(h * h - r * r, 3);
        };
        // calculate gradient of the weight function
        SPHSystem.prototype.gradw = function (rVec, resultVec) {
            var r = rVec.length, h = this.smoothingRadius;
            rVec.scaleNumberTo(945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * Math.pow((h * h - r * r), 2), resultVec);
        };
        // Calculate nabla(W)
        SPHSystem.prototype.nablaw = function (r) {
            var h = this.smoothingRadius;
            var nabla = 945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h);
            return nabla;
        };
        return SPHSystem;
    }());
    CANNON.SPHSystem = SPHSystem;
    var SPHSystem_getNeighbors_dist = new CANNON.Vector3();
    var SPHSystem_update_dist = new CANNON.Vector3();
    var SPHSystem_update_a_pressure = new CANNON.Vector3();
    var SPHSystem_update_a_visc = new CANNON.Vector3();
    var SPHSystem_update_gradW = new CANNON.Vector3();
    var SPHSystem_update_r_vec = new CANNON.Vector3();
    var SPHSystem_update_u = new CANNON.Vector3(); // Relative velocity
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Equation = /** @class */ (function () {
        /**
         * Equation base class
         * @class Equation
         * @constructor
         * @author schteppe
         * @param {Body} bi
         * @param {Body} bj
         * @param {Number} minForce Minimum (read: negative max) force to be applied by the constraint.
         * @param {Number} maxForce Maximum (read: positive max) force to be applied by the constraint.
         */
        function Equation(bi, bj, minForce, maxForce) {
            if (minForce === void 0) { minForce = -1e6; }
            if (maxForce === void 0) { maxForce = 1e6; }
            this.id = Equation.id++;
            this.minForce = minForce;
            this.maxForce = maxForce;
            this.bi = bi;
            this.bj = bj;
            this.a = 0.0;
            this.b = 0.0;
            this.eps = 0.0;
            this.jacobianElementA = new CANNON.JacobianElement();
            this.jacobianElementB = new CANNON.JacobianElement();
            this.enabled = true;
            this.multiplier = 0;
            // Set typical spook params
            this.setSpookParams(1e7, 4, 1 / 60);
        }
        /**
         * Recalculates a,b,eps.
         */
        Equation.prototype.setSpookParams = function (stiffness, relaxation, timeStep) {
            var d = relaxation, k = stiffness, h = timeStep;
            this.a = 4.0 / (h * (1 + 4 * d));
            this.b = (4.0 * d) / (1 + 4 * d);
            this.eps = 4.0 / (h * h * k * (1 + 4 * d));
        };
        /**
         * Computes the RHS of the SPOOK equation
         */
        Equation.prototype.computeB = function (a, b, h) {
            var GW = this.computeGW(), Gq = this.computeGq(), GiMf = this.computeGiMf();
            return -Gq * a - GW * b - GiMf * h;
        };
        /**
         * Computes G*q, where q are the generalized body coordinates
         */
        Equation.prototype.computeGq = function () {
            var GA = this.jacobianElementA, GB = this.jacobianElementB, bi = this.bi, bj = this.bj, xi = bi.position, xj = bj.position;
            return GA.spatial.dot(xi) + GB.spatial.dot(xj);
        };
        /**
         * Computes G*W, where W are the body velocities
         */
        Equation.prototype.computeGW = function () {
            var GA = this.jacobianElementA, GB = this.jacobianElementB, bi = this.bi, bj = this.bj, vi = bi.velocity, vj = bj.velocity, wi = bi.angularVelocity, wj = bj.angularVelocity;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        };
        /**
         * Computes G*Wlambda, where W are the body velocities
         */
        Equation.prototype.computeGWlambda = function () {
            var GA = this.jacobianElementA, GB = this.jacobianElementB, bi = this.bi, bj = this.bj, vi = bi.vlambda, vj = bj.vlambda, wi = bi.wlambda, wj = bj.wlambda;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        };
        /**
         * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
         */
        Equation.prototype.computeGiMf = function () {
            var GA = this.jacobianElementA, GB = this.jacobianElementB, bi = this.bi, bj = this.bj, fi = bi.force, ti = bi.torque, fj = bj.force, tj = bj.torque, invMassi = bi.invMassSolve, invMassj = bj.invMassSolve;
            fi.scaleNumberTo(invMassi, iMfi);
            fj.scaleNumberTo(invMassj, iMfj);
            bi.invInertiaWorldSolve.vmult(ti, invIi_vmult_taui);
            bj.invInertiaWorldSolve.vmult(tj, invIj_vmult_tauj);
            return GA.multiplyVectors(iMfi, invIi_vmult_taui) + GB.multiplyVectors(iMfj, invIj_vmult_tauj);
        };
        /**
         * Computes G*inv(M)*G'
         */
        Equation.prototype.computeGiMGt = function () {
            var GA = this.jacobianElementA, GB = this.jacobianElementB, bi = this.bi, bj = this.bj, invMassi = bi.invMassSolve, invMassj = bj.invMassSolve, invIi = bi.invInertiaWorldSolve, invIj = bj.invInertiaWorldSolve, result = invMassi + invMassj;
            invIi.vmult(GA.rotational, tmp);
            result += tmp.dot(GA.rotational);
            invIj.vmult(GB.rotational, tmp);
            result += tmp.dot(GB.rotational);
            return result;
        };
        /**
         * Add constraint velocity to the bodies.
         */
        Equation.prototype.addToWlambda = function (deltalambda) {
            var GA = this.jacobianElementA, GB = this.jacobianElementB, bi = this.bi, bj = this.bj, temp = addToWlambda_temp;
            // Add to linear velocity
            // v_lambda += inv(M) * delta_lamba * G
            bi.vlambda.addScaledVectorTo(bi.invMassSolve * deltalambda, GA.spatial, bi.vlambda);
            bj.vlambda.addScaledVectorTo(bj.invMassSolve * deltalambda, GB.spatial, bj.vlambda);
            // Add to angular velocity
            bi.invInertiaWorldSolve.vmult(GA.rotational, temp);
            bi.wlambda.addScaledVectorTo(deltalambda, temp, bi.wlambda);
            bj.invInertiaWorldSolve.vmult(GB.rotational, temp);
            bj.wlambda.addScaledVectorTo(deltalambda, temp, bj.wlambda);
        };
        /**
         * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
         */
        Equation.prototype.computeC = function () {
            return this.computeGiMGt() + this.eps;
        };
        Equation.id = 0;
        return Equation;
    }());
    CANNON.Equation = Equation;
    var zero = new CANNON.Vector3();
    var iMfi = new CANNON.Vector3();
    var iMfj = new CANNON.Vector3();
    var invIi_vmult_taui = new CANNON.Vector3();
    var invIj_vmult_tauj = new CANNON.Vector3();
    var tmp = new CANNON.Vector3();
    var addToWlambda_temp = new CANNON.Vector3();
    var addToWlambda_Gi = new CANNON.Vector3();
    var addToWlambda_Gj = new CANNON.Vector3();
    var addToWlambda_ri = new CANNON.Vector3();
    var addToWlambda_rj = new CANNON.Vector3();
    var addToWlambda_Mdiag = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ConeEquation = /** @class */ (function (_super) {
        __extends(ConeEquation, _super);
        /**
         * Cone equation. Works to keep the given body world vectors aligned, or tilted within a given angle from each other.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function ConeEquation(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            _this.axisA = options.axisA ? options.axisA.clone() : new CANNON.Vector3(1, 0, 0);
            _this.axisB = options.axisB ? options.axisB.clone() : new CANNON.Vector3(0, 1, 0);
            _this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;
            return _this;
        }
        ConeEquation.prototype.computeB = function (h) {
            var a = this.a, b = this.b, ni = this.axisA, nj = this.axisB, nixnj = tmpVec1, njxni = tmpVec2, GA = this.jacobianElementA, GB = this.jacobianElementB;
            // Caluclate cross products
            ni.crossTo(nj, nixnj);
            nj.crossTo(ni, njxni);
            // The angle between two vector is:
            // cos(theta) = a * b / (length(a) * length(b) = { len(a) = len(b) = 1 } = a * b
            // g = a * b
            // gdot = (b x a) * wi + (a x b) * wj
            // G = [0 bxa 0 axb]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);
            var g = Math.cos(this.angle) - ni.dot(nj), GW = this.computeGW(), GiMf = this.computeGiMf();
            var B = -g * a - GW * b - h * GiMf;
            return B;
        };
        return ConeEquation;
    }(CANNON.Equation));
    CANNON.ConeEquation = ConeEquation;
    var tmpVec1 = new CANNON.Vector3();
    var tmpVec2 = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var ContactEquation = /** @class */ (function (_super) {
        __extends(ContactEquation, _super);
        /**
         * Contact/non-penetration constraint equation
         *
         * @param bodyA
         * @param bodyB
         *
         * @author schteppe
         */
        function ContactEquation(bodyA, bodyB, maxForce) {
            var _this = _super.call(this, bodyA, bodyB, 0, typeof (maxForce) !== 'undefined' ? maxForce : 1e6) || this;
            _this.restitution = 0.0; // "bounciness": u1 = -e*u0
            _this.ri = new CANNON.Vector3();
            _this.rj = new CANNON.Vector3();
            _this.ni = new CANNON.Vector3();
            return _this;
        }
        ContactEquation.prototype.computeB = function (h) {
            var a = this.a, b = this.b, bi = this.bi, bj = this.bj, ri = this.ri, rj = this.rj, rixn = ContactEquation_computeB_temp1, rjxn = ContactEquation_computeB_temp2, vi = bi.velocity, wi = bi.angularVelocity, fi = bi.force, taui = bi.torque, vj = bj.velocity, wj = bj.angularVelocity, fj = bj.force, tauj = bj.torque, penetrationVec = ContactEquation_computeB_temp3, GA = this.jacobianElementA, GB = this.jacobianElementB, n = this.ni;
            // Caluclate cross products
            ri.crossTo(n, rixn);
            rj.crossTo(n, rjxn);
            // g = xj+rj -(xi+ri)
            // G = [ -ni  -rixn  ni  rjxn ]
            n.negateTo(GA.spatial);
            rixn.negateTo(GA.rotational);
            GB.spatial.copy(n);
            GB.rotational.copy(rjxn);
            // Calculate the penetration vector
            penetrationVec.copy(bj.position);
            penetrationVec.addTo(rj, penetrationVec);
            penetrationVec.subTo(bi.position, penetrationVec);
            penetrationVec.subTo(ri, penetrationVec);
            var g = n.dot(penetrationVec);
            // Compute iteration
            var ePlusOne = this.restitution + 1;
            var GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
            var GiMf = this.computeGiMf();
            var B = -g * a - GW * b - h * GiMf;
            return B;
        };
        /**
         * Get the current relative velocity in the contact point.
         */
        ContactEquation.prototype.getImpactVelocityAlongNormal = function () {
            var vi = ContactEquation_getImpactVelocityAlongNormal_vi;
            var vj = ContactEquation_getImpactVelocityAlongNormal_vj;
            var xi = ContactEquation_getImpactVelocityAlongNormal_xi;
            var xj = ContactEquation_getImpactVelocityAlongNormal_xj;
            var relVel = ContactEquation_getImpactVelocityAlongNormal_relVel;
            this.bi.position.addTo(this.ri, xi);
            this.bj.position.addTo(this.rj, xj);
            this.bi.getVelocityAtWorldPoint(xi, vi);
            this.bj.getVelocityAtWorldPoint(xj, vj);
            vi.subTo(vj, relVel);
            return this.ni.dot(relVel);
        };
        return ContactEquation;
    }(CANNON.Equation));
    CANNON.ContactEquation = ContactEquation;
    var ContactEquation_computeB_temp1 = new CANNON.Vector3(); // Temp vectors
    var ContactEquation_computeB_temp2 = new CANNON.Vector3();
    var ContactEquation_computeB_temp3 = new CANNON.Vector3();
    var ContactEquation_getImpactVelocityAlongNormal_vi = new CANNON.Vector3();
    var ContactEquation_getImpactVelocityAlongNormal_vj = new CANNON.Vector3();
    var ContactEquation_getImpactVelocityAlongNormal_xi = new CANNON.Vector3();
    var ContactEquation_getImpactVelocityAlongNormal_xj = new CANNON.Vector3();
    var ContactEquation_getImpactVelocityAlongNormal_relVel = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var FrictionEquation = /** @class */ (function (_super) {
        __extends(FrictionEquation, _super);
        /**
         * Constrains the slipping in a contact along a tangent
         * @class FrictionEquation
         * @constructor
         * @author schteppe
         * @param {Body} bodyA
         * @param {Body} bodyB
         * @param {Number} slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
         * @extends Equation
         */
        function FrictionEquation(bodyA, bodyB, slipForce) {
            var _this = _super.call(this, bodyA, bodyB, -slipForce, slipForce) || this;
            _this.ri = new CANNON.Vector3();
            _this.rj = new CANNON.Vector3();
            _this.t = new CANNON.Vector3(); // tangent
            return _this;
        }
        FrictionEquation.prototype.computeB = function (h) {
            var a = this.a, b = this.b, bi = this.bi, bj = this.bj, ri = this.ri, rj = this.rj, rixt = FrictionEquation_computeB_temp1, rjxt = FrictionEquation_computeB_temp2, t = this.t;
            // Caluclate cross products
            ri.crossTo(t, rixt);
            rj.crossTo(t, rjxt);
            // G = [-t -rixt t rjxt]
            // And remember, this is a pure velocity constraint, g is always zero!
            var GA = this.jacobianElementA, GB = this.jacobianElementB;
            t.negateTo(GA.spatial);
            rixt.negateTo(GA.rotational);
            GB.spatial.copy(t);
            GB.rotational.copy(rjxt);
            var GW = this.computeGW();
            var GiMf = this.computeGiMf();
            var B = -GW * b - h * GiMf;
            return B;
        };
        return FrictionEquation;
    }(CANNON.Equation));
    CANNON.FrictionEquation = FrictionEquation;
    var FrictionEquation_computeB_temp1 = new CANNON.Vector3();
    var FrictionEquation_computeB_temp2 = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var RotationalEquation = /** @class */ (function (_super) {
        __extends(RotationalEquation, _super);
        /**
         * Rotational constraint. Works to keep the local vectors orthogonal to each other in world space.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function RotationalEquation(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            _this.axisA = options.axisA ? options.axisA.clone() : new CANNON.Vector3(1, 0, 0);
            _this.axisB = options.axisB ? options.axisB.clone() : new CANNON.Vector3(0, 1, 0);
            _this.maxAngle = Math.PI / 2;
            return _this;
        }
        RotationalEquation.prototype.computeB = function (h) {
            var a = this.a, b = this.b, ni = this.axisA, nj = this.axisB, nixnj = tmpVec1, njxni = tmpVec2, GA = this.jacobianElementA, GB = this.jacobianElementB;
            // Caluclate cross products
            ni.crossTo(nj, nixnj);
            nj.crossTo(ni, njxni);
            // g = ni * nj
            // gdot = (nj x ni) * wi + (ni x nj) * wj
            // G = [0 njxni 0 nixnj]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);
            var g = Math.cos(this.maxAngle) - ni.dot(nj), GW = this.computeGW(), GiMf = this.computeGiMf();
            var B = -g * a - GW * b - h * GiMf;
            return B;
        };
        return RotationalEquation;
    }(CANNON.Equation));
    CANNON.RotationalEquation = RotationalEquation;
    var tmpVec1 = new CANNON.Vector3();
    var tmpVec2 = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var RotationalMotorEquation = /** @class */ (function (_super) {
        __extends(RotationalMotorEquation, _super);
        /**
         * Rotational motor constraint. Tries to keep the relative angular velocity of the bodies to a given value.
         *
         * @param bodyA
         * @param bodyB
         * @param maxForce
         *
         * @author schteppe
         */
        function RotationalMotorEquation(bodyA, bodyB, maxForce) {
            var _this = _super.call(this, bodyA, bodyB, -(typeof (maxForce) !== 'undefined' ? maxForce : 1e6), typeof (maxForce) !== 'undefined' ? maxForce : 1e6) || this;
            _this.axisA = new CANNON.Vector3();
            _this.axisB = new CANNON.Vector3(); // World oriented rotational axis
            _this.targetVelocity = 0;
            return _this;
        }
        RotationalMotorEquation.prototype.computeB = function (h) {
            var a = this.a, b = this.b, bi = this.bi, bj = this.bj, axisA = this.axisA, axisB = this.axisB, GA = this.jacobianElementA, GB = this.jacobianElementB;
            // g = 0
            // gdot = axisA * wi - axisB * wj
            // gdot = G * W = G * [vi wi vj wj]
            // =>
            // G = [0 axisA 0 -axisB]
            GA.rotational.copy(axisA);
            axisB.negateTo(GB.rotational);
            var GW = this.computeGW() - this.targetVelocity, GiMf = this.computeGiMf();
            var B = -GW * b - h * GiMf;
            return B;
        };
        return RotationalMotorEquation;
    }(CANNON.Equation));
    CANNON.RotationalMotorEquation = RotationalMotorEquation;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Solver = /** @class */ (function () {
        /**
         * Constraint equation solver base class.
         * @author schteppe / https://github.com/schteppe
         */
        function Solver() {
            this.equations = [];
        }
        /**
         * Should be implemented in subclasses!
         * @param dt
         * @param world
         */
        Solver.prototype.solve = function (dt, world) {
            // Should return the number of iterations done!
            return 0;
        };
        /**
         * Add an equation
         * @param eq
         */
        Solver.prototype.addEquation = function (eq) {
            if (eq.enabled) {
                this.equations.push(eq);
            }
        };
        /**
         * Remove an equation
         * @param eq
         */
        Solver.prototype.removeEquation = function (eq) {
            var eqs = this.equations;
            var i = eqs.indexOf(eq);
            if (i !== -1) {
                eqs.splice(i, 1);
            }
        };
        /**
         * Add all equations
         */
        Solver.prototype.removeAllEquations = function () {
            this.equations.length = 0;
        };
        return Solver;
    }());
    CANNON.Solver = Solver;
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var GSSolver = /** @class */ (function (_super) {
        __extends(GSSolver, _super);
        /**
         * Constraint equation Gauss-Seidel solver.
         * @todo The spook parameters should be specified for each constraint, not globally.
         * @author schteppe / https://github.com/schteppe
         * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
         */
        function GSSolver() {
            var _this = _super.call(this) || this;
            _this.iterations = 10;
            _this.tolerance = 1e-7;
            return _this;
        }
        GSSolver.prototype.solve = function (dt, world) {
            var iter = 0, maxIter = this.iterations, tolSquared = this.tolerance * this.tolerance, equations = this.equations, Neq = equations.length, bodies = world.bodies, Nbodies = bodies.length, h = dt, q, B, invC, deltalambda, deltalambdaTot, GWlambda, lambdaj;
            // Update solve mass
            if (Neq !== 0) {
                for (var i = 0; i !== Nbodies; i++) {
                    bodies[i].updateSolveMassProperties();
                }
            }
            // Things that does not change during iteration can be computed once
            var invCs = GSSolver_solve_invCs, Bs = GSSolver_solve_Bs, lambda = GSSolver_solve_lambda;
            invCs.length = Neq;
            Bs.length = Neq;
            lambda.length = Neq;
            for (var i = 0; i !== Neq; i++) {
                var c = equations[i];
                lambda[i] = 0.0;
                Bs[i] = c.computeB(h, 0, 0);
                invCs[i] = 1.0 / c.computeC();
            }
            if (Neq !== 0) {
                // Reset vlambda
                for (var i = 0; i !== Nbodies; i++) {
                    var b = bodies[i], vlambda = b.vlambda, wlambda = b.wlambda;
                    vlambda.set(0, 0, 0);
                    wlambda.set(0, 0, 0);
                }
                // Iterate over equations
                for (iter = 0; iter !== maxIter; iter++) {
                    // Accumulate the total error for each iteration.
                    deltalambdaTot = 0.0;
                    for (var j = 0; j !== Neq; j++) {
                        var c = equations[j];
                        // Compute iteration
                        B = Bs[j];
                        invC = invCs[j];
                        lambdaj = lambda[j];
                        GWlambda = c.computeGWlambda();
                        deltalambda = invC * (B - GWlambda - c.eps * lambdaj);
                        // Clamp if we are not within the min/max interval
                        if (lambdaj + deltalambda < c.minForce) {
                            deltalambda = c.minForce - lambdaj;
                        }
                        else if (lambdaj + deltalambda > c.maxForce) {
                            deltalambda = c.maxForce - lambdaj;
                        }
                        lambda[j] += deltalambda;
                        deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // abs(deltalambda)
                        c.addToWlambda(deltalambda);
                    }
                    // If the total error is small enough - stop iterate
                    if (deltalambdaTot * deltalambdaTot < tolSquared) {
                        break;
                    }
                }
                // Add result to velocity
                for (var i = 0; i !== Nbodies; i++) {
                    var b = bodies[i], v = b.velocity, w = b.angularVelocity;
                    b.vlambda.scaleTo(b.linearFactor, b.vlambda);
                    v.addTo(b.vlambda, v);
                    b.wlambda.scaleTo(b.angularFactor, b.wlambda);
                    w.addTo(b.wlambda, w);
                }
                // Set the .multiplier property of each equation
                var l = equations.length;
                var invDt = 1 / h;
                while (l--) {
                    equations[l].multiplier = lambda[l] * invDt;
                }
            }
            return iter;
        };
        return GSSolver;
    }(CANNON.Solver));
    CANNON.GSSolver = GSSolver;
    var GSSolver_solve_lambda = []; // Just temporary number holders that we want to reuse each solve.
    var GSSolver_solve_invCs = [];
    var GSSolver_solve_Bs = [];
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    ;
    var SplitSolver = /** @class */ (function (_super) {
        __extends(SplitSolver, _super);
        /**
         * Splits the equations into islands and solves them independently. Can improve performance.
         *
         * @param subsolver
         */
        function SplitSolver(subsolver) {
            var _this = _super.call(this) || this;
            _this.iterations = 10;
            _this.tolerance = 1e-7;
            _this.subsolver = subsolver;
            _this.nodes = [];
            _this.nodePool = [];
            // Create needed nodes, reuse if possible
            while (_this.nodePool.length < 128) {
                _this.nodePool.push(_this.createNode());
            }
            return _this;
        }
        SplitSolver.prototype.createNode = function () {
            return { body: null, children: [], eqs: [], visited: false };
        };
        /**
         * Solve the subsystems
         * @method solve
         * @param  {Number} dt
         * @param  {World} world
         */
        SplitSolver.prototype.solve = function (dt, world) {
            var nodes = SplitSolver_solve_nodes, nodePool = this.nodePool, bodies = world.bodies, equations = this.equations, Neq = equations.length, Nbodies = bodies.length, subsolver = this.subsolver;
            // Create needed nodes, reuse if possible
            while (nodePool.length < Nbodies) {
                nodePool.push(this.createNode());
            }
            nodes.length = Nbodies;
            for (var i = 0; i < Nbodies; i++) {
                nodes[i] = nodePool[i];
            }
            // Reset node values
            for (var i = 0; i !== Nbodies; i++) {
                var node = nodes[i];
                node.body = bodies[i];
                node.children.length = 0;
                node.eqs.length = 0;
                node.visited = false;
            }
            for (var k = 0; k !== Neq; k++) {
                var eq = equations[k], i0 = bodies.indexOf(eq.bi), j = bodies.indexOf(eq.bj), ni = nodes[i0], nj = nodes[j];
                ni.children.push(nj);
                ni.eqs.push(eq);
                nj.children.push(ni);
                nj.eqs.push(eq);
            }
            var child, n = 0, eqs = SplitSolver_solve_eqs;
            subsolver.tolerance = this.tolerance;
            subsolver.iterations = this.iterations;
            var dummyWorld = SplitSolver_solve_dummyWorld;
            while ((child = getUnvisitedNode(nodes))) {
                eqs.length = 0;
                dummyWorld.bodies.length = 0;
                bfs(child, visitFunc, dummyWorld.bodies, eqs);
                var Neqs = eqs.length;
                eqs = eqs.sort(sortById);
                for (var i = 0; i !== Neqs; i++) {
                    subsolver.addEquation(eqs[i]);
                }
                var iter = subsolver.solve(dt, dummyWorld);
                subsolver.removeAllEquations();
                n++;
            }
            return n;
        };
        return SplitSolver;
    }(CANNON.Solver));
    CANNON.SplitSolver = SplitSolver;
    // Returns the number of subsystems
    var SplitSolver_solve_nodes = []; // All allocated node objects
    var SplitSolver_solve_nodePool = []; // All allocated node objects
    var SplitSolver_solve_eqs = []; // Temp array
    var SplitSolver_solve_bds = []; // Temp array
    var SplitSolver_solve_dummyWorld = { bodies: [] }; // Temp object
    var STATIC = CANNON.Body.STATIC;
    function getUnvisitedNode(nodes) {
        var Nnodes = nodes.length;
        for (var i = 0; i !== Nnodes; i++) {
            var node = nodes[i];
            if (!node.visited && !(node.body.type & STATIC)) {
                return node;
            }
        }
        return false;
    }
    var queue = [];
    function bfs(root, visitFunc, bds, eqs) {
        queue.push(root);
        root.visited = true;
        visitFunc(root, bds, eqs);
        while (queue.length) {
            var node = queue.pop();
            // Loop over unvisited child nodes
            var child;
            while ((child = getUnvisitedNode(node.children))) {
                child.visited = true;
                visitFunc(child, bds, eqs);
                queue.push(child);
            }
        }
    }
    function visitFunc(node, bds, eqs) {
        bds.push(node.body);
        var Neqs = node.eqs.length;
        for (var i = 0; i !== Neqs; i++) {
            var eq = node.eqs[i];
            if (eqs.indexOf(eq) === -1) {
                eqs.push(eq);
            }
        }
    }
    function sortById(a, b) {
        return b.id - a.id;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var World = /** @class */ (function (_super) {
        __extends(World, _super);
        /**
         * The physics world
         * @param options
         */
        function World(options) {
            if (options === void 0) { options = {}; }
            var _this_1 = _super.call(this) || this;
            _this_1.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0,
            };
            /**
             * Dispatched after a body has been added to the world.
             */
            _this_1.addBodyEvent = {
                type: "addBody",
                body: null
            };
            /**
             * Dispatched after a body has been removed from the world.
             */
            _this_1.removeBodyEvent = {
                type: "removeBody",
                body: null
            };
            _this_1.idToBodyMap = {};
            _this_1.emitContactEvents = (function () {
                var additions = [];
                var removals = [];
                var beginContactEvent = {
                    type: 'beginContact',
                    bodyA: null,
                    bodyB: null
                };
                var endContactEvent = {
                    type: 'endContact',
                    bodyA: null,
                    bodyB: null
                };
                var beginShapeContactEvent = {
                    type: 'beginShapeContact',
                    bodyA: null,
                    bodyB: null,
                    shapeA: null,
                    shapeB: null
                };
                var endShapeContactEvent = {
                    type: 'endShapeContact',
                    bodyA: null,
                    bodyB: null,
                    shapeA: null,
                    shapeB: null
                };
                return function () {
                    var _this = this;
                    var hasBeginContact = _this.hasAnyEventListener('beginContact');
                    var hasEndContact = _this.hasAnyEventListener('endContact');
                    if (hasBeginContact || hasEndContact) {
                        _this.bodyOverlapKeeper.getDiff(additions, removals);
                    }
                    if (hasBeginContact) {
                        for (var i = 0, l = additions.length; i < l; i += 2) {
                            beginContactEvent.bodyA = _this.getBodyById(additions[i]);
                            beginContactEvent.bodyB = _this.getBodyById(additions[i + 1]);
                            _this.dispatchEvent(beginContactEvent);
                        }
                        beginContactEvent.bodyA = beginContactEvent.bodyB = null;
                    }
                    if (hasEndContact) {
                        for (var i = 0, l = removals.length; i < l; i += 2) {
                            endContactEvent.bodyA = _this.getBodyById(removals[i]);
                            endContactEvent.bodyB = _this.getBodyById(removals[i + 1]);
                            _this.dispatchEvent(endContactEvent);
                        }
                        endContactEvent.bodyA = endContactEvent.bodyB = null;
                    }
                    additions.length = removals.length = 0;
                    var hasBeginShapeContact = _this.hasAnyEventListener('beginShapeContact');
                    var hasEndShapeContact = _this.hasAnyEventListener('endShapeContact');
                    if (hasBeginShapeContact || hasEndShapeContact) {
                        _this.shapeOverlapKeeper.getDiff(additions, removals);
                    }
                    if (hasBeginShapeContact) {
                        for (var i = 0, l = additions.length; i < l; i += 2) {
                            var shapeA = _this.getShapeById(additions[i]);
                            var shapeB = _this.getShapeById(additions[i + 1]);
                            beginShapeContactEvent.shapeA = shapeA;
                            beginShapeContactEvent.shapeB = shapeB;
                            beginShapeContactEvent.bodyA = shapeA.body;
                            beginShapeContactEvent.bodyB = shapeB.body;
                            _this.dispatchEvent(beginShapeContactEvent);
                        }
                        beginShapeContactEvent.bodyA = beginShapeContactEvent.bodyB = beginShapeContactEvent.shapeA = beginShapeContactEvent.shapeB = null;
                    }
                    if (hasEndShapeContact) {
                        for (var i = 0, l = removals.length; i < l; i += 2) {
                            var shapeA = _this.getShapeById(removals[i]);
                            var shapeB = _this.getShapeById(removals[i + 1]);
                            endShapeContactEvent.shapeA = shapeA;
                            endShapeContactEvent.shapeB = shapeB;
                            endShapeContactEvent.bodyA = shapeA.body;
                            endShapeContactEvent.bodyB = shapeB.body;
                            _this.dispatchEvent(endShapeContactEvent);
                        }
                        endShapeContactEvent.bodyA = endShapeContactEvent.bodyB = endShapeContactEvent.shapeA = endShapeContactEvent.shapeB = null;
                    }
                };
            })();
            _this_1.dt = -1;
            _this_1.allowSleep = !!options.allowSleep;
            _this_1.contacts = [];
            _this_1.frictionEquations = [];
            _this_1.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0;
            _this_1.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false;
            _this_1.time = 0.0;
            _this_1.stepnumber = 0;
            _this_1.default_dt = 1 / 60;
            _this_1.nextId = 0;
            _this_1.gravity = new CANNON.Vector3();
            if (options.gravity) {
                _this_1.gravity.copy(options.gravity);
            }
            _this_1.broadphase = options.broadphase !== undefined ? options.broadphase : new CANNON.NaiveBroadphase();
            _this_1.bodies = [];
            _this_1.solver = options.solver !== undefined ? options.solver : new CANNON.GSSolver();
            _this_1.constraints = [];
            _this_1.narrowphase = new CANNON.Narrowphase(_this_1);
            _this_1.collisionMatrix = new CANNON.ArrayCollisionMatrix();
            _this_1.collisionMatrixPrevious = new CANNON.ArrayCollisionMatrix();
            _this_1.bodyOverlapKeeper = new CANNON.OverlapKeeper();
            _this_1.shapeOverlapKeeper = new CANNON.OverlapKeeper();
            _this_1.materials = [];
            _this_1.contactmaterials = [];
            _this_1.contactMaterialTable = new CANNON.TupleDictionary();
            _this_1.defaultMaterial = new CANNON.Material("default");
            _this_1.defaultContactMaterial = new CANNON.ContactMaterial(_this_1.defaultMaterial, _this_1.defaultMaterial, { friction: 0.3, restitution: 0.0 });
            _this_1.doProfiling = false;
            _this_1.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0,
            };
            _this_1.accumulator = 0;
            _this_1.subsystems = [];
            _this_1.addBodyEvent = {
                type: "addBody",
                body: null
            };
            _this_1.removeBodyEvent = {
                type: "removeBody",
                body: null
            };
            _this_1.idToBodyMap = {};
            _this_1.broadphase.setWorld(_this_1);
            return _this_1;
        }
        /**
         * Get the contact material between materials m1 and m2
         * @param m1
         * @param m2
         * @return  The contact material if it was found.
         */
        World.prototype.getContactMaterial = function (m1, m2) {
            return this.contactMaterialTable.get(m1.id, m2.id); //this.contactmaterials[this.mats2cmat[i+j*this.materials.length]];
        };
        /**
         * Get number of objects in the world.
         * @deprecated
         */
        World.prototype.numObjects = function () {
            return this.bodies.length;
        };
        /**
         * Store old collision state info
         */
        World.prototype.collisionMatrixTick = function () {
            var temp = this.collisionMatrixPrevious;
            this.collisionMatrixPrevious = this.collisionMatrix;
            this.collisionMatrix = temp;
            this.collisionMatrix.reset();
            this.bodyOverlapKeeper.tick();
            this.shapeOverlapKeeper.tick();
        };
        /**
         * Add a rigid body to the simulation.
         * @param body
         *
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         * @deprecated Use .addBody instead
         */
        World.prototype.add = function (body) {
            if (this.bodies.indexOf(body) !== -1) {
                return;
            }
            body.index = this.bodies.length;
            this.bodies.push(body);
            body.world = this;
            body.initPosition.copy(body.position);
            body.initVelocity.copy(body.velocity);
            body.timeLastSleepy = this.time;
            if (body instanceof CANNON.Body) {
                body.initAngularVelocity.copy(body.angularVelocity);
                body.initQuaternion.copy(body.quaternion);
            }
            this.collisionMatrix.setNumObjects(this.bodies.length);
            this.addBodyEvent.body = body;
            this.idToBodyMap[body.id] = body;
            this.dispatchEvent(this.addBodyEvent);
        };
        /**
         * Add a rigid body to the simulation.
         * @method add
         * @param {Body} body
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         * @deprecated Use .addBody instead
         */
        World.prototype.addBody = function (body) {
            if (this.bodies.indexOf(body) !== -1) {
                return;
            }
            body.index = this.bodies.length;
            this.bodies.push(body);
            body.world = this;
            body.initPosition.copy(body.position);
            body.initVelocity.copy(body.velocity);
            body.timeLastSleepy = this.time;
            if (body instanceof CANNON.Body) {
                body.initAngularVelocity.copy(body.angularVelocity);
                body.initQuaternion.copy(body.quaternion);
            }
            this.collisionMatrix.setNumObjects(this.bodies.length);
            this.addBodyEvent.body = body;
            this.idToBodyMap[body.id] = body;
            this.dispatchEvent(this.addBodyEvent);
        };
        /**
         * Add a constraint to the simulation.
         * @param c
         */
        World.prototype.addConstraint = function (c) {
            this.constraints.push(c);
        };
        /**
         * Removes a constraint
         * @param c
         */
        World.prototype.removeConstraint = function (c) {
            var idx = this.constraints.indexOf(c);
            if (idx !== -1) {
                this.constraints.splice(idx, 1);
            }
        };
        /**
         * Raycast test
         * @param from
         * @param to
         * @param result
         * @deprecated Use .raycastAll, .raycastClosest or .raycastAny instead.
         */
        World.prototype.rayTest = function (from, to, result) {
            if (result instanceof CANNON.RaycastResult) {
                // Do raycastclosest
                this.raycastClosest(from, to, {
                    skipBackfaces: true
                }, result);
            }
            else {
                // Do raycastAll
                this.raycastAll(from, to, {
                    skipBackfaces: true
                }, result);
            }
        };
        /**
         * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
         * @param from
         * @param to
         * @param options
         * @param callback
         * @return True if any body was hit.
         */
        World.prototype.raycastAll = function (from, to, options, callback) {
            if (options === void 0) { options = {}; }
            options.mode = CANNON.Ray.ALL;
            options.from = from;
            options.to = to;
            options.callback = callback;
            return tmpRay.intersectWorld(this, options);
        };
        /**
         * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
         *
         * @param from
         * @param to
         * @param options
         * @param result
         *
         * @return True if any body was hit.
         */
        World.prototype.raycastAny = function (from, to, options, result) {
            options.mode = CANNON.Ray.ANY;
            options.from = from;
            options.to = to;
            options.result = result;
            return tmpRay.intersectWorld(this, options);
        };
        /**
         * Ray cast, and return information of the closest hit.
         *
         * @param from
         * @param to
         * @param options
         * @param result
         *
         * @return True if any body was hit.
         */
        World.prototype.raycastClosest = function (from, to, options, result) {
            options.mode = CANNON.Ray.CLOSEST;
            options.from = from;
            options.to = to;
            options.result = result;
            return tmpRay.intersectWorld(this, options);
        };
        /**
         * Remove a rigid body from the simulation.
         * @param body
         * @deprecated Use .removeBody instead
         */
        World.prototype.remove = function (body) {
            body.world = null;
            var n = this.bodies.length - 1, bodies = this.bodies, idx = bodies.indexOf(body);
            if (idx !== -1) {
                bodies.splice(idx, 1); // Todo: should use a garbage free method
                // Recompute index
                for (var i = 0; i !== bodies.length; i++) {
                    bodies[i].index = i;
                }
                this.collisionMatrix.setNumObjects(n);
                this.removeBodyEvent.body = body;
                delete this.idToBodyMap[body.id];
                this.dispatchEvent(this.removeBodyEvent);
            }
        };
        /**
         * Remove a rigid body from the simulation.
         * @param body
         */
        World.prototype.removeBody = function (body) {
            body.world = null;
            var n = this.bodies.length - 1, bodies = this.bodies, idx = bodies.indexOf(body);
            if (idx !== -1) {
                bodies.splice(idx, 1); // Todo: should use a garbage free method
                // Recompute index
                for (var i = 0; i !== bodies.length; i++) {
                    bodies[i].index = i;
                }
                this.collisionMatrix.setNumObjects(n);
                this.removeBodyEvent.body = body;
                delete this.idToBodyMap[body.id];
                this.dispatchEvent(this.removeBodyEvent);
            }
        };
        World.prototype.getBodyById = function (id) {
            return this.idToBodyMap[id];
        };
        // TODO Make a faster map
        World.prototype.getShapeById = function (id) {
            var bodies = this.bodies;
            for (var i = 0, bl = bodies.length; i < bl; i++) {
                var shapes = bodies[i].shapes;
                for (var j = 0, sl = shapes.length; j < sl; j++) {
                    var shape = shapes[j];
                    if (shape.id === id) {
                        return shape;
                    }
                }
            }
        };
        /**
         * Adds a material to the World.
         * @param m
         * @todo Necessary?
         */
        World.prototype.addMaterial = function (m) {
            this.materials.push(m);
        };
        /**
         * Adds a contact material to the World
         * @param cmat
         */
        World.prototype.addContactMaterial = function (cmat) {
            // Add contact material
            this.contactmaterials.push(cmat);
            // Add current contact material to the material table
            this.contactMaterialTable.set(cmat.materials[0].id, cmat.materials[1].id, cmat);
        };
        /**
         * Step the physics world forward in time.
         *
         * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
         *
         * @param dt                       The fixed time step size to use.
         * @param timeSinceLastCalled    The time elapsed since the function was last called.
         * @param maxSubSteps         Maximum number of fixed steps to take per function call.
         *
         * @example
         *     // fixed timestepping without interpolation
         *     world.step(1/60);
         *
         * @see http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
         */
        World.prototype.step = function (dt, timeSinceLastCalled, maxSubSteps) {
            if (timeSinceLastCalled === void 0) { timeSinceLastCalled = 0; }
            if (maxSubSteps === void 0) { maxSubSteps = 10; }
            if (timeSinceLastCalled === 0) { // Fixed, simple stepping
                this.internalStep(dt);
                // Increment time
                this.time += dt;
            }
            else {
                this.accumulator += timeSinceLastCalled;
                var substeps = 0;
                while (this.accumulator >= dt && substeps < maxSubSteps) {
                    // Do fixed steps to catch up
                    this.internalStep(dt);
                    this.accumulator -= dt;
                    substeps++;
                }
                var t = (this.accumulator % dt) / dt;
                for (var j = 0; j !== this.bodies.length; j++) {
                    var b = this.bodies[j];
                    b.previousPosition.lerpNumberTo(b.position, t, b.interpolatedPosition);
                    b.previousQuaternion.slerpTo(b.quaternion, t, b.interpolatedQuaternion);
                    b.previousQuaternion.normalize();
                }
                this.time += timeSinceLastCalled;
            }
        };
        World.prototype.internalStep = function (dt) {
            this.dt = dt;
            var world = this, that = this, contacts = this.contacts, p1 = World_step_p1, p2 = World_step_p2, N = this.numObjects(), bodies = this.bodies, solver = this.solver, gravity = this.gravity, doProfiling = this.doProfiling, profile = this.profile, DYNAMIC = CANNON.Body.DYNAMIC, profilingStart, constraints = this.constraints, frictionEquationPool = World_step_frictionEquationPool, gnorm = gravity.length, gx = gravity.x, gy = gravity.y, gz = gravity.z, i = 0;
            if (doProfiling) {
                profilingStart = performance.now();
            }
            // Add gravity to all objects
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi.type === DYNAMIC) { // Only for dynamic bodies
                    var f = bi.force, m = bi.mass;
                    f.x += m * gx;
                    f.y += m * gy;
                    f.z += m * gz;
                }
            }
            // Update subsystems
            for (var i = 0, Nsubsystems = this.subsystems.length; i !== Nsubsystems; i++) {
                this.subsystems[i].update();
            }
            // Collision detection
            if (doProfiling) {
                profilingStart = performance.now();
            }
            p1.length = 0; // Clean up pair arrays from last step
            p2.length = 0;
            this.broadphase.collisionPairs(this, p1, p2);
            if (doProfiling) {
                profile.broadphase = performance.now() - profilingStart;
            }
            // Remove constrained pairs with collideConnected == false
            var Nconstraints = constraints.length;
            for (i = 0; i !== Nconstraints; i++) {
                var c = constraints[i];
                if (!c.collideConnected) {
                    for (var j = p1.length - 1; j >= 0; j -= 1) {
                        if ((c.bodyA === p1[j] && c.bodyB === p2[j]) ||
                            (c.bodyB === p1[j] && c.bodyA === p2[j])) {
                            p1.splice(j, 1);
                            p2.splice(j, 1);
                        }
                    }
                }
            }
            this.collisionMatrixTick();
            // Generate contacts
            if (doProfiling) {
                profilingStart = performance.now();
            }
            var oldcontacts = World_step_oldContacts;
            var NoldContacts = contacts.length;
            for (i = 0; i !== NoldContacts; i++) {
                oldcontacts.push(contacts[i]);
            }
            contacts.length = 0;
            // Transfer FrictionEquation from current list to the pool for reuse
            var NoldFrictionEquations = this.frictionEquations.length;
            for (i = 0; i !== NoldFrictionEquations; i++) {
                frictionEquationPool.push(this.frictionEquations[i]);
            }
            this.frictionEquations.length = 0;
            this.narrowphase.getContacts(p1, p2, this, contacts, oldcontacts, // To be reused
            this.frictionEquations, frictionEquationPool);
            if (doProfiling) {
                profile.narrowphase = performance.now() - profilingStart;
            }
            // Loop over all collisions
            if (doProfiling) {
                profilingStart = performance.now();
            }
            // Add all friction eqs
            for (var i = 0; i < this.frictionEquations.length; i++) {
                solver.addEquation(this.frictionEquations[i]);
            }
            var ncontacts = contacts.length;
            for (var k = 0; k !== ncontacts; k++) {
                // Current contact
                var c_1 = contacts[k];
                // Get current collision indeces
                var bi_2 = c_1.bi, bj = c_1.bj, si = c_1.si, sj = c_1.sj;
                // Get collision properties
                var cm;
                if (bi_2.material && bj.material) {
                    cm = this.getContactMaterial(bi_2.material, bj.material) || this.defaultContactMaterial;
                }
                else {
                    cm = this.defaultContactMaterial;
                }
                // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
                var mu = cm.friction;
                // c.restitution = cm.restitution;
                // If friction or restitution were specified in the material, use them
                if (bi_2.material && bj.material) {
                    if (bi_2.material.friction >= 0 && bj.material.friction >= 0) {
                        mu = bi_2.material.friction * bj.material.friction;
                    }
                    if (bi_2.material.restitution >= 0 && bj.material.restitution >= 0) {
                        c_1.restitution = bi_2.material.restitution * bj.material.restitution;
                    }
                }
                // c.setSpookParams(
                //           cm.contactEquationStiffness,
                //           cm.contactEquationRelaxation,
                //           dt
                //       );
                solver.addEquation(c_1);
                // // Add friction constraint equation
                // if(mu > 0){
                // 	// Create 2 tangent equations
                // 	var mug = mu * gnorm;
                // 	var reducedMass = (bi.invMass + bj.invMass);
                // 	if(reducedMass > 0){
                // 		reducedMass = 1/reducedMass;
                // 	}
                // 	var pool = frictionEquationPool;
                // 	var c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	var c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	this.frictionEquations.push(c1, c2);
                // 	c1.bi = c2.bi = bi;
                // 	c1.bj = c2.bj = bj;
                // 	c1.minForce = c2.minForce = -mug*reducedMass;
                // 	c1.maxForce = c2.maxForce = mug*reducedMass;
                // 	// Copy over the relative vectors
                // 	c1.ri.copy(c.ri);
                // 	c1.rj.copy(c.rj);
                // 	c2.ri.copy(c.ri);
                // 	c2.rj.copy(c.rj);
                // 	// Construct tangents
                // 	c.ni.tangents(c1.t, c2.t);
                //           // Set spook params
                //           c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
                //           c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
                //           c1.enabled = c2.enabled = c.enabled;
                // 	// Add equations to solver
                // 	solver.addEquation(c1);
                // 	solver.addEquation(c2);
                // }
                if (bi_2.allowSleep &&
                    bi_2.type === CANNON.Body.DYNAMIC &&
                    bi_2.sleepState === CANNON.Body.SLEEPING &&
                    bj.sleepState === CANNON.Body.AWAKE &&
                    bj.type !== CANNON.Body.STATIC) {
                    var speedSquaredB = bj.velocity.lengthSquared + bj.angularVelocity.lengthSquared;
                    var speedLimitSquaredB = Math.pow(bj.sleepSpeedLimit, 2);
                    if (speedSquaredB >= speedLimitSquaredB * 2) {
                        bi_2._wakeUpAfterNarrowphase = true;
                    }
                }
                if (bj.allowSleep &&
                    bj.type === CANNON.Body.DYNAMIC &&
                    bj.sleepState === CANNON.Body.SLEEPING &&
                    bi_2.sleepState === CANNON.Body.AWAKE &&
                    bi_2.type !== CANNON.Body.STATIC) {
                    var speedSquaredA = bi_2.velocity.lengthSquared + bi_2.angularVelocity.lengthSquared;
                    var speedLimitSquaredA = Math.pow(bi_2.sleepSpeedLimit, 2);
                    if (speedSquaredA >= speedLimitSquaredA * 2) {
                        bj._wakeUpAfterNarrowphase = true;
                    }
                }
                // Now we know that i and j are in contact. Set collision matrix state
                this.collisionMatrix.set(bi_2, bj, true);
                if (!this.collisionMatrixPrevious.get(bi_2, bj)) {
                    // First contact!
                    // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
                    World_step_collideEvent.body = bj;
                    World_step_collideEvent.contact = c_1;
                    bi_2.dispatchEvent(World_step_collideEvent);
                    World_step_collideEvent.body = bi_2;
                    bj.dispatchEvent(World_step_collideEvent);
                }
                this.bodyOverlapKeeper.set(bi_2.id, bj.id);
                this.shapeOverlapKeeper.set(si.id, sj.id);
            }
            this.emitContactEvents();
            if (doProfiling) {
                profile.makeContactConstraints = performance.now() - profilingStart;
                profilingStart = performance.now();
            }
            // Wake up bodies
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi._wakeUpAfterNarrowphase) {
                    bi.wakeUp();
                    bi._wakeUpAfterNarrowphase = false;
                }
            }
            // Add user-added constraints
            var Nconstraints = constraints.length;
            for (i = 0; i !== Nconstraints; i++) {
                var c = constraints[i];
                c.update();
                for (var j = 0, Neq = c.equations.length; j !== Neq; j++) {
                    var eq = c.equations[j];
                    solver.addEquation(eq);
                }
            }
            // Solve the constrained system
            solver.solve(dt, this);
            if (doProfiling) {
                profile.solve = performance.now() - profilingStart;
            }
            // Remove all contacts from solver
            solver.removeAllEquations();
            // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
            var pow = Math.pow;
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi.type & DYNAMIC) { // Only for dynamic bodies
                    var ld = pow(1.0 - bi.linearDamping, dt);
                    var v = bi.velocity;
                    v.scaleNumberTo(ld, v);
                    var av = bi.angularVelocity;
                    if (av) {
                        var ad = pow(1.0 - bi.angularDamping, dt);
                        av.scaleNumberTo(ad, av);
                    }
                }
            }
            this.dispatchEvent(World_step_preStepEvent);
            // Invoke pre-step callbacks
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi.preStep) {
                    bi.preStep.call(bi);
                }
            }
            // Leap frog
            // vnew = v + h*f/m
            // xnew = x + h*vnew
            if (doProfiling) {
                profilingStart = performance.now();
            }
            var stepnumber = this.stepnumber;
            var quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0;
            var quatNormalizeFast = this.quatNormalizeFast;
            for (i = 0; i !== N; i++) {
                bodies[i].integrate(dt, quatNormalize, quatNormalizeFast);
            }
            this.clearForces();
            this.broadphase.dirty = true;
            if (doProfiling) {
                profile.integrate = performance.now() - profilingStart;
            }
            // Update world time
            this.time += dt;
            this.stepnumber += 1;
            this.dispatchEvent(World_step_postStepEvent);
            // Invoke post-step callbacks
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                var postStep = bi.postStep;
                if (postStep) {
                    postStep.call(bi);
                }
            }
            // Sleeping update
            if (this.allowSleep) {
                for (i = 0; i !== N; i++) {
                    bodies[i].sleepTick(this.time);
                }
            }
        };
        /**
         * Sets all body forces in the world to zero.
         * @method clearForces
         */
        World.prototype.clearForces = function () {
            var bodies = this.bodies;
            var N = bodies.length;
            for (var i = 0; i !== N; i++) {
                var b = bodies[i], force = b.force, tau = b.torque;
                b.force.set(0, 0, 0);
                b.torque.set(0, 0, 0);
            }
        };
        World.worldNormal = new CANNON.Vector3(0, 0, 1);
        return World;
    }(CANNON.EventTarget));
    CANNON.World = World;
    // Temp stuff
    var tmpAABB1 = new CANNON.AABB();
    var tmpArray1 = [];
    var tmpRay = new CANNON.Ray();
    // performance.now()
    if (typeof performance === 'undefined') {
        throw "performance";
        // performance = {};
    }
    if (!performance.now) {
        var nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart;
        }
        performance.now = function () {
            return Date.now() - nowOffset;
        };
    }
    var step_tmp1 = new CANNON.Vector3();
    /**
     * Dispatched after the world has stepped forward in time.
     */
    var World_step_postStepEvent = { type: "postStep" }; // Reusable event objects to save memory
    /**
     * Dispatched before the world steps forward in time.
     */
    var World_step_preStepEvent = { type: "preStep" };
    var World_step_collideEvent = { type: CANNON.Body.COLLIDE_EVENT_NAME, body: null, contact: null };
    var World_step_oldContacts = []; // Pools for unused objects
    var World_step_frictionEquationPool = [];
    var World_step_p1 = []; // Reusable arrays for collision pairs
    var World_step_p2 = [];
    var World_step_gvec = new CANNON.Vector3(); // Temporary vectors and quats
    var World_step_vi = new CANNON.Vector3();
    var World_step_vj = new CANNON.Vector3();
    var World_step_wi = new CANNON.Vector3();
    var World_step_wj = new CANNON.Vector3();
    var World_step_t1 = new CANNON.Vector3();
    var World_step_t2 = new CANNON.Vector3();
    var World_step_rixn = new CANNON.Vector3();
    var World_step_rjxn = new CANNON.Vector3();
    var World_step_step_q = new CANNON.Quaternion();
    var World_step_step_w = new CANNON.Quaternion();
    var World_step_step_wq = new CANNON.Quaternion();
    var invI_tau_dt = new CANNON.Vector3();
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    var Narrowphase = /** @class */ (function () {
        /**
         * Helper class for the World. Generates ContactEquations.
         * @class Narrowphase
         * @constructor
         * @todo Sphere-ConvexPolyhedron contacts
         * @todo Contact reduction
         * @todo  should move methods to prototype
         */
        function Narrowphase(world) {
            this.contactPointPool = [];
            this.frictionEquationPool = [];
            this.result = [];
            this.frictionResult = [];
            this.v3pool = new CANNON.Vec3Pool();
            this.world = world;
            this.currentContactMaterial = null;
            this.enableFrictionReduction = false;
        }
        /**
         * Make a contact object, by using the internal pool or creating a new one.
         *
         * @param bi
         * @param bj
         * @param si
         * @param sj
         * @param overrideShapeA
         * @param overrideShapeB
         */
        Narrowphase.prototype.createContactEquation = function (bi, bj, si, sj, overrideShapeA, overrideShapeB) {
            var c;
            if (this.contactPointPool.length) {
                c = this.contactPointPool.pop();
                c.bi = bi;
                c.bj = bj;
            }
            else {
                c = new CANNON.ContactEquation(bi, bj);
            }
            c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
            var cm = this.currentContactMaterial;
            c.restitution = cm.restitution;
            c.setSpookParams(cm.contactEquationStiffness, cm.contactEquationRelaxation, this.world.dt);
            var matA = si.material || bi.material;
            var matB = sj.material || bj.material;
            if (matA && matB && matA.restitution >= 0 && matB.restitution >= 0) {
                c.restitution = matA.restitution * matB.restitution;
            }
            c.si = overrideShapeA || si;
            c.sj = overrideShapeB || sj;
            return c;
        };
        ;
        Narrowphase.prototype.createFrictionEquationsFromContact = function (contactEquation, outArray) {
            var bodyA = contactEquation.bi;
            var bodyB = contactEquation.bj;
            var shapeA = contactEquation.si;
            var shapeB = contactEquation.sj;
            var world = this.world;
            var cm = this.currentContactMaterial;
            // If friction or restitution were specified in the material, use them
            var friction = cm.friction;
            var matA = shapeA.material || bodyA.material;
            var matB = shapeB.material || bodyB.material;
            if (matA && matB && matA.friction >= 0 && matB.friction >= 0) {
                friction = matA.friction * matB.friction;
            }
            if (friction > 0) {
                // Create 2 tangent equations
                var mug = friction * world.gravity.length;
                var reducedMass = (bodyA.invMass + bodyB.invMass);
                if (reducedMass > 0) {
                    reducedMass = 1 / reducedMass;
                }
                var pool = this.frictionEquationPool;
                var c1 = pool.length ? pool.pop() : new CANNON.FrictionEquation(bodyA, bodyB, mug * reducedMass);
                var c2 = pool.length ? pool.pop() : new CANNON.FrictionEquation(bodyA, bodyB, mug * reducedMass);
                c1.bi = c2.bi = bodyA;
                c1.bj = c2.bj = bodyB;
                c1.minForce = c2.minForce = -mug * reducedMass;
                c1.maxForce = c2.maxForce = mug * reducedMass;
                // Copy over the relative vectors
                c1.ri.copy(contactEquation.ri);
                c1.rj.copy(contactEquation.rj);
                c2.ri.copy(contactEquation.ri);
                c2.rj.copy(contactEquation.rj);
                // Construct tangents
                contactEquation.ni.tangents(c1.t, c2.t);
                // Set spook params
                c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
                c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
                c1.enabled = c2.enabled = contactEquation.enabled;
                outArray.push(c1, c2);
                return true;
            }
            return false;
        };
        // Take the average N latest contact point on the plane.
        Narrowphase.prototype.createFrictionFromAverage = function (numContacts) {
            // The last contactEquation
            var c = this.result[this.result.length - 1];
            // Create the result: two "average" friction equations
            if (!this.createFrictionEquationsFromContact(c, this.frictionResult) || numContacts === 1) {
                return;
            }
            var f1 = this.frictionResult[this.frictionResult.length - 2];
            var f2 = this.frictionResult[this.frictionResult.length - 1];
            averageNormal.setZero();
            averageContactPointA.setZero();
            averageContactPointB.setZero();
            var bodyA = c.bi;
            var bodyB = c.bj;
            for (var i = 0; i !== numContacts; i++) {
                c = this.result[this.result.length - 1 - i];
                if (c.bodyA !== bodyA) {
                    averageNormal.addTo(c.ni, averageNormal);
                    averageContactPointA.addTo(c.ri, averageContactPointA);
                    averageContactPointB.addTo(c.rj, averageContactPointB);
                }
                else {
                    averageNormal.subTo(c.ni, averageNormal);
                    averageContactPointA.addTo(c.rj, averageContactPointA);
                    averageContactPointB.addTo(c.ri, averageContactPointB);
                }
            }
            var invNumContacts = 1 / numContacts;
            averageContactPointA.scaleNumberTo(invNumContacts, f1.ri);
            averageContactPointB.scaleNumberTo(invNumContacts, f1.rj);
            f2.ri.copy(f1.ri); // Should be the same
            f2.rj.copy(f1.rj);
            averageNormal.normalize();
            averageNormal.tangents(f1.t, f2.t);
            // return eq;
        };
        /**
         * Generate all contacts between a list of body pairs
         * @method getContacts
         * @param {array} p1 Array of body indices
         * @param {array} p2 Array of body indices
         * @param {World} world
         * @param {array} result Array to store generated contacts
         * @param {array} oldcontacts Optional. Array of reusable contact objects
         */
        Narrowphase.prototype.getContacts = function (p1, p2, world, result, oldcontacts, frictionResult, frictionPool) {
            // Save old contact objects
            this.contactPointPool = oldcontacts;
            this.frictionEquationPool = frictionPool;
            this.result = result;
            this.frictionResult = frictionResult;
            var qi = tmpQuat1;
            var qj = tmpQuat2;
            var xi = tmpVec1;
            var xj = tmpVec2;
            for (var k = 0, N = p1.length; k !== N; k++) {
                // Get current collision bodies
                var bi = p1[k], bj = p2[k];
                // Get contact material
                var bodyContactMaterial = null;
                if (bi.material && bj.material) {
                    bodyContactMaterial = world.getContactMaterial(bi.material, bj.material) || null;
                }
                var justTest = (((bi.type & CANNON.Body.KINEMATIC) && (bj.type & CANNON.Body.STATIC)) || ((bi.type & CANNON.Body.STATIC) && (bj.type & CANNON.Body.KINEMATIC)) || ((bi.type & CANNON.Body.KINEMATIC) && (bj.type & CANNON.Body.KINEMATIC)));
                for (var i = 0; i < bi.shapes.length; i++) {
                    bi.quaternion.multTo(bi.shapeOrientations[i], qi);
                    bi.quaternion.vmult(bi.shapeOffsets[i], xi);
                    xi.addTo(bi.position, xi);
                    var si = bi.shapes[i];
                    for (var j = 0; j < bj.shapes.length; j++) {
                        // Compute world transform of shapes
                        bj.quaternion.multTo(bj.shapeOrientations[j], qj);
                        bj.quaternion.vmult(bj.shapeOffsets[j], xj);
                        xj.addTo(bj.position, xj);
                        var sj = bj.shapes[j];
                        if (!((si.collisionFilterMask & sj.collisionFilterGroup) && (sj.collisionFilterMask & si.collisionFilterGroup))) {
                            continue;
                        }
                        if (xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius) {
                            continue;
                        }
                        // Get collision material
                        var shapeContactMaterial = null;
                        if (si.material && sj.material) {
                            shapeContactMaterial = world.getContactMaterial(si.material, sj.material) || null;
                        }
                        this.currentContactMaterial = shapeContactMaterial || bodyContactMaterial || world.defaultContactMaterial;
                        // Get contacts
                        var resolver = this[si.type | sj.type];
                        if (resolver) {
                            var retval = false;
                            if (si.type < sj.type) {
                                retval = resolver.call(this, si, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
                            }
                            else {
                                retval = resolver.call(this, sj, si, xj, xi, qj, qi, bj, bi, si, sj, justTest);
                            }
                            if (retval && justTest) {
                                // Register overlap
                                world.shapeOverlapKeeper.set(si.id, sj.id);
                                world.bodyOverlapKeeper.set(bi.id, bj.id);
                            }
                        }
                    }
                }
            }
        };
        Narrowphase.prototype.boxBox = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            sj.convexPolyhedronRepresentation.material = sj.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
            return this.convexConvex(si.convexPolyhedronRepresentation, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.boxConvex = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexConvex(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.boxParticle = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexParticle(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.sphereSphere = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            if (justTest) {
                return xi.distanceSquared(xj) < Math.pow(si.radius + sj.radius, 2);
            }
            // We will have only one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
            // Contact normal
            xj.subTo(xi, r.ni);
            r.ni.normalize();
            // Contact point locations
            r.ri.copy(r.ni);
            r.rj.copy(r.ni);
            r.ri.scaleNumberTo(si.radius, r.ri);
            r.rj.scaleNumberTo(-sj.radius, r.rj);
            r.ri.addTo(xi, r.ri);
            r.ri.subTo(bi.position, r.ri);
            r.rj.addTo(xj, r.rj);
            r.rj.subTo(bj.position, r.rj);
            this.result.push(r);
            this.createFrictionEquationsFromContact(r, this.frictionResult);
        };
        ;
        /**
         * @method planeTrimesh
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        Narrowphase.prototype.planeTrimesh = function (planeShape, trimeshShape, planePos, trimeshPos, planeQuat, trimeshQuat, planeBody, trimeshBody, rsi, rsj, justTest) {
            // Make contacts!
            var v = new CANNON.Vector3();
            var normal = planeTrimesh_normal;
            normal.copy(CANNON.World.worldNormal);
            planeQuat.vmult(normal, normal); // Turn normal according to plane
            for (var i = 0; i < trimeshShape.vertices.length / 3; i++) {
                // Get world vertex from trimesh
                trimeshShape.getVertex(i, v);
                // Safe up
                var v2 = new CANNON.Vector3();
                v2.copy(v);
                CANNON.Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
                // Check plane side
                var relpos = planeTrimesh_relpos;
                v.subTo(planePos, relpos);
                var dot = normal.dot(relpos);
                if (dot <= 0.0) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(planeBody, trimeshBody, planeShape, trimeshShape, rsi, rsj);
                    r.ni.copy(normal); // Contact normal is the plane normal
                    // Get vertex position projected on plane
                    var projected = planeTrimesh_projected;
                    normal.scaleNumberTo(relpos.dot(normal), projected);
                    v.subTo(projected, projected);
                    // ri is the projected world position minus plane position
                    r.ri.copy(projected);
                    r.ri.subTo(planeBody.position, r.ri);
                    r.rj.copy(v);
                    r.rj.subTo(trimeshBody.position, r.rj);
                    // Store result
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
        };
        Narrowphase.prototype.sphereTrimesh = function (sphereShape, trimeshShape, spherePos, trimeshPos, sphereQuat, trimeshQuat, sphereBody, trimeshBody, rsi, rsj, justTest) {
            var edgeVertexA = sphereTrimesh_edgeVertexA;
            var edgeVertexB = sphereTrimesh_edgeVertexB;
            var edgeVector = sphereTrimesh_edgeVector;
            var edgeVectorUnit = sphereTrimesh_edgeVectorUnit;
            var localSpherePos = sphereTrimesh_localSpherePos;
            var tmp = sphereTrimesh_tmp;
            var localSphereAABB = sphereTrimesh_localSphereAABB;
            var v2 = sphereTrimesh_v2;
            var relpos = sphereTrimesh_relpos;
            var triangles = sphereTrimesh_triangles;
            // Convert sphere position to local in the trimesh
            CANNON.Transform.pointToLocalFrame(trimeshPos, trimeshQuat, spherePos, localSpherePos);
            // Get the aabb of the sphere locally in the trimesh
            var sphereRadius = sphereShape.radius;
            localSphereAABB.lowerBound.set(localSpherePos.x - sphereRadius, localSpherePos.y - sphereRadius, localSpherePos.z - sphereRadius);
            localSphereAABB.upperBound.set(localSpherePos.x + sphereRadius, localSpherePos.y + sphereRadius, localSpherePos.z + sphereRadius);
            trimeshShape.getTrianglesInAABB(localSphereAABB, triangles);
            //for (var i = 0; i < trimeshShape.indices.length / 3; i++) triangles.push(i); // All
            // Vertices
            var v = sphereTrimesh_v;
            var radiusSquared = sphereShape.radius * sphereShape.radius;
            for (var i = 0; i < triangles.length; i++) {
                for (var j = 0; j < 3; j++) {
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], v);
                    // Check vertex overlap in sphere
                    v.subTo(localSpherePos, relpos);
                    if (relpos.lengthSquared <= radiusSquared) {
                        // Safe up
                        v2.copy(v);
                        CANNON.Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
                        v.subTo(spherePos, relpos);
                        if (justTest) {
                            return true;
                        }
                        var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                        r.ni.copy(relpos);
                        r.ni.normalize();
                        // ri is the vector from sphere center to the sphere surface
                        r.ri.copy(r.ni);
                        r.ri.scaleNumberTo(sphereShape.radius, r.ri);
                        r.ri.addTo(spherePos, r.ri);
                        r.ri.subTo(sphereBody.position, r.ri);
                        r.rj.copy(v);
                        r.rj.subTo(trimeshBody.position, r.rj);
                        // Store result
                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }
            // Check all edges
            for (var i = 0; i < triangles.length; i++) {
                for (var j = 0; j < 3; j++) {
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], edgeVertexA);
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + ((j + 1) % 3)], edgeVertexB);
                    edgeVertexB.subTo(edgeVertexA, edgeVector);
                    // Project sphere position to the edge
                    localSpherePos.subTo(edgeVertexB, tmp);
                    var positionAlongEdgeB = tmp.dot(edgeVector);
                    localSpherePos.subTo(edgeVertexA, tmp);
                    var positionAlongEdgeA = tmp.dot(edgeVector);
                    if (positionAlongEdgeA > 0 && positionAlongEdgeB < 0) {
                        // Now check the orthogonal distance from edge to sphere center
                        localSpherePos.subTo(edgeVertexA, tmp);
                        edgeVectorUnit.copy(edgeVector);
                        edgeVectorUnit.normalize();
                        positionAlongEdgeA = tmp.dot(edgeVectorUnit);
                        edgeVectorUnit.scaleNumberTo(positionAlongEdgeA, tmp);
                        tmp.addTo(edgeVertexA, tmp);
                        // tmp is now the sphere center position projected to the edge, defined locally in the trimesh frame
                        var dist = tmp.distance(localSpherePos);
                        if (dist < sphereShape.radius) {
                            if (justTest) {
                                return true;
                            }
                            var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                            tmp.subTo(localSpherePos, r.ni);
                            r.ni.normalize();
                            r.ni.scaleNumberTo(sphereShape.radius, r.ri);
                            CANNON.Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
                            tmp.subTo(trimeshBody.position, r.rj);
                            CANNON.Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
                            CANNON.Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
                        }
                    }
                }
            }
            // Triangle faces
            var va = sphereTrimesh_va;
            var vb = sphereTrimesh_vb;
            var vc = sphereTrimesh_vc;
            var normal = sphereTrimesh_normal;
            for (var i = 0, N = triangles.length; i !== N; i++) {
                trimeshShape.getTriangleVertices(triangles[i], va, vb, vc);
                trimeshShape.getNormal(triangles[i], normal);
                localSpherePos.subTo(va, tmp);
                var dist = tmp.dot(normal);
                normal.scaleNumberTo(dist, tmp);
                localSpherePos.subTo(tmp, tmp);
                // tmp is now the sphere position projected to the triangle plane
                dist = tmp.distance(localSpherePos);
                if (CANNON.Ray.pointInTriangle(tmp, va, vb, vc) && dist < sphereShape.radius) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                    tmp.subTo(localSpherePos, r.ni);
                    r.ni.normalize();
                    r.ni.scaleNumberTo(sphereShape.radius, r.ri);
                    CANNON.Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
                    tmp.subTo(trimeshBody.position, r.rj);
                    CANNON.Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
                    CANNON.Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
            triangles.length = 0;
        };
        Narrowphase.prototype.spherePlane = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            // We will have one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
            // Contact normal
            r.ni.copy(CANNON.World.worldNormal);
            qj.vmult(r.ni, r.ni);
            r.ni.negateTo(r.ni); // body i is the sphere, flip normal
            r.ni.normalize(); // Needed?
            // Vector from sphere center to contact point
            r.ni.scaleNumberTo(si.radius, r.ri);
            // Project down sphere on plane
            xi.subTo(xj, point_on_plane_to_sphere);
            r.ni.scaleNumberTo(r.ni.dot(point_on_plane_to_sphere), plane_to_sphere_ortho);
            point_on_plane_to_sphere.subTo(plane_to_sphere_ortho, r.rj); // The sphere position projected to plane
            if (-point_on_plane_to_sphere.dot(r.ni) <= si.radius) {
                if (justTest) {
                    return true;
                }
                // Make it relative to the body
                var ri = r.ri;
                var rj = r.rj;
                ri.addTo(xi, ri);
                ri.subTo(bi.position, ri);
                rj.addTo(xj, rj);
                rj.subTo(bj.position, rj);
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        };
        Narrowphase.prototype.sphereBox = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            var v3pool = this.v3pool;
            // we refer to the box as body j
            var sides = sphereBox_sides;
            xi.subTo(xj, box_to_sphere);
            sj.getSideNormals(sides, qj);
            var R = si.radius;
            var penetrating_sides = [];
            // Check side (plane) intersections
            var found = false;
            // Store the resulting side penetration info
            var side_ns = sphereBox_side_ns;
            var side_ns1 = sphereBox_side_ns1;
            var side_ns2 = sphereBox_side_ns2;
            var side_h = null;
            var side_penetrations = 0;
            var side_dot1 = 0;
            var side_dot2 = 0;
            var side_distance = null;
            for (var idx = 0, nsides = sides.length; idx !== nsides && found === false; idx++) {
                // Get the plane side normal (ns)
                var ns = sphereBox_ns;
                ns.copy(sides[idx]);
                var h = ns.length;
                ns.normalize();
                // The normal/distance dot product tells which side of the plane we are
                var dot = box_to_sphere.dot(ns);
                if (dot < h + R && dot > 0) {
                    // Intersects plane. Now check the other two dimensions
                    var ns1 = sphereBox_ns1;
                    var ns2 = sphereBox_ns2;
                    ns1.copy(sides[(idx + 1) % 3]);
                    ns2.copy(sides[(idx + 2) % 3]);
                    var h1 = ns1.length;
                    var h2 = ns2.length;
                    ns1.normalize();
                    ns2.normalize();
                    var dot1 = box_to_sphere.dot(ns1);
                    var dot2 = box_to_sphere.dot(ns2);
                    if (dot1 < h1 && dot1 > -h1 && dot2 < h2 && dot2 > -h2) {
                        var dist = Math.abs(dot - h - R);
                        if (side_distance === null || dist < side_distance) {
                            side_distance = dist;
                            side_dot1 = dot1;
                            side_dot2 = dot2;
                            side_h = h;
                            side_ns.copy(ns);
                            side_ns1.copy(ns1);
                            side_ns2.copy(ns2);
                            side_penetrations++;
                            if (justTest) {
                                return true;
                            }
                        }
                    }
                }
            }
            if (side_penetrations) {
                found = true;
                var r_1 = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                side_ns.scaleNumberTo(-R, r_1.ri); // Sphere r
                r_1.ni.copy(side_ns);
                r_1.ni.negateTo(r_1.ni); // Normal should be out of sphere
                side_ns.scaleNumberTo(side_h, side_ns);
                side_ns1.scaleNumberTo(side_dot1, side_ns1);
                side_ns.addTo(side_ns1, side_ns);
                side_ns2.scaleNumberTo(side_dot2, side_ns2);
                side_ns.addTo(side_ns2, r_1.rj);
                // Make relative to bodies
                r_1.ri.addTo(xi, r_1.ri);
                r_1.ri.subTo(bi.position, r_1.ri);
                r_1.rj.addTo(xj, r_1.rj);
                r_1.rj.subTo(bj.position, r_1.rj);
                this.result.push(r_1);
                this.createFrictionEquationsFromContact(r_1, this.frictionResult);
            }
            // Check corners
            var rj = v3pool.get();
            var sphere_to_corner = sphereBox_sphere_to_corner;
            for (var j = 0; j !== 2 && !found; j++) {
                for (var k = 0; k !== 2 && !found; k++) {
                    for (var l = 0; l !== 2 && !found; l++) {
                        rj.set(0, 0, 0);
                        if (j) {
                            rj.addTo(sides[0], rj);
                        }
                        else {
                            rj.subTo(sides[0], rj);
                        }
                        if (k) {
                            rj.addTo(sides[1], rj);
                        }
                        else {
                            rj.subTo(sides[1], rj);
                        }
                        if (l) {
                            rj.addTo(sides[2], rj);
                        }
                        else {
                            rj.subTo(sides[2], rj);
                        }
                        // World position of corner
                        xj.addTo(rj, sphere_to_corner);
                        sphere_to_corner.subTo(xi, sphere_to_corner);
                        if (sphere_to_corner.lengthSquared < R * R) {
                            if (justTest) {
                                return true;
                            }
                            found = true;
                            var r_2 = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            r_2.ri.copy(sphere_to_corner);
                            r_2.ri.normalize();
                            r_2.ni.copy(r_2.ri);
                            r_2.ri.scaleNumberTo(R, r_2.ri);
                            r_2.rj.copy(rj);
                            // Make relative to bodies
                            r_2.ri.addTo(xi, r_2.ri);
                            r_2.ri.subTo(bi.position, r_2.ri);
                            r_2.rj.addTo(xj, r_2.rj);
                            r_2.rj.subTo(bj.position, r_2.rj);
                            this.result.push(r_2);
                            this.createFrictionEquationsFromContact(r_2, this.frictionResult);
                        }
                    }
                }
            }
            v3pool.release(rj);
            rj = null;
            // Check edges
            var edgeTangent = v3pool.get();
            var edgeCenter = v3pool.get();
            var r = v3pool.get(); // r = edge center to sphere center
            var orthogonal = v3pool.get();
            var dist1 = v3pool.get();
            var Nsides = sides.length;
            for (var j = 0; j !== Nsides && !found; j++) {
                for (var k = 0; k !== Nsides && !found; k++) {
                    if (j % 3 !== k % 3) {
                        // Get edge tangent
                        sides[k].crossTo(sides[j], edgeTangent);
                        edgeTangent.normalize();
                        sides[j].addTo(sides[k], edgeCenter);
                        r.copy(xi);
                        r.subTo(edgeCenter, r);
                        r.subTo(xj, r);
                        var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
                        edgeTangent.scaleNumberTo(orthonorm, orthogonal); // Vector from edge center to sphere center in the tangent direction
                        // Find the third side orthogonal to this one
                        var l = 0;
                        while (l === j % 3 || l === k % 3) {
                            l++;
                        }
                        // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
                        dist1.copy(xi);
                        dist1.subTo(orthogonal, dist1);
                        dist1.subTo(edgeCenter, dist1);
                        dist1.subTo(xj, dist1);
                        // Distances in tangent direction and distance in the plane orthogonal to it
                        var tdist = Math.abs(orthonorm);
                        var ndist = dist1.length;
                        if (tdist < sides[l].length && ndist < R) {
                            if (justTest) {
                                return true;
                            }
                            found = true;
                            var res = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            edgeCenter.addTo(orthogonal, res.rj); // box rj
                            res.rj.copy(res.rj);
                            dist1.negateTo(res.ni);
                            res.ni.normalize();
                            res.ri.copy(res.rj);
                            res.ri.addTo(xj, res.ri);
                            res.ri.subTo(xi, res.ri);
                            res.ri.normalize();
                            res.ri.scaleNumberTo(R, res.ri);
                            // Make relative to bodies
                            res.ri.addTo(xi, res.ri);
                            res.ri.subTo(bi.position, res.ri);
                            res.rj.addTo(xj, res.rj);
                            res.rj.subTo(bj.position, res.rj);
                            this.result.push(res);
                            this.createFrictionEquationsFromContact(res, this.frictionResult);
                        }
                    }
                }
            }
            v3pool.release(edgeTangent, edgeCenter, r, orthogonal, dist1);
        };
        Narrowphase.prototype.sphereConvex = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            var v3pool = this.v3pool;
            xi.subTo(xj, convex_to_sphere);
            var normals = sj.faceNormals;
            var faces = sj.faces;
            var verts = sj.vertices;
            var R = si.radius;
            var penetrating_sides = [];
            // if(convex_to_sphere.lengthSquared > si.boundingSphereRadius + sj.boundingSphereRadius){
            //     return;
            // }
            // Check corners
            for (var i = 0; i !== verts.length; i++) {
                var v = verts[i];
                // World position of corner
                var worldCorner = sphereConvex_worldCorner;
                qj.vmult(v, worldCorner);
                xj.addTo(worldCorner, worldCorner);
                var sphere_to_corner = sphereConvex_sphereToCorner;
                worldCorner.subTo(xi, sphere_to_corner);
                if (sphere_to_corner.lengthSquared < R * R) {
                    if (justTest) {
                        return true;
                    }
                    found = true;
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    r.ri.copy(sphere_to_corner);
                    r.ri.normalize();
                    r.ni.copy(r.ri);
                    r.ri.scaleNumberTo(R, r.ri);
                    worldCorner.subTo(xj, r.rj);
                    // Should be relative to the body.
                    r.ri.addTo(xi, r.ri);
                    r.ri.subTo(bi.position, r.ri);
                    // Should be relative to the body.
                    r.rj.addTo(xj, r.rj);
                    r.rj.subTo(bj.position, r.rj);
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                    return;
                }
            }
            // Check side (plane) intersections
            var found = false;
            for (var i = 0, nfaces = faces.length; i !== nfaces && found === false; i++) {
                var normal = normals[i];
                var face = faces[i];
                // Get world-transformed normal of the face
                var worldNormal = sphereConvex_worldNormal;
                qj.vmult(normal, worldNormal);
                // Get a world vertex from the face
                var worldPoint = sphereConvex_worldPoint;
                qj.vmult(verts[face[0]], worldPoint);
                worldPoint.addTo(xj, worldPoint);
                // Get a point on the sphere, closest to the face normal
                var worldSpherePointClosestToPlane = sphereConvex_worldSpherePointClosestToPlane;
                worldNormal.scaleNumberTo(-R, worldSpherePointClosestToPlane);
                xi.addTo(worldSpherePointClosestToPlane, worldSpherePointClosestToPlane);
                // Vector from a face point to the closest point on the sphere
                var penetrationVec = sphereConvex_penetrationVec;
                worldSpherePointClosestToPlane.subTo(worldPoint, penetrationVec);
                // The penetration. Negative value means overlap.
                var penetration = penetrationVec.dot(worldNormal);
                var worldPointToSphere = sphereConvex_sphereToWorldPoint;
                xi.subTo(worldPoint, worldPointToSphere);
                if (penetration < 0 && worldPointToSphere.dot(worldNormal) > 0) {
                    // Intersects plane. Now check if the sphere is inside the face polygon
                    var faceVerts = []; // Face vertices, in world coords
                    for (var j = 0, Nverts = face.length; j !== Nverts; j++) {
                        var worldVertex = v3pool.get();
                        qj.vmult(verts[face[j]], worldVertex);
                        xj.addTo(worldVertex, worldVertex);
                        faceVerts.push(worldVertex);
                    }
                    if (pointInPolygon(faceVerts, worldNormal, xi)) { // Is the sphere center in the face polygon?
                        if (justTest) {
                            return true;
                        }
                        found = true;
                        var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                        worldNormal.scaleNumberTo(-R, r.ri); // Contact offset, from sphere center to contact
                        worldNormal.negateTo(r.ni); // Normal pointing out of sphere
                        var penetrationVec2 = v3pool.get();
                        worldNormal.scaleNumberTo(-penetration, penetrationVec2);
                        var penetrationSpherePoint = v3pool.get();
                        worldNormal.scaleNumberTo(-R, penetrationSpherePoint);
                        //xi.subTo(xj).addTo(penetrationSpherePoint).addTo(penetrationVec2 , r.rj);
                        xi.subTo(xj, r.rj);
                        r.rj.addTo(penetrationSpherePoint, r.rj);
                        r.rj.addTo(penetrationVec2, r.rj);
                        // Should be relative to the body.
                        r.rj.addTo(xj, r.rj);
                        r.rj.subTo(bj.position, r.rj);
                        // Should be relative to the body.
                        r.ri.addTo(xi, r.ri);
                        r.ri.subTo(bi.position, r.ri);
                        v3pool.release(penetrationVec2);
                        v3pool.release(penetrationSpherePoint);
                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                        // Release world vertices
                        for (var j = 0, Nfaceverts = faceVerts.length; j !== Nfaceverts; j++) {
                            v3pool.release(faceVerts[j]);
                        }
                        return; // We only expect *one* face contact
                    }
                    else {
                        // Edge?
                        for (var j = 0; j !== face.length; j++) {
                            // Get two world transformed vertices
                            var v1 = v3pool.get();
                            var v2 = v3pool.get();
                            qj.vmult(verts[face[(j + 1) % face.length]], v1);
                            qj.vmult(verts[face[(j + 2) % face.length]], v2);
                            xj.addTo(v1, v1);
                            xj.addTo(v2, v2);
                            // Construct edge vector
                            var edge = sphereConvex_edge;
                            v2.subTo(v1, edge);
                            // Construct the same vector, but normalized
                            var edgeUnit = sphereConvex_edgeUnit;
                            edge.unit(edgeUnit);
                            // p is xi projected onto the edge
                            var p = v3pool.get();
                            var v1_to_xi = v3pool.get();
                            xi.subTo(v1, v1_to_xi);
                            var dot = v1_to_xi.dot(edgeUnit);
                            edgeUnit.scaleNumberTo(dot, p);
                            p.addTo(v1, p);
                            // Compute a vector from p to the center of the sphere
                            var xi_to_p = v3pool.get();
                            p.subTo(xi, xi_to_p);
                            // Collision if the edge-sphere distance is less than the radius
                            // AND if p is in between v1 and v2
                            if (dot > 0 && dot * dot < edge.lengthSquared && xi_to_p.lengthSquared < R * R) { // Collision if the edge-sphere distance is less than the radius
                                // Edge contact!
                                if (justTest) {
                                    return true;
                                }
                                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                                p.subTo(xj, r.rj);
                                p.subTo(xi, r.ni);
                                r.ni.normalize();
                                r.ni.scaleNumberTo(R, r.ri);
                                // Should be relative to the body.
                                r.rj.addTo(xj, r.rj);
                                r.rj.subTo(bj.position, r.rj);
                                // Should be relative to the body.
                                r.ri.addTo(xi, r.ri);
                                r.ri.subTo(bi.position, r.ri);
                                this.result.push(r);
                                this.createFrictionEquationsFromContact(r, this.frictionResult);
                                // Release world vertices
                                for (var j = 0, Nfaceverts = faceVerts.length; j !== Nfaceverts; j++) {
                                    v3pool.release(faceVerts[j]);
                                }
                                v3pool.release(v1);
                                v3pool.release(v2);
                                v3pool.release(p);
                                v3pool.release(xi_to_p);
                                v3pool.release(v1_to_xi);
                                return;
                            }
                            v3pool.release(v1);
                            v3pool.release(v2);
                            v3pool.release(p);
                            v3pool.release(xi_to_p);
                            v3pool.release(v1_to_xi);
                        }
                    }
                    // Release world vertices
                    for (var j = 0, Nfaceverts = faceVerts.length; j !== Nfaceverts; j++) {
                        v3pool.release(faceVerts[j]);
                    }
                }
            }
        };
        Narrowphase.prototype.planeBox = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            sj.convexPolyhedronRepresentation.material = sj.material;
            sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
            sj.convexPolyhedronRepresentation.id = sj.id;
            return this.planeConvex(si, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.planeConvex = function (planeShape, convexShape, planePosition, convexPosition, planeQuat, convexQuat, planeBody, convexBody, si, sj, justTest) {
            // Simply return the points behind the plane.
            var worldVertex = planeConvex_v, worldNormal = planeConvex_normal;
            worldNormal.copy(CANNON.World.worldNormal);
            planeQuat.vmult(worldNormal, worldNormal); // Turn normal according to plane orientation
            var numContacts = 0;
            var relpos = planeConvex_relpos;
            for (var i = 0; i !== convexShape.vertices.length; i++) {
                // Get world convex vertex
                worldVertex.copy(convexShape.vertices[i]);
                convexQuat.vmult(worldVertex, worldVertex);
                convexPosition.addTo(worldVertex, worldVertex);
                worldVertex.subTo(planePosition, relpos);
                var dot = worldNormal.dot(relpos);
                if (dot <= 0.0) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(planeBody, convexBody, planeShape, convexShape, si, sj);
                    // Get vertex position projected on plane
                    var projected = planeConvex_projected;
                    worldNormal.scaleNumberTo(worldNormal.dot(relpos), projected);
                    worldVertex.subTo(projected, projected);
                    projected.subTo(planePosition, r.ri); // From plane to vertex projected on plane
                    r.ni.copy(worldNormal); // Contact normal is the plane normal out from plane
                    // rj is now just the vector from the convex center to the vertex
                    worldVertex.subTo(convexPosition, r.rj);
                    // Make it relative to the body
                    r.ri.addTo(planePosition, r.ri);
                    r.ri.subTo(planeBody.position, r.ri);
                    r.rj.addTo(convexPosition, r.rj);
                    r.rj.subTo(convexBody.position, r.rj);
                    this.result.push(r);
                    numContacts++;
                    if (!this.enableFrictionReduction) {
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }
            if (this.enableFrictionReduction && numContacts) {
                this.createFrictionFromAverage(numContacts);
            }
        };
        Narrowphase.prototype.convexConvex = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest, faceListA, faceListB) {
            var sepAxis = convexConvex_sepAxis;
            if (xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius) {
                return;
            }
            if (si.findSeparatingAxis(sj, xi, qi, xj, qj, sepAxis, faceListA, faceListB)) {
                var res = [];
                var q = convexConvex_q;
                si.clipAgainstHull(xi, qi, sj, xj, qj, sepAxis, -100, 100, res);
                var numContacts = 0;
                for (var j = 0; j !== res.length; j++) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj), ri = r.ri, rj = r.rj;
                    sepAxis.negateTo(r.ni);
                    res[j].normal.negateTo(q);
                    q.scaleNumberTo(res[j].depth, q);
                    res[j].point.addTo(q, ri);
                    rj.copy(res[j].point);
                    // Contact points are in world coordinates. Transform back to relative
                    ri.subTo(xi, ri);
                    rj.subTo(xj, rj);
                    // Make relative to bodies
                    ri.addTo(xi, ri);
                    ri.subTo(bi.position, ri);
                    rj.addTo(xj, rj);
                    rj.subTo(bj.position, rj);
                    this.result.push(r);
                    numContacts++;
                    if (!this.enableFrictionReduction) {
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
                if (this.enableFrictionReduction && numContacts) {
                    this.createFrictionFromAverage(numContacts);
                }
            }
        };
        /**
         * @method convexTrimesh
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        // Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON | Shape.types.TRIMESH] =
        // Narrowphase.prototype.convexTrimesh = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,faceListA,faceListB){
        //     var sepAxis = convexConvex_sepAxis;
        //     if(xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
        //         return;
        //     }
        //     // Construct a temp hull for each triangle
        //     var hullB = new ConvexPolyhedron();
        //     hullB.faces = [[0,1,2]];
        //     var va = new Vector3();
        //     var vb = new Vector3();
        //     var vc = new Vector3();
        //     hullB.vertices = [
        //         va,
        //         vb,
        //         vc
        //     ];
        //     for (var i = 0; i < sj.indices.length / 3; i++) {
        //         var triangleNormal = new Vector3();
        //         sj.getNormal(i, triangleNormal);
        //         hullB.faceNormals = [triangleNormal];
        //         sj.getTriangleVertices(i, va, vb, vc);
        //         var d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
        //         if(!d){
        //             triangleNormal.scaleNumberTo(-1, triangleNormal);
        //             d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
        //             if(!d){
        //                 continue;
        //             }
        //         }
        //         var res = [];
        //         var q = convexConvex_q;
        //         si.clipAgainstHull(xi,qi,hullB,xj,qj,triangleNormal,-100,100,res);
        //         for(var j = 0; j !== res.length; j++){
        //             var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj),
        //                 ri = r.ri,
        //                 rj = r.rj;
        //             r.ni.copy(triangleNormal);
        //             r.ni.negateTo(r.ni);
        //             res[j].normal.negateTo(q);
        //             q.multTo(res[j].depth, q);
        //             res[j].point.addTo(q, ri);
        //             rj.copy(res[j].point);
        //             // Contact points are in world coordinates. Transform back to relative
        //             ri.subTo(xi,ri);
        //             rj.subTo(xj,rj);
        //             // Make relative to bodies
        //             ri.addTo(xi, ri);
        //             ri.subTo(bi.position, ri);
        //             rj.addTo(xj, rj);
        //             rj.subTo(bj.position, rj);
        //             result.push(r);
        //         }
        //     }
        // };
        Narrowphase.prototype.planeParticle = function (sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
            var normal = particlePlane_normal;
            normal.copy(CANNON.World.worldNormal);
            bj.quaternion.vmult(normal, normal); // Turn normal according to plane orientation
            var relpos = particlePlane_relpos;
            xi.subTo(bj.position, relpos);
            var dot = normal.dot(relpos);
            if (dot <= 0.0) {
                if (justTest) {
                    return true;
                }
                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                r.ni.copy(normal); // Contact normal is the plane normal
                r.ni.negateTo(r.ni);
                r.ri.set(0, 0, 0); // Center of particle
                // Get particle position projected on plane
                var projected = particlePlane_projected;
                normal.scaleNumberTo(normal.dot(xi), projected);
                xi.subTo(projected, projected);
                //projected.addTo(bj.position,projected);
                // rj is now the projected world position minus plane position
                r.rj.copy(projected);
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        };
        Narrowphase.prototype.sphereParticle = function (sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
            // The normal is the unit vector from sphere center to particle center
            var normal = particleSphere_normal;
            normal.copy(CANNON.World.worldNormal);
            xi.subTo(xj, normal);
            var lengthSquared = normal.lengthSquared;
            if (lengthSquared <= sj.radius * sj.radius) {
                if (justTest) {
                    return true;
                }
                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                normal.normalize();
                r.rj.copy(normal);
                r.rj.scaleNumberTo(sj.radius, r.rj);
                r.ni.copy(normal); // Contact normal
                r.ni.negateTo(r.ni);
                r.ri.set(0, 0, 0); // Center of particle
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        };
        Narrowphase.prototype.convexParticle = function (sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
            var penetratedFaceIndex = -1;
            var penetratedFaceNormal = convexParticle_penetratedFaceNormal;
            var worldPenetrationVec = convexParticle_worldPenetrationVec;
            var minPenetration = null;
            var numDetectedFaces = 0;
            // Convert particle position xi to local coords in the convex
            var local = convexParticle_local;
            local.copy(xi);
            local.subTo(xj, local); // Convert position to relative the convex origin
            qj.inverseTo(cqj);
            cqj.vmult(local, local);
            if (sj.pointIsInside(local)) {
                if (sj.worldVerticesNeedsUpdate) {
                    sj.computeWorldVertices(xj, qj);
                }
                if (sj.worldFaceNormalsNeedsUpdate) {
                    sj.computeWorldFaceNormals(qj);
                }
                // For each world polygon in the polyhedra
                for (var i = 0, nfaces = sj.faces.length; i !== nfaces; i++) {
                    // Construct world face vertices
                    var verts = [sj.worldVertices[sj.faces[i][0]]];
                    var normal = sj.worldFaceNormals[i];
                    // Check how much the particle penetrates the polygon plane.
                    xi.subTo(verts[0], convexParticle_vertexToParticle);
                    var penetration = -normal.dot(convexParticle_vertexToParticle);
                    if (minPenetration === null || Math.abs(penetration) < Math.abs(minPenetration)) {
                        if (justTest) {
                            return true;
                        }
                        minPenetration = penetration;
                        penetratedFaceIndex = i;
                        penetratedFaceNormal.copy(normal);
                        numDetectedFaces++;
                    }
                }
                if (penetratedFaceIndex !== -1) {
                    // Setup contact
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    penetratedFaceNormal.scaleNumberTo(minPenetration, worldPenetrationVec);
                    // rj is the particle position projected to the face
                    worldPenetrationVec.addTo(xi, worldPenetrationVec);
                    worldPenetrationVec.subTo(xj, worldPenetrationVec);
                    r.rj.copy(worldPenetrationVec);
                    //var projectedToFace = xi.subTo(xj).addTo(worldPenetrationVec);
                    //projectedToFace.copy(r.rj);
                    //qj.vmult(r.rj,r.rj);
                    penetratedFaceNormal.negateTo(r.ni); // Contact normal
                    r.ri.set(0, 0, 0); // Center of particle
                    var ri = r.ri, rj = r.rj;
                    // Make relative to bodies
                    ri.addTo(xi, ri);
                    ri.subTo(bi.position, ri);
                    rj.addTo(xj, rj);
                    rj.subTo(bj.position, rj);
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
                else {
                    console.warn("Point found inside convex, but did not find penetrating face!");
                }
            }
        };
        Narrowphase.prototype.boxHeightfield = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexHeightfield(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.convexHeightfield = function (convexShape, hfShape, convexPos, hfPos, convexQuat, hfQuat, convexBody, hfBody, rsi, rsj, justTest) {
            var data = hfShape.data, w = hfShape.elementSize, radius = convexShape.boundingSphereRadius, worldPillarOffset = convexHeightfield_tmp2, faceList = convexHeightfield_faceList;
            // Get sphere position to heightfield local!
            var localConvexPos = convexHeightfield_tmp1;
            CANNON.Transform.pointToLocalFrame(hfPos, hfQuat, convexPos, localConvexPos);
            // Get the index of the data points to test against
            var iMinX = Math.floor((localConvexPos.x - radius) / w) - 1, iMaxX = Math.ceil((localConvexPos.x + radius) / w) + 1, iMinY = Math.floor((localConvexPos.y - radius) / w) - 1, iMaxY = Math.ceil((localConvexPos.y + radius) / w) + 1;
            // Bail out if we are out of the terrain
            if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMinY > data[0].length) {
                return;
            }
            // Clamp index to edges
            if (iMinX < 0) {
                iMinX = 0;
            }
            if (iMaxX < 0) {
                iMaxX = 0;
            }
            if (iMinY < 0) {
                iMinY = 0;
            }
            if (iMaxY < 0) {
                iMaxY = 0;
            }
            if (iMinX >= data.length) {
                iMinX = data.length - 1;
            }
            if (iMaxX >= data.length) {
                iMaxX = data.length - 1;
            }
            if (iMaxY >= data[0].length) {
                iMaxY = data[0].length - 1;
            }
            if (iMinY >= data[0].length) {
                iMinY = data[0].length - 1;
            }
            var minMax = [];
            hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
            var min = minMax[0];
            var max = minMax[1];
            // Bail out if we're cant touch the bounding height box
            if (localConvexPos.z - radius > max || localConvexPos.z + radius < min) {
                return;
            }
            for (var i = iMinX; i < iMaxX; i++) {
                for (var j = iMinY; j < iMaxY; j++) {
                    var intersecting = false;
                    // Lower triangle
                    hfShape.getConvexTrianglePillar(i, j, false);
                    CANNON.Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (convexPos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
                        intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                    // Upper triangle
                    hfShape.getConvexTrianglePillar(i, j, true);
                    CANNON.Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (convexPos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
                        intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                }
            }
        };
        ;
        Narrowphase.prototype.sphereHeightfield = function (sphereShape, hfShape, spherePos, hfPos, sphereQuat, hfQuat, sphereBody, hfBody, rsi, rsj, justTest) {
            var data = hfShape.data, radius = sphereShape.radius, w = hfShape.elementSize, worldPillarOffset = sphereHeightfield_tmp2;
            // Get sphere position to heightfield local!
            var localSpherePos = sphereHeightfield_tmp1;
            CANNON.Transform.pointToLocalFrame(hfPos, hfQuat, spherePos, localSpherePos);
            // Get the index of the data points to test against
            var iMinX = Math.floor((localSpherePos.x - radius) / w) - 1, iMaxX = Math.ceil((localSpherePos.x + radius) / w) + 1, iMinY = Math.floor((localSpherePos.y - radius) / w) - 1, iMaxY = Math.ceil((localSpherePos.y + radius) / w) + 1;
            // Bail out if we are out of the terrain
            if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMaxY > data[0].length) {
                return;
            }
            // Clamp index to edges
            if (iMinX < 0) {
                iMinX = 0;
            }
            if (iMaxX < 0) {
                iMaxX = 0;
            }
            if (iMinY < 0) {
                iMinY = 0;
            }
            if (iMaxY < 0) {
                iMaxY = 0;
            }
            if (iMinX >= data.length) {
                iMinX = data.length - 1;
            }
            if (iMaxX >= data.length) {
                iMaxX = data.length - 1;
            }
            if (iMaxY >= data[0].length) {
                iMaxY = data[0].length - 1;
            }
            if (iMinY >= data[0].length) {
                iMinY = data[0].length - 1;
            }
            var minMax = [];
            hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
            var min = minMax[0];
            var max = minMax[1];
            // Bail out if we're cant touch the bounding height box
            if (localSpherePos.z - radius > max || localSpherePos.z + radius < min) {
                return;
            }
            var result = this.result;
            for (var i = iMinX; i < iMaxX; i++) {
                for (var j = iMinY; j < iMaxY; j++) {
                    var numContactsBefore = result.length;
                    var intersecting = false;
                    // Lower triangle
                    hfShape.getConvexTrianglePillar(i, j, false);
                    CANNON.Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (spherePos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
                        intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                    // Upper triangle
                    hfShape.getConvexTrianglePillar(i, j, true);
                    CANNON.Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (spherePos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
                        intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                    var numContacts = result.length - numContactsBefore;
                    if (numContacts > 2) {
                        return;
                    }
                    /*
                    // Skip all but 1
                    for (var k = 0; k < numContacts - 1; k++) {
                        result.pop();
                    }
                    */
                }
            }
        };
        return Narrowphase;
    }());
    CANNON.Narrowphase = Narrowphase;
    var averageNormal = new CANNON.Vector3();
    var averageContactPointA = new CANNON.Vector3();
    var averageContactPointB = new CANNON.Vector3();
    var tmpVec1 = new CANNON.Vector3();
    var tmpVec2 = new CANNON.Vector3();
    var tmpQuat1 = new CANNON.Quaternion();
    var tmpQuat2 = new CANNON.Quaternion();
    var numWarnings = 0;
    var maxWarnings = 10;
    function warn(msg) {
        if (numWarnings > maxWarnings) {
            return;
        }
        numWarnings++;
        console.warn(msg);
    }
    var planeTrimesh_normal = new CANNON.Vector3();
    var planeTrimesh_relpos = new CANNON.Vector3();
    var planeTrimesh_projected = new CANNON.Vector3();
    var sphereTrimesh_normal = new CANNON.Vector3();
    var sphereTrimesh_relpos = new CANNON.Vector3();
    var sphereTrimesh_projected = new CANNON.Vector3();
    var sphereTrimesh_v = new CANNON.Vector3();
    var sphereTrimesh_v2 = new CANNON.Vector3();
    var sphereTrimesh_edgeVertexA = new CANNON.Vector3();
    var sphereTrimesh_edgeVertexB = new CANNON.Vector3();
    var sphereTrimesh_edgeVector = new CANNON.Vector3();
    var sphereTrimesh_edgeVectorUnit = new CANNON.Vector3();
    var sphereTrimesh_localSpherePos = new CANNON.Vector3();
    var sphereTrimesh_tmp = new CANNON.Vector3();
    var sphereTrimesh_va = new CANNON.Vector3();
    var sphereTrimesh_vb = new CANNON.Vector3();
    var sphereTrimesh_vc = new CANNON.Vector3();
    var sphereTrimesh_localSphereAABB = new CANNON.AABB();
    var sphereTrimesh_triangles = [];
    var point_on_plane_to_sphere = new CANNON.Vector3();
    var plane_to_sphere_ortho = new CANNON.Vector3();
    // See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
    var pointInPolygon_edge = new CANNON.Vector3();
    var pointInPolygon_edge_x_normal = new CANNON.Vector3();
    var pointInPolygon_vtp = new CANNON.Vector3();
    function pointInPolygon(verts, normal, p) {
        var positiveResult = null;
        var N = verts.length;
        for (var i = 0; i !== N; i++) {
            var v = verts[i];
            // Get edge to the next vertex
            var edge = pointInPolygon_edge;
            verts[(i + 1) % (N)].subTo(v, edge);
            // Get cross product between polygon normal and the edge
            var edge_x_normal = pointInPolygon_edge_x_normal;
            //var edge_x_normal = new Vector3();
            edge.crossTo(normal, edge_x_normal);
            // Get vector between point and current vertex
            var vertex_to_p = pointInPolygon_vtp;
            p.subTo(v, vertex_to_p);
            // This dot product determines which side of the edge the point is
            var r = edge_x_normal.dot(vertex_to_p);
            // If all such dot products have same sign, we are inside the polygon.
            if (positiveResult === null || (r > 0 && positiveResult === true) || (r <= 0 && positiveResult === false)) {
                if (positiveResult === null) {
                    positiveResult = r > 0;
                }
                continue;
            }
            else {
                return false; // Encountered some other sign. Exit.
            }
        }
        // If we got here, all dot products were of the same sign.
        return true;
    }
    var box_to_sphere = new CANNON.Vector3();
    var sphereBox_ns = new CANNON.Vector3();
    var sphereBox_ns1 = new CANNON.Vector3();
    var sphereBox_ns2 = new CANNON.Vector3();
    var sphereBox_sides = [new CANNON.Vector3(), new CANNON.Vector3(), new CANNON.Vector3(), new CANNON.Vector3(), new CANNON.Vector3(), new CANNON.Vector3()];
    var sphereBox_sphere_to_corner = new CANNON.Vector3();
    var sphereBox_side_ns = new CANNON.Vector3();
    var sphereBox_side_ns1 = new CANNON.Vector3();
    var sphereBox_side_ns2 = new CANNON.Vector3();
    var convex_to_sphere = new CANNON.Vector3();
    var sphereConvex_edge = new CANNON.Vector3();
    var sphereConvex_edgeUnit = new CANNON.Vector3();
    var sphereConvex_sphereToCorner = new CANNON.Vector3();
    var sphereConvex_worldCorner = new CANNON.Vector3();
    var sphereConvex_worldNormal = new CANNON.Vector3();
    var sphereConvex_worldPoint = new CANNON.Vector3();
    var sphereConvex_worldSpherePointClosestToPlane = new CANNON.Vector3();
    var sphereConvex_penetrationVec = new CANNON.Vector3();
    var sphereConvex_sphereToWorldPoint = new CANNON.Vector3();
    var planeBox_normal = new CANNON.Vector3();
    var plane_to_corner = new CANNON.Vector3();
    var planeConvex_v = new CANNON.Vector3();
    var planeConvex_normal = new CANNON.Vector3();
    var planeConvex_relpos = new CANNON.Vector3();
    var planeConvex_projected = new CANNON.Vector3();
    var convexConvex_sepAxis = new CANNON.Vector3();
    var convexConvex_q = new CANNON.Vector3();
    var particlePlane_normal = new CANNON.Vector3();
    var particlePlane_relpos = new CANNON.Vector3();
    var particlePlane_projected = new CANNON.Vector3();
    var particleSphere_normal = new CANNON.Vector3();
    // WIP
    var cqj = new CANNON.Quaternion();
    var convexParticle_local = new CANNON.Vector3();
    var convexParticle_normal = new CANNON.Vector3();
    var convexParticle_penetratedFaceNormal = new CANNON.Vector3();
    var convexParticle_vertexToParticle = new CANNON.Vector3();
    var convexParticle_worldPenetrationVec = new CANNON.Vector3();
    var convexHeightfield_tmp1 = new CANNON.Vector3();
    var convexHeightfield_tmp2 = new CANNON.Vector3();
    var convexHeightfield_faceList = [0];
    var sphereHeightfield_tmp1 = new CANNON.Vector3();
    var sphereHeightfield_tmp2 = new CANNON.Vector3();
    Narrowphase.prototype[CANNON.Shape.types.BOX | CANNON.Shape.types.BOX] = Narrowphase.prototype.boxBox;
    Narrowphase.prototype[CANNON.Shape.types.BOX | CANNON.Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.boxConvex;
    Narrowphase.prototype[CANNON.Shape.types.BOX | CANNON.Shape.types.PARTICLE] = Narrowphase.prototype.boxParticle;
    Narrowphase.prototype[CANNON.Shape.types.SPHERE] = Narrowphase.prototype.sphereSphere;
    Narrowphase.prototype[CANNON.Shape.types.PLANE | CANNON.Shape.types.TRIMESH] = Narrowphase.prototype.planeTrimesh;
    Narrowphase.prototype[CANNON.Shape.types.SPHERE | CANNON.Shape.types.TRIMESH] = Narrowphase.prototype.sphereTrimesh;
    Narrowphase.prototype[CANNON.Shape.types.SPHERE | CANNON.Shape.types.PLANE] = Narrowphase.prototype.spherePlane;
    Narrowphase.prototype[CANNON.Shape.types.SPHERE | CANNON.Shape.types.BOX] = Narrowphase.prototype.sphereBox;
    Narrowphase.prototype[CANNON.Shape.types.SPHERE | CANNON.Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.sphereConvex;
    Narrowphase.prototype[CANNON.Shape.types.PLANE | CANNON.Shape.types.BOX] = Narrowphase.prototype.planeBox;
    Narrowphase.prototype[CANNON.Shape.types.PLANE | CANNON.Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.planeConvex;
    Narrowphase.prototype[CANNON.Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.convexConvex;
    Narrowphase.prototype[CANNON.Shape.types.PLANE | CANNON.Shape.types.PARTICLE] = Narrowphase.prototype.planeParticle;
    Narrowphase.prototype[CANNON.Shape.types.PARTICLE | CANNON.Shape.types.SPHERE] = Narrowphase.prototype.sphereParticle;
    Narrowphase.prototype[CANNON.Shape.types.PARTICLE | CANNON.Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.convexParticle;
    Narrowphase.prototype[CANNON.Shape.types.BOX | CANNON.Shape.types.HEIGHTFIELD] = Narrowphase.prototype.boxHeightfield;
    Narrowphase.prototype[CANNON.Shape.types.SPHERE | CANNON.Shape.types.HEIGHTFIELD] = Narrowphase.prototype.sphereHeightfield;
    Narrowphase.prototype[CANNON.Shape.types.CONVEXPOLYHEDRON | CANNON.Shape.types.HEIGHTFIELD] = Narrowphase.prototype.convexHeightfield;
})(CANNON || (CANNON = {}));
//# sourceMappingURL=cannon.js.map