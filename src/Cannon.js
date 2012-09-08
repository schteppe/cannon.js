/**
 * @page About
 * cannon.js is a lightweight 3D physics engine for web applications. For more information and source code, go to the Github repository [schteppe/cannon.js](https://github.com/schteppe/cannon.js).
 */

/**
 * @library cannon.js
 * @version 0.4.3
 * @brief A lightweight 3D physics engine for the web
 */

var CANNON = CANNON || {};

// Maintain compatibility with older browsers
// @todo: check so ordinary Arrays work.
if(!this.Int32Array){
  this.Int32Array=Array;
  this.Float32Array=Array;
}