/**
 * @mainpage Cannon.js
 * A lightweight 3D physics engine for the web. See the github page for more information: https://github.com/schteppe/cannon.js
 */

var CANNON = CANNON || {};

// Maintain compatibility with older browsers
if(!self.Int32Array){
  self.Int32Array = Array;
  self.Float32Array = Array;
}
