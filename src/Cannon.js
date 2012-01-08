/**
 * Our main namespace
 * @author schteppe
 */
var CANNON = CANNON || {};

// Maintain compatibility with older browsers
if(!self.Int32Array){
  self.Int32Array = Array;
  self.Float32Array = Array;
}
