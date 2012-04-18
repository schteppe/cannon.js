/**
 * @mainpage Cannon.js
 * A lightweight 3D physics engine for the web. See the github page for more information: https://github.com/schteppe/cannon.js
 */

var CANNON = CANNON || {};

// Maintain compatibility with older browsers
// @todo: check so ordinary Arrays work.
if(!this.Int32Array){
  this.Int32Array=Array;
  this.Float32Array=Array;
}